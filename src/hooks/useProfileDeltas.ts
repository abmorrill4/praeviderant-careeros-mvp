
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileDelta {
  id: string;
  entity_type: string;
  field: string | null;
  original_value: string | null;
  new_value: string;
  status: 'unresolved' | 'approved' | 'rejected';
  created_at: string;
}

export const useProfileDeltas = (userId?: string) => {
  const [deltas, setDeltas] = useState<ProfileDelta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchDeltas = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profile_deltas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDeltas(data || []);
    } catch (error) {
      console.error('Error fetching profile deltas:', error);
      toast({
        title: "Error",
        description: "Failed to load profile changes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeltaStatus = async (deltaId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profile_deltas')
        .update({ status })
        .eq('id', deltaId);

      if (error) {
        throw error;
      }

      setDeltas(prev => 
        prev.map(delta => 
          delta.id === deltaId ? { ...delta, status } : delta
        )
      );

      toast({
        title: "Status Updated",
        description: `Profile change ${status}`,
      });

    } catch (error) {
      console.error('Error updating delta status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDeltas();
  }, [userId]);

  return {
    deltas,
    isLoading,
    fetchDeltas,
    updateDeltaStatus
  };
};
