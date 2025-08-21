import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for stored session
      const storedSession = await SecureStore.getItemAsync('supabase-session');
      
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        await supabase.auth.setSession(parsedSession);
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      // Store or remove session
      if (session) {
        await SecureStore.setItemAsync('supabase-session', JSON.stringify(session));
        await fetchProfile(session.user.id);
      } else {
        await SecureStore.deleteItemAsync('supabase-session');
        setProfile(null);
      }
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          role: 'user',
        });

      if (profileError) throw profileError;
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('supabase-session');
    await supabase.auth.signOut();
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  };
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id);

    if (error) throw error;

    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        changePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};