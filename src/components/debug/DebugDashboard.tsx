
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Play
} from 'lucide-react';
import { SystemStatusMonitor } from './SystemStatusMonitor';
import { ProcessingAnalytics } from './ProcessingAnalytics';
import { ErrorAnalysisPanel } from './ErrorAnalysisPanel';
import { PerformanceMetrics } from './PerformanceMetrics';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';
import { useEnrichResume } from '@/hooks/useEnrichment';

interface DebugDashboardProps {
  versionId?: string;
}

export const DebugDashboard: React.FC<DebugDashboardProps> = ({ versionId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: status, isLoading, error, refetch } = useEnrichmentStatus(versionId);
  const enrichResume = useEnrichResume();

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  const handleTriggerAnalysis = () => {
    if (versionId) {
      enrichResume.mutate(versionId);
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
          <h2 className="text-2xl font-bold">Debug Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive monitoring and debugging tools
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
                System Configuration
              </CardTitle>
              <CardDescription>
                System-wide settings and configuration details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Environment:</span>
                    <span className="ml-2">{process.env.NODE_ENV}</span>
                  </div>
                  <div>
                    <span className="font-medium">Version ID:</span>
                    <span className="ml-2 font-mono text-xs">
                      {versionId?.slice(-12) || 'None'}
                    </span>
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
