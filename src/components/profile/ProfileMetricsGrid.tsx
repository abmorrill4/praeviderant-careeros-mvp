
import React from 'react';
import { TrendingUp, Award, Code, Target } from 'lucide-react';
import { formatExperienceYears } from '@/utils/dateUtils';
import type { UnifiedProfileData } from '@/hooks/useUnifiedProfileData';

interface ProfileMetricsGridProps {
  data: UnifiedProfileData;
}

export const ProfileMetricsGrid: React.FC<ProfileMetricsGridProps> = ({ data }) => {
  const { metrics } = data;

  const metricCards = [
    {
      title: 'Total Experience',
      value: formatExperienceYears(metrics.totalExperienceYears),
      icon: TrendingUp,
      color: 'neo-gradient-accent',
      description: 'Years of professional experience'
    },
    {
      title: 'Positions',
      value: metrics.totalPositions.toString(),
      icon: Award,
      color: 'neo-gradient-accent',
      description: 'Career positions held'
    },
    {
      title: 'Skills',
      value: metrics.totalSkills.toString(),
      icon: Code,
      color: 'neo-gradient-accent',
      description: 'Technical and soft skills'
    },
    {
      title: 'Profile Score',
      value: `${metrics.profileCompleteness}%`,
      icon: Target,
      color: 'neo-gradient-accent',
      description: 'Completeness rating'
    }
  ];

  console.log('ProfileMetricsGrid rendering with:', {
    totalExperienceYears: metrics.totalExperienceYears,
    formattedExperience: formatExperienceYears(metrics.totalExperienceYears),
    totalPositions: metrics.totalPositions
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.title} className="neo-metric group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${metric.color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold neo-text mb-1">
                {metric.value}
              </div>
              <div className="text-sm font-medium neo-text mb-2">
                {metric.title}
              </div>
              <div className="text-xs neo-text-muted">
                {metric.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
