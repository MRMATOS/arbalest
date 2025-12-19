import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ValidityEntry {
    id: string;
    expires_at: string;
    lot: string | null;
    quantity: number;
    status: 'ativo' | 'conferindo' | 'conferido' | 'excluido';
    product: {
        name: string;
        ean: string | null;
        code: string;
        type?: 'mercado' | 'farmacia';
    };
    created_by_user?: {
        id: string;
        email?: string;
    };
    has_pending_delete_request?: boolean;
    pending_delete_request?: {
        reason: string;
        requested_at: string;
        requested_by: string;
    };
    verified_at?: string | null;
    updated_at: string;
    created_at: string;
    store_id: string;
}

export const useValidityEntries = () => {
    const [entries, setEntries] = useState<ValidityEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchEntries = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch entries from validity schema
            const { data: entriesData, error: entriesError } = await supabase
                .schema('validity')
                .from('validity_entries')
                .select('*')
                .neq('status', 'excluido')
                .order('created_at', { ascending: false });

            if (entriesError) throw entriesError;

            // Get unique product IDs
            const productIds = [...new Set((entriesData || []).map((e: any) => e.product_id))];
            const createdByIds = [...new Set((entriesData || []).map((e: any) => e.created_by).filter(Boolean))];

            // Fetch products from public schema (default)
            const { data: productsData } = await supabase
                .from('products')
                .select('id, name, ean, code, type')
                .in('id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

            // Fetch profiles from public schema (default)
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', createdByIds.length > 0 ? createdByIds : ['00000000-0000-0000-0000-000000000000']);

            // Create maps for quick lookup
            const productsMap = new Map((productsData || []).map((p: any) => [p.id, p]));
            const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

            // Fetch pending delete requests
            const { data: requestsData, error: requestsError } = await supabase
                .schema('validity')
                .from('validity_delete_requests')
                .select('validity_entry_id, reason, created_at, requested_by')
                .eq('status', 'pendente');

            if (requestsError) throw requestsError;

            const pendingRequestsMap = new Map();
            requestsData?.forEach((r: any) => {
                pendingRequestsMap.set(r.validity_entry_id, {
                    reason: r.reason,
                    requested_at: r.created_at,
                    requested_by: r.requested_by
                });
            });

            // Transform the data structure
            const transformedData = (entriesData || []).map((item: any) => {
                const product = productsMap.get(item.product_id);
                const createdByUser = profilesMap.get(item.created_by);
                return {
                    id: item.id,
                    expires_at: item.expires_at,
                    lot: item.lot,
                    quantity: item.quantity,
                    status: item.status,
                    store_id: item.store_id,
                    created_at: item.created_at,
                    has_pending_delete_request: pendingRequestsMap.has(item.id),
                    pending_delete_request: pendingRequestsMap.get(item.id),
                    verified_at: item.verified_at,
                    updated_at: item.updated_at,
                    product: {
                        name: product?.name || 'Unknown',
                        ean: product?.ean || null,
                        code: product?.code || '',
                        type: product?.type
                    },
                    created_by_user: createdByUser ? {
                        id: createdByUser.id,
                        email: createdByUser.email
                    } : undefined
                };
            });

            // Filter by store if user is encarregado (client-side)
            let filteredEntries = transformedData;
            if (user?.role === 'encarregado' && user.store_id) {
                filteredEntries = transformedData.filter((entry: any) =>
                    entry.store_id === user.store_id
                );
            }

            setEntries(filteredEntries as ValidityEntry[]);
        } catch (err: any) {
            console.error('Error fetching validity entries:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user]);

    return {
        entries,
        loading,
        error,
        refresh: fetchEntries,
        updateStatus,
        updateEntry,
        requestDelete,
        approveDeleteRequest,
        rejectDeleteRequest
    };

    async function updateStatus(id: string, newStatus: ValidityEntry['status']) {
        try {
            const updates: any = { status: newStatus };
            if (newStatus === 'conferido') {
                updates.verified_at = new Date().toISOString();
                updates.verified_by = user?.id;
            } else {
                updates.verified_at = null;
                updates.verified_by = null;
            }

            const { error: updateError } = await supabase
                .schema('validity')
                .from('validity_entries')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            // Optimistic update
            setEntries(prev => prev.map(entry =>
                entry.id === id ? { ...entry, status: newStatus } : entry
            ));
        } catch (err: any) {
            console.error('Error updating status:', err);
            throw err;
        }
    }

    async function requestDelete(id: string, reason: string) {
        try {
            const { error } = await supabase
                .schema('validity')
                .from('validity_delete_requests')
                .insert({
                    validity_entry_id: id,
                    reason,
                    requested_by: user?.id,
                    status: 'pendente'
                });

            if (error) throw error;

            await fetchEntries();
        } catch (err: any) {
            console.error('Error requesting delete:', err);
            throw err;
        }
    }

    async function approveDeleteRequest(id: string) {
        try {
            const { error: reqError } = await supabase
                .schema('validity')
                .from('validity_delete_requests')
                .update({
                    status: 'aprovado',
                    reviewed_by: user?.id,
                    reviewed_at: new Date().toISOString()
                })
                .eq('validity_entry_id', id)
                .eq('status', 'pendente');

            if (reqError) throw reqError;

            const { error: entryError } = await supabase
                .schema('validity')
                .from('validity_entries')
                .update({
                    status: 'excluido',
                    deleted_at: new Date().toISOString()
                })
                .eq('id', id);

            if (entryError) throw entryError;

            await fetchEntries();
        } catch (err: any) {
            console.error('Error approving delete:', err);
            throw err;
        }
    }

    async function rejectDeleteRequest(id: string) {
        try {
            const { error } = await supabase
                .schema('validity')
                .from('validity_delete_requests')
                .update({
                    status: 'rejeitado',
                    reviewed_by: user?.id,
                    reviewed_at: new Date().toISOString()
                })
                .eq('validity_entry_id', id)
                .eq('status', 'pendente');

            if (error) throw error;
            await fetchEntries();
        } catch (err: any) {
            console.error('Error rejecting delete:', err);
            throw err;
        }
    }
    async function updateEntry(id: string, updates: { expires_at: string; quantity: number; lot: string | null }) {
        try {
            const { error } = await supabase
                .schema('validity')
                .from('validity_entries')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            await fetchEntries();
        } catch (err: any) {
            console.error('Error updating entry:', err);
            throw err;
        }
    }
};
