
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useResumeTimelineDebug() {
  return useQuery({
    queryKey: ['resume-timeline-debug'],
    queryFn: async () => {
      // Check current enum values for interview_phase
      const { data: enumData, error: enumError } = await supabase
        .rpc('sql', { 
          query: `
            SELECT unnest(enum_range(NULL::interview_phase)) as phase_value;
          `
        });

      console.log('Current interview_phase enum values:', enumData, enumError);

      // Check current question_flows data
      const { data: questionFlows, error: qfError } = await supabase
        .from('question_flows')
        .select('phase, count(*)')
        .group('phase');

      console.log('Current question_flows phases:', questionFlows, qfError);

      return {
        enumValues: enumData,
        questionFlowPhases: questionFlows
      };
    },
    enabled: true,
  });
}
