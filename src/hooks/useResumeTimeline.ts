import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTimelineData } from './useTimelineData';
import { processTimelineStages, determineOverallStatus } from '@/utils/timelineDataProcessor';
import type { ResumeTimelineData, TimelineFilters } from '@/types/resume-timeline';

export function useResumeTimeline(resumeVersionId?: string, filters?: TimelineFilters) {
  const { user } = useAuth();
  const { data: timelineData, isLoading, error, refetch } = useTimelineData(resumeVersionId);

  return useQuery({
    queryKey: ['resume-timeline', resumeVersionId, filters, timelineData],
    queryFn: async (): Promise<ResumeTimelineData | null> => {
      if (!timelineData || !user) return null;

      const { resumeVersion, jobLogs, normalizationJobs, enrichmentJobs } = timelineData;

      // Process the data into timeline stages
      const stages = processTimelineStages(
        jobLogs,
        normalizationJobs,
        enrichmentJobs,
        resumeVersion
      );

      // Determine overall status
      const overallStatus = determineOverallStatus(stages);

      const result: ResumeTimelineData = {
        resumeVersionId: resumeVersion.id,
        userId: resumeVersion.resume_streams.user_id,
        stages,
        overallStatus,
        createdAt: resumeVersion.created_at,
        lastUpdated: resumeVersion.updated_at,
      };

      console.log('Timeline data created:', result);
      return result;
    },
    enabled: !!timelineData && !!user,
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
