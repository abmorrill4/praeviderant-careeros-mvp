
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle, 
  FileText, 
  Brain, 
  Sparkles,
  Clock,
  AlertCircle
} from 'lucide-react';
import { EnrichmentStatus } from '@/hooks/useEnrichmentStatus';

interface EnrichmentProgressProps {
  status: EnrichmentStatus;
}

export const EnrichmentProgress: React.FC<EnrichmentProgressProps> = ({ status }) => {
  const getProgressValue = () => {
    // More accurate progress calculation
    if (status.isComplete && status.hasNarratives) return 100;
    if (status.hasEnrichment && status.hasNarratives) return 90;
    if (status.hasEnrichment) return 70;
    if (status.hasEntities) return 40;
    if (status.processingStage === 'parsing') return 20;
    return 10;
  };

  const getStageIcon = (stage: string, isActive: boolean, isComplete: boolean) => {
    if (isComplete) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isActive) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStageColor = (stage: string, isActive: boolean, isComplete: boolean) => {
    if (isComplete) return 'text-green-700';
    if (isActive) return 'text-blue-700';
    return 'text-gray-500';
  };

  const stages = [
    {
      key: 'parsing',
      label: 'Extracting Data',
      description: 'Parsing resume content and structure',
      icon: FileText,
      isActive: status.processingStage === 'parsing' || (!status.hasEntities && status.processingStage !== 'failed'),
      isComplete: status.hasEntities
    },
    {
      key: 'enriching',
      label: 'AI Analysis',
      description: 'Analyzing career patterns and strengths',
      icon: Brain,
      isActive: status.hasEntities && !status.hasEnrichment && status.processingStage !== 'failed',
      isComplete: status.hasEnrichment
    },
    {
      key: 'narratives',
      label: 'Generating Insights',
      description: 'Creating personalized career narratives',
      icon: Sparkles,
      isActive: status.hasEnrichment && !status.hasNarratives && status.processingStage !== 'failed',
      isComplete: status.hasNarratives
    }
  ];

  const progressValue = getProgressValue();
  const overallStatus = status.isComplete ? 'Complete' : 
                       status.processingStage === 'failed' ? 'Failed' : 'Processing';

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Career Analysis in Progress
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Processing your resume through our AI pipeline</span>
          <Badge variant="outline" className="text-xs">
            {overallStatus}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Stage Details */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStageIcon(stage.key, stage.isActive, stage.isComplete)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${getStageColor(stage.key, stage.isActive, stage.isComplete)}`}>
                  {stage.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stage.description}
                </div>
                {stage.isActive && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <strong>Debug Info:</strong>
            <div>Processing Stage: {status.processingStage}</div>
            <div>Has Entities: {status.hasEntities ? 'Yes' : 'No'}</div>
            <div>Has Enrichment: {status.hasEnrichment ? 'Yes' : 'No'}</div>
            <div>Has Narratives: {status.hasNarratives ? 'Yes' : 'No'}</div>
            <div>Is Complete: {status.isComplete ? 'Yes' : 'No'}</div>
          </div>
        )}

        {/* Status Footer */}
        <div className="pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Powered by OpenAI GPT-4o</span>
            <span>Typically completes in 30-60 seconds</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
