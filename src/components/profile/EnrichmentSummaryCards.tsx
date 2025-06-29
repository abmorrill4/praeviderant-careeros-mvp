import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Star, Award, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EnrichmentSummaryCardsProps {
  userId: string;
}

interface EnrichmentSummary {
  total_entities: number;
  enriched_entities: number;
  avg_confidence: number;
  top_skills: string[];
  experience_levels: Record<string, number>;
  total_insights: number;
  total_recommendations: number;
}

export const EnrichmentSummaryCards: React.FC<EnrichmentSummaryCardsProps> = ({ userId }) => {
  const { user } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['enrichment-summary', userId],
    queryFn: async (): Promise<EnrichmentSummary> => {
      if (!user) throw new Error('No user');

      // Get enrichment data from entry_enrichment table
      const { data: enrichments, error } = await supabase
        .from('entry_enrichment')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const totalEnriched = enrichments?.length || 0;
      const avgConfidence = enrichments?.length > 0 
        ? enrichments.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / enrichments.length 
        : 0;

      // Extract skills from all enrichments
      const allSkills: string[] = [];
      enrichments?.forEach(e => {
        if (e.skills_identified && Array.isArray(e.skills_identified)) {
          // Handle Json type properly
          const skills = e.skills_identified.map(skill => 
            typeof skill === 'string' ? skill : String(skill)
          );
          allSkills.push(...skills);
        }
      });

      // Count skill occurrences
      const skillCounts = allSkills.reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get top 5 skills
      const topSkills = Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([skill]) => skill);

      // Count experience levels
      const experienceLevels = enrichments?.reduce((acc, e) => {
        if (e.experience_level) {
          acc[e.experience_level] = (acc[e.experience_level] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Count total insights and recommendations
      const totalInsights = enrichments?.reduce((sum, e) => {
        return sum + (Array.isArray(e.insights) ? e.insights.length : 0);
      }, 0) || 0;

      const totalRecommendations = enrichments?.reduce((sum, e) => {
        return sum + (Array.isArray(e.recommendations) ? e.recommendations.length : 0);
      }, 0) || 0;

      return {
        total_entities: totalEnriched,
        enriched_entities: totalEnriched,
        avg_confidence: avgConfidence,
        top_skills: topSkills,
        experience_levels: experienceLevels,
        total_insights: totalInsights,
        total_recommendations: totalRecommendations
      };
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const enrichmentPercentage = summary.total_entities > 0 
    ? Math.round((summary.enriched_entities / summary.total_entities) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Enrichment Progress */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-500" />
            AI Analysis Progress
          </CardTitle>
          <CardDescription className="text-xs">
            {summary.enriched_entities} entries analyzed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{enrichmentPercentage}%</span>
            </div>
            <Progress value={enrichmentPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Confidence Score */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-green-500" />
            Average Confidence
          </CardTitle>
          <CardDescription className="text-xs">
            AI analysis accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {Math.round(summary.avg_confidence * 100)}%
          </div>
        </CardContent>
      </Card>

      {/* Top Skills */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Top Skills Detected
          </CardTitle>
          <CardDescription className="text-xs">
            Most frequently identified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {summary.top_skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs mr-1">
                {skill}
              </Badge>
            ))}
            {summary.top_skills.length > 3 && (
              <div className="text-xs text-muted-foreground mt-1">
                +{summary.top_skills.length - 3} more
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-500" />
            AI Insights
          </CardTitle>
          <CardDescription className="text-xs">
            Generated insights & tips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Insights</span>
              <span className="font-semibold">{summary.total_insights}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Recommendations</span>
              <span className="font-semibold">{summary.total_recommendations}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
