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
    };
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

            // Use RPC to call the database function
            const { data, error: supabaseError } = await supabase
                .schema('validity')
                .rpc('get_validity_entries_with_products');

            if (supabaseError) throw supabaseError;

            // Transform the flat data structure to nested
            const transformedData = (data || []).map((item: any) => ({
                id: item.id,
                expires_at: item.expires_at,
                lot: item.lot,
                quantity: item.quantity,
                status: item.status,
                product: {
                    name: item.product_name,
                    ean: item.product_ean,
                    code: item.product_code
                }
            }));

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

    return { entries, loading, error, refresh: fetchEntries };
};
