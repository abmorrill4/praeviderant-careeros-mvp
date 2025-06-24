
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MergeDecision, MergeReviewItem } from '@/types/merge-decisions';
import type { ResumeDiff } from '@/types/resume-diffs';

// Hook to get merge review items for a resume version
export function useMergeReviewItems(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['merge-review-items', versionId],
    queryFn: async (): Promise<MergeReviewItem[]> => {
      if (!versionId || !user) return [];
      
      // Get resume diffs for this version
      const { data: diffs, error } = await supabase
        .from('resume_diffs')
        .select(`
          *,
          parsed_resume_entities!inner(field_name, raw_value)
        `)
        .eq('resume_version_id', versionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching merge review items:', error);
        throw error;
      }

      // Transform diffs into review items
      const reviewItems: MergeReviewItem[] = (diffs || []).map((diff: any) => ({
        parsedEntityId: diff.parsed_entity_id,
        profileEntityId: diff.profile_entity_id,
        profileEntityType: diff.profile_entity_type,
        fieldName: diff.parsed_resume_entities.field_name,
        parsedValue: diff.parsed_resume_entities.raw_value,
        confirmedValue: undefined, // Will be populated by confirmed profile data
        diffType: diff.diff_type as MergeReviewItem['diffType'],
        confidenceScore: diff.confidence_score || 0,
        similarityScore: diff.similarity_score || 0,
        justification: diff.justification
      }));

      return reviewItems;
    },
    enabled: !!versionId && !!user,
  });
}

// Hook to get existing merge decisions
export function useMergeDecisions(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['merge-decisions', versionId],
    queryFn: async (): Promise<MergeDecision[]> => {
      if (!versionId || !user) return [];
      
      try {
        // Use the edge function to query merge decisions
        const { data, error } = await supabase.functions.invoke('select-merge-decisions', {
          body: { versionId, userId: user.id }
        });

        if (error) {
          console.error('Error fetching merge decisions:', error);
          return [];
        }

        return (data || []) as MergeDecision[];
      } catch (error) {
        console.error('Error calling merge decisions function:', error);
        return [];
      }
    },
    enabled: !!versionId && !!user,
  });
}

// Hook to create a merge decision
export function useCreateMergeDecision() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      versionId,
      parsedEntityId,
      profileEntityId,
      profileEntityType,
      fieldName,
      decisionType,
      parsedValue,
      confirmedValue,
      overrideValue,
      justification,
      confidenceScore
    }: {
      versionId: string;
      parsedEntityId: string;
      profileEntityId?: string;
      profileEntityType?: string;
      fieldName: string;
      decisionType: 'accept' | 'reject' | 'override';
      parsedValue: string;
      confirmedValue: string;
      overrideValue?: string;
      justification?: string;
      confidenceScore: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Use the edge function to create merge decision
      const { data, error } = await supabase.functions.invoke('create-merge-decision', {
        body: {
          user_id: user.id,
          resume_version_id: versionId,
          parsed_entity_id: parsedEntityId,
          profile_entity_id: profileEntityId,
          profile_entity_type: profileEntityType,
          field_name: fieldName,
          decision_type: decisionType,
          parsed_value: parsedValue,
          confirmed_value: confirmedValue,
          override_value: overrideValue,
          justification: justification,
          confidence_score: confidenceScore
        }
      });

      if (error) {
        console.error('Error creating merge decision:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const actionMap = {
        accept: 'accepted',
        reject: 'rejected',
        override: 'overridden'
      };
      
      toast({
        title: "Decision Saved",
        description: `Field "${variables.fieldName}" has been ${actionMap[variables.decisionType]}.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['merge-decisions', variables.versionId] });
    },
    onError: (error) => {
      toast({
        title: "Decision Failed",
        description: error instanceof Error ? error.message : 'Failed to save merge decision',
        variant: "destructive",
      });
    },
  });
}
