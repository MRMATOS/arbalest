/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

export interface Store {
    id: string;
    name: string;
    show_validity: boolean;
    show_planogram: boolean;
    is_butcher_active?: boolean;
    is_butcher_production?: boolean;
}

export interface Profile {
    id: string;
    role: 'admin' | 'encarregado' | 'conferente' | 'planogram_edit' | 'planogram_view';
    store_id?: string;
    store?: Store;
    name?: string;
    full_name?: string;
    email?: string;
    approved_at?: string | null;
    butcher_role?: 'requester' | 'producer' | null;
}

interface AuthContextType {
    user: Profile | null;
    session: Session | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    store:stores(id, name, show_validity, show_planogram, is_butcher_active, is_butcher_production)
                `)
                .eq('id', userId)
                .single();

            if (error) throw error;
            setUser({ ...data, email });
        } catch (err) {
            console.error('Error fetching profile:', err);
            // If profile doesn't exist yet (race condition with trigger), retry or handle gracefully
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, login, signUp, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
