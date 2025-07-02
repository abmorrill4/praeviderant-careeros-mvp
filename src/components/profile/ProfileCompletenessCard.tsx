
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';

interface ProfileSection {
  score: number;
}

interface ProfileCompleteness {
  overall: number;
  sections: {
    experience: ProfileSection;
    skills: ProfileSection;
    education: ProfileSection;
    interviews: ProfileSection;
  };
}

interface ProfileCompletenessCardProps {
  profileScore: ProfileCompleteness;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  profileScore,
}) => {
  return (
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
  );
};
