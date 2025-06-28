
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  TrendingUp,
  Users,
  Target,
  Brain,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useCareerEnrichment, useCareerNarratives, useEnrichResume } from '@/hooks/useEnrichment';

interface EnrichedResumeViewProps {
  versionId: string;
}

export const EnrichedResumeView: React.FC<EnrichedResumeViewProps> = ({ versionId }) => {
  const { data: enrichment, isLoading: enrichmentLoading } = useCareerEnrichment(versionId);
  const { data: narratives, isLoading: narrativesLoading } = useCareerNarratives(versionId);
  const enrichResumeMutation = useEnrichResume();

  const handleTriggerEnrichment = () => {
    enrichResumeMutation.mutate(versionId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  if (enrichmentLoading || narrativesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Career Analysis
          </CardTitle>
          <CardDescription>
            Loading AI-powered career insights...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!enrichment || narratives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Career Analysis
          </CardTitle>
          <CardDescription>
            Generate AI-powered career insights and professional narratives from your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Ready to unlock deeper insights about your career profile?
            </p>
            <Button 
              onClick={handleTriggerEnrichment} 
              className="flex items-center gap-2"
              disabled={enrichResumeMutation.isPending}
            >
              {enrichResumeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Career Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const careerSummary = narratives.find(n => n.narrative_type === 'career_summary');
  const keyStrengths = narratives.find(n => n.narrative_type === 'key_strengths');
  const growthTrajectory = narratives.find(n => n.narrative_type === 'growth_trajectory');

  return (
    <div className="space-y-6">
      {/* Career Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Career Profile
          </CardTitle>
          <CardDescription>
            AI-analyzed professional archetype and persona
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {enrichment.role_archetype}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {enrichment.role_archetype_explanation}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {enrichment.persona_type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {enrichment.persona_explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Professional Capability Scores
          </CardTitle>
          <CardDescription>
            Quantified analysis of your professional strengths
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Leadership</span>
                </div>
                <Badge variant={getScoreVariant(enrichment.leadership_score)}>
                  {enrichment.leadership_score}/100
                </Badge>
              </div>
              <Progress value={enrichment.leadership_score} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {enrichment.leadership_explanation}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Scope & Impact</span>
                </div>
                <Badge variant={getScoreVariant(enrichment.scope_score)}>
                  {enrichment.scope_score}/100
                </Badge>
              </div>
              <Progress value={enrichment.scope_score} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {enrichment.scope_explanation}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  <span className="font-medium">Technical Depth</span>
                </div>
                <Badge variant={getScoreVariant(enrichment.technical_depth_score)}>
                  {enrichment.technical_depth_score}/100
                </Badge>
              </div>
              <Progress value={enrichment.technical_depth_score} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {enrichment.technical_depth_explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Narratives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Professional Narratives
          </CardTitle>
          <CardDescription>
            AI-generated professional summaries and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {careerSummary && (
            <div>
              <h4 className="font-medium mb-2">Career Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {careerSummary.narrative_text}
              </p>
            </div>
          )}

          {keyStrengths && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Key Strengths</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {keyStrengths.narrative_text}
                </p>
              </div>
            </>
          )}

          {growthTrajectory && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Growth Trajectory</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {growthTrajectory.narrative_text}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
