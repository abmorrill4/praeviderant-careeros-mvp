
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Target, Award, TrendingUp, Users, BookOpen } from 'lucide-react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { useProfileScore } from '@/hooks/useProfileScore';
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
  const profileScore = useProfileScore();

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

      {/* Profile Score Breakdown */}
      <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}>
        <CardHeader>
          <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center gap-2`}>
            <TrendingUp className="w-5 h-5" />
            Profile Completeness Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Experience Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Work Experience
                </span>
                <Badge variant="outline" className="text-xs">
                  {profileScore.sections.experience.weight}% weight
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  {profileScore.sections.experience.score}%
                </span>
                <div className="w-16">
                  <Progress value={profileScore.sections.experience.score} className="h-2" />
                </div>
              </div>
            </div>

            {/* Education Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Education
                </span>
                <Badge variant="outline" className="text-xs">
                  {profileScore.sections.education.weight}% weight
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  {profileScore.sections.education.score}%
                </span>
                <div className="w-16">
                  <Progress value={profileScore.sections.education.score} className="h-2" />
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Skills
                </span>
                <Badge variant="outline" className="text-xs">
                  {profileScore.sections.skills.weight}% weight
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  {profileScore.sections.skills.score}%
                </span>
                <div className="w-16">
                  <Progress value={profileScore.sections.skills.score} className="h-2" />
                </div>
              </div>
            </div>

            {/* Mini Interviews Section (Coming Soon) */}
            <div className="flex items-center justify-between opacity-60">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Mini Interviews
                </span>
                <Badge variant="outline" className="text-xs">
                  {profileScore.sections.interviews.weight}% weight
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  {profileScore.sections.interviews.score}%
                </span>
                <div className="w-16">
                  <Progress value={profileScore.sections.interviews.score} className="h-2" />
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className={`pt-4 border-t ${theme === 'dark' ? 'border-career-gray-dark' : 'border-career-gray-light'}`}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Complete Entities:
                  </span>
                  <span className={`ml-2 font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    {profileScore.details.completeEntities} of {profileScore.details.totalEntities}
                  </span>
                </div>
                <div>
                  <span className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Data Quality:
                  </span>
                  <span className={`ml-2 font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    {profileScore.details.qualityScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
