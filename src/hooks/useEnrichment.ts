
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  CareerEnrichment, 
  CareerNarrative, 
  EnrichmentJob, 
  EnrichmentResult 
} from '@/types/enrichment';

// Hook to get career enrichment for a resume version
export function useCareerEnrichment(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['career-enrichment', versionId],
    queryFn: async (): Promise<CareerEnrichment | null> => {
      if (!versionId || !user) return null;
      
      console.log('Fetching career enrichment for version:', versionId);
      
      const { data, error } = await supabase
        .from('career_enrichment')
        .select('*')
        .eq('resume_version_id', versionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching career enrichment:', error);
        throw error;
      }

      console.log('Career enrichment data:', data);
      return data;
    },
    enabled: !!versionId && !!user,
    refetchInterval: (data) => data ? false : 5000, // Poll every 5 seconds if no data
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  });
}

// Hook to get career narratives for a resume version
export function useCareerNarratives(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['career-narratives', versionId],
    queryFn: async (): Promise<CareerNarrative[]> => {
      if (!versionId || !user) return [];
      
      console.log('Fetching career narratives for version:', versionId);
      
      const { data, error } = await supabase
        .from('career_narratives')
        .select('*')
        .eq('resume_version_id', versionId)
        .eq('user_id', user.id)
        .order('narrative_type');

      if (error) {
        console.error('Error fetching career narratives:', error);
        throw error;
      }

      console.log('Career narratives data:', data);
      return (data || []).map(row => ({
        ...row,
        narrative_type: row.narrative_type as CareerNarrative['narrative_type']
      }));
    },
    enabled: !!versionId && !!user,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && data.length > 0 ? false : 5000; // Poll every 5 seconds if no data
    },
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  });
}

// Hook to get enrichment jobs
export function useEnrichmentJobs(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['enrichment-jobs', versionId],
    queryFn: async (): Promise<EnrichmentJob[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('enrichment_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (versionId) {
        query = query.eq('resume_version_id', versionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching enrichment jobs:', error);
        throw error;
      }

      return (data || []).map(row => ({
        ...row,
        status: row.status as EnrichmentJob['status']
      }));
    },
    enabled: !!user,
  });
}

// Hook to trigger career enrichment for a resume version
export function useEnrichResume() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      console.log('useEnrichResume: Starting enrichment for versionId:', versionId);
      
      // Enhanced validation
      if (!versionId) {
        console.error('useEnrichResume: No versionId provided');
        throw new Error('Version ID is required');
      }

      if (typeof versionId !== 'string') {
        console.error('useEnrichResume: Invalid versionId type:', typeof versionId, versionId);
        throw new Error('Version ID must be a string');
      }

      // Check for parameter placeholders
      if (versionId.startsWith(':') || versionId === 'undefined' || versionId === 'null') {
        console.error('useEnrichResume: versionId appears to be a parameter placeholder:', versionId);
        throw new Error('Invalid version ID - parameter not resolved');
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(versionId)) {
        console.error('useEnrichResume: versionId is not a valid UUID:', versionId);
        throw new Error('Version ID must be a valid UUID format');
      }

      const requestBody = { versionId };
      console.log('useEnrichResume: Request body to be sent:', requestBody);
      console.log('useEnrichResume: Request body JSON:', JSON.stringify(requestBody));

      try {
        console.log('useEnrichResume: Calling supabase.functions.invoke with:', {
          functionName: 'enrich-resume',
          body: requestBody
        });

        const { data, error } = await supabase.functions.invoke('enrich-resume', {
          body: requestBody
        });

        console.log('useEnrichResume: Supabase function response:', { data, error });

        if (error) {
          console.error('useEnrichResume: Supabase function error:', error);
          
          // Check for specific error types
          if (error.message?.includes('Empty request body')) {
            throw new Error('Request body validation failed - the request appears to be empty');
          }
          
          if (error.message?.includes('Invalid JSON')) {
            throw new Error('Request formatting error - invalid JSON structure');
          }
          
          if (error.message?.includes('parameter placeholder')) {
            throw new Error('Version ID parameter was not properly resolved');
          }

          throw new Error(error.message || 'Failed to start career enrichment');
        }

        console.log('useEnrichResume: Successfully received response:', data);
        return data as EnrichmentResult;
      } catch (invokeError) {
        console.error('useEnrichResume: Exception during function invoke:', invokeError);
        
        // Re-throw with more context
        if (invokeError instanceof Error) {
          throw new Error(`Enrichment request failed: ${invokeError.message}`);
        }
        
        throw new Error('Unexpected error during enrichment request');
      }
    },
    onSuccess: (data, versionId) => {
      console.log('useEnrichResume: onSuccess called with:', { data, versionId });
      
      // Handle different response structures gracefully
      const jobId = data?.job?.id;
      const enrichmentId = data?.enrichment_id;
      
      let description = 'Processing career insights for resume.';
      
      if (jobId) {
        description += ` Job ID: ${jobId}`;
      } else if (enrichmentId) {
        description += ` Enrichment ID: ${enrichmentId}`;
      }
      
      // Show appropriate message based on response type
      const title = data?.message === 'Enrichment already exists' 
        ? "Enrichment Available" 
        : "Enrichment Started";
      
      toast({
        title,
        description,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['enrichment-jobs', versionId] });
      queryClient.invalidateQueries({ queryKey: ['career-enrichment', versionId] });
      queryClient.invalidateQueries({ queryKey: ['career-narratives', versionId] });
      queryClient.invalidateQueries({ queryKey: ['enrichment-status', versionId] });
    },
    onError: (error) => {
      console.error('useEnrichResume: onError called with:', error);
      
      let errorMessage = 'Failed to start career enrichment';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Enrichment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}
