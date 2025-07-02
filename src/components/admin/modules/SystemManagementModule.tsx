import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Activity, 
  Server, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings
} from 'lucide-react';
import { SystemStatusMonitor } from '@/components/debug/SystemStatusMonitor';
import { PerformanceMetrics } from '@/components/debug/PerformanceMetrics';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';

export const SystemManagementModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const systemHealth = useSystemHealth();
  const adminMetrics = useAdminMetrics();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">System Management</h1>
        <p className="text-muted-foreground">
          Monitor system health, performance metrics, and configuration
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {adminMetrics.loading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">{adminMetrics.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">Registered users</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {adminMetrics.loading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{adminMetrics.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {adminMetrics.loading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{adminMetrics.errorRate}%</div>
                    <p className="text-xs text-muted-foreground">Processing failures</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Health Checks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Service Health Checks
              </CardTitle>
              <CardDescription>
                Real-time status of core system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth.loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2 text-muted-foreground">Checking system health...</span>
                </div>
              ) : systemHealth.error ? (
                <div className="text-center py-8 text-destructive">
                  Error: {systemHealth.error}
                </div>
              ) : (
                <div className="space-y-3">
                  {systemHealth.healthChecks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <p className="font-medium">{check.name}</p>
                          <p className="text-sm text-muted-foreground">Response: {check.responseTime}</p>
                          {check.details && (
                            <p className="text-xs text-muted-foreground">{check.details}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(check.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common system administration tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Settings className="w-6 h-6" />
                  <span>System Config</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Activity className="w-6 h-6" />
                  <span>Health Check</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <AlertTriangle className="w-6 h-6" />
                  <span>View Alerts</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <SystemStatusMonitor refreshTrigger={0} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetrics refreshTrigger={0} />
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Manage system-wide settings and parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configuration management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};