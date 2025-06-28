
import React, { useEffect } from 'react';
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
  Loader2,
  CheckCircle,
  Info,
  Clock,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useCareerEnrichment, useCareerNarratives } from '@/hooks/useEnrichment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InsightCardProps {
  versionId: string;
  enrichment?: any;
  narratives: any[];
  isLoading?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  versionId,
  enrichment: propEnrichment,
  narratives: propNarratives,
  isLoading: propIsLoading
}) => {
  const { toast } = useToast();
  const { data: enrichmentData, isLoading: enrichmentLoading, refetch: refetchEnrichment } = useCareerEnrichment(versionId);
  const { data: narrativesData, isLoading: narrativesLoading, refetch: refetchNarratives } = useCareerNarratives(versionId);

  // Use hook data if available, otherwise use props
  const enrichment = enrichmentData || propEnrichment;
  const narratives = narrativesData || propNarratives || [];
  const isLoading = propIsLoading || enrichmentLoading || narrativesLoading;

  console.log('InsightCard Debug:', {
    versionId,
    enrichmentData,
    enrichment,
    narrativesData,
    narratives,
    isLoading,
    enrichmentLoading,
    narrativesLoading
  });

  // Check enrichment status periodically
  useEffect(() => {
    if (!versionId) return;

    const checkEnrichmentStatus = async () => {
      try {
        console.log('Checking enrichment status for version:', versionId);
        
        // Check if enrichment exists
        const { data: enrichmentCheck, error: enrichmentError } = await supabase
          .from('career_enrichment')
          .select('*')
          .eq('resume_version_id', versionId)
          .maybeSingle();

        console.log('Enrichment check result:', { enrichmentCheck, enrichmentError });

        if (enrichmentCheck) {
          refetchEnrichment();
          refetchNarratives();
          return;
        }

        // Check resume version processing status
        const { data: versionData, error: versionError } = await supabase
          .from('resume_versions')
          .select('processing_status, created_at')
          .eq('id', versionId)
          .single();

        console.log('Version status:', { versionData, versionError });

        if (versionError) {
          console.error('Error checking version status:', versionError);
          toast({
            title: "Error",
            description: "Failed to check processing status",
            variant: "destructive",
          });
          return;
        }

        // If resume was uploaded recently and no enrichment exists, trigger it
        const uploadTime = new Date(versionData.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - uploadTime.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        if (minutesDiff < 5 && !enrichmentCheck) {
          console.log('Triggering enrichment for recent upload...');
          
          const { data: triggerResult, error: triggerError } = await supabase.functions.invoke('enrich-resume', {
            body: { versionId }
          });

          if (triggerError) {
            console.error('Error triggering enrichment:', triggerError);
            toast({
              title: "Processing Error",
              description: "Failed to start AI analysis. Please try refreshing the page.",
              variant: "destructive",
            });
          } else {
            console.log('Enrichment triggered successfully:', triggerResult);
          }
        }
      } catch (error) {
        console.error('Error in checkEnrichmentStatus:', error);
      }
    };

    // Check immediately
    checkEnrichmentStatus();

    // Set up polling for updates
    const interval = setInterval(checkEnrichmentStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [versionId, refetchEnrichment, refetchNarratives, toast]);

  // Show loading state
  if (isLoading || (!enrichment && !enrichmentData)) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating AI Career Insights...
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-blue-500" />
            Fast processing with OpenAI GPT-4o • Typically completes in 15-30 seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Analyzing work experience and skills
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Calculating professional capability scores
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Generating career narratives and recommendations
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if no enrichment data after loading
  if (!enrichment) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-4 h-4" />
            AI Career Insights
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Info className="w-3 h-3" />
            Processing your resume data
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Brain className="w-12 h-12 mx-auto text-amber-400 mb-4" />
          <p className="text-amber-700 mb-2 font-medium">
            AI insights are being generated
          </p>
          <p className="text-amber-600 text-sm">
            This process typically takes 15-30 seconds. Please wait or refresh the page if it takes longer.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  const careerSummary = narratives.find(n => n.narrative_type === 'career_summary');
  const keyStrengths = narratives.find(n => n.narrative_type === 'key_strengths');
  const growthTrajectory = narratives.find(n => n.narrative_type === 'growth_trajectory');

  return (
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
  );
};
