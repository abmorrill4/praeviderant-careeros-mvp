
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  Database,
  Zap,
  FileText,
  Sparkles
} from 'lucide-react';
import { EnrichmentStatus } from '@/hooks/useEnrichmentStatus';
import { useCareerEnrichment, useCareerNarratives } from '@/hooks/useEnrichment';

interface SystemStatusMonitorProps {
  versionId?: string;
  status?: EnrichmentStatus | null;
  refreshTrigger: number;
}

export const SystemStatusMonitor: React.FC<SystemStatusMonitorProps> = ({
  versionId,
  status,
  refreshTrigger
}) => {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { data: enrichment } = useCareerEnrichment(versionId);
  const { data: narratives } = useCareerNarratives(versionId);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [refreshTrigger, status]);

  const getStageIcon = (stage: string, isComplete: boolean, isActive: boolean) => {
    if (isComplete) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isActive) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStageStatus = (stage: string) => {
    if (!status) return { isComplete: false, isActive: false };
    
    switch (stage) {
      case 'parsing':
        return {
          isComplete: status.hasEntities,
          isActive: status.processingStage === 'parsing'
        };
      case 'enriching':
        return {
          isComplete: status.hasEnrichment,
          isActive: status.processingStage === 'enriching'
        };
      case 'narratives':
        return {
          isComplete: status.hasNarratives,
          isActive: status.processingStage === 'enriching' && status.hasEnrichment
        };
      default:
        return { isComplete: false, isActive: false };
    }
  };

  const stages = [
    {
      id: 'parsing',
      name: 'Data Extraction',
      description: 'Extracting structured data from resume',
      icon: Database,
      ...getStageStatus('parsing')
    },
    {
      id: 'enriching',
      name: 'AI Analysis',
      description: 'Analyzing career patterns and strengths',
      icon: Zap,
      ...getStageStatus('enriching')
    },
    {
      id: 'narratives',
      name: 'Narrative Generation',
      description: 'Creating personalized career narratives',
      icon: Sparkles,
      ...getStageStatus('narratives')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Processing Pipeline Status
            <Badge variant="outline" className="text-xs">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time monitoring of the resume processing pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{status.processingProgress}%</span>
              </div>
              <Progress value={status.processingProgress} className="h-2" />
            </div>
          )}

          {status?.processingStage === 'failed' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Processing failed. Check the error analysis tab for details.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Stage Details */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Stages</CardTitle>
          <CardDescription>
            Detailed breakdown of each processing stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-start gap-4 p-3 rounded-lg border">
                <div className="flex-shrink-0 mt-0.5">
                  {getStageIcon(stage.id, stage.isComplete, stage.isActive)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <stage.icon className="w-4 h-4" />
                    <h4 className="font-medium">{stage.name}</h4>
                    <Badge 
                      variant={stage.isComplete ? 'default' : stage.isActive ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {stage.isComplete ? 'Complete' : stage.isActive ? 'Processing' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
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
        </CardContent>
      </Card>

      {/* Data Summary */}
      {(enrichment || narratives) && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content Summary</CardTitle>
            <CardDescription>
              Overview of AI-generated insights and content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrichment && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Role Archetype:</span>
                  <span className="ml-2">{enrichment.role_archetype}</span>
                </div>
                <div>
                  <span className="font-medium">Persona Type:</span>
                  <span className="ml-2">{enrichment.persona_type}</span>
                </div>
                <div>
                  <span className="font-medium">Leadership Score:</span>
                  <span className="ml-2">{enrichment.leadership_score}/100</span>
                </div>
                <div>
                  <span className="font-medium">Technical Depth:</span>
                  <span className="ml-2">{enrichment.technical_depth_score}/100</span>
                </div>
              </div>
            )}
            
            {narratives && narratives.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Generated Narratives:</h5>
                <div className="flex flex-wrap gap-2">
                  {narratives.map((narrative) => (
                    <Badge key={narrative.id} variant="outline" className="capitalize">
                      {narrative.narrative_type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && status && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Technical details for debugging (development only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify({
                versionId: versionId?.slice(-12),
                processingStage: status.processingStage,
                hasEntities: status.hasEntities,
                hasEnrichment: status.hasEnrichment,
                hasNarratives: status.hasNarratives,
                isComplete: status.isComplete,
                lastUpdated: status.lastUpdated
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
