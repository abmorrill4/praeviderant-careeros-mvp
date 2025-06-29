
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  XCircle, 
  Info, 
  RefreshCw,
  Bug,
  AlertCircle,
  Download,
  Copy
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LogDumpModal } from './LogDumpModal';
import { useToast } from '@/hooks/use-toast';

interface ErrorAnalysisPanelProps {
  versionId?: string;
  refreshTrigger: number;
}

interface ErrorData {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stage: string;
  timestamp: string;
  metadata?: any;
}

export const ErrorAnalysisPanel: React.FC<ErrorAnalysisPanelProps> = ({
  versionId,
  refreshTrigger
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logDumpOpen, setLogDumpOpen] = useState(false);

  const { data: errors, isLoading, refetch } = useQuery({
    queryKey: ['error-analysis', versionId, user?.id, refreshTrigger],
    queryFn: async (): Promise<ErrorData[]> => {
      if (!user) return [];

      // Get error logs from job_logs table
      const { data: logs, error } = await supabase
        .from('job_logs')
        .select('*')
        .in('level', ['error', 'warn', 'info', 'debug'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return logs?.map(log => ({
        id: log.id,
        level: log.level as 'error' | 'warn' | 'info',
        message: log.message,
        stage: log.stage,
        timestamp: log.created_at,
        metadata: log.metadata
      })) || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    refetch();
  };

  const getErrorIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getErrorBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      default: return 'outline';
    }
  };

  const getCommonSolutions = (message: string) => {
    const solutions = [];
    
    if (message.includes('JSON')) {
      solutions.push('Check for malformed JSON in request/response data');
    }
    if (message.includes('timeout') || message.includes('timeout')) {
      solutions.push('Increase timeout limits or check network connectivity');
    }
    if (message.includes('OpenAI') || message.includes('API')) {
      solutions.push('Verify API credentials and rate limits');
    }
    if (message.includes('database') || message.includes('SQL')) {
      solutions.push('Check database connectivity and query syntax');
    }
    if (message.includes('file') || message.includes('upload')) {
      solutions.push('Verify file format and size limits');
    }
    
    return solutions;
  };

  const errorCounts = {
    total: errors?.length || 0,
    errors: errors?.filter(e => e.level === 'error').length || 0,
    warnings: errors?.filter(e => e.level === 'warn').length || 0
  };

  // Check if there are any failures that should trigger log dump
  const hasFailures = errors?.some(e => e.level === 'error') || false;
  const failedStage = errors?.find(e => e.level === 'error')?.stage;

  const handleCopyErrorLogs = async () => {
    if (!errors || errors.length === 0) return;

    const errorLogs = errors.filter(e => e.level === 'error');
    const logText = errorLogs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.stage}] ${log.message}`
    ).join('\n');

    try {
      await navigator.clipboard.writeText(logText);
      toast({
        title: "Error logs copied",
        description: "Error logs have been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy logs to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{errorCounts.total}</p>
                <p className="text-xs text-muted-foreground">Total Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{errorCounts.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{errorCounts.warnings}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failure Alert with Log Dump */}
      {hasFailures && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Processing Failure Detected</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-3">
              <p>
                The resume processing failed at stage: <strong>{failedStage}</strong>. 
                Complete diagnostic logs are available for troubleshooting.
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setLogDumpOpen(true)} 
                  variant="outline" 
                  size="sm"
                  className="bg-background"
                >
                  <Download className="w-4 h-4 mr-2" />
                  View Full Log Dump
                </Button>
                <Button 
                  onClick={handleCopyErrorLogs} 
                  variant="outline" 
                  size="sm"
                  className="bg-background"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Error Logs
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Recent Issues
              </CardTitle>
              <CardDescription>
                Error logs and warnings from the processing pipeline
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading error logs...</p>
            </div>
          ) : errors && errors.length > 0 ? (
            <div className="space-y-4">
              {errors.slice(0, 10).map((error) => (
                <Alert key={error.id} variant={error.level === 'error' ? 'destructive' : 'default'}>
                  <div className="flex items-start gap-3 w-full">
                    {getErrorIcon(error.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTitle className="text-sm">
                          {error.stage.charAt(0).toUpperCase() + error.stage.slice(1)} Stage
                        </AlertTitle>
                        <Badge variant={getErrorBadgeVariant(error.level)} className="text-xs">
                          {error.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <AlertDescription className="text-sm mb-2">
                        {error.message}
                      </AlertDescription>
                      
                      {/* Common Solutions */}
                      {getCommonSolutions(error.message).length > 0 && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                          <p className="font-medium mb-1">Possible Solutions:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {getCommonSolutions(error.message).map((solution, index) => (
                              <li key={index}>{solution}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Technical Details */}
                      {error.metadata && Object.keys(error.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                            Technical Details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                            {JSON.stringify(error.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}

              {errors.length > 10 && (
                <div className="text-center py-4 border-t">
                  <Button 
                    onClick={() => setLogDumpOpen(true)} 
                    variant="outline" 
                    size="sm"
                  >
                    View All {errors.length} Logs
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-700 mb-2">No Issues Found</h3>
              <p className="text-muted-foreground">
                All systems are running smoothly. No errors or warnings detected.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Dump Modal */}
      <LogDumpModal
        isOpen={logDumpOpen}
        onClose={() => setLogDumpOpen(false)}
        logs={errors || []}
        failedStage={failedStage}
        versionId={versionId}
      />
    </div>
  );
};
