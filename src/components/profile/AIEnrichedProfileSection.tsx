
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Sparkles,
  Award,
  Users,
  Lightbulb
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EnrichmentData {
  role_archetype: string;
  persona_type: string;
  leadership_score: number;
  technical_depth_score: number;
  scope_score: number;
  role_archetype_explanation: string;
  persona_explanation: string;
  leadership_explanation: string;
  technical_depth_explanation: string;
  scope_explanation: string;
}

interface NarrativeData {
  narrative_type: string;
  narrative_text: string;
}

export const AIEnrichedProfileSection: React.FC = () => {
  const { user } = useAuth();

  const { data: enrichment, isLoading: loadingEnrichment } = useQuery({
    queryKey: ['career-enrichment', user?.id],
    queryFn: async (): Promise<EnrichmentData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('career_enrichment')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: narratives, isLoading: loadingNarratives } = useQuery({
    queryKey: ['career-narratives', user?.id],
    queryFn: async (): Promise<NarrativeData[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('career_narratives')
        .select('narrative_type, narrative_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  if (loadingEnrichment || loadingNarratives) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
            AI Career Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!enrichment && (!narratives || narratives.length === 0)) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-muted-foreground" />
            AI Career Analysis
          </CardTitle>
          <CardDescription>
            Upload a resume to get AI-powered career insights and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No AI analysis available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Career Analysis */}
      {enrichment && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Career Analysis
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of your professional profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Archetype & Persona */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Role Archetype</span>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {enrichment.role_archetype}
                </Badge>
                {enrichment.role_archetype_explanation && (
                  <p className="text-sm text-muted-foreground">
                    {enrichment.role_archetype_explanation}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Persona Type</span>
                </div>
                <Badge variant="outline" className="text-sm">
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

            {/* Skill Scores */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Professional Metrics
              </h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Leadership Score</span>
                    <span className="text-sm font-semibold">{enrichment.leadership_score}/100</span>
                  </div>
                  <Progress value={enrichment.leadership_score} className="h-2" />
                  {enrichment.leadership_explanation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {enrichment.leadership_explanation}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Technical Depth</span>
                    <span className="text-sm font-semibold">{enrichment.technical_depth_score}/100</span>
                  </div>
                  <Progress value={enrichment.technical_depth_score} className="h-2" />
                  {enrichment.technical_depth_explanation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {enrichment.technical_depth_explanation}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Scope & Impact</span>
                    <span className="text-sm font-semibold">{enrichment.scope_score}/100</span>
                  </div>
                  <Progress value={enrichment.scope_score} className="h-2" />
                  {enrichment.scope_explanation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {enrichment.scope_explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Generated Narratives */}
      {narratives && narratives.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-orange-500" />
              AI Career Narratives
            </CardTitle>
            <CardDescription>
              Personalized career stories and positioning statements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {narratives.map((narrative, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  <Badge variant="outline" className="capitalize">
                    {narrative.narrative_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {narrative.narrative_text}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
