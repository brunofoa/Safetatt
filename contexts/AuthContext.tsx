import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';

import { Role, Studio } from '../types';

// Define the shape of our Auth Context
interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    sessionRole: Role | null;
    currentStudio: Studio | null;
    signInWithPassword: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
    signUpWithPassword: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ data: any; error: AuthError | null }>;
    updatePassword: (password: string) => Promise<{ data: any; error: AuthError | null }>;
    selectSession: (studio: Studio, role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionRole, setSessionRole] = useState<Role | null>(null);
    const [currentStudio, setCurrentStudio] = useState<Studio | null>(null);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (!session) {
                setSessionRole(null);
                setCurrentStudio(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithPassword = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signUpWithPassword = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            // We can add options here later if needed, e.g., default metadata
        });
        return { data, error };
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            setUser(null);
            setSession(null);
            setSessionRole(null);
            setCurrentStudio(null);
        }
        return { error };
    };

    const resetPassword = async (email: string) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        return { data, error };
    };

    const updatePassword = async (password: string) => {
        const { data, error } = await supabase.auth.updateUser({
            password: password
        });
        return { data, error };
    };

    const selectSession = (studio: Studio, role: Role) => {
        setCurrentStudio(studio);
        setSessionRole(role);
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            sessionRole,
            currentStudio,
            signInWithPassword,
            signUpWithPassword,
            signOut,
            resetPassword,
            updatePassword,
            selectSession
        }}>
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
