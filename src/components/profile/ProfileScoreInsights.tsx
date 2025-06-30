
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTheme } from '@/contexts/ThemeContext';
import { TrendingUp, Target, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { useEnhancedProfileScore } from '@/hooks/useEnhancedProfileScore';

export const ProfileScoreInsights: React.FC = () => {
  const { theme } = useTheme();
  const profileScore = useEnhancedProfileScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <Target className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-career-panel-light border-career-text-light/20">
        <CardHeader>
          <CardTitle className="text-lg text-career-text-light flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Enhanced Profile Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className={`text-3xl font-bold ${getScoreColor(profileScore.overall)}`}>
              {profileScore.overall}%
            </div>
            <div className="flex items-center gap-2">
              {getScoreIcon(profileScore.overall)}
              <span className="text-sm text-career-text-muted-light">
                {profileScore.overall >= 80 ? 'Excellent' : profileScore.overall >= 60 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
          </div>
          <Progress value={profileScore.overall} className="h-3" />
        </CardContent>
      </Card>

      {/* Detailed Section Breakdown */}
      <Card className="bg-career-panel-light border-career-text-light/20">
        <CardHeader>
          <CardTitle className="text-lg text-career-text-light">
            Section Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Work Experience Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-career-text-light">
                Work Experience
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${getScoreColor(profileScore.sections.experience.score)}`}>
                  {profileScore.sections.experience.score}%
                </span>
                <Progress value={profileScore.sections.experience.score} className="w-16 h-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-opacity-50">
                <span>Quantified Results</span>
                <span className={getScoreColor(profileScore.sections.experience.details.quantifiedAchievements)}>
                  {profileScore.sections.experience.details.quantifiedAchievements}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-opacity-50">
                <span>Action Verbs</span>
                <span className={getScoreColor(profileScore.sections.experience.details.actionVerbUsage)}>
                  {profileScore.sections.experience.details.actionVerbUsage}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-opacity-50">
                <span>Impact Statements</span>
                <span className={getScoreColor(profileScore.sections.experience.details.impactStatements)}>
                  {profileScore.sections.experience.details.impactStatements}%
                </span>
              </div>
            </div>
          </div>

          {/* Skills Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-career-text-light">
                Skills
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${getScoreColor(profileScore.sections.skills.score)}`}>
                  {profileScore.sections.skills.score}%
                </span>
                <Progress value={profileScore.sections.skills.score} className="w-16 h-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-opacity-50">
                <span>Context & Evidence</span>
                <span className={getScoreColor(profileScore.sections.skills.details.contextualEvidence)}>
                  {profileScore.sections.skills.details.contextualEvidence}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-opacity-50">
                <span>Proficiency Clarity</span>
                <span className={getScoreColor(profileScore.sections.skills.details.proficiencyClarity)}>
                  {profileScore.sections.skills.details.proficiencyClarity}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {profileScore.recommendations.length > 0 && (
        <Card className="bg-career-panel-light border-career-text-light/20">
          <CardHeader>
            <CardTitle className="text-lg text-career-text-light flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profileScore.recommendations.map((recommendation, index) => (
                <div key={index} className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                  <p className="text-sm text-career-text-light">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Practice Gaps */}
      {profileScore.bestPracticeGaps.length > 0 && (
        <Card className="bg-career-panel-light border-career-text-light/20">
          <CardHeader>
            <CardTitle className="text-lg text-career-text-light flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profileScore.bestPracticeGaps.map((gap, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-career-text-muted-light">
                    {gap}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
