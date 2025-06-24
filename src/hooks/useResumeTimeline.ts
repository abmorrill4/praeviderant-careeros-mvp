
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ResumeTimelineData, TimelineFilters, TimelineStage, JobLog } from '@/types/resume-timeline';
import { PIPELINE_STAGES } from '@/types/resume-timeline';

export function useResumeTimeline(resumeVersionId?: string, filters?: TimelineFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resume-timeline', resumeVersionId, filters],
    queryFn: async (): Promise<ResumeTimelineData | null> => {
      if (!resumeVersionId || !user) return null;

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

      // Get job logs for this resume
      const { data: jobLogs, error: logsError } = await supabase
        .from('job_logs')
        .select(`
          *,
          jobs!inner(
            id,
            user_id,
            status,
            job_type,
            created_at,
            updated_at,
            started_at,
            completed_at,
            error_message
          )
        `)
        .eq('jobs.user_id', resumeVersion.resume_streams.user_id)
        .order('created_at', { ascending: true });

      if (logsError) {
        console.error('Error fetching job logs:', logsError);
      }

      // Get related jobs data
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', resumeVersion.resume_streams.user_id)
        .order('created_at', { ascending: true });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }

      // Process the data into timeline stages
      const stages: TimelineStage[] = PIPELINE_STAGES.map(stageConfig => {
        const stageLogs = (jobLogs || []).filter(log => 
          log.stage === stageConfig.name || 
          log.jobs?.job_type?.includes(stageConfig.name)
        );

        const relatedJobs = (jobs || []).filter(job => 
          job.job_type?.includes(stageConfig.name)
        );

        let status: TimelineStage['status'] = 'pending';
        let startedAt: string | undefined;
        let completedAt: string | undefined;
        let errorMessage: string | undefined;

        if (relatedJobs.length > 0) {
          const latestJob = relatedJobs[relatedJobs.length - 1];
          
          switch (latestJob.status) {
            case 'pending':
              status = 'pending';
              break;
            case 'processing':
            case 'in_progress':
              status = 'in_progress';
              startedAt = latestJob.started_at;
              break;
            case 'completed':
              status = 'completed';
              startedAt = latestJob.started_at;
              completedAt = latestJob.completed_at;
              break;
            case 'failed':
              status = 'failed';
              startedAt = latestJob.started_at;
              errorMessage = latestJob.error_message;
              break;
          }
        }

        // Special handling for upload stage
        if (stageConfig.name === 'upload') {
          status = 'completed';
          startedAt = resumeVersion.created_at;
          completedAt = resumeVersion.created_at;
        }

        return {
          id: stageConfig.id,
          name: stageConfig.name,
          label: stageConfig.label,
          order: stageConfig.order,
          status,
          startedAt,
          completedAt,
          duration: startedAt && completedAt ? 
            new Date(completedAt).getTime() - new Date(startedAt).getTime() : undefined,
          errorMessage,
          logs: stageLogs.map(log => ({
            id: log.id,
            job_id: log.job_id,
            stage: log.stage,
            level: log.level,
            message: log.message,
            metadata: log.metadata || {},
            created_at: log.created_at,
          })),
        };
      });

      // Determine overall status
      const hasError = stages.some(stage => stage.status === 'failed');
      const hasInProgress = stages.some(stage => stage.status === 'in_progress');
      const allCompleted = stages.every(stage => 
        stage.status === 'completed' || stage.status === 'skipped'
      );

      let overallStatus: ResumeTimelineData['overallStatus'];
      if (hasError) {
        overallStatus = 'failed';
      } else if (hasInProgress) {
        overallStatus = 'in_progress';
      } else if (allCompleted) {
        overallStatus = 'completed';
      } else {
        overallStatus = 'pending';
      }

      return {
        resumeVersionId,
        userId: resumeVersion.resume_streams.user_id,
        stages,
        overallStatus,
        createdAt: resumeVersion.created_at,
        lastUpdated: resumeVersion.updated_at,
      };
    },
    enabled: !!resumeVersionId && !!user,
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
  });
}

export function useResumeTimelineList(filters?: TimelineFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resume-timeline-list', filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('resume_versions')
        .select(`
          *,
          resume_streams!inner(user_id, name)
        `);

      // Apply filters
      if (filters?.userId) {
        query = query.eq('resume_streams.user_id', filters.userId);
      } else {
        query = query.eq('resume_streams.user_id', user.id);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resume timeline list:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });
}
