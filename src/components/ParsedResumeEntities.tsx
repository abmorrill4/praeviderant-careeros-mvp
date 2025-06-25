
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useParsedResumeEntities } from '@/hooks/useResumeStreams';

interface ParsedResumeEntitiesProps {
  versionId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export const ParsedResumeEntities: React.FC<ParsedResumeEntitiesProps> = ({
  versionId,
  processingStatus
}) => {
  const { data: entities, isLoading, error } = useParsedResumeEntities(versionId);

  const getStatusIcon = () => {
    switch (processingStatus) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (processingStatus) {
      case 'pending':
        return 'Processing queued';
      case 'processing':
        return 'Extracting data...';
      case 'completed':
        return 'Processing complete';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const groupedEntities = entities?.reduce((groups, entity) => {
    const key = entity.field_name;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entity);
    return groups;
  }, {} as Record<string, typeof entities>) || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Parsed Resume Entities
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {getStatusIcon()}
          {getStatusText()}
          {entities && entities.length > 0 && (
            <span className="ml-2">• {entities.length} data points extracted</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading parsed data...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 py-4">
            <XCircle className="w-5 h-5" />
            <span>Error loading parsed entities</span>
          </div>
        ) : !entities || entities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              {processingStatus === 'pending' || processingStatus === 'processing' ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing resume data...</span>
                </div>
              ) : processingStatus === 'failed' ? (
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span>Failed to process resume</span>
                </div>
              ) : (
                'No entities extracted yet'
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEntities).map(([fieldName, fieldEntities]) => (
              <div key={fieldName}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-medium capitalize">
                    {fieldName.replace(/_/g, ' ')}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {fieldEntities.length} value{fieldEntities.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-2 ml-4">
                  {fieldEntities.map((entity) => (
                    <div key={entity.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm">{entity.raw_value}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={entity.confidence_score > 0.8 ? "default" : entity.confidence_score > 0.6 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {Math.round(entity.confidence_score * 100)}% confidence
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {entity.source_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(groupedEntities).indexOf(fieldName) < Object.keys(groupedEntities).length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
