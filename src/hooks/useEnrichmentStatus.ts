
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
        throw new Error('User not authenticated');
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
          console.error('useEnrichmentStatus: Error getting processing status:', error);
          // Return fallback instead of throwing
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
        // Return fallback instead of throwing
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
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
