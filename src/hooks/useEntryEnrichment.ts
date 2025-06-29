
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EntryEnrichment {
  id: string;
  user_id: string;
  resume_version_id: string;
  parsed_entity_id: string;
  insights: string[];
  skills_identified: string[];
  experience_level?: string;
  career_progression?: string;
  market_relevance?: string;
  recommendations: string[];
  parsed_structure?: any;
  model_version: string;
  confidence_score: number;
  enrichment_metadata: any;
  created_at: string;
  updated_at: string;
}

// Hook to get enrichments for a resume version
export function useResumeEnrichments(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['entry-enrichments', versionId],
    queryFn: async (): Promise<EntryEnrichment[]> => {
      if (!versionId || !user) return [];
      
      const { data, error } = await supabase
        .from('entry_enrichment')
        .select('*')
        .eq('resume_version_id', versionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entry enrichments:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!versionId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to get enrichment for a specific entity
export function useEntityEnrichment(entityId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['entity-enrichment', entityId],
    queryFn: async (): Promise<EntryEnrichment | null> => {
      if (!entityId || !user) return null;
      
      const { data, error } = await supabase
        .from('entry_enrichment')
        .select('*')
        .eq('parsed_entity_id', entityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching entity enrichment:', error);
        throw error;
      }

      return data;
    },
    enabled: !!entityId && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to enrich all entries in a resume
export function useEnrichAllEntries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { data, error } = await supabase.functions.invoke('enrich-resume-entries', {
        body: { resume_version_id: versionId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to enrich entries');
      }

      return data;
    },
    onSuccess: (data, versionId) => {
      toast({
        title: "Enrichment Complete",
        description: `Successfully enriched ${data.enriched_count} entries`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['entry-enrichments', versionId] });
      queryClient.invalidateQueries({ queryKey: ['parsed-resume-entities', versionId] });
    },
    onError: (error) => {
      console.error('Error enriching entries:', error);
      toast({
        title: "Enrichment Failed",
        description: error instanceof Error ? error.message : 'Failed to enrich entries',
        variant: "destructive",
      });
    },
  });
}

// Hook to enrich a single entry
export function useEnrichSingleEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityId, forceRefresh = false }: { entityId: string; forceRefresh?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('enrich-single-entry', {
        body: { 
          parsed_entity_id: entityId,
          force_refresh: forceRefresh
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to enrich entry');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const message = data.was_cached 
        ? "Enrichment already available"
        : "Entry enriched successfully";
        
      toast({
        title: "Enrichment Complete",
        description: message,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['entity-enrichment', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['entry-enrichments'] });
    },
    onError: (error) => {
      console.error('Error enriching entry:', error);
      toast({
        title: "Enrichment Failed",
        description: error instanceof Error ? error.message : 'Failed to enrich entry',
        variant: "destructive",
      });
    },
  });
}

// Hook to get enrichment statistics
export function useEnrichmentStats(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['enrichment-stats', versionId],
    queryFn: async () => {
      if (!versionId || !user) return null;
      
      // Get total entities
      const { data: entities, error: entitiesError } = await supabase
        .from('parsed_resume_entities')
        .select('id')
        .eq('resume_version_id', versionId);

      if (entitiesError) {
        throw entitiesError;
      }

      // Get enriched entities
      const { data: enrichments, error: enrichmentsError } = await supabase
        .from('entry_enrichment')
        .select('id')
        .eq('resume_version_id', versionId)
        .eq('user_id', user.id);

      if (enrichmentsError) {
        throw enrichmentsError;
      }

      return {
        total_entities: entities?.length || 0,
        enriched_entities: enrichments?.length || 0,
        enrichment_percentage: entities?.length 
          ? Math.round((enrichments?.length || 0) / entities.length * 100)
          : 0
      };
    },
    enabled: !!versionId && !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
