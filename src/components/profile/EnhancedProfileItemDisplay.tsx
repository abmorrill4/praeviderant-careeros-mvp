import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import { Check, Edit, Brain, Sparkles, TrendingUp, Award, Star } from 'lucide-react';
import { useEntityEnrichment } from '@/hooks/useEntryEnrichment';
import { AIInsightsFeedbackButton } from '@/components/feedback/AIInsightsFeedbackButton';
import type { VersionedEntity } from '@/types/versioned-entities';

interface EnhancedProfileItemDisplayProps<T extends VersionedEntity> {
  item: T;
  onAccept: (item: VersionedEntity) => void;
  onEdit: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  enrichmentEntityId?: string; // ID to fetch enrichment data
}

export const EnhancedProfileItemDisplay = <T extends VersionedEntity>({
  item,
  onAccept,
  onEdit,
  renderItem,
  enrichmentEntityId
}: EnhancedProfileItemDisplayProps<T>) => {
  const { theme } = useTheme();
  const { data: enrichmentData } = useEntityEnrichment(enrichmentEntityId);

  const isPendingAIExtraction = (item: VersionedEntity) => 
    item.source === 'AI_EXTRACTION' && !item.is_active;

  const handleEditClick = () => {
    onEdit(item);
  };

  const renderEnrichmentData = () => {
    if (!enrichmentData) return null;

    return (
      <Card className="mt-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center justify-between text-purple-700">
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              AI Insights
            </div>
            {enrichmentData.id && (
              <AIInsightsFeedbackButton
                insightType="entry_enrichment"
                insightId={enrichmentData.id}
                currentInsight={[
                  enrichmentData.experience_level && `Level: ${enrichmentData.experience_level}`,
                  enrichmentData.market_relevance && `Market Relevance: ${enrichmentData.market_relevance}`,
                  enrichmentData.career_progression && `Career Progression: ${enrichmentData.career_progression}`,
                  enrichmentData.skills_identified && enrichmentData.skills_identified.length > 0 && `Skills Detected: ${enrichmentData.skills_identified.join(', ')}`,
                  enrichmentData.insights && enrichmentData.insights.length > 0 && `💡 "${enrichmentData.insights[0]}"`,
                  enrichmentData.recommendations && enrichmentData.recommendations.length > 0 && `🏆 ${enrichmentData.recommendations[0]}`
                ].filter(Boolean).join('\n\n')}
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
              <Award className="w-3 h-3 text-green-500" />
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

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isPendingAIExtraction(item)
          ? 'border-yellow-400 bg-yellow-50'
          : 'border-career-text-light/10 bg-career-background-light/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {renderItem(item)}
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant={item.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {item.is_active ? 'Active' : 'Pending'}
            </Badge>
            {item.source && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs cursor-help">
                    {item.source}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Source: {item.source}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {item.source_confidence && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs cursor-help">
                    {Math.round(item.source_confidence * 100)}% confidence
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Confidence: {Math.round(item.source_confidence * 100)}%</p>
                </TooltipContent>
              </Tooltip>
            )}
            {enrichmentData && (
              <Badge className="text-xs bg-purple-100 text-purple-800">
                AI Enhanced
              </Badge>
            )}
          </div>
          
          {/* Render enrichment data if available */}
          {renderEnrichmentData()}
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          {isPendingAIExtraction(item) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAccept(item)}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <Check className="w-3 h-3 mr-1" />
              Accept
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleEditClick}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};