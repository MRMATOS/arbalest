
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate username from email with uniqueness check
async function generateUniqueUsername(email: string, supabaseAdmin: any): Promise<string> {
    // Extract local part of email (before @)
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    let username = baseUsername;
    let attempt = 1;

    // Check if username exists, if so append number
    while (true) {
        const { data } = await supabaseAdmin
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();

        if (!data) {
            // Username is available
            return username;
        }

        // Try with number suffix
        username = `${baseUsername}${attempt}`;
        attempt++;

        // Safety limit to prevent infinite loop
        if (attempt > 9999) {
            throw new Error('Unable to generate unique username');
        }
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // Verify User is Admin
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error('Unauthorized');

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.is_admin) {
            throw new Error('Forbidden: Only Admins can manage users');
        }

        // Initialize Admin Client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { action, userData, userId } = await req.json();

        if (action === 'create') {
            const { email, password, name, permissions, is_admin } = userData;

            // Generate unique username from email
            const generatedUsername = await generateUniqueUsername(email, supabaseAdmin);

            // 1. Create Auth User
            const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name } // Optional metadata
            });

            if (createError) throw createError;

            // 2. Create/Update Profile
            const newUserId = authData.user.id;

            // Upsert profile with generated username
            const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: newUserId,
                    email,
                    name,
                    username: generatedUsername,
                    is_admin: is_admin || false,
                    permissions: permissions || {},
                    approved_at: new Date().toISOString() // Auto-approve created users
                });

            if (profileUpdateError) throw profileUpdateError;

            return new Response(
                JSON.stringify({ success: true, user: authData.user, username: generatedUsername }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'delete') {
            if (!userId) throw new Error('Missing userId for delete');

            // Delete from Auth (Cascade should handle profile, but just in case)
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (deleteError) throw deleteError;

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        throw new Error('Invalid Action');

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
