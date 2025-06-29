import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Zap,
  Settings,
  BarChart3,
  Play,
  Info,
  Loader2
} from 'lucide-react';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';
import { useEnrichResume } from '@/hooks/useEnrichment';

interface DebugDashboardProps {
  versionId: string;
}

export const DebugDashboard: React.FC<DebugDashboardProps> = ({ versionId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  console.log('DebugDashboard - Version ID:', versionId);
  console.log('DebugDashboard - Version ID type:', typeof versionId);
  console.log('DebugDashboard - Version ID length:', versionId?.length);

  const { data: status, isLoading, error, refetch } = useEnrichmentStatus(versionId);
  const enrichResume = useEnrichResume();

  const handleRefresh = () => {
    console.log('DebugDashboard - Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  const handleTriggerAnalysis = () => {
    console.log('DebugDashboard - Triggering analysis for:', versionId);
    console.log('DebugDashboard - versionId validation before trigger:', {
      versionId,
      type: typeof versionId,
      length: versionId?.length,
      isString: typeof versionId === 'string',
      isValid: versionId && typeof versionId === 'string' && versionId.length > 10
    });
    
    if (!versionId || typeof versionId !== 'string') {
      console.error('DebugDashboard - Invalid versionId for analysis trigger:', versionId);
      return;
    }
    
    enrichResume.mutate(versionId);
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

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading debug information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load debug information: {error.message}
            <Button onClick={handleRefresh} variant="outline" size="sm" className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resume Debug Dashboard</h2>
          <p className="text-muted-foreground">
            Processing monitoring and system health analysis
          </p>
          <p className="text-xs font-mono text-gray-500 mt-1">
            Version: {versionId.slice(0, 8)}...{versionId.slice(-8)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}
            className="flex items-center gap-1"
          >
            <Activity className="w-3 h-3" />
            System {systemHealth.status}
          </Badge>
          <Button 
            onClick={handleTriggerAnalysis} 
            variant="outline" 
            size="sm"
            disabled={enrichResume.isPending || status?.isComplete || !versionId}
          >
            <Play className="w-4 h-4 mr-2" />
            {enrichResume.isPending ? 'Analyzing...' : 'Trigger Analysis'}
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Show enrichment error if any */}
      {enrichResume.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Enrichment error: {enrichResume.error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Status Overview */}
      {status && (
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
                <Activity className="w-4 h-4 text-orange-500" />
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Overview</CardTitle>
              <CardDescription>Current state of resume processing pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              {status ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Current Stage</h4>
                      <Badge variant="outline">{status.currentStage}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium">Processing Status</h4>
                      <Badge variant={status.processingStatus === 'completed' ? 'default' : 'secondary'}>
                        {status.processingStatus}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium">Progress</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${status.processingProgress}%` }}
                          />
                        </div>
                        <span className="text-sm">{status.processingProgress}%</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Last Updated</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(status.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Processing Stages */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Processing Stages</h4>
                    <div className="space-y-2">
                      {status.stages && Object.entries(status.stages).map(([stage, stageData]: [string, any]) => (
                        <div key={stage} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              stageData?.status === 'completed' ? 'bg-green-500' :
                              stageData?.status === 'in_progress' ? 'bg-blue-500' :
                              stageData?.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                            }`} />
                            <span className="capitalize">{stage}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {stageData?.status || 'pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No processing data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Availability</CardTitle>
              <CardDescription>Status of processed data components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded">
                  <Database className="w-8 h-8 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Parsed Entities</h4>
                    <p className="text-sm text-muted-foreground">
                      {status?.hasEntities ? 'Available' : 'Not available'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded">
                  <Zap className="w-8 h-8 text-purple-500" />
                  <div>
                    <h4 className="font-medium">Career Enrichment</h4>
                    <p className="text-sm text-muted-foreground">
                      {status?.hasEnrichment ? 'Available' : 'Not available'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded">
                  <BarChart3 className="w-8 h-8 text-green-500" />
                  <div>
                    <h4 className="font-medium">Career Narratives</h4>
                    <p className="text-sm text-muted-foreground">
                      {status?.hasNarratives ? 'Available' : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Status
              </CardTitle>
              <CardDescription>
                System health and operational metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* System Health */}
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
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Processing Pipeline</span>
                  </div>
                </div>

                {/* Status Metrics */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Resume Version:</span>
                      <span className="font-mono text-xs">{versionId.slice(-12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Refresh:</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Stage:</span>
                      <Badge variant="outline">
                        {status?.processingStage || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>System Health:</span>
                      <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                        {systemHealth.status}
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
