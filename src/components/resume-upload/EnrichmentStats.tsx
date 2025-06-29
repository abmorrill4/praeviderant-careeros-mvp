
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle, Clock } from 'lucide-react';
import { useEnrichmentStats } from '@/hooks/useEntryEnrichment';

interface EnrichmentStatsProps {
  versionId: string;
}

export const EnrichmentStats: React.FC<EnrichmentStatsProps> = ({ versionId }) => {
  const { data: stats, isLoading } = useEnrichmentStats(versionId);

  if (isLoading || !stats) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading enrichment stats...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { total_entities, enriched_entities, enrichment_percentage } = stats;
  
  if (total_entities === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-muted-foreground">No entities found for enrichment</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isComplete = enrichment_percentage === 100;

  return (
    <Card className={`border-l-4 ${isComplete ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500 bg-blue-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <Brain className="w-4 h-4 text-blue-500" />
          )}
          AI Enrichment Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {enriched_entities} of {total_entities} entries enriched
          </span>
          <span className="font-medium">
            {enrichment_percentage}%
          </span>
        </div>
        <Progress 
          value={enrichment_percentage} 
          className={`h-2 ${isComplete ? 'bg-green-100' : 'bg-blue-100'}`}
        />
        {isComplete && (
          <div className="text-xs text-green-600 font-medium">
            ✓ All work and education entries have been analyzed
          </div>
        )}
      </CardContent>
    </Card>
  );
};
