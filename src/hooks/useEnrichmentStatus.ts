
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface EnrichmentStatus {
  versionId: string;
  currentStage: string;
  processingProgress: number;
  processingStatus: string;
  stages: any;
  hasEntities: boolean;
  hasEnrichment: boolean;
  hasNarratives: boolean;
  isComplete: boolean;
  lastUpdated: string;
  processingStage: 'pending' | 'parsing' | 'enriching' | 'complete' | 'failed';
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
      
      console.log('useEnrichmentStatus: Checking comprehensive processing status for version:', versionId);
      
      try {
        // Use the new comprehensive status function
        const { data, error } = await supabase.rpc('get_resume_processing_status', {
          p_version_id: versionId
        });

        if (error) {
          console.error('useEnrichmentStatus: Error getting processing status:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log('useEnrichmentStatus: No processing status found for version:', versionId);
          return null;
        }

        const status = data[0];
        console.log('useEnrichmentStatus: Raw status from database:', status);

        // Map the database status to our interface
        const processingStage = mapCurrentStageToProcessingStage(status.current_stage, status.processing_status);
        
        const result: EnrichmentStatus = {
          versionId: status.version_id,
          currentStage: status.current_stage,
          processingProgress: status.processing_progress || 0,
          processingStatus: status.processing_status,
          stages: status.stages || {},
          hasEntities: status.has_entities || false,
          hasEnrichment: status.has_enrichment || false,
          hasNarratives: status.has_narratives || false,
          isComplete: status.is_complete || false,
          lastUpdated: status.last_updated,
          processingStage
        };

        console.log('useEnrichmentStatus: Mapped result:', result);
        return result;
      } catch (error) {
        console.error('useEnrichmentStatus: Query failed:', error);
        
        // Return a failed state instead of throwing
        return {
          versionId,
          currentStage: 'upload',
          processingProgress: 0,
          processingStatus: 'failed',
          stages: {},
          hasEntities: false,
          hasEnrichment: false,
          hasNarratives: false,
          isComplete: false,
          lastUpdated: new Date().toISOString(),
          processingStage: 'failed'
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

function mapCurrentStageToProcessingStage(currentStage: string, processingStatus: string): EnrichmentStatus['processingStage'] {
  if (processingStatus === 'failed') return 'failed';
  if (processingStatus === 'completed') return 'complete';
  
  switch (currentStage) {
    case 'upload':
      return 'pending';
    case 'parse':
      return 'parsing';
    case 'enrich':
      return 'enriching';
    case 'complete':
      return 'complete';
    default:
      return 'pending';
  }
}
