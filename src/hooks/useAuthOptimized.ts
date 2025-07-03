import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCompletenessCheck {
  complete: boolean;
  score: number;
  missing_fields: string[];
  message: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileCompleteness: ProfileCompletenessCheck | null;
}

interface AuthActions {
  signUp: (email: string, password: string, name: string) => Promise<{ user?: User; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkProfileCompleteness: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuthOptimized = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    profileCompleteness: null,
  });

  // Check profile completeness
  const checkProfileCompleteness = useCallback(async () => {
    if (!state.user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('check_profile_completeness', {
        p_user_id: state.user.id
      });
      
      if (!error && data && typeof data === 'object' && data !== null) {
        setState(prev => ({ ...prev, profileCompleteness: data as unknown as ProfileCompletenessCheck }));
      }
    } catch (error) {
      console.error('Error checking profile completeness:', error);
    }
  }, [state.user?.id]);

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
      
      if (session?.user) {
        // Check profile completeness after auth refresh
        setTimeout(() => {
          checkProfileCompleteness();
        }, 100);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [checkProfileCompleteness]);

  // Set up auth state listener
  useEffect(() => {
    console.log('🔄 Setting up optimized auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));

        // Handle post-authentication tasks
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            checkProfileCompleteness();
            
            // Redirect logic using client-side navigation
            const currentPath = window.location.pathname;
            if (currentPath !== '/admin' && (currentPath === '/' || currentPath === '/auth')) {
              console.log('🔄 Redirecting to profile timeline');
              setTimeout(() => {
                window.history.pushState({}, '', '/profile-timeline');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }, 100);
            }
          }, 100);
        }
      }
    );

    // Initial session check
    refreshAuth();

    return () => subscription.unsubscribe();
  }, [refreshAuth, checkProfileCompleteness]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Clean up any existing auth state
      await supabase.auth.signOut();
      
      const redirectUrl = `${window.location.origin}/profile-timeline`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name }
        }
      });
      
      if (error) throw error;
      
      // The trigger will handle profile creation with the name from metadata
      console.log('✅ Sign up successful, trigger will handle profile creation');
      
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      setState(prev => ({ ...prev, loading: false }));
      return { user: undefined, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Clean up any existing auth state
      await supabase.auth.signOut();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setState(prev => ({ ...prev, loading: false }));
      }
      
      return { error };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      setState(prev => ({ ...prev, loading: false }));
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Clean up any existing auth state
      await supabase.auth.signOut();
      
      const redirectUrl = `${window.location.origin}/profile-timeline`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      if (error) {
        setState(prev => ({ ...prev, loading: false }));
      }
      
      return { error };
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);
      setState(prev => ({ ...prev, loading: false }));
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await supabase.auth.signOut();
      setState({
        user: null,
        session: null,
        loading: false,
        profileCompleteness: null,
      });
    } catch (error) {
      console.error('❌ Sign out error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    checkProfileCompleteness,
    refreshAuth,
  };
};