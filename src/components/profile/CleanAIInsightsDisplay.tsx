import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Award, Sparkles, Star, Target } from 'lucide-react';
import { AIInsightsFeedbackButton } from '@/components/feedback/AIInsightsFeedbackButton';

interface EnrichmentData {
  id?: string;
  experience_level?: string;
  market_relevance?: string;
  career_progression?: string;
  skills_identified?: string[];
  insights?: string[];
  recommendations?: string[];
  confidence_score?: number;
}

interface CleanAIInsightsDisplayProps {
  enrichmentData: EnrichmentData;
  className?: string;
  compact?: boolean;
}

export const CleanAIInsightsDisplay: React.FC<CleanAIInsightsDisplayProps> = ({
  enrichmentData,
  className = "",
  compact = false
}) => {
  if (!enrichmentData) return null;

  const formatInsightText = (): string => {
    const parts = [
      enrichmentData.experience_level && `Experience Level: ${enrichmentData.experience_level}`,
      enrichmentData.market_relevance && `Market Relevance: ${enrichmentData.market_relevance}`,
      enrichmentData.career_progression && `Career Progression: ${enrichmentData.career_progression}`,
      enrichmentData.skills_identified && enrichmentData.skills_identified.length > 0 && 
        `Skills Detected: ${enrichmentData.skills_identified.join(', ')}`,
      enrichmentData.insights && enrichmentData.insights.length > 0 && 
        `💡 Key Insight: "${enrichmentData.insights[0]}"`,
      enrichmentData.recommendations && enrichmentData.recommendations.length > 0 && 
        `🎯 Recommendation: ${enrichmentData.recommendations[0]}`
    ].filter(Boolean);
    
    return parts.join('\n\n');
  };

  const getConfidenceLevel = (score?: number): 'high' | 'medium' | 'low' => {
    if (!score) return 'low';
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (level: string): string => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const confidenceLevel = getConfidenceLevel(enrichmentData.confidence_score);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Brain className="w-3 h-3 text-purple-500" />
        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
          AI Enhanced
        </Badge>
        {enrichmentData.confidence_score && (
          <Badge 
            variant="outline" 
            className={`text-xs ${getConfidenceColor(confidenceLevel)}`}
          >
            {Math.round(enrichmentData.confidence_score * 100)}% confident
          </Badge>
        )}
        {enrichmentData.id && (
          <AIInsightsFeedbackButton
            insightType="entry_enrichment"
            insightId={enrichmentData.id}
            currentInsight={formatInsightText()}
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-800 h-6 w-6 p-0"
          />
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between text-purple-700">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Analysis
            {enrichmentData.confidence_score && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getConfidenceColor(confidenceLevel)}`}
              >
                {Math.round(enrichmentData.confidence_score * 100)}% confident
              </Badge>
            )}
          </div>
          {enrichmentData.id && (
            <AIInsightsFeedbackButton
              insightType="entry_enrichment"
              insightId={enrichmentData.id}
              currentInsight={formatInsightText()}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-800"
            />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Experience Level */}
        {enrichmentData.experience_level && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-blue-500" />
            <span className="text-xs">
              <strong>Level:</strong> {enrichmentData.experience_level}
            </span>
          </div>
        )}

        {/* Market Relevance */}
        {enrichmentData.market_relevance && (
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-green-500" />
            <span className="text-xs">
              <strong>Market Relevance:</strong> {enrichmentData.market_relevance}
            </span>
          </div>
        )}

        {/* Career Progression */}
        {enrichmentData.career_progression && (
          <div className="text-xs">
            <strong>Career Progression:</strong> {enrichmentData.career_progression}
          </div>
        )}

        {/* Skills Identified */}
        {enrichmentData.skills_identified && enrichmentData.skills_identified.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-green-500" />
              Skills Detected:
            </div>
            <div className="flex flex-wrap gap-1">
              {enrichmentData.skills_identified.slice(0, 4).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0 bg-green-100 text-green-800">
                  {skill}
                </Badge>
              ))}
              {enrichmentData.skills_identified.length > 4 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{enrichmentData.skills_identified.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Top Insight */}
        {enrichmentData.insights && enrichmentData.insights.length > 0 && (
          <div className="text-xs text-muted-foreground italic flex items-start gap-1">
            <Star className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
            "{enrichmentData.insights[0]}"
          </div>
        )}

        {/* Top Recommendation */}
        {enrichmentData.recommendations && enrichmentData.recommendations.length > 0 && (
          <div className="text-xs text-muted-foreground italic flex items-start gap-1">
            <Award className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
            {enrichmentData.recommendations[0]}
          </div>
        )}
      </CardContent>
    </Card>
  );
};