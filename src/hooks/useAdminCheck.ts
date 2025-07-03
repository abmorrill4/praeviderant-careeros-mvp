import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Global cache to prevent duplicate requests
const adminStatusCache = new Map<string, { value: boolean; timestamp: number }>();
const pendingRequests = new Map<string, Promise<boolean>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAdminCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Don't check while auth is still loading
      if (authLoading) return;
      
      const userId = user?.id;
      
      // No user means not admin
      if (!user || !userId) {
        if (isAdmin !== false) {
          setIsAdmin(false);
          setLoading(false);
          setError(null);
        }
        return;
      }

      // Skip if same user and we already have a result
      if (lastUserIdRef.current === userId && isAdmin !== null) {
        return;
      }

      // Check cache first
      const cached = adminStatusCache.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsAdmin(cached.value);
        setLoading(false);
        setError(null);
        lastUserIdRef.current = userId;
        return;
      }

      // Check if there's already a pending request for this user
      let pendingRequest = pendingRequests.get(userId);
      
      if (!pendingRequest) {
        // Create new request
        pendingRequest = (async () => {
          try {
            const { data, error: rpcError } = await supabase.rpc('is_admin_user');
            
            if (rpcError) {
              throw rpcError;
            }
            
            const adminStatus = data || false;
            
            // Cache the result
            adminStatusCache.set(userId, {
              value: adminStatus,
              timestamp: Date.now()
            });
            
            return adminStatus;
          } finally {
            // Remove from pending requests
            pendingRequests.delete(userId);
          }
        })();
        
        pendingRequests.set(userId, pendingRequest);
      }

      try {
        setLoading(true);
        setError(null);
        
        const adminStatus = await pendingRequest;
        setIsAdmin(adminStatus);
        lastUserIdRef.current = userId;
      } catch (err) {
        console.error('❌ Admin check error:', err);
        setError('Failed to verify admin status');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id, authLoading]); // Only depend on user ID and auth loading status

  return { isAdmin, loading: loading || authLoading, error };
};