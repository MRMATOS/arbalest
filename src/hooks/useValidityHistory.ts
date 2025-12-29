import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export interface HistoryEntry {
    id: string;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
    changed_at: string;
    changed_by: string; // uuid
    changer_name?: string; // We'll need to join or fetch this
}

export const useValidityHistory = (entryId: string | null) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!entryId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                // We need to fetch history and ideally the name of the user who changed it
                // Since we don't have a view for this yet, we might just fetch the history 
                // and maybe later enrich it with profile names if needed, 
                // or use a simple join if we have RLS access to profiles.

                const { data, error } = await supabase
                    .schema('validity')
                    .from('validity_entry_history')
                    .select(`
                        id,
                        field_name,
                        old_value,
                        new_value,
                        created_at,
                        changed_by
                    `)
                    .eq('validity_entry_id', entryId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Map to our interface (renaming created_at to changed_at for clarity)
                const mappedData: HistoryEntry[] = (data || []).map((item) => ({
                    id: item.id,
                    field_name: item.field_name,
                    old_value: item.old_value,
                    new_value: item.new_value,
                    changed_at: item.created_at,
                    changed_by: item.changed_by
                }));

                setHistory(mappedData);
            } catch (err) {
                console.error('Error fetching history:', err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [entryId]);

    return { history, loading, error };
};
