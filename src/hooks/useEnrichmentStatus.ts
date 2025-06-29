
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

// Type guard to ensure data exists and has the correct shape
function isValidEnrichmentStatus(data: unknown): data is EnrichmentStatus {
  return (
    data !== null &&
    data !== undefined &&
    typeof data === 'object' &&
    'processingStage' in data &&
    'isComplete' in data &&
    typeof (data as any).processingStage === 'string' &&
    typeof (data as any).isComplete === 'boolean'
  );
}

// Helper function to determine if we should continue polling
function shouldContinuePolling(status: EnrichmentStatus): boolean {
  // Don't poll if processing failed or is complete
  if (status.processingStage === 'failed' || (status.isComplete && status.processingStage === 'complete')) {
    return false;
  }
  
  // Poll more frequently during active processing
  const shouldPoll = !status.isComplete && status.processingStage !== 'failed';
  console.log('useEnrichmentStatus: Refetch interval decision:', { 
    isComplete: status.isComplete, 
    processingStage: status.processingStage,
    shouldPoll 
  });
  
  return shouldPoll;
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
        // Use the comprehensive status function with enhanced error handling
        const { data, error } = await supabase.rpc('get_resume_processing_status', {
          p_version_id: versionId
        });

        if (error) {
          console.error('useEnrichmentStatus: Error getting processing status:', error);
          // Don't throw - return a safe fallback state
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

        if (!data || data.length === 0) {
          console.log('useEnrichmentStatus: No processing status found for version:', versionId);
          return null;
        }

        const status = data[0];
        console.log('useEnrichmentStatus: Raw status from database:', status);

        // Enhanced stage mapping with better error handling
        const processingStage = mapCurrentStageToProcessingStage(
          status.current_stage, 
          status.processing_status,
          status.has_entities,
          status.has_enrichment,
          status.has_narratives
        );
        
        const result: EnrichmentStatus = {
          versionId: status.version_id,
          currentStage: status.current_stage || 'upload',
          processingProgress: Math.max(0, Math.min(100, status.processing_progress || 0)),
          processingStatus: status.processing_status || 'pending',
          stages: status.stages || {},
          hasEntities: Boolean(status.has_entities),
          hasEnrichment: Boolean(status.has_enrichment),
          hasNarratives: Boolean(status.has_narratives),
          isComplete: Boolean(status.is_complete),
          lastUpdated: status.last_updated || new Date().toISOString(),
          processingStage: processingStage as EnrichmentStatus['processingStage']
        };

        console.log('useEnrichmentStatus: Mapped result:', result);
        return result;
      } catch (error) {
        console.error('useEnrichmentStatus: Query failed:', error);
        
        // Return a safe fallback state instead of throwing
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
      // Use type guard to safely access the data
      if (!isValidEnrichmentStatus(query.state.data)) {
        return false;
      }
      
      // Use helper function with proper typing
      return shouldContinuePolling(query.state.data) ? 3000 : false;
    },
    staleTime: 1000 * 10, // Consider data stale after 10 seconds
    retry: (failureCount, error) => {
      console.log('useEnrichmentStatus: Retry decision:', { failureCount, error });
      return failureCount < 2; // Retry up to 2 times
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff, max 10s
  });
}

function mapCurrentStageToProcessingStage(
  currentStage: string, 
  processingStatus: string,
  hasEntities: boolean,
  hasEnrichment: boolean,
  hasNarratives: boolean
): 'pending' | 'parsing' | 'enriching' | 'complete' | 'failed' {
  // Check for explicit failed status first
  if (processingStatus === 'failed') {
    return 'failed';
  }
  
  // Check for complete status
  if (processingStatus === 'completed' && hasNarratives && hasEnrichment) {
    return 'complete';
  }
  
  // Determine stage based on data availability and current stage
  if (hasNarratives && hasEnrichment && hasEntities) {
    return 'complete';
  } else if (hasEnrichment && hasEntities) {
    return 'enriching';
  } else if (hasEntities) {
    return 'parsing';
  } else {
    // Map stage names to processing stages
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
}
