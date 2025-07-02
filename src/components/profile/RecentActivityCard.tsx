
import React from 'react';
import { Activity, Clock, User, Code } from 'lucide-react';
import type { UnifiedProfileData } from '@/hooks/useUnifiedProfileData';

interface RecentActivityCardProps {
  data: UnifiedProfileData;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ data }) => {
  // Generate activity items based on actual data
  const activityItems = [];

  // Add recent work experience
  if (data.workExperience.length > 0) {
    const recentWork = data.workExperience[0];
    activityItems.push({
      icon: User,
      action: 'Current position',
      details: `${recentWork.title} at ${recentWork.company}`,
      time: recentWork.start_date || 'Recently'
    });
  }

  // Add skills count
  if (data.skills.length > 0) {
    activityItems.push({
      icon: Code,
      action: 'Skills tracked',
      details: `${data.skills.length} professional skills`,
      time: 'Updated'
    });
  }

  // Add education
  if (data.education.length > 0) {
    const recentEducation = data.education[0];
    activityItems.push({
      icon: User,
      action: 'Education',
      details: `${recentEducation.degree} from ${recentEducation.institution}`,
      time: recentEducation.end_date || 'Completed'
    });
  }

  // Add AI insights
  if (data.careerEnrichment) {
    activityItems.push({
      icon: Activity,
      action: 'AI analysis complete',
      details: `Career archetype: ${data.careerEnrichment.role_archetype}`,
      time: 'Recently analyzed'
    });
  }

  return (
    <div className="neo-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-5 h-5 neo-text-accent" />
        <h3 className="text-lg font-semibold neo-text">Profile Activity</h3>
      </div>

      {activityItems.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 neo-text-muted mx-auto mb-4" />
          <p className="neo-text-muted">No recent activity</p>
          <p className="text-sm neo-text-muted mt-2">
            Start building your profile to see activity here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activityItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="p-2 neo-card-subtle rounded-lg">
                  <Icon className="w-4 h-4 neo-text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm neo-text font-medium">
                    {item.action}
                  </p>
                  <p className="text-sm neo-text-muted truncate">
                    {item.details}
                  </p>
                  <p className="text-xs neo-text-muted mt-1">
                    {item.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
