
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApplyResumeDataResult {
  entitiesCreated: number;
  entitiesUpdated: number;
  errors: number;
  results: Array<{
    entity_type: string;
    action: 'created' | 'updated' | 'error';
    entity_id?: string;
    error?: string;
  }>;
}

export function useApplyResumeDataToProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ versionId }: {
      versionId: string;
    }): Promise<ApplyResumeDataResult> => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('apply-resume-data-to-profile', {
        body: { versionId }
      });

      if (error) {
        console.error('Error applying resume data to profile:', error);
        throw error;
      }

      return data as ApplyResumeDataResult;
    },
    onSuccess: (result, variables) => {
      const { entitiesCreated, entitiesUpdated, errors } = result;
      
      let message = `Created ${entitiesCreated} new profile entries`;
      if (entitiesUpdated > 0) message += `, updated ${entitiesUpdated}`;
      if (errors > 0) message += `, ${errors} errors occurred`;

      toast({
        title: "Resume Data Applied",
        description: message,
        variant: errors > 0 ? "destructive" : "default",
      });
      
      // Invalidate all entity queries to refresh the profile data
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['user-confirmed-profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['resume-diffs', variables.versionId] });
    },
    onError: (error) => {
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : 'Failed to apply resume data to profile',
        variant: "destructive",
      });
    },
  });
}
