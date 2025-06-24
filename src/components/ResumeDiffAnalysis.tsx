
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Brain, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  GitCompare,
  Eye,
  EyeOff
} from 'lucide-react';
import { useResumeDiffs, useSemanticDiffAnalysis, useConfirmProfileEntity } from '@/hooks/useResumeDiffs';
import type { ResumeDiff } from '@/types/resume-diffs';

interface ResumeDiffAnalysisProps {
  versionId: string;
  onToggleVisibility?: () => void;
  isVisible?: boolean;
}

export const ResumeDiffAnalysis: React.FC<ResumeDiffAnalysisProps> = ({
  versionId,
  onToggleVisibility,
  isVisible = true
}) => {
  const { data: diffs, isLoading, refetch } = useResumeDiffs(versionId);
  const diffAnalysisMutation = useSemanticDiffAnalysis();
  const confirmEntityMutation = useConfirmProfileEntity();

  const handleAnalyze = () => {
    diffAnalysisMutation.mutate(versionId);
  };

  const handleConfirmEntity = async (diff: ResumeDiff, confirmedValue: string) => {
    if (!diff.profile_entity_type || !diff.profile_entity_id) return;
    
    await confirmEntityMutation.mutateAsync({
      entityType: diff.profile_entity_type,
      entityId: diff.profile_entity_id,
      fieldName: 'confirmed_value', // This would be more specific in real implementation
      confirmedValue,
    });
  };

  const getDiffTypeColor = (diffType: ResumeDiff['diff_type']) => {
    switch (diffType) {
      case 'identical': return 'bg-green-100 text-green-800';
      case 'equivalent': return 'bg-blue-100 text-blue-800';
      case 'conflicting': return 'bg-red-100 text-red-800';
      case 'new': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDiffIcon = (diffType: ResumeDiff['diff_type']) => {
    switch (diffType) {
      case 'identical': return <CheckCircle className="w-4 h-4" />;
      case 'equivalent': return <GitCompare className="w-4 h-4" />;
      case 'conflicting': return <AlertTriangle className="w-4 h-4" />;
      case 'new': return <Plus className="w-4 h-4" />;
      default: return null;
    }
  };

  const summary = React.useMemo(() => {
    if (!diffs) return null;
    
    return {
      total: diffs.length,
      identical: diffs.filter(d => d.diff_type === 'identical').length,
      equivalent: diffs.filter(d => d.diff_type === 'equivalent').length,
      conflicting: diffs.filter(d => d.diff_type === 'conflicting').length,
      new: diffs.filter(d => d.diff_type === 'new').length,
      requiresReview: diffs.filter(d => d.requires_review).length,
    };
  }, [diffs]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading semantic analysis...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Semantic Diff Analysis
              {summary && (
                <Badge variant="outline" className="ml-2">
                  {summary.total} comparisons
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered comparison between resume data and your confirmed profile
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onToggleVisibility && (
              <Button variant="ghost" size="sm" onClick={onToggleVisibility}>
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAnalyze}
              disabled={diffAnalysisMutation.isPending}
            >
              {diffAnalysisMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-6">
          {!diffs || diffs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No semantic analysis available yet. Click "Analyze" to compare this resume with your profile.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.identical}</div>
                    <div className="text-sm text-muted-foreground">Identical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.equivalent}</div>
                    <div className="text-sm text-muted-foreground">Equivalent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.conflicting}</div>
                    <div className="text-sm text-muted-foreground">Conflicting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{summary.new}</div>
                    <div className="text-sm text-muted-foreground">New</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{summary.requiresReview}</div>
                    <div className="text-sm text-muted-foreground">Need Review</div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Diff Details */}
              <div className="space-y-4">
                <h3 className="font-medium">Detailed Comparisons</h3>
                {diffs.map((diff) => (
                  <div 
                    key={diff.id} 
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDiffIcon(diff.diff_type)}
                        <Badge className={getDiffTypeColor(diff.diff_type)}>
                          {diff.diff_type.toUpperCase()}
                        </Badge>
                        {diff.profile_entity_type && (
                          <Badge variant="outline">
                            {diff.profile_entity_type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {Math.round(diff.similarity_score * 100)}% similar
                        </Badge>
                        <Badge variant="secondary">
                          {Math.round(diff.confidence_score * 100)}% confidence
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {diff.justification}
                      </p>
                      
                      {diff.requires_review && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            This comparison requires manual review
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress bars for scores */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20">Similarity:</span>
                        <Progress 
                          value={diff.similarity_score * 100} 
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(diff.similarity_score * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20">Confidence:</span>
                        <Progress 
                          value={diff.confidence_score * 100} 
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(diff.confidence_score * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(diffs[0]?.updated_at).toLocaleString()}
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
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};
