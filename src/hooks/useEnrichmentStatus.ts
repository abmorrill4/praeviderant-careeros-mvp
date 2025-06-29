
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

function isValidVersionId(versionId?: string): boolean {
  if (!versionId) return false;
  
  if (versionId === ':versionId' || 
      versionId.startsWith(':') || 
      versionId === 'undefined' || 
      versionId === 'null' ||
      versionId.length < 10) {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(versionId);
}

function createFallbackStatus(versionId: string): EnrichmentStatus {
  return {
    versionId,
    currentStage: 'upload',
    processingProgress: 0,
    processingStatus: 'pending',
    stages: {
      upload: { status: 'pending', started_at: null, completed_at: null, error: null },
      parse: { status: 'pending', started_at: null, completed_at: null, error: null },
      enrich: { status: 'pending', started_at: null, completed_at: null, error: null },
      complete: { status: 'pending', started_at: null, completed_at: null, error: null }
    },
    hasEntities: false,
    hasEnrichment: false,
    hasNarratives: false,
    isComplete: false,
    lastUpdated: new Date().toISOString(),
    processingStage: 'pending'
  };
}

function mapCurrentStageToProcessingStage(
  currentStage: string, 
  processingStatus: string,
  hasEntities: boolean,
  hasEnrichment: boolean,
  hasNarratives: boolean
): EnrichmentStatus['processingStage'] {
  if (processingStatus === 'failed') {
    return 'failed';
  }
  
  if (processingStatus === 'completed' && hasNarratives && hasEnrichment) {
    return 'complete';
  }
  
  if (hasNarratives && hasEnrichment && hasEntities) {
    return 'complete';
  }
  
  if (hasEnrichment && hasEntities) {
    return 'enriching';
  }
  
  if (hasEntities) {
    return 'parsing';
  }
  
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

export function useEnrichmentStatus(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['enrichment-status', versionId],
    queryFn: async (): Promise<EnrichmentStatus> => {
      if (!user) {
        console.log('useEnrichmentStatus: No user authenticated');
        // Return fallback instead of throwing to prevent auth error propagation
        if (versionId && isValidVersionId(versionId)) {
          return createFallbackStatus(versionId);
        }
        throw new Error('Authentication required');
      }

      if (!versionId) {
        console.log('useEnrichmentStatus: No versionId provided');
        throw new Error('Version ID is required');
      }

      if (!isValidVersionId(versionId)) {
        console.error('useEnrichmentStatus: Invalid versionId format:', versionId);
        throw new Error(`Invalid version ID format: ${versionId}`);
      }
      
      console.log('useEnrichmentStatus: Checking comprehensive processing status for version:', versionId);
      
      try {
        const { data, error } = await supabase.rpc('get_resume_processing_status', {
          p_version_id: versionId
        });

        if (error) {
          console.error('useEnrichmentStatus: Database error getting processing status:', error);
          // Check if it's an auth-related error
          if (error.message?.includes('JWT') || error.message?.includes('auth')) {
            throw new Error('Authentication expired. Please sign in again.');
          }
          // Return fallback for other database errors to prevent UI crashes
          console.warn('useEnrichmentStatus: Falling back to default status due to database error');
          return createFallbackStatus(versionId);
        }

        if (!data || data.length === 0) {
          console.log('useEnrichmentStatus: No processing status found for version:', versionId);
          return createFallbackStatus(versionId);
        }

        const status = data[0];
        console.log('useEnrichmentStatus: Raw status from database:', status);

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
        
        // Distinguish between different error types
        if (error instanceof Error) {
          if (error.message.includes('Authentication') || error.message.includes('JWT')) {
            throw error; // Re-throw auth errors
          }
        }
        
        // For other errors, return fallback to prevent UI crashes
        console.warn('useEnrichmentStatus: Returning fallback status due to error');
        return createFallbackStatus(versionId);
      }
    },
    enabled: !!user && isValidVersionId(versionId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      
      // Continue polling if not complete and not failed
      return (!data.isComplete && data.processingStage !== 'failed') ? 3000 : false;
    },
    staleTime: 1000 * 10,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error instanceof Error && 
          (error.message.includes('Authentication') || error.message.includes('JWT'))) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
