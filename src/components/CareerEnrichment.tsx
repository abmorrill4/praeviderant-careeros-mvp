
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Loader2, Brain, Sparkles, TrendingUp, Users, Target } from 'lucide-react';
import { useCareerEnrichment, useCareerNarratives, useEnrichmentJobs, useEnrichResume } from '@/hooks/useEnrichment';

interface CareerEnrichmentProps {
  versionId: string;
}

export const CareerEnrichment: React.FC<CareerEnrichmentProps> = ({ versionId }) => {
  const { data: enrichment, isLoading: enrichmentLoading } = useCareerEnrichment(versionId);
  const { data: narratives, isLoading: narrativesLoading } = useCareerNarratives(versionId);
  const { data: jobs } = useEnrichmentJobs(versionId);
  const enrichResumeMutation = useEnrichResume();

  const latestJob = jobs?.[0];
  const isProcessing = latestJob?.status === 'running' || enrichResumeMutation.isPending;

  const handleEnrichResume = () => {
    enrichResumeMutation.mutate(versionId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (enrichmentLoading || narrativesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading career insights...</span>
        </CardContent>
      </Card>
    );
  }

  if (!enrichment && !isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Career Enrichment
          </CardTitle>
          <CardDescription>
            Generate AI-powered career insights and narrative summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No career insights available yet. Generate enriched analysis to get:
            </p>
            <ul className="text-sm text-muted-foreground mb-6 space-y-2">
              <li>• Role archetype and persona analysis</li>
              <li>• Leadership, scope, and technical depth scores</li>
              <li>• Career summary and growth trajectory</li>
              <li>• Key strengths identification</li>
            </ul>
            <Button onClick={handleEnrichResume} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Processing Career Insights
          </CardTitle>
          <CardDescription>
            Analyzing career data and generating enriched insights...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Processing with AI...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Career Scores */}
      {enrichment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Career Analysis Scores
            </CardTitle>
            <CardDescription>
              AI-generated scores based on your career progression and experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Archetype & Persona */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Role Archetype</span>
                </div>
                <Badge variant="secondary" className="mb-2">
                  {enrichment.role_archetype}
                </Badge>
                {enrichment.role_archetype_explanation && (
                  <p className="text-sm text-muted-foreground">
                    {enrichment.role_archetype_explanation}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4" />
                  <span className="font-medium">Persona Type</span>
                </div>
                <Badge variant="secondary" className="mb-2">
                  {enrichment.persona_type}
                </Badge>
                {enrichment.persona_explanation && (
                  <p className="text-sm text-muted-foreground">
                    {enrichment.persona_explanation}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Scores */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Leadership Score</span>
                  <Badge className={getScoreBadgeColor(enrichment.leadership_score)}>
                    {enrichment.leadership_score}/100
                  </Badge>
                </div>
                <Progress value={enrichment.leadership_score} className="mb-2" />
                {enrichment.leadership_explanation && (
                  <p className="text-sm text-muted-foreground">
                    {enrichment.leadership_explanation}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Scope Score</span>
                  <Badge className={getScoreBadgeColor(enrichment.scope_score)}>
                    {enrichment.scope_score}/100
                  </Badge>
                </div>
                <Progress value={enrichment.scope_score} className="mb-2" />
                {enrichment.scope_explanation && (
                  <p className="text-sm text-muted-foreground">
                    {enrichment.scope_explanation}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Technical Depth Score</span>
                  <Badge className={getScoreBadgeColor(enrichment.technical_depth_score)}>
                    {enrichment.technical_depth_score}/100
                  </Badge>
                </div>
                <Progress value={enrichment.technical_depth_score} className="mb-2" />
                {enrichment.technical_depth_explanation && (
                  <p className="text-sm text-muted-foreground">
                    {enrichment.technical_depth_explanation}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Generated by {enrichment.model_version} • 
                Confidence: {Math.round(enrichment.confidence_score * 100)}%
              </div>
              <Button variant="outline" size="sm" onClick={handleEnrichResume}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Refresh Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Narratives */}
      {narratives && narratives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Career Narratives
            </CardTitle>
            <CardDescription>
              AI-generated narrative insights about your career
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {narratives.map((narrative) => (
              <div key={narrative.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {narrative.narrative_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(narrative.confidence_score * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {narrative.narrative_text}
                </p>
                {narrative.narrative_explanation && (
                  <p className="text-xs text-muted-foreground">
                    {narrative.narrative_explanation}
                  </p>
                )}
                {narrative !== narratives[narratives.length - 1] && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
