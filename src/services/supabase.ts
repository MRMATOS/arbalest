import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ttijcvhtkclmqhwbfggt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0aWpjdmh0a2NsbXFod2JmZ2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTk1MjUsImV4cCI6MjA4MTU3NTUyNX0.-_ohfFMOjRlkLfLkjyf6NKudvQagEStloDai91qj6Ag';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
