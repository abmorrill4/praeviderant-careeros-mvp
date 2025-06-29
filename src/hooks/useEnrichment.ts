
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
