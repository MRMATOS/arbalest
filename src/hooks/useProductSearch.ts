import { useState } from 'react';
import { supabase } from '../services/supabase';

export interface Product {
    id: string;
    name: string;
    ean: string | null;
    code: string;
    type: 'mercado' | 'farmacia' | null;
}

export const useProductSearch = () => {
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = async (term: string) => {
        if (!term || term.length < 3) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Search by EAN, code or name
            const { data, error: supabaseError } = await supabase
                .from('products')
                .select('id, name, ean, code, type')
                .or(`ean.eq.${term},code.eq.${term},name.ilike.%${term}%`)
                .limit(20);

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
