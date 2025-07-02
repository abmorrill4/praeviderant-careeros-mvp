
import React from 'react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { useEnhancedProfileScore } from '@/hooks/useEnhancedProfileScore';
import { InteractiveTimeline } from './InteractiveTimeline';
import { SkillCharts } from './SkillCharts';
import { CareerProgressionChart } from './CareerProgressionChart';
import { ProfileStatsGrid } from './ProfileStatsGrid';
import { CurrentRoleHighlight } from './CurrentRoleHighlight';
import { ProfileCompletenessCard } from './ProfileCompletenessCard';
import { ExperienceDebugInfo } from './ExperienceDebugInfo';
import { calculateExperienceYears } from '@/utils/dateUtils';
import type { WorkExperience, Education, Skill } from '@/types/versioned-entities';

interface EnhancedProfileOverviewProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const EnhancedProfileOverview: React.FC<EnhancedProfileOverviewProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { data: workExperiences } = useLatestEntities<WorkExperience>('work_experience');
  const { data: education } = useLatestEntities<Education>('education');
  const { data: skills } = useLatestEntities<Skill>('skill');
  const profileScore = useEnhancedProfileScore();

  const currentRole = workExperiences?.[0];
  const totalExperience = workExperiences?.length || 0;
  const totalSkills = skills?.length || 0;

  // Calculate experience duration using the enhanced utility function
  const experienceYears = calculateExperienceYears(workExperiences || []);

  console.log('EnhancedProfileOverview - Experience calculation:', {
    workExperiencesCount: workExperiences?.length,
    calculatedYears: experienceYears,
    rawExperiences: workExperiences?.map(exp => ({
      title: exp.title,
      company: exp.company,
      start_date: exp.start_date,
      end_date: exp.end_date
    }))
  });

  return (
    <div className="space-y-8">
      {/* Debug Information - Remove this after testing */}
      <ExperienceDebugInfo />

      {/* Enhanced Summary Stats */}
      <ProfileStatsGrid
        experienceYears={experienceYears}
        totalPositions={totalExperience}
        totalSkills={totalSkills}
        profileScore={profileScore.overall}
      />

      {/* Current Role Highlight */}
      <CurrentRoleHighlight currentRole={currentRole} />

      {/* Interactive Timeline */}
      <InteractiveTimeline />

      {/* Career Progression Chart */}
      <CareerProgressionChart />

      {/* Skills Charts */}
      <SkillCharts />

      {/* Profile Completeness */}
      <ProfileCompletenessCard profileScore={profileScore} />
    </div>
  );
};
