
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
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const obj = data as any;
  const validProcessingStages = ['pending', 'parsing', 'enriching', 'complete', 'failed'];
  
  return (
    typeof obj.processingStage === 'string' &&
    validProcessingStages.includes(obj.processingStage) &&
    typeof obj.isComplete === 'boolean'
  );
}

// Helper function to determine if we should continue polling - using switch to avoid type narrowing issues
function shouldContinuePolling(status: EnrichmentStatus): boolean {
  console.log('useEnrichmentStatus: Refetch interval decision:', { 
    isComplete: status.isComplete, 
    processingStage: status.processingStage,
  });

  // Use switch statement to avoid TypeScript control flow analysis issues
  switch (status.processingStage) {
    case 'failed':
      return false;
    case 'complete':
      return !status.isComplete; // Only continue if not actually complete
    case 'pending':
    case 'parsing':
    case 'enriching':
      return !status.isComplete; // Continue polling for active stages
    default:
      return false;
  }
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

      // Enhanced parameter validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(versionId)) {
        console.error('useEnrichmentStatus: Invalid versionId format:', versionId);
        throw new Error(`Invalid version ID format: ${versionId}`);
      }

      // Additional check for parameter placeholder
      if (versionId.startsWith(':') || versionId === 'undefined' || versionId === 'null') {
        console.error('useEnrichmentStatus: Version ID appears to be a parameter placeholder:', versionId);
        throw new Error(`Version ID appears to be a parameter placeholder: ${versionId}`);
      }
      
      console.log('useEnrichmentStatus: Checking comprehensive processing status for version:', versionId);
      
      try {
        // Use the comprehensive status function with enhanced error handling
        const { data, error } = await supabase.rpc('get_resume_processing_status', {
          p_version_id: versionId
        });

        if (error) {
          console.error('useEnrichmentStatus: Error getting processing status:', error);
          
          // Check if the error is due to invalid UUID format
          if (error.message?.includes('invalid input syntax for type uuid')) {
            throw new Error(`Invalid UUID format provided: ${versionId}`);
          }
          
          // Don't throw - return a safe fallback state for other errors
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
          processingStage: processingStage
        };

        console.log('useEnrichmentStatus: Mapped result:', result);
        return result;
      } catch (error) {
        console.error('useEnrichmentStatus: Query failed:', error);
        
        // Re-throw validation errors so they bubble up to the UI
        if (error instanceof Error && (
          error.message.includes('Invalid version ID') || 
          error.message.includes('parameter placeholder')
        )) {
          throw error;
        }
        
        // Return a safe fallback state for other errors
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
      
      // Don't retry validation errors
      if (error instanceof Error && (
        error.message.includes('Invalid version ID') || 
        error.message.includes('parameter placeholder')
      )) {
        return false;
      }
      
      return failureCount < 2; // Retry up to 2 times for other errors
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
): EnrichmentStatus['processingStage'] {
  // Define all possible return values to help TypeScript understand the full union
  const validStages = {
    pending: 'pending' as const,
    parsing: 'parsing' as const,
    enriching: 'enriching' as const,
    complete: 'complete' as const,
    failed: 'failed' as const
  };
  
  // Check for explicit failed status first
  if (processingStatus === 'failed') {
    return validStages.failed;
  }
  
  // Check for complete status with all data available
  if (processingStatus === 'completed' && hasNarratives && hasEnrichment) {
    return validStages.complete;
  }
  
  // Determine stage based on data availability and current stage
  if (hasNarratives && hasEnrichment && hasEntities) {
    return validStages.complete;
  }
  
  if (hasEnrichment && hasEntities) {
    return validStages.enriching;
  }
  
  if (hasEntities) {
    return validStages.parsing;
  }
  
  // Map stage names to processing stages as fallback
  switch (currentStage) {
    case 'upload':
      return validStages.pending;
    case 'parse':
      return validStages.parsing;
    case 'enrich':
      return validStages.enriching;
    case 'complete':
      return validStages.complete;
    default:
      return validStages.pending;
  }
}
