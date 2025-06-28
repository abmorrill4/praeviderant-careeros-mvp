
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface EnrichmentStatus {
  versionId: string;
  hasEntities: boolean;
  hasEnrichment: boolean;
  hasNarratives: boolean;
  isComplete: boolean;
  processingStage: 'pending' | 'parsing' | 'enriching' | 'complete' | 'failed';
  lastUpdated: string;
}

export function useEnrichmentStatus(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['enrichment-status', versionId],
    queryFn: async (): Promise<EnrichmentStatus | null> => {
      if (!versionId || !user) return null;
      
      console.log('Checking enrichment status for version:', versionId);
      
      // Check parsed entities
      const { data: entities, error: entitiesError } = await supabase
        .from('parsed_resume_entities')
        .select('id')
        .eq('resume_version_id', versionId)
        .limit(1);

      if (entitiesError) {
        console.error('Error checking entities:', entitiesError);
        throw entitiesError;
      }

      const hasEntities = entities && entities.length > 0;

      // Check career enrichment
      const { data: enrichment, error: enrichmentError } = await supabase
        .from('career_enrichment')
        .select('id')
        .eq('resume_version_id', versionId)
        .eq('user_id', user.id)
        .limit(1);

      if (enrichmentError) {
        console.error('Error checking enrichment:', enrichmentError);
        throw enrichmentError;
      }

      const hasEnrichment = enrichment && enrichment.length > 0;

      // Check career narratives
      const { data: narratives, error: narrativesError } = await supabase
        .from('career_narratives')
        .select('id')
        .eq('resume_version_id', versionId)
        .eq('user_id', user.id)
        .limit(1);

      if (narrativesError) {
        console.error('Error checking narratives:', narrativesError);
        throw narrativesError;
      }

      const hasNarratives = narratives && narratives.length > 0;

      // Determine processing stage
      let processingStage: EnrichmentStatus['processingStage'] = 'pending';
      if (hasEntities && hasEnrichment && hasNarratives) {
        processingStage = 'complete';
      } else if (hasEntities && hasEnrichment) {
        processingStage = 'enriching';
      } else if (hasEntities) {
        processingStage = 'enriching';
      } else {
        processingStage = 'parsing';
      }

      const isComplete = hasEntities && hasEnrichment && hasNarratives;

      console.log('Enrichment status:', {
        hasEntities,
        hasEnrichment,
        hasNarratives,
        isComplete,
        processingStage
      });

      return {
        versionId,
        hasEntities,
        hasEnrichment,
        hasNarratives,
        isComplete,
        processingStage,
        lastUpdated: new Date().toISOString()
      };
    },
    enabled: !!versionId && !!user,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.isComplete ? false : 3000; // Poll every 3 seconds until complete
    },
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
  });
}
