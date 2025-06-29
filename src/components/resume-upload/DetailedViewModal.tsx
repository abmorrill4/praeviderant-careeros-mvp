import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar, Building, MapPin, Globe, Award, Code, Users, Heart, BookOpen, Star, Sparkles, Brain, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { useEnrichSingleEntry } from '@/hooks/useEntryEnrichment';

interface ParsedResumeEntity {
  id: string;
  field_name: string;
  raw_value: string;
  confidence_score: number;
  source_type: string;
  // AI enrichment data
  enrichment_data?: {
    insights?: string[];
    skills_identified?: string[];
    experience_level?: string;
    career_progression?: string;
    market_relevance?: string;
    recommendations?: string[];
    parsed_structure?: any;
  };
}

interface DetailedViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: ParsedResumeEntity;
  title: string;
  subtitle?: string;
}

export const DetailedViewModal: React.FC<DetailedViewModalProps> = ({
  isOpen,
  onClose,
  entity,
  title,
  subtitle
}) => {
  const enrichSingleMutation = useEnrichSingleEntry();

  // Parse the raw data
  const parseRawData = () => {
    try {
      const parsed = JSON.parse(entity.raw_value);
      return parsed;
    } catch (error) {
      return entity.raw_value;
    }
  };

  const rawData = parseRawData();
  const enrichmentData = entity.enrichment_data;

  const handleEnrichEntry = async () => {
    try {
      const entityId = entity.id.split('-')[0]; // Get original entity ID
      await enrichSingleMutation.mutateAsync({ entityId, forceRefresh: true });
    } catch (error) {
      console.error('Failed to enrich entry:', error);
    }
  };

  const renderParsedData = () => {
    if (typeof rawData === 'object' && rawData !== null) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-500" />
              Extracted Data Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(rawData).map(([key, value]) => (
              <div key={key} className="border-l-2 border-l-blue-200 pl-3">
                <div className="font-medium text-sm capitalize">{key.replace(/_/g, ' ')}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {Array.isArray(value) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {value.map((item, index) => (
                        <li key={index}>{String(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    String(value)
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">
              {String(rawData)}
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  const renderEnrichmentData = () => {
    if (!enrichmentData) {
      return (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p className="text-muted-foreground mb-4">AI enrichment data not available for this entry</p>
              <Button
                onClick={handleEnrichEntry}
                disabled={enrichSingleMutation.isPending}
                className="flex items-center gap-2"
              >
                {enrichSingleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Enrich This Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnrichEntry}
            disabled={enrichSingleMutation.isPending}
            className="flex items-center gap-2"
          >
            {enrichSingleMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Refresh Analysis
          </Button>
        </div>

        {/* AI Insights */}
        {enrichmentData.insights && enrichmentData.insights.length > 0 && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {enrichmentData.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Star className="w-3 h-3 text-purple-500 mt-1 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Skills Identified */}
        {enrichmentData.skills_identified && enrichmentData.skills_identified.length > 0 && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-green-500" />
                Skills Identified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {enrichmentData.skills_identified.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Experience Level & Career Progression */}
        {(enrichmentData.experience_level || enrichmentData.career_progression) && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Career Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {enrichmentData.experience_level && (
                <div>
                  <div className="font-medium text-sm">Experience Level</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {enrichmentData.experience_level}
                  </div>
                </div>
              )}
              {enrichmentData.career_progression && (
                <div>
                  <div className="font-medium text-sm">Career Progression</div>
                  <div className="text-sm text-muted-foreground">
                    {enrichmentData.career_progression}
                  </div>
                </div>
              )}
              {enrichmentData.market_relevance && (
                <div>
                  <div className="font-medium text-sm">Market Relevance</div>
                  <div className="text-sm text-muted-foreground">
                    {enrichmentData.market_relevance}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {enrichmentData.recommendations && enrichmentData.recommendations.length > 0 && (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-500" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {enrichmentData.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Award className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Parsed Structure (if different from raw data) */}
        {enrichmentData.parsed_structure && (
          <Card className="border-l-4 border-l-gray-500">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-gray-500" />
                AI Enhanced Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                {JSON.stringify(enrichmentData.parsed_structure, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-500" />
            {title}
          </DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        
        <Separator />
        
        <div className="space-y-6 py-4">
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-gray-50 p-3 rounded">
            <div className="flex items-center gap-4">
              <span>Field: <strong>{entity.field_name}</strong></span>
              <span>Source: <strong>{entity.source_type}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {Math.round(entity.confidence_score * 100)}% confidence
              </Badge>
              {entity.enrichment_data && (
                <Badge className="text-xs bg-purple-100 text-purple-800">
                  AI Enhanced
                </Badge>
              )}
            </div>
          </div>

          {/* Parsed Data Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              Extracted Resume Data
            </h3>
            {renderParsedData()}
          </div>

          {/* AI Enrichment Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Analysis & Enrichment
            </h3>
            {renderEnrichmentData()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
