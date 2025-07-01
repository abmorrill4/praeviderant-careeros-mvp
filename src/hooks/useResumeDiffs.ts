
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ResumeDiff, UserConfirmedProfile, DiffAnalysisResult } from '@/types/resume-diffs';

// Hook to get resume diffs for a specific version
export function useResumeDiffs(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['resume-diffs', versionId],
    queryFn: async (): Promise<ResumeDiff[]> => {
      if (!versionId || !user) return [];
      
      const { data, error } = await supabase
        .from('resume_diffs')
        .select('*')
        .eq('resume_version_id', versionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resume diffs:', error);
        throw error;
      }

      // Type assertion to ensure diff_type is properly typed
      return (data || []).map(row => ({
        ...row,
        diff_type: row.diff_type as ResumeDiff['diff_type'],
        metadata: row.metadata as Record<string, any>,
        // Note: embedding_vector is not available in current schema
        embedding_vector: undefined
      }));
    },
    enabled: !!versionId && !!user,
  });
}

// Hook to get user confirmed profile data
export function useUserConfirmedProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-confirmed-profile', user?.id],
    queryFn: async (): Promise<UserConfirmedProfile[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_confirmed_profile')
        .select('*')
        .eq('user_id', user.id)
        .order('last_confirmed_at', { ascending: false });

      if (error) {
        console.error('Error fetching user confirmed profile:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
}

// Hook to trigger semantic diff analysis
export function useSemanticDiffAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-resume-diffs', {
        body: { versionId }
      });

      if (error) {
        console.error('Error analyzing resume diffs:', error);
        throw error;
      }

      return data as DiffAnalysisResult;
    },
    onSuccess: (data, versionId) => {
      toast({
        title: "Analysis Complete",
        description: `Found ${data.summary.total} comparisons: ${data.summary.new} new, ${data.summary.conflicting} conflicts, ${data.summary.requiresReview} need review`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['resume-diffs', versionId] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Failed to analyze resume differences',
        variant: "destructive",
      });
    },
  });
}

// Hook to confirm a profile entity value
export function useConfirmProfileEntity() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      fieldName,
      confirmedValue,
      confidenceScore = 1.0
    }: {
      entityType: string;
      entityId: string;
      fieldName: string;
      confirmedValue: string;
      confidenceScore?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_confirmed_profile')
        .upsert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          field_name: fieldName,
          confirmed_value: confirmedValue,
          confidence_score: confidenceScore,
          last_confirmed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error confirming profile entity:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile data has been confirmed and saved.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['user-confirmed-profile', user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: "destructive",
      });
    },
  });
}
