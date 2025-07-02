import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) return;
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Checking admin status for user:', user.email);
        const { data, error: rpcError } = await supabase.rpc('is_admin_user');
        
        console.log('🔍 Admin check result:', { data, error: rpcError });
        
        if (rpcError) {
          console.error('❌ Error checking admin status:', rpcError);
          setError('Failed to verify admin status');
          setIsAdmin(false);
        } else {
          console.log('✅ Admin status:', data || false);
          setIsAdmin(data || false);
        }
      } catch (err) {
        console.error('❌ Admin check error:', err);
        setError('Failed to verify admin status');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading, error };
};