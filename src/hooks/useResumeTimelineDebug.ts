
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useResumeTimelineDebug() {
  return useQuery({
    queryKey: ['resume-timeline-debug'],
    queryFn: async () => {
      console.log('=== Resume Timeline Debug Hook ===');
      
      // Check current question_flows data and phases
      const { data: questionFlows, error: qfError } = await supabase
        .from('question_flows')
        .select('phase')
        .order('phase');

      console.log('Current question_flows phases:', questionFlows, qfError);

      // Get unique phases and count them
      const phaseCounts = questionFlows?.reduce((acc, row) => {
        const phase = row.phase;
        acc[phase] = (acc[phase] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      console.log('Phase counts:', phaseCounts);

      // Check resume timeline related tables
      const { data: resumeVersions, error: rvError } = await supabase
        .from('resume_versions')
        .select('processing_status')
        .limit(10);

      console.log('Sample resume versions:', resumeVersions, rvError);

      const { data: jobLogs, error: jlError } = await supabase
        .from('job_logs')
        .select('stage, level')
        .limit(10);

      console.log('Sample job logs:', jobLogs, jlError);

      return {
        questionFlowPhases: questionFlows,
        phaseCounts,
        resumeVersions,
        jobLogs,
        errors: {
          questionFlowsError: qfError,
          resumeVersionsError: rvError,
          jobLogsError: jlError
        }
      };
    },
    enabled: true,
  });
}
