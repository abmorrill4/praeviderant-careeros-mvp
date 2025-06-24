
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  NormalizedEntity, 
  ResumeEntityLink, 
  NormalizationJob, 
  NormalizationResult 
} from '@/types/normalization';

// Hook to get normalized entities by type
export function useNormalizedEntities(entityType?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['normalized-entities', entityType],
    queryFn: async (): Promise<NormalizedEntity[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('normalized_entities')
        .select('*')
        .order('canonical_name');

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching normalized entities:', error);
        throw error;
      }

      return (data || []).map(row => ({
        ...row,
        aliases: row.aliases || [],
        metadata: row.metadata as Record<string, any>,
        embedding_vector: row.embedding_vector ? (row.embedding_vector as unknown as number[]) : undefined
      }));
    },
    enabled: !!user,
  });
}

// Hook to get entity links for a resume version
export function useResumeEntityLinks(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['resume-entity-links', versionId],
    queryFn: async (): Promise<ResumeEntityLink[]> => {
      if (!versionId || !user) return [];
      
      const { data, error } = await supabase
        .from('resume_entity_links')
        .select(`
          *,
          parsed_resume_entities!inner(resume_version_id)
        `)
        .eq('parsed_resume_entities.resume_version_id', versionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resume entity links:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!versionId && !!user,
  });
}

// Hook to get normalization jobs
export function useNormalizationJobs(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['normalization-jobs', versionId],
    queryFn: async (): Promise<NormalizationJob[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('normalization_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (versionId) {
        query = query.eq('resume_version_id', versionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching normalization jobs:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
}

// Hook to trigger entity normalization for a resume version
export function useNormalizeEntities() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      versionId,
      entityType
    }: {
      versionId: string;
      entityType?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('normalize-entities', {
        body: { 
          versionId,
          entityType 
        }
      });

      if (error) {
        console.error('Error normalizing entities:', error);
        throw error;
      }

      return data as NormalizationResult;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Normalization Started",
        description: `Processing entities for resume version. Job ID: ${data.job.id}`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['normalization-jobs', variables.versionId] });
      queryClient.invalidateQueries({ queryKey: ['resume-entity-links', variables.versionId] });
    },
    onError: (error) => {
      toast({
        title: "Normalization Failed",
        description: error instanceof Error ? error.message : 'Failed to start entity normalization',
        variant: "destructive",
      });
    },
  });
}

// Hook to manually link entities
export function useManualEntityLink() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parsedEntityId,
      normalizedEntityId,
      confidenceScore = 1.0
    }: {
      parsedEntityId: string;
      normalizedEntityId: string;
      confidenceScore?: number;
    }) => {
      const { data, error } = await supabase
        .from('resume_entity_links')
        .upsert({
          parsed_entity_id: parsedEntityId,
          normalized_entity_id: normalizedEntityId,
          match_method: 'manual',
          match_score: 1.0,
          confidence_score: confidenceScore,
          review_required: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating manual entity link:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Entity Linked",
        description: "Manual entity link created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['resume-entity-links'] });
    },
    onError: (error) => {
      toast({
        title: "Link Failed",
        description: error instanceof Error ? error.message : 'Failed to create entity link',
        variant: "destructive",
      });
    },
  });
}

// Hook to create new normalized entity
export function useCreateNormalizedEntity() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      canonicalName,
      aliases = [],
      metadata = {}
    }: {
      entityType: string;
      canonicalName: string;
      aliases?: string[];
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('normalized_entities')
        .insert({
          entity_type: entityType,
          canonical_name: canonicalName,
          aliases,
          metadata,
          confidence_score: 1.0,
          review_status: 'approved'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating normalized entity:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Entity Created",
        description: `New normalized entity "${data.canonical_name}" created successfully.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['normalized-entities'] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create normalized entity',
        variant: "destructive",
      });
    },
  });
}
