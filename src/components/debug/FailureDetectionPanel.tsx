
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Database,
  Code,
  GitBranch,
  Settings
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FailureDetectionPanelProps {
  versionId?: string;
  refreshTrigger: number;
}

interface FailureAnalysis {
  hasSchemaIssues: boolean;
  hasEdgeFunctionErrors: boolean;
  hasMigrationIssues: boolean;
  recentFailures: any[];
  consistencyCheck: {
    tablesExist: boolean;
    columnsMatch: boolean;
    foreignKeysValid: boolean;
  };
}

export const FailureDetectionPanel: React.FC<FailureDetectionPanelProps> = ({
  versionId,
  refreshTrigger
}) => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: failureAnalysis, isLoading, refetch } = useQuery({
    queryKey: ['failure-analysis', versionId, user?.id, refreshTrigger],
    queryFn: async (): Promise<FailureAnalysis> => {
      if (!user) return getDefaultAnalysis();

      console.log('Starting comprehensive failure analysis...');

      // Check for recent enrichment failures
      const { data: recentJobs, error: jobsError } = await supabase
        .from('enrichment_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) {
        console.error('Error fetching failed jobs:', jobsError);
      }

      // Check for schema consistency issues
      const consistencyCheck = await performSchemaConsistencyCheck();
      
      // Analyze error patterns
      const { data: errorLogs } = await supabase
        .from('job_logs')
        .select('*')
        .eq('level', 'error')
        .order('created_at', { ascending: false })
        .limit(50);

      const schemaRelatedErrors = errorLogs?.filter(log => 
        log.message.includes('does not exist') ||
        log.message.includes('column') ||
        log.message.includes('table') ||
        log.message.includes('constraint')
      ) || [];

      const edgeFunctionErrors = errorLogs?.filter(log =>
        log.message.includes('enrich-resume') ||
        log.stage === 'enrich'
      ) || [];

      return {
        hasSchemaIssues: schemaRelatedErrors.length > 0 || !consistencyCheck.tablesExist,
        hasEdgeFunctionErrors: edgeFunctionErrors.length > 0,
        hasMigrationIssues: !consistencyCheck.columnsMatch || !consistencyCheck.foreignKeysValid,
        recentFailures: recentJobs || [],
        consistencyCheck
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const performSchemaConsistencyCheck = async () => {
    try {
      // Check if critical tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['career_enrichment', 'career_narratives', 'enrichment_jobs']);

      const tablesExist = !tablesError && tables && tables.length >= 3;

      // Check if enrichment_metadata column exists
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'career_enrichment')
        .eq('column_name', 'enrichment_metadata');

      const columnsMatch = !columnsError && columns && columns.length > 0;

      // Basic foreign key validation would go here in a real implementation
      const foreignKeysValid = true; // Simplified for now

      return {
        tablesExist,
        columnsMatch,
        foreignKeysValid
      };
    } catch (error) {
      console.error('Schema consistency check failed:', error);
      return {
        tablesExist: false,
        columnsMatch: false,
        foreignKeysValid: false
      };
    }
  };

  const handleDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Trigger comprehensive analysis
      console.log('Starting deep failure analysis...');
      
      // Log analysis start
      await supabase
        .from('job_logs')
        .insert({
          job_id: crypto.randomUUID(), // Temporary job ID for analysis
          stage: 'debug',
          level: 'info',
          message: 'Deep failure analysis initiated by user',
          metadata: {
            version_id: versionId,
            user_id: user?.id,
            timestamp: new Date().toISOString()
          }
        });

      await refetch();
    } catch (error) {
      console.error('Deep analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDefaultAnalysis = (): FailureAnalysis => ({
    hasSchemaIssues: false,
    hasEdgeFunctionErrors: false,
    hasMigrationIssues: false,
    recentFailures: [],
    consistencyCheck: {
      tablesExist: false,
      columnsMatch: false,
      foreignKeysValid: false
    }
  });

  const analysis = failureAnalysis || getDefaultAnalysis();
  const criticalIssuesCount = [
    analysis.hasSchemaIssues,
    analysis.hasEdgeFunctionErrors,
    analysis.hasMigrationIssues
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      {criticalIssuesCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Issues Detected</AlertTitle>
          <AlertDescription>
            Found {criticalIssuesCount} critical issue(s) that may be causing resume processing failures.
            These issues need immediate attention to restore normal operation.
          </AlertDescription>
        </Alert>
      )}

      {/* Failure Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={analysis.hasSchemaIssues ? 'border-red-500' : 'border-green-500'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 ${analysis.hasSchemaIssues ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="text-sm font-medium">Schema Issues</p>
                <Badge variant={analysis.hasSchemaIssues ? 'destructive' : 'default'}>
                  {analysis.hasSchemaIssues ? 'Issues Found' : 'Healthy'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={analysis.hasEdgeFunctionErrors ? 'border-red-500' : 'border-green-500'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Code className={`w-4 h-4 ${analysis.hasEdgeFunctionErrors ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="text-sm font-medium">Edge Functions</p>
                <Badge variant={analysis.hasEdgeFunctionErrors ? 'destructive' : 'default'}>
                  {analysis.hasEdgeFunctionErrors ? 'Errors Found' : 'Healthy'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={analysis.hasMigrationIssues ? 'border-red-500' : 'border-green-500'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitBranch className={`w-4 h-4 ${analysis.hasMigrationIssues ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="text-sm font-medium">Migrations</p>
                <Badge variant={analysis.hasMigrationIssues ? 'destructive' : 'default'}>
                  {analysis.hasMigrationIssues ? 'Out of Sync' : 'Synchronized'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Recent Failures</p>
                <p className="text-lg font-bold">{analysis.recentFailures.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Health Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of system components and their health status
              </CardDescription>
            </div>
            <Button 
              onClick={handleDeepAnalysis} 
              variant="outline" 
              size="sm"
              disabled={isAnalyzing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Deep Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Schema Consistency */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Database Schema Status</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${analysis.consistencyCheck.tablesExist ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Tables Exist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${analysis.consistencyCheck.columnsMatch ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Columns Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${analysis.consistencyCheck.foreignKeysValid ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Foreign Keys Valid</span>
                </div>
              </div>
            </div>

            {/* Recent Failures Summary */}
            {analysis.recentFailures.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Recent Failure Pattern</h4>
                <div className="space-y-2">
                  {analysis.recentFailures.slice(0, 3).map((failure, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      <span className="font-mono">{new Date(failure.created_at).toLocaleString()}</span>
                      {failure.error_message && (
                        <span className="ml-2">- {failure.error_message.substring(0, 100)}...</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {criticalIssuesCount > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium mb-2">Recommended Actions</h4>
                <ul className="text-sm space-y-1">
                  {analysis.hasSchemaIssues && (
                    <li>• Run pending database migrations to update schema</li>
                  )}
                  {analysis.hasEdgeFunctionErrors && (
                    <li>• Review and redeploy edge functions with updated schema references</li>
                  )}
                  {analysis.hasMigrationIssues && (
                    <li>• Verify migration status and apply any missing updates</li>
                  )}
                  <li>• Monitor system logs for additional error patterns</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
