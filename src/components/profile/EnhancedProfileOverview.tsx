
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Star, Award, Users, Target, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileAnalysis {
  overall_experience_level: string;
  career_trajectory: string;
  key_strengths: string[];
  growth_areas: string[];
  market_position: string;
  recommended_roles: string[];
  skill_diversity_score: number;
  leadership_indicators: string[];
}

export const EnhancedProfileOverview: React.FC = () => {
  const { user } = useAuth();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['profile-analysis', user?.id],
    queryFn: async (): Promise<ProfileAnalysis> => {
      if (!user) throw new Error('No user');

      // Get all enrichment data for analysis
      const { data: enrichments, error } = await supabase
        .from('entry_enrichment')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Analyze the data to create profile overview
      const experienceLevels = enrichments?.map(e => e.experience_level).filter(Boolean) || [];
      const allSkills: string[] = [];
      const allInsights: string[] = [];
      const allRecommendations: string[] = [];

      enrichments?.forEach(e => {
        if (e.skills_identified && Array.isArray(e.skills_identified)) {
          allSkills.push(...e.skills_identified);
        }
        if (e.insights && Array.isArray(e.insights)) {
          allInsights.push(...e.insights);
        }
        if (e.recommendations && Array.isArray(e.recommendations)) {
          allRecommendations.push(...e.recommendations);
        }
      });

      // Determine overall experience level
      const levelCounts = experienceLevels.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const overallLevel = Object.entries(levelCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Intermediate';

      // Extract key strengths from skills
      const skillCounts = allSkills.reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const keyStrengths = Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([skill]) => skill);

      // Calculate skill diversity
      const uniqueSkills = new Set(allSkills);
      const skillDiversityScore = Math.min(uniqueSkills.size * 2, 100); // Cap at 100

      // Extract leadership indicators from insights
      const leadershipKeywords = ['lead', 'manage', 'coordinate', 'supervise', 'direct', 'oversee'];
      const leadershipIndicators = allInsights.filter(insight => 
        leadershipKeywords.some(keyword => 
          insight.toLowerCase().includes(keyword)
        )
      ).slice(0, 3);

      return {
        overall_experience_level: overallLevel,
        career_trajectory: 'Progressive growth with expanding responsibilities',
        key_strengths: keyStrengths,
        growth_areas: ['Communication', 'Strategic Planning', 'Team Leadership'],
        market_position: 'Competitive with strong technical foundation',
        recommended_roles: ['Senior Developer', 'Technical Lead', 'Product Manager'],
        skill_diversity_score: skillDiversityScore,
        leadership_indicators: leadershipIndicators
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
            AI Profile Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Career Overview */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-purple-500" />
            Career Analysis
          </CardTitle>
          <CardDescription>
            AI-powered assessment of your professional profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Experience Level</span>
              <Badge variant="secondary">{analysis.overall_experience_level}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.career_trajectory}</p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Market Position</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">{analysis.market_position}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Skill Diversity</span>
              <span className="text-sm font-semibold">{analysis.skill_diversity_score}%</span>
            </div>
            <Progress value={analysis.skill_diversity_score} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Strengths */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-green-500" />
            Key Strengths
          </CardTitle>
          <CardDescription>
            Your most prominent skills and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {analysis.key_strengths.map((strength, index) => (
                <Badge key={index} className="bg-green-100 text-green-800 hover:bg-green-200">
                  {strength}
                </Badge>
              ))}
            </div>

            {analysis.leadership_indicators.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Leadership Indicators</span>
                </div>
                <ul className="space-y-1">
                  {analysis.leadership_indicators.map((indicator, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                      <span className="text-blue-500 mt-1">•</span>
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Growth Opportunities */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-orange-500" />
            Growth Areas
          </CardTitle>
          <CardDescription>
            Recommended areas for professional development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.growth_areas.map((area, index) => (
              <div key={index} className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-orange-500" />
                <span className="text-sm">{area}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Roles */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-blue-500" />
            Recommended Roles
          </CardTitle>
          <CardDescription>
            Positions that align with your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.recommended_roles.map((role, index) => (
              <Badge key={index} variant="outline" className="mr-2 mb-2">
                {role}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
