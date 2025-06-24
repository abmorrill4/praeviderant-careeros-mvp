
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

      return data;
    },
    enabled: !!versionId && !!user,
  });
}

// Hook to get career narratives for a resume version
export function useCareerNarratives(versionId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['career-narratives', versionId],
    queryFn: async (): Promise<CareerNarrative[]> => {
      if (!versionId || !user) return [];
      
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

      return (data || []).map(row => ({
        ...row,
        narrative_type: row.narrative_type as CareerNarrative['narrative_type']
      }));
    },
    enabled: !!versionId && !!user,
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
      const { data, error } = await supabase.functions.invoke('enrich-resume', {
        body: { versionId }
      });

      if (error) {
        console.error('Error enriching resume:', error);
        throw error;
      }

      return data as EnrichmentResult;
    },
    onSuccess: (data, versionId) => {
      toast({
        title: "Enrichment Started",
        description: `Processing career insights for resume. Job ID: ${data.job.id}`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['enrichment-jobs', versionId] });
      queryClient.invalidateQueries({ queryKey: ['career-enrichment', versionId] });
      queryClient.invalidateQueries({ queryKey: ['career-narratives', versionId] });
    },
    onError: (error) => {
      toast({
        title: "Enrichment Failed",
        description: error instanceof Error ? error.message : 'Failed to start career enrichment',
        variant: "destructive",
      });
    },
  });
}
