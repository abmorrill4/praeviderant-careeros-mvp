
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApplyMergeDecisionsResult {
  total_decisions: number;
  applied: number;
  rejected: number;
  overridden: number;
  errors: number;
  results: Array<{
    decision_id: string;
    field_name: string;
    status: 'accepted' | 'rejected' | 'overridden' | 'error';
    applied_value?: string;
    reason?: string;
    error?: string;
  }>;
}

export function useApplyMergeDecisions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ versionId, applyAll = false }: {
      versionId: string;
      applyAll?: boolean;
    }): Promise<ApplyMergeDecisionsResult> => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('apply-merge-decisions', {
        body: { versionId, applyAll }
      });

      if (error) {
        console.error('Error applying merge decisions:', error);
        throw error;
      }

      return data as ApplyMergeDecisionsResult;
    },
    onSuccess: (result, variables) => {
      const { applied, rejected, overridden, errors } = result;
      
      let message = `Applied ${applied + overridden} updates`;
      if (rejected > 0) message += `, rejected ${rejected}`;
      if (errors > 0) message += `, ${errors} errors`;

      toast({
        title: "Merge Decisions Applied",
        description: message,
        variant: errors > 0 ? "destructive" : "default",
      });
      
      // Invalidate related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['merge-decisions', variables.versionId] });
      queryClient.invalidateQueries({ queryKey: ['user-confirmed-profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['resume-diffs', variables.versionId] });
    },
    onError: (error) => {
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : 'Failed to apply merge decisions',
        variant: "destructive",
      });
    },
  });
}
