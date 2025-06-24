import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Brain, RefreshCw, Eye, Target, Sparkles } from 'lucide-react';
import { useParsedResumeEntities, useParseResumeVersion } from '@/hooks/useResumeStreams';
import { ResumeDiffAnalysis } from '@/components/ResumeDiffAnalysis';
import { EntityNormalization } from '@/components/EntityNormalization';
import { CareerEnrichment } from '@/components/CareerEnrichment';
import type { ParsedResumeEntity } from '@/hooks/useResumeStreams';

interface ParsedResumeEntitiesProps {
  versionId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export const ParsedResumeEntities: React.FC<ParsedResumeEntitiesProps> = ({
  versionId,
  processingStatus
}) => {
  const { data: entities, isLoading, refetch } = useParsedResumeEntities(versionId);
  const parseResumeMutation = useParseResumeVersion();
  const [showDiffAnalysis, setShowDiffAnalysis] = React.useState(false);

  const handleRetryParsing = () => {
    parseResumeMutation.mutate(versionId);
  };

  const groupedEntities = React.useMemo(() => {
    if (!entities) return {};
    
    return entities.reduce((acc, entity) => {
      const section = entity.field_name.split('.')[0];
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(entity);
      return acc;
    }, {} as Record<string, ParsedResumeEntity[]>);
  }, [entities]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split('.')
      .pop()
      ?.replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase()) || fieldName;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading parsed data...</span>
        </CardContent>
      </Card>
    );
  }

  if (processingStatus === 'processing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Processing Resume
          </CardTitle>
          <CardDescription>
            Extracting structured data from your resume...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Processing with AI...</span>
        </CardContent>
      </Card>
    );
  }

  if (processingStatus === 'failed' || (!entities || entities.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Extracted Data
          </CardTitle>
          <CardDescription>
            {processingStatus === 'failed' 
              ? 'Failed to extract structured data from resume'
              : 'No structured data available'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {processingStatus === 'failed'
                ? 'The AI processing failed. You can retry extraction.'
                : 'No structured data has been extracted yet.'
              }
            </p>
            <Button 
              onClick={handleRetryParsing}
              disabled={parseResumeMutation.isPending}
            >
              {parseResumeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {processingStatus === 'failed' ? 'Retry Extraction' : 'Extract Data'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="extracted" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="extracted" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Extracted Data
          </TabsTrigger>
          <TabsTrigger value="enrichment" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Career Insights
          </TabsTrigger>
          <TabsTrigger value="normalization" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Normalization
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extracted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Extracted Data ({entities.length} items)
              </CardTitle>
              <CardDescription>
                Structured data extracted using AI with confidence scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedEntities).map(([section, sectionEntities]) => (
                <div key={section}>
                  <h3 className="font-medium mb-3 capitalize">
                    {section.replace(/_/g, ' ')}
                  </h3>
                  <div className="space-y-2">
                    {sectionEntities.map((entity) => (
                      <div 
                        key={entity.id} 
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {formatFieldName(entity.field_name)}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getConfidenceColor(entity.confidence_score)}`}
                            >
                              {Math.round(entity.confidence_score * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entity.raw_value.length > 100 
                              ? `${entity.raw_value.substring(0, 100)}...`
                              : entity.raw_value
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {section !== Object.keys(groupedEntities)[Object.keys(groupedEntities).length - 1] && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Extracted by {entities[0]?.model_version} • {entities[0]?.source_type}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrichment">
          <CareerEnrichment versionId={versionId} />
        </TabsContent>

        <TabsContent value="normalization">
          <EntityNormalization versionId={versionId} />
        </TabsContent>

        <TabsContent value="analysis">
          <ResumeDiffAnalysis 
            versionId={versionId}
            onToggleVisibility={() => setShowDiffAnalysis(!showDiffAnalysis)}
            isVisible={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
