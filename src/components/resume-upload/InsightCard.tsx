
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Code, 
  Award,
  Sparkles,
  CheckCircle,
  Info,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useCareerEnrichment, useCareerNarratives } from '@/hooks/useEnrichment';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';
import { EnrichmentProgress } from './EnrichmentProgress';
import { SmartEnrichmentTrigger } from './SmartEnrichmentTrigger';

interface InsightCardProps {
  versionId: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ versionId }) => {
  const [retryCount, setRetryCount] = useState(0);
  const { data: status, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useEnrichmentStatus(versionId);
  const { data: enrichment, isLoading: enrichmentLoading, error: enrichmentError, refetch: refetchEnrichment } = useCareerEnrichment(versionId);
  const { data: narratives, isLoading: narrativesLoading, error: narrativesError, refetch: refetchNarratives } = useCareerNarratives(versionId);

  console.log('InsightCard Debug:', {
    versionId,
    status,
    statusLoading,
    statusError,
    enrichment,
    enrichmentLoading,
    enrichmentError,
    narratives: narratives?.length || 0,
    narrativesLoading,
    narrativesError,
    retryCount,
    timestamp: new Date().toISOString()
  });

  const handleRetry = async () => {
    console.log('InsightCard: Manual retry triggered');
    setRetryCount(prev => prev + 1);
    
    // Refetch all data
    await Promise.all([
      refetchStatus(),
      refetchEnrichment(),
      refetchNarratives()
    ]);
  };

  // Show error state if any queries failed
  if (statusError || enrichmentError || narrativesError) {
    const error = statusError || enrichmentError || narrativesError;
    console.error('InsightCard: Error detected:', error);
    
    return (
      <>
        <SmartEnrichmentTrigger versionId={versionId} />
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              AI Analysis Error
            </CardTitle>
            <CardDescription>
              There was an issue loading your career insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700">
              Error: {error?.message || 'Unknown error occurred'}
            </p>
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // Show failed state if processing failed
  if (status?.processingStage === 'failed') {
    return (
      <>
        <SmartEnrichmentTrigger versionId={versionId} />
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              AI Analysis Failed
            </CardTitle>
            <CardDescription>
              The AI analysis process encountered an error
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700">
              Please try refreshing the page or uploading your resume again.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  // Show progress while processing - this is the main state during AI enrichment
  if (!status?.isComplete) {
    console.log('InsightCard: Showing progress - not complete yet');
    return (
      <>
        <SmartEnrichmentTrigger versionId={versionId} />
        {status && <EnrichmentProgress status={status} />}
      </>
    );
  }

  // Show insights when complete - this should only render when everything is done
  if (status.isComplete && enrichment && narratives) {
    console.log('InsightCard: Showing completed insights');
    
    const getScoreVariant = (score: number) => {
      if (score >= 80) return 'default';
      if (score >= 60) return 'secondary';
      return 'outline';
    };

    const careerSummary = narratives.find(n => n.narrative_type === 'career_summary');
    const keyStrengths = narratives.find(n => n.narrative_type === 'key_strengths');
    const growthTrajectory = narratives.find(n => n.narrative_type === 'growth_trajectory');

    console.log('InsightCard: Narrative breakdown:', {
      careerSummary: !!careerSummary,
      keyStrengths: !!keyStrengths,
      growthTrajectory: !!growthTrajectory
    });

    return (
      <>
        <SmartEnrichmentTrigger versionId={versionId} />
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Sparkles className="w-4 h-4" />
              AI Career Insights
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Info className="w-3 h-3" />
              Generated by OpenAI {enrichment.model_version || 'GPT-4o'} • Model confidence: {Math.round((enrichment.confidence_score || 0.9) * 100)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Professional Profile */}
            <div className="space-y-3">
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

              {/* Archetype and Persona Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-2 bg-white/60 rounded border-l-2 border-blue-400">
                  <div className="font-medium text-blue-800 mb-1">Role Archetype</div>
                  <p className="text-gray-700 leading-relaxed">
                    {enrichment.role_archetype_explanation}
                  </p>
                </div>
                <div className="p-2 bg-white/60 rounded border-l-2 border-purple-400">
                  <div className="font-medium text-purple-800 mb-1">Professional Persona</div>
                  <p className="text-gray-700 leading-relaxed">
                    {enrichment.persona_explanation}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Capability Scores */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Professional Capability Assessment
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Users className="w-3 h-3" />
                    <span className="text-xs font-medium">Leadership</span>
                  </div>
                  <div className="space-y-1">
                    <Badge variant={getScoreVariant(enrichment.leadership_score)} className="text-xs">
                      {enrichment.leadership_score}/100
                    </Badge>
                    <Progress value={enrichment.leadership_score} className="h-1" />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Target className="w-3 h-3" />
                    <span className="text-xs font-medium">Impact</span>
                  </div>
                  <div className="space-y-1">
                    <Badge variant={getScoreVariant(enrichment.scope_score)} className="text-xs">
                      {enrichment.scope_score}/100
                    </Badge>
                    <Progress value={enrichment.scope_score} className="h-1" />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Code className="w-3 h-3" />
                    <span className="text-xs font-medium">Technical</span>
                  </div>
                  <div className="space-y-1">
                    <Badge variant={getScoreVariant(enrichment.technical_depth_score)} className="text-xs">
                      {enrichment.technical_depth_score}/100
                    </Badge>
                    <Progress value={enrichment.technical_depth_score} className="h-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI-Generated Career Narratives */}
            <div className="space-y-3">
              {/* Career Summary */}
              {careerSummary && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Professional Summary
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-white/40 p-2 rounded">
                    {careerSummary.narrative_text}
                  </p>
                </div>
              )}

              {/* Key Strengths */}
              {keyStrengths && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Key Strengths
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-white/40 p-2 rounded">
                    {keyStrengths.narrative_text}
                  </p>
                </div>
              )}

              {/* Growth Trajectory (collapsed by default to save space) */}
              {growthTrajectory && (
                <details className="group">
                  <summary className="font-medium text-sm mb-2 flex items-center gap-1 cursor-pointer hover:text-green-700">
                    <TrendingUp className="w-3 h-3" />
                    Career Growth Analysis
                    <span className="text-xs text-gray-500 ml-auto">Click to expand</span>
                  </summary>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-white/40 p-2 rounded mt-2">
                    {growthTrajectory.narrative_text}
                  </p>
                </details>
              )}
            </div>

            {/* Model Attribution */}
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              Analysis powered by OpenAI {enrichment.model_version || 'GPT-4o'} • 
              Generated at confidence level {Math.round((enrichment.confidence_score || 0.9) * 100)}%
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  // Loading state - should rarely be shown now that we have better state management
  console.log('InsightCard: Showing loading state');
  return (
    <>
      <SmartEnrichmentTrigger versionId={versionId} />
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            Loading AI Insights...
          </CardTitle>
          <CardDescription>
            Preparing your career analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please wait while we load your career insights...
          </p>
          {retryCount > 0 && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
