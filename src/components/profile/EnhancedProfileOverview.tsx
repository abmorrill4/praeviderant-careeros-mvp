
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Target, Award, TrendingUp, Users, BookOpen, Star } from 'lucide-react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { useEnhancedProfileScore } from '@/hooks/useEnhancedProfileScore';
import { InteractiveTimeline } from './InteractiveTimeline';
import { SkillCharts } from './SkillCharts';
import { CareerProgressionChart } from './CareerProgressionChart';
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
  const latestEducation = education?.[0];
  const totalExperience = workExperiences?.length || 0;
  const totalSkills = skills?.length || 0;

  // Calculate experience duration with proper date handling
  const experienceYears = workExperiences?.reduce((total, exp) => {
    if (!exp.start_date) return total;
    
    try {
      const start = new Date(exp.start_date);
      const end = exp.end_date ? new Date(exp.end_date) : new Date();
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn(`Invalid date for experience: ${exp.title} at ${exp.company}`);
        return total;
      }
      
      // Calculate years difference more accurately
      const timeDiff = end.getTime() - start.getTime();
      const yearsDiff = timeDiff / (1000 * 60 * 60 * 24 * 365.25); // Use 365.25 to account for leap years
      
      return total + Math.max(0, yearsDiff); // Ensure we don't add negative years
    } catch (error) {
      console.warn(`Error calculating experience duration for ${exp.title}:`, error);
      return total;
    }
  }, 0) || 0;

  return (
    <div className="space-y-8">
      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold mb-1">
                  {experienceYears >= 1 ? `${Math.floor(experienceYears)}y` : 
                   experienceYears > 0 ? `${Math.round(experienceYears * 12)}m` : '0'}
                </div>
                <div className="text-purple-100 text-sm">
                  Experience
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold mb-1">
                  {totalExperience}
                </div>
                <div className="text-blue-100 text-sm">
                  Positions
                </div>
              </div>
              <Award className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold mb-1">
                  {totalSkills}
                </div>
                <div className="text-green-100 text-sm">
                  Skills
                </div>
              </div>
              <Star className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold mb-1">
                  {profileScore.overall}%
                </div>
                <div className="text-orange-100 text-sm">
                  Profile Score
                </div>
              </div>
              <Target className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Role Highlight */}
      {currentRole && (
        <Card className="bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Current Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  {currentRole.title}
                </h3>
                <p className="text-lg text-slate-600 mb-3">
                  {currentRole.company}
                </p>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{currentRole.start_date} - {currentRole.end_date || 'Present'}</span>
                </div>
                {!currentRole.end_date && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Active
                  </Badge>
                )}
              </div>
              
              {currentRole.description && (
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {currentRole.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Timeline */}
      <InteractiveTimeline />

      {/* Career Progression Chart */}
      <CareerProgressionChart />

      {/* Skills Charts */}
      <SkillCharts />

      {/* Profile Completeness */}
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Profile Completeness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Overall Progress</span>
              <span className="text-sm font-bold text-purple-600">{profileScore.overall}%</span>
            </div>
            <Progress value={profileScore.overall} className="h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Work Experience</span>
                  <span className="text-sm font-medium">{profileScore.sections.experience.score}%</span>
                </div>
                <Progress value={profileScore.sections.experience.score} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Skills</span>
                  <span className="text-sm font-medium">{profileScore.sections.skills.score}%</span>
                </div>
                <Progress value={profileScore.sections.skills.score} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Education</span>
                  <span className="text-sm font-medium">{profileScore.sections.education.score}%</span>
                </div>
                <Progress value={profileScore.sections.education.score} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Interviews</span>
                  <span className="text-sm font-medium">{profileScore.sections.interviews.score}%</span>
                </div>
                <Progress value={profileScore.sections.interviews.score} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
