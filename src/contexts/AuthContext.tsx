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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle profile creation/update for OAuth and sign-ups
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            handleUserProfile(session.user);
            // Redirect to profile timeline after successful authentication
            if (window.location.pathname === '/' || window.location.pathname === '/auth') {
              window.location.href = '/profile-timeline';
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserProfile = async (user: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Profile will be created automatically by the trigger with secure defaults
        console.log('Profile will be created by trigger for user:', user.email);
        
        // After trigger creates the profile, safely update with OAuth data if available
        if (user.user_metadata) {
          setTimeout(async () => {
            await updateProfileWithOAuthData(user);
          }, 100); // Small delay to ensure trigger completes
        }
      } else {
        // Update existing profile with latest OAuth data if available
        await updateProfileWithOAuthData(user);
      }
    } catch (error) {
      console.error('Error handling user profile:', error);
    }
  };

  const updateProfileWithOAuthData = async (user: User) => {
    try {
      // Only update if we have OAuth metadata and the fields are currently null/empty
      if (user.user_metadata) {
        const updates: any = {};
        
        // Safely extract name from various OAuth providers
        const oauthName = user.user_metadata.name || 
                         user.user_metadata.full_name || 
                         user.user_metadata.display_name;
        
        // Safely extract avatar from various OAuth providers
        const oauthAvatar = user.user_metadata.picture || 
                           user.user_metadata.avatar_url ||
                           user.user_metadata.image;

        if (oauthName) {
          updates.name = oauthName;
        }
        
        if (oauthAvatar) {
          updates.avatar_url = oauthAvatar;
        }

        // Only update if we have data to update
        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating profile with OAuth data:', updateError);
          } else {
            console.log('Profile updated with OAuth data for user:', user.email);
          }
        }
      }
    } catch (error) {
      console.error('Error updating profile with OAuth data:', error);
    }
  };

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
          data: {
            name: name
          }
        }
      });
      
      if (error) throw error;
      
      // After successful sign-up, update the profile with the provided name
      if (data.user) {
        setTimeout(async () => {
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                name: name,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.user.id);
            
            if (updateError) {
              console.error('Error updating profile with sign-up name:', updateError);
            } else {
              console.log('Profile updated with sign-up name for user:', data.user.email);
            }
          } catch (error) {
            console.error('Error in sign-up profile update:', error);
          }
        }, 100); // Small delay to ensure trigger completes
      }
      
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
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
