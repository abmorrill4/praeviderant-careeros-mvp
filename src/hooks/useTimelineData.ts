
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTimelineData(resumeVersionId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['timeline-data', resumeVersionId],
    queryFn: async () => {
      if (!resumeVersionId || !user) return null;

      console.log('Fetching timeline data for resume version:', resumeVersionId);

      // Get resume version info
      const { data: resumeVersion, error: versionError } = await supabase
        .from('resume_versions')
        .select(`
          *,
          resume_streams!inner(user_id)
        `)
        .eq('id', resumeVersionId)
        .single();

      if (versionError || !resumeVersion) {
        console.error('Error fetching resume version:', versionError);
        return null;
      }

      // Get related job
      const { data: relatedJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get job logs
      let jobLogs: any[] = [];
      if (relatedJob) {
        const { data: logs } = await supabase
          .from('job_logs')
          .select('*')
          .eq('job_id', relatedJob.id)
          .order('created_at', { ascending: true });
        
        jobLogs = logs || [];
      }

      // Get normalization jobs
      const { data: normalizationJobs } = await supabase
        .from('normalization_jobs')
        .select('*')
        .eq('resume_version_id', resumeVersionId)
        .order('created_at', { ascending: true });

      // Get enrichment jobs
      const { data: enrichmentJobs } = await supabase
        .from('enrichment_jobs')
        .select('*')
        .eq('resume_version_id', resumeVersionId)
        .order('created_at', { ascending: true });

      return {
        resumeVersion,
        jobLogs: jobLogs || [],
        normalizationJobs: normalizationJobs || [],
        enrichmentJobs: enrichmentJobs || [],
      };
    },
    enabled: !!resumeVersionId && !!user,
  });
}
