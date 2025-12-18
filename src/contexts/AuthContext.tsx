import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface Profile {
    id: string;
    role: 'admin' | 'encarregado' | 'conferente';
    store_id?: string;
    full_name?: string;
    email?: string;
}

interface AuthContextType {
    user: Profile | null;
    loading: boolean;
    login: (email: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for saved session
        const savedEmail = localStorage.getItem('arbalest_auth_email');
        if (savedEmail) {
            handleLogin(savedEmail);
        } else {
            setLoading(false);
        }
    }, []);

    const handleLogin = async (email: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !data) throw new Error('Profile not found');

            setUser(data);
            localStorage.setItem('arbalest_auth_email', email);
        } catch (err) {
            console.error('Auth error:', err);
            localStorage.removeItem('arbalest_auth_email');
            setUser(null);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('arbalest_auth_email');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login: handleLogin, logout }}>
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
