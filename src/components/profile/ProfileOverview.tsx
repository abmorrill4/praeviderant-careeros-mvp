
import React from 'react';
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
  const { data: workExperiences } = useLatestEntities<WorkExperience>('work_experience');
  const { data: education } = useLatestEntities<Education>('education');
  const profileScore = useEnhancedProfileScore();

  const currentRole = workExperiences?.[0];
  const latestEducation = education?.[0];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-lg border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {workExperiences?.length || 0} roles
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {education?.length || 0} degrees
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Profile Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-2">
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
        <Card className="bg-white shadow-lg border border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Current Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {currentRole.title}
                </h3>
                <p className="text-lg text-slate-600">
                  {currentRole.company}
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{currentRole.start_date} - {currentRole.end_date || 'Present'}</span>
                </div>
              </div>
              
              {currentRole.description && (
                <p className="text-sm text-slate-600 line-clamp-3">
                  {currentRole.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Placeholder */}
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-600">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity to show</p>
            <p className="text-sm mt-1">Start building your career timeline</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
