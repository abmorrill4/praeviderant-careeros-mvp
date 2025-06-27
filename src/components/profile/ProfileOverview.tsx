
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Target, Award, TrendingUp, Users, BookOpen } from 'lucide-react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { useEnhancedProfileScore } from '@/hooks/useEnhancedProfileScore';
import { ProfileScoreInsights } from './ProfileScoreInsights';
import type { WorkExperience, Education } from '@/types/versioned-entities';

interface ProfileOverviewProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { theme } = useTheme();
  const { data: workExperiences } = useLatestEntities<WorkExperience>('work_experience');
  const { data: education } = useLatestEntities<Education>('education');
  const profileScore = useEnhancedProfileScore();

  const currentRole = workExperiences?.[0];
  const latestEducation = education?.[0];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Total Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              {workExperiences?.length || 0} roles
            </div>
          </CardContent>
        </Card>

        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              {education?.length || 0} degrees
            </div>
          </CardContent>
        </Card>

        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Profile Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-career-accent mb-2`}>
              {profileScore.overall}%
            </div>
            <Progress value={profileScore.overall} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Profile Score Insights */}
      <ProfileScoreInsights />

      {/* Current Role */}
      {currentRole && (
        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
          <CardHeader>
            <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              Current Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  {currentRole.title}
                </h3>
                <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  {currentRole.company}
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  <Calendar className="w-4 h-4" />
                  <span>{currentRole.start_date} - {currentRole.end_date || 'Present'}</span>
                </div>
              </div>
              
              {currentRole.description && (
                <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} line-clamp-3`}>
                  {currentRole.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Placeholder */}
      <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
        <CardHeader>
          <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity to show</p>
            <p className="text-sm mt-1">Start building your career timeline</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
