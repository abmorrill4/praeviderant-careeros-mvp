
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
      if (!versionId || !user) {
        console.log('useEnrichmentStatus: Missing versionId or user', { versionId, userId: user?.id });
        return null;
      }
      
      console.log('useEnrichmentStatus: Checking enrichment status for version:', versionId);
      
      try {
        // Check parsed entities
        const { data: entities, error: entitiesError } = await supabase
          .from('parsed_resume_entities')
          .select('id')
          .eq('resume_version_id', versionId)
          .limit(1);

        if (entitiesError) {
          console.error('useEnrichmentStatus: Error checking entities:', entitiesError);
          throw entitiesError;
        }

        const hasEntities = entities && entities.length > 0;
        console.log('useEnrichmentStatus: Entities check result:', { hasEntities, entitiesCount: entities?.length || 0 });

        // Check career enrichment
        const { data: enrichment, error: enrichmentError } = await supabase
          .from('career_enrichment')
          .select('id')
          .eq('resume_version_id', versionId)
          .eq('user_id', user.id)
          .limit(1);

        if (enrichmentError) {
          console.error('useEnrichmentStatus: Error checking enrichment:', enrichmentError);
          throw enrichmentError;
        }

        const hasEnrichment = enrichment && enrichment.length > 0;
        console.log('useEnrichmentStatus: Enrichment check result:', { hasEnrichment, enrichmentCount: enrichment?.length || 0 });

        // Check career narratives
        const { data: narratives, error: narrativesError } = await supabase
          .from('career_narratives')
          .select('id')
          .eq('resume_version_id', versionId)
          .eq('user_id', user.id)
          .limit(1);

        if (narrativesError) {
          console.error('useEnrichmentStatus: Error checking narratives:', narrativesError);
          throw narrativesError;
        }

        const hasNarratives = narratives && narratives.length > 0;
        console.log('useEnrichmentStatus: Narratives check result:', { hasNarratives, narrativesCount: narratives?.length || 0 });

        // Determine processing stage with better logic
        let processingStage: EnrichmentStatus['processingStage'] = 'pending';
        if (hasEntities && hasEnrichment && hasNarratives) {
          processingStage = 'complete';
        } else if (hasEntities && hasEnrichment) {
          processingStage = 'enriching'; // Enrichment exists but narratives are still being generated
        } else if (hasEntities) {
          processingStage = 'enriching'; // Entities exist, now enriching
        } else {
          processingStage = 'parsing'; // Still parsing entities
        }

        const isComplete = hasEntities && hasEnrichment && hasNarratives;

        const result = {
          versionId,
          hasEntities,
          hasEnrichment,
          hasNarratives,
          isComplete,
          processingStage,
          lastUpdated: new Date().toISOString()
        };

        console.log('useEnrichmentStatus: Final result:', result);
        return result;
      } catch (error) {
        console.error('useEnrichmentStatus: Query failed:', error);
        
        // Return a failed state instead of throwing
        return {
          versionId,
          hasEntities: false,
          hasEnrichment: false,
          hasNarratives: false,
          isComplete: false,
          processingStage: 'failed',
          lastUpdated: new Date().toISOString()
        };
      }
    },
    enabled: !!versionId && !!user,
    refetchInterval: (query) => {
      const data = query.state.data;
      const shouldPoll = data && !data.isComplete && data.processingStage !== 'failed';
      console.log('useEnrichmentStatus: Refetch interval decision:', { 
        isComplete: data?.isComplete, 
        processingStage: data?.processingStage,
        shouldPoll 
      });
      return shouldPoll ? 2000 : false; // Poll every 2 seconds until complete or failed
    },
    staleTime: 1000 * 15, // Consider data stale after 15 seconds
    retry: (failureCount, error) => {
      console.log('useEnrichmentStatus: Retry decision:', { failureCount, error });
      return failureCount < 3; // Retry up to 3 times
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
