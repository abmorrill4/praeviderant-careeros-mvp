
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

      console.log('Fetching timeline for resume version:', resumeVersionId);

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

      console.log('Resume version found:', resumeVersion);

      // Get the most recent job for this user (created around the same time as the resume)
      const { data: relatedJob, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (jobError) {
        console.error('Error fetching related job:', jobError);
      }

      console.log('Related job:', relatedJob);

      // Get job logs for this job if it exists
      let jobLogs: any[] = [];
      if (relatedJob) {
        const { data: logs, error: logsError } = await supabase
          .from('job_logs')
          .select('*')
          .eq('job_id', relatedJob.id)
          .order('created_at', { ascending: true });

        if (logsError) {
          console.error('Error fetching job logs:', logsError);
        } else {
          jobLogs = logs || [];
          console.log('Job logs found:', jobLogs.length);
        }
      }

      // Get normalization jobs
      const { data: normalizationJobs, error: normError } = await supabase
        .from('normalization_jobs')
        .select('*')
        .eq('resume_version_id', resumeVersionId)
        .order('created_at', { ascending: true });

      if (normError) {
        console.error('Error fetching normalization jobs:', normError);
      }

      console.log('Normalization jobs:', normalizationJobs?.length || 0);

      // Get enrichment jobs
      const { data: enrichmentJobs, error: enrichError } = await supabase
        .from('enrichment_jobs')
        .select('*')
        .eq('resume_version_id', resumeVersionId)
        .order('created_at', { ascending: true });

      if (enrichError) {
        console.error('Error fetching enrichment jobs:', enrichError);
      }

      console.log('Enrichment jobs:', enrichmentJobs?.length || 0);

      // Process the data into timeline stages
      const stages: TimelineStage[] = PIPELINE_STAGES.map(stageConfig => {
        // Filter job logs for this stage
        const stageLogs = jobLogs.filter(log => 
          log.stage === stageConfig.name
        );

        // Find related jobs based on stage
        let relatedJobs: any[] = [];
        if (stageConfig.name === 'normalize') {
          relatedJobs = normalizationJobs || [];
        } else if (stageConfig.name === 'enrich') {
          relatedJobs = enrichmentJobs || [];
        }

        let status: TimelineStage['status'] = 'pending';
        let startedAt: string | undefined;
        let completedAt: string | undefined;
        let errorMessage: string | undefined;

        // Determine status based on job records
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

        // Special handling for upload stage (always completed if version exists)
        if (stageConfig.name === 'upload') {
          status = 'completed';
          startedAt = resumeVersion.created_at;
          completedAt = resumeVersion.created_at;
        }

        // Special handling for parse stage based on resume version status
        if (stageConfig.name === 'parse' && resumeVersion.processing_status) {
          switch (resumeVersion.processing_status) {
            case 'pending':
              status = 'pending';
              break;
            case 'processing':
              status = 'in_progress';
              startedAt = resumeVersion.updated_at;
              break;
            case 'completed':
              status = 'completed';
              startedAt = resumeVersion.updated_at;
              completedAt = resumeVersion.updated_at;
              break;
            case 'failed':
              status = 'failed';
              startedAt = resumeVersion.updated_at;
              // Safely handle JSON metadata
              if (resumeVersion.resume_metadata && typeof resumeVersion.resume_metadata === 'object') {
                const metadata = resumeVersion.resume_metadata as Record<string, any>;
                errorMessage = metadata.error_message;
              }
              break;
          }
        }

        // If we have logs for this stage but no specific job status, infer from logs
        if (stageLogs.length > 0 && status === 'pending') {
          const hasError = stageLogs.some(log => log.level === 'error');
          const hasInfo = stageLogs.some(log => log.level === 'info');
          
          if (hasError) {
            status = 'failed';
            errorMessage = stageLogs.find(log => log.level === 'error')?.message;
          } else if (hasInfo) {
            status = 'completed';
          }
          
          startedAt = stageLogs[0]?.created_at;
          completedAt = stageLogs[stageLogs.length - 1]?.created_at;
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
            level: log.level as 'debug' | 'info' | 'warn' | 'error',
            message: log.message,
            metadata: (log.metadata as Record<string, any>) || {},
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

      const timelineData = {
        resumeVersionId,
        userId: resumeVersion.resume_streams.user_id,
        stages,
        overallStatus,
        createdAt: resumeVersion.created_at,
        lastUpdated: resumeVersion.updated_at,
      };

      console.log('Timeline data created:', timelineData);

      return timelineData;
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

      console.log('Fetching resume timeline list for user:', user.id);

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

      console.log('Resume timeline list fetched:', data?.length || 0, 'items');

      return data || [];
    },
    enabled: !!user,
  });
}
