import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ user?: User; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Setting up optimized auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle post-authentication redirect only for auth page
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            const currentPath = window.location.pathname;
            console.log('🔄 Current path during auth redirect check:', currentPath);
            // Only redirect from auth page to prevent conflicts with Index page logic
            if (currentPath === '/auth') {
              console.log('🔄 Redirecting from auth page to profile timeline');
              window.location.href = '/profile-timeline';
            } else {
              console.log('🔄 Not redirecting, staying on current path:', currentPath);
            }
          }, 100);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('✅ Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Removed manual profile handling - now handled by optimized database trigger

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Clean up any existing auth state
      await supabase.auth.signOut();
      
      const redirectUrl = `${window.location.origin}/profile-timeline`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name } // This will be handled by the optimized trigger
        }
      });
      
      if (error) throw error;
      
      console.log('✅ Sign up successful, optimized trigger will handle profile creation');
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      return { user: undefined, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up any existing auth state
      await supabase.auth.signOut();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Clean up any existing auth state
      await supabase.auth.signOut();
      
      const redirectUrl = `${window.location.origin}/profile-timeline`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      return { error };
    } catch (error: any) {
      console.error('Google sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
