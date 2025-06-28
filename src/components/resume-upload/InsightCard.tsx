
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Code, 
  Award,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { CareerEnrichment, CareerNarrative } from '@/types/enrichment';

interface InsightCardProps {
  enrichment?: CareerEnrichment;
  narratives: CareerNarrative[];
  isLoading?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  enrichment,
  narratives,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Career Insights...
          </CardTitle>
          <CardDescription>
            AI is analyzing your career profile
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!enrichment) {
    return null;
  }

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  const careerSummary = narratives.find(n => n.narrative_type === 'career_summary');
  const keyStrengths = narratives.find(n => n.narrative_type === 'key_strengths');

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Sparkles className="w-4 h-4" />
          Career Insights
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your professional profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Profile Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            {enrichment.role_archetype}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {enrichment.persona_type}
          </Badge>
        </div>

        {/* Key Scores */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-3 h-3" />
              <span className="text-xs font-medium">Leadership</span>
            </div>
            <Badge variant={getScoreVariant(enrichment.leadership_score)} className="text-xs">
              {enrichment.leadership_score}
            </Badge>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-medium">Impact</span>
            </div>
            <Badge variant={getScoreVariant(enrichment.scope_score)} className="text-xs">
              {enrichment.scope_score}
            </Badge>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Code className="w-3 h-3" />
              <span className="text-xs font-medium">Technical</span>
            </div>
            <Badge variant={getScoreVariant(enrichment.technical_depth_score)} className="text-xs">
              {enrichment.technical_depth_score}
            </Badge>
          </div>
        </div>

        {/* Career Summary */}
        {careerSummary && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
              <Award className="w-3 h-3" />
              Professional Summary
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {careerSummary.narrative_text}
            </p>
          </div>
        )}

        {/* Key Strengths */}
        {keyStrengths && (
          <div>
            <h4 className="font-medium text-sm mb-2">Key Strengths</h4>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {keyStrengths.narrative_text}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
