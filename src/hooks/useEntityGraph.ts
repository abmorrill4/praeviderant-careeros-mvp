
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UnresolvedEntity, SimilarEntity } from '@/types/entity-graph';

// Hook to get unresolved entities
export function useUnresolvedEntities() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['unresolved-entities'],
    queryFn: async (): Promise<UnresolvedEntity[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('unresolved_entities_stats')
        .select('*')
        .order('confidence_score', { ascending: true });

      if (error) {
        console.error('Error fetching unresolved entities:', error);
        throw error;
      }

      return (data || []).map(row => ({
        id: row.id,
        entity_type: row.entity_type,
        canonical_name: row.canonical_name,
        aliases: row.aliases || [],
        confidence_score: row.confidence_score,
        review_status: row.review_status as 'approved' | 'pending' | 'flagged',
        reference_count: row.reference_count || 0,
        referencing_users: row.referencing_users || [],
        avg_match_score: row.avg_match_score,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    },
    enabled: !!user,
  });
}

// Hook to get similar entities for a given entity
export function useSimilarEntities(entityId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['similar-entities', entityId],
    queryFn: async (): Promise<SimilarEntity[]> => {
      if (!entityId || !user) return [];
      
      const { data, error } = await supabase.rpc('find_similar_entities', {
        p_entity_id: entityId,
        p_similarity_threshold: 0.7
      });

      if (error) {
        console.error('Error fetching similar entities:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        entity_type: row.entity_type,
        canonical_name: row.canonical_name,
        aliases: row.aliases || [],
        confidence_score: row.confidence_score,
        similarity_score: row.similarity_score
      }));
    },
    enabled: !!entityId && !!user,
  });
}

// Hook to merge entities
export function useMergeEntities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      sourceEntityId,
      targetEntityId
    }: {
      sourceEntityId: string;
      targetEntityId: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('merge_normalized_entities', {
        p_source_entity_id: sourceEntityId,
        p_target_entity_id: targetEntityId,
        p_admin_user_id: user.id
      });

      if (error) {
        console.error('Error merging entities:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Entities Merged",
        description: "The entities have been successfully merged.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['unresolved-entities'] });
      queryClient.invalidateQueries({ queryKey: ['similar-entities'] });
      queryClient.invalidateQueries({ queryKey: ['normalized-entities'] });
    },
    onError: (error) => {
      toast({
        title: "Merge Failed",
        description: error instanceof Error ? error.message : 'Failed to merge entities',
        variant: "destructive",
      });
    },
  });
}

// Hook to update entity status
export function useUpdateEntityStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      entityId,
      status
    }: {
      entityId: string;
      status: 'approved' | 'pending' | 'flagged';
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('normalized_entities')
        .update({ 
          review_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', entityId)
        .select()
        .single();

      if (error) {
        console.error('Error updating entity status:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Entity status has been updated successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['unresolved-entities'] });
      queryClient.invalidateQueries({ queryKey: ['normalized-entities'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update entity status',
        variant: "destructive",
      });
    },
  });
}

// Hook to delete entity
export function useDeleteEntity() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entityId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('normalized_entities')
        .delete()
        .eq('id', entityId);

      if (error) {
        console.error('Error deleting entity:', error);
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Entity Deleted",
        description: "The entity has been successfully deleted.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['unresolved-entities'] });
      queryClient.invalidateQueries({ queryKey: ['normalized-entities'] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete entity',
        variant: "destructive",
      });
    },
  });
}
