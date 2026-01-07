import { useState, useEffect, useCallback } from 'react';
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
        amount?: number;
    };
    created_by_user?: {
        id: string;
        name?: string;
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

export const useValidityEntries = (options: { includeDeleted?: boolean } = {}) => {
    const [entries, setEntries] = useState<ValidityEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchEntries = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch entries from validity schema
            let query = supabase
                .schema('validity')
                .from('validity_entries')
                .select('*');

            if (!options.includeDeleted) {
                query = query.neq('status', 'excluido');
            }

            const { data: entriesData, error: entriesError } = await query
                .order('created_at', { ascending: false });

            if (entriesError) throw entriesError;

            // Get unique product IDs
            const productIds = [...new Set((entriesData || []).map((e) => e.product_id))];
            const createdByIds = [...new Set((entriesData || []).map((e) => e.created_by).filter(Boolean))];

            // Fetch products from public schema (default)
            const { data: productsData } = await supabase
                .from('products')
                .select('id, name, ean, code, type, amount')
                .in('id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

            // Fetch profiles from public schema (default)
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, name, email')
                .in('id', createdByIds.length > 0 ? createdByIds : ['00000000-0000-0000-0000-000000000000']);

            // Create maps for quick lookup
            const productsMap = new Map((productsData || []).map((p) => [p.id, p]));
            const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

            // Fetch pending delete requests
            const { data: requestsData, error: requestsError } = await supabase
                .schema('validity')
                .from('validity_delete_requests')
                .select('validity_entry_id, reason, created_at, requested_by')
                .eq('status', 'pendente');

            if (requestsError) throw requestsError;

            const pendingRequestsMap = new Map();
            requestsData?.forEach((r) => {
                pendingRequestsMap.set(r.validity_entry_id, {
                    reason: r.reason,
                    requested_at: r.created_at,
                    requested_by: r.requested_by
                });
            });

            // Transform the data structure
            const transformedData = (entriesData || []).map((item) => {
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
                        type: product?.type,
                        amount: product?.amount
                    },
                    created_by_user: createdByUser ? {
                        id: createdByUser.id,
                        name: createdByUser.name,
                        email: createdByUser.email
                    } : undefined
                };
            });

            // Filter by store if user is encarregado (client-side)
            let filteredEntries = transformedData;
            if (user?.role === 'encarregado' && user.store_id) {
                filteredEntries = transformedData.filter((entry) =>
                    entry.store_id === user.store_id
                );
            }

            setEntries(filteredEntries as ValidityEntry[]);
        } catch (err) {
            console.error('Error fetching validity entries:', err);
            if (err instanceof Error) setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, options.includeDeleted]);

    useEffect(() => {
        const subscription = supabase
            .channel('validity_delete_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'validity',
                    table: 'validity_delete_requests'
                },
                () => {
                    fetchEntries();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchEntries]);

    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user, fetchEntries]);

    return {
        entries,
        loading,
        error,
        refresh: fetchEntries,
        updateStatus,
        updateEntry,
        deleteEntry
    };

    async function updateStatus(id: string, newStatus: ValidityEntry['status']) {
        try {
            const updates: Record<string, unknown> = { status: newStatus };
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
        } catch (err) {
            console.error('Error updating status:', err);
            throw err;
        }
    }

    async function deleteEntry(id: string) {
        try {
            const { error: entryError } = await supabase
                .schema('validity')
                .from('validity_entries')
                .update({
                    status: 'excluido',
                    deleted_at: new Date().toISOString()
                })
                .eq('id', id);

            if (entryError) throw entryError;

            // Optimistic update
            setEntries(prev => prev.filter(entry => entry.id !== id));
        } catch (err) {
            console.error('Error deleting entry:', err);
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
        } catch (err) {
            console.error('Error updating entry:', err);
            throw err;
        }
    }
};
