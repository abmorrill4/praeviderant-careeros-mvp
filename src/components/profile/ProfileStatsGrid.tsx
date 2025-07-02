
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Award, Star, Target } from 'lucide-react';
import { formatExperienceYears } from '@/utils/dateUtils';

interface ProfileStatsGridProps {
  experienceYears: number;
  totalPositions: number;
  totalSkills: number;
  profileScore: number;
}

export const ProfileStatsGrid: React.FC<ProfileStatsGridProps> = ({
  experienceYears,
  totalPositions,
  totalSkills,
  profileScore,
}) => {
  console.log('ProfileStatsGrid rendering with:', {
    experienceYears,
    totalPositions,
    totalSkills,
    profileScore
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold mb-1">
                {formatExperienceYears(experienceYears)}
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
                {totalPositions}
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
                {profileScore}%
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
  );
};
