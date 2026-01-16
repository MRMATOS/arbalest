import { useState } from 'react';
import { supabase } from '../services/supabase';

export interface Product {
    id: string;
    name: string;
    ean: string | null;
    code: string;
    type: 'mercado' | 'farmacia' | null;
    meat_group: string | null;
}

export const useProductSearch = () => {
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    interface ProductSearchFilters {
        meatOnly?: boolean;
    }

    const search = async (term: string, filters?: ProductSearchFilters) => {
        if (!term || term.length < 3) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Start query
            let query = supabase
                .from('products')
                .select('id, name, ean, code, type, meat_group')
                .or(`ean.eq.${term},code.eq.${term},name.ilike.%${term}%`);

            // Apply Filters
            if (filters?.meatOnly) {
                // Filter where meat_group is NOT null
                query = query.not('meat_group', 'is', null);
            }

            const { data, error: supabaseError } = await query.limit(20);

            if (supabaseError) throw supabaseError;

            setResults(data as Product[]);
        } catch (err) {
            console.error('Error searching products:', err);
            if (err instanceof Error) setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { results, loading, error, search };
};
