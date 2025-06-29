
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
  
  // FIXED: Simplified completion check - if we have all three components, we're complete
  if (hasEntities && hasEnrichment && hasNarratives) {
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
          if (error.message?.includes('JWT') || error.message?.includes('auth')) {
            throw new Error('Authentication expired. Please sign in again.');
          }
          console.warn('useEnrichmentStatus: Falling back to default status due to database error');
          return createFallbackStatus(versionId);
        }

        if (!data || data.length === 0) {
          console.log('useEnrichmentStatus: No processing status found for version:', versionId);
          return createFallbackStatus(versionId);
        }

        const status = data[0];
        console.log('useEnrichmentStatus: Raw status from database:', status);

        // Extract boolean values
        const hasEntities = Boolean(status.has_entities);
        const hasEnrichment = Boolean(status.has_enrichment);
        const hasNarratives = Boolean(status.has_narratives);

        // FIXED: Simplified completion logic - just check if we have all three components
        const isComplete = hasEntities && hasEnrichment && hasNarratives;
        
        const processingStage = mapCurrentStageToProcessingStage(
          status.current_stage, 
          status.processing_status,
          hasEntities,
          hasEnrichment,
          hasNarratives
        );
        
        // FIXED: Set progress to 100% when complete, otherwise use database value
        const processingProgress = isComplete ? 100 : Math.max(0, Math.min(100, status.processing_progress || 0));
        
        const result: EnrichmentStatus = {
          versionId: status.version_id,
          currentStage: status.current_stage || 'upload',
          processingProgress: processingProgress,
          processingStatus: isComplete ? 'completed' : (status.processing_status || 'pending'),
          stages: status.stages || {},
          hasEntities: hasEntities,
          hasEnrichment: hasEnrichment,
          hasNarratives: hasNarratives,
          isComplete: isComplete,
          lastUpdated: status.last_updated || new Date().toISOString(),
          processingStage: processingStage
        };

        console.log('useEnrichmentStatus: Final mapped result:', {
          versionId: result.versionId,
          hasEntities: result.hasEntities,
          hasEnrichment: result.hasEnrichment,
          hasNarratives: result.hasNarratives,
          isComplete: result.isComplete,
          processingProgress: result.processingProgress,
          processingStage: result.processingStage
        });
        
        return result;
      } catch (error) {
        console.error('useEnrichmentStatus: Query failed:', error);
        
        if (error instanceof Error) {
          if (error.message.includes('Authentication') || error.message.includes('JWT')) {
            throw error;
          }
        }
        
        console.warn('useEnrichmentStatus: Returning fallback status due to error');
        return createFallbackStatus(versionId);
      }
    },
    enabled: !!user && isValidVersionId(versionId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      
      // FIXED: Stop polling when complete (simplified check)
      if (data.isComplete) {
        console.log('useEnrichmentStatus: Processing complete, stopping polling');
        return false;
      }
      
      // Continue polling if not complete and not failed
      return (!data.isComplete && data.processingStage !== 'failed') ? 3000 : false;
    },
    staleTime: 1000 * 10,
    retry: (failureCount, error) => {
      if (error instanceof Error && 
          (error.message.includes('Authentication') || error.message.includes('JWT'))) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
