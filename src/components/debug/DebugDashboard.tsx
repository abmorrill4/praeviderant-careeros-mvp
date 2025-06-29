
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Database,
  Zap,
  Settings,
  BarChart3,
  Play,
  Shield,
  Search,
  Info
} from 'lucide-react';
import { SystemStatusMonitor } from './SystemStatusMonitor';
import { ProcessingAnalytics } from './ProcessingAnalytics';
import { ErrorAnalysisPanel } from './ErrorAnalysisPanel';
import { PerformanceMetrics } from './PerformanceMetrics';
import { FailureDetectionPanel } from './FailureDetectionPanel';
import { SchemaValidationPanel } from './SchemaValidationPanel';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';
import { useEnrichResume } from '@/hooks/useEnrichment';

interface DebugDashboardProps {
  versionId?: string;
}

export const DebugDashboard: React.FC<DebugDashboardProps> = ({ versionId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Enhanced parameter logging
  useEffect(() => {
    console.log('DebugDashboard - Props received:', {
      versionId,
      versionIdType: typeof versionId,
      versionIdLength: versionId?.length,
      isValidUUID: versionId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(versionId) : false,
      timestamp: new Date().toISOString()
    });
  }, [versionId]);

  const { data: status, isLoading, error, refetch } = useEnrichmentStatus(versionId);
  const enrichResume = useEnrichResume();

  // Enhanced status logging
  useEffect(() => {
    console.log('DebugDashboard - Status data:', {
      hasStatus: !!status,
      statusData: status,
      isLoading,
      hasError: !!error,
      errorMessage: error?.message,
      versionId,
      timestamp: new Date().toISOString()
    });
  }, [status, isLoading, error, versionId]);

  const handleRefresh = () => {
    console.log('DebugDashboard - Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  const handleTriggerAnalysis = () => {
    if (versionId) {
      console.log('DebugDashboard - Triggering analysis for:', versionId);
      enrichResume.mutate(versionId);
    } else {
      console.warn('DebugDashboard - Cannot trigger analysis: no valid versionId');
    }
  };

  const getSystemHealth = () => {
    if (!status) return { status: 'unknown', color: 'gray' };
    
    if (status.processingStage === 'failed') {
      return { status: 'critical', color: 'red' };
    }
    
    if (status.isComplete) {
      return { status: 'healthy', color: 'green' };
    }
    
    return { status: 'processing', color: 'yellow' };
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Debug Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive monitoring, failure detection, and system health analysis
          </p>
          {versionId && (
            <p className="text-xs font-mono text-gray-500 mt-1">
              Version ID: {versionId.slice(0, 8)}...{versionId.slice(-8)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            <Activity className="w-3 h-3" />
            System {systemHealth.status}
          </Badge>
          {versionId && (
            <Button 
              onClick={handleTriggerAnalysis} 
              variant="outline" 
              size="sm"
              disabled={enrichResume.isPending || status?.isComplete}
            >
              <Play className="w-4 h-4 mr-2" />
              {enrichResume.isPending ? 'Analyzing...' : 'Trigger Analysis'}
            </Button>
          )}
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Version ID Status Alert */}
      {!versionId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No specific resume version selected. Showing system-wide monitoring and general status.
            To debug a specific resume, navigate with a valid version ID.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Loading/Error States */}
      {versionId && isLoading && (
        <Alert>
          <Clock className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Loading status for version {versionId.slice(-12)}...
          </AlertDescription>
        </Alert>
      )}

      {versionId && error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load status: {error.message}
            <Button onClick={handleRefresh} variant="outline" size="sm" className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Status Overview */}
      {versionId && status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Entities</p>
                  <p className="text-xs text-muted-foreground">
                    {status.hasEntities ? 'Available' : 'Processing'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Enrichment</p>
                  <p className="text-xs text-muted-foreground">
                    {status.hasEnrichment ? 'Complete' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Narratives</p>
                  <p className="text-xs text-muted-foreground">
                    {status.hasNarratives ? 'Generated' : 'Pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <p className="text-xs text-muted-foreground">
                    {status.processingProgress}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="failures">Failures</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SystemStatusMonitor 
            versionId={versionId} 
            status={status}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <FailureDetectionPanel 
            versionId={versionId}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <SchemaValidationPanel />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ProcessingAnalytics 
            versionId={versionId}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <ErrorAnalysisPanel 
            versionId={versionId}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetrics 
            versionId={versionId}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Configuration & Health
              </CardTitle>
              <CardDescription>
                System-wide settings, configuration details, and operational status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Environment Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Environment:</span>
                    <span className="ml-2">{process.env.NODE_ENV}</span>
                  </div>
                  <div>
                    <span className="font-medium">Version ID:</span>
                    <span className="ml-2 font-mono text-xs">
                      {versionId ? `${versionId.slice(0, 8)}...${versionId.slice(-4)}` : 'None'}
                    </span>
                  </div>
                </div>

                {/* Parameter Debug Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">Parameter Debug Information</h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div>Raw versionId: <code>{versionId || 'undefined'}</code></div>
                    <div>Type: <code>{typeof versionId}</code></div>
                    <div>Valid UUID: <code>{versionId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(versionId).toString() : 'false'}</code></div>
                    <div>Current URL: <code>{window.location.pathname}</code></div>
                  </div>
                </div>

                {/* System Health Indicators */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">Health Indicators</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Database Connected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Auth Service</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Edge Functions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${versionId ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-sm">Version Context</span>
                    </div>
                  </div>
                </div>

                {/* Operational Metrics */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Operational Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Last Refresh:</span>
                      <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Refresh Interval:</span>
                      <span>30 seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debug Mode:</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Status Query:</span>
                      <Badge variant={status ? 'default' : 'secondary'}>
                        {status ? 'Success' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
