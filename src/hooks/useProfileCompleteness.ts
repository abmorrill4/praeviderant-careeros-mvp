
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileCompleteness {
  hasResumeData: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  isNewUser: boolean;
  completionPercentage: number;
}

export function useProfileCompleteness(): ProfileCompleteness {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['profile-completeness', user?.id],
    queryFn: async (): Promise<ProfileCompleteness> => {
      if (!user) {
        return {
          hasResumeData: false,
          hasExperience: false,
          hasEducation: false,
          hasSkills: false,
          isNewUser: true,
          completionPercentage: 0
        };
      }

      // Check for resume data
      const { data: resumeStreams } = await supabase
        .from('resume_streams')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const hasResumeData = (resumeStreams?.length || 0) > 0;

      // Check for work experience
      const { data: workExperience } = await supabase
        .from('work_experience')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const hasExperience = (workExperience?.length || 0) > 0;

      // Check for education
      const { data: education } = await supabase
        .from('education')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const hasEducation = (education?.length || 0) > 0;

      // Check for skills - using correct table name "skill" (singular)
      const { data: skills } = await supabase
        .from('skill')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const hasSkills = (skills?.length || 0) > 0;

      // Calculate completion
      const completedSections = [hasResumeData, hasExperience, hasEducation, hasSkills]
        .filter(Boolean).length;
      const completionPercentage = (completedSections / 4) * 100;

      const isNewUser = completionPercentage === 0;

      return {
        hasResumeData,
        hasExperience,
        hasEducation,
        hasSkills,
        isNewUser,
        completionPercentage
      };
    },
    enabled: !!user,
  });

  return data || {
    hasResumeData: false,
    hasExperience: false,
    hasEducation: false,
    hasSkills: false,
    isNewUser: true,
    completionPercentage: 0
  };
}
