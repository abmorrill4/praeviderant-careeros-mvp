
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Loader2, 
  CheckCircle, 
  FileText, 
  Sparkles,
  Clock,
  Users
} from 'lucide-react';
import type { EnrichmentStatus } from '@/hooks/useEnrichmentStatus';

interface EnrichmentProgressProps {
  status: EnrichmentStatus;
}

export const EnrichmentProgress: React.FC<EnrichmentProgressProps> = ({ status }) => {
  const getStageIcon = (stage: string, isActive: boolean, isComplete: boolean) => {
    if (isComplete) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isActive) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const stages = [
    {
      key: 'upload',
      label: 'Upload Complete',
      description: 'Resume file uploaded successfully',
      icon: FileText,
      isActive: status.currentStage === 'upload',
      isComplete: status.processingProgress >= 25
    },
    {
      key: 'parse',  
      label: 'Data Extraction',
      description: 'Parsing resume content and structure',
      icon: FileText,
      isActive: status.currentStage === 'parse',
      isComplete: status.hasEntities
    },
    {
      key: 'enrich',
      label: 'AI Analysis', 
      description: 'Analyzing career patterns and strengths',
      icon: Brain,
      isActive: status.currentStage === 'enrich',
      isComplete: status.hasEnrichment
    },
    {
      key: 'complete',
      label: 'Insights Generated',
      description: 'Creating personalized career narratives', 
      icon: Sparkles,
      isActive: status.currentStage === 'complete',
      isComplete: status.hasNarratives && status.isComplete
    }
  ];

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Brain className="w-5 h-5" />
          AI Analysis in Progress
        </CardTitle>
        <CardDescription>
          Please wait while we analyze your resume and generate personalized insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{status.processingProgress || 0}%</span>
          </div>
          <Progress value={status.processingProgress || 0} className="h-2" />
        </div>

        {/* Current Status */}
        <div className="flex items-center justify-center py-2">
          <div className="text-center space-y-1">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" />
            <p className="text-sm text-muted-foreground">
              Processing stage: {status.currentStage}
            </p>
          </div>
        </div>

        {/* Processing Stages */}
        <div className="space-y-3">
          {stages.map((stage) => (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStageIcon(stage.key, stage.isActive, stage.isComplete)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${
                  stage.isComplete ? 'text-green-700' : 
                  stage.isActive ? 'text-blue-700' : 
                  'text-gray-500'
                }`}>
                  {stage.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stage.description}
                </div>
                {stage.isActive && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-600">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status Footer */}
        <div className="pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Powered by OpenAI GPT-4o</span>
            <span>Typically completes in 30-60 seconds</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
