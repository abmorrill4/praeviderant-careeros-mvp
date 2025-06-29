
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCareerEnrichment = (versionId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['career-enrichment', user?.id, versionId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('career_enrichment')
        .select('*')
        .eq('user_id', user.id);

      if (versionId) {
        query = query.eq('resume_version_id', versionId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });
};

export const useCareerNarratives = (versionId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['career-narratives', user?.id, versionId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('career_narratives')
        .select('*')
        .eq('user_id', user.id);

      if (versionId) {
        query = query.eq('resume_version_id', versionId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });
};

export const useEntryEnrichment = (versionId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['entry-enrichment', user?.id, versionId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('entry_enrichment')
        .select('*')
        .eq('user_id', user.id);

      if (versionId) {
        query = query.eq('resume_version_id', versionId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });
};

export const useEnrichResume = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const { data, error } = await supabase.functions.invoke('enrich-resume', {
        body: { resume_version_id: versionId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to enrich resume');
      }

      return data;
    },
    onSuccess: (data, versionId) => {
      toast({
        title: "Analysis Complete",
        description: "Your resume has been successfully analyzed",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['career-enrichment'] });
      queryClient.invalidateQueries({ queryKey: ['career-narratives'] });
      queryClient.invalidateQueries({ queryKey: ['entry-enrichment'] });
    },
    onError: (error) => {
      console.error('Error enriching resume:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Failed to analyze resume',
        variant: "destructive",
      });
    },
  });
};
