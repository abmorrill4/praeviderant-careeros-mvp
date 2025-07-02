import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Database, 
  GitMerge, 
  Settings, 
  BarChart3,
  Users,
  Activity,
  Filter,
  Shield,
  Bot
} from 'lucide-react';
import EntityGraphAdminUI from '@/components/admin/EntityGraphAdminUI';
import { TimelineAdminPanel } from '@/components/admin/TimelineAdminPanel';
import { SystemManagementModule } from '@/components/admin/modules/SystemManagementModule';
import { SecurityComplianceModule } from '@/components/admin/modules/SecurityComplianceModule';
import { AIContentModule } from '@/components/admin/modules/AIContentModule';
import { UserManagementModule } from '@/components/admin/modules/UserManagementModule';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useSystemHealth } from '@/hooks/useSystemHealth';

export const AdminContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('system');
  const adminMetrics = useAdminMetrics();
  const systemHealth = useSystemHealth();
  
  // Show authentication error if not logged in
  if (adminMetrics.error && adminMetrics.error.includes('JWT')) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Please log in to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-background border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Admin Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              System administration and management tools
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className={
                    systemHealth.overallStatus === 'healthy' 
                      ? "bg-green-50 text-green-700 border-green-200 cursor-help"
                      : systemHealth.overallStatus === 'warning'
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200 cursor-help"
                      : "bg-red-50 text-red-700 border-red-200 cursor-help"
                  }
                >
                  {systemHealth.loading 
                    ? 'Checking...' 
                    : systemHealth.overallStatus === 'healthy' 
                    ? 'System Operational'
                    : systemHealth.overallStatus === 'warning'
                    ? 'System Warning'
                    : 'System Error'
                  }
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                {systemHealth.loading ? (
                  <p>Running health checks...</p>
                ) : systemHealth.error ? (
                  <p className="text-destructive">Error: {systemHealth.error}</p>
                ) : (
                  <div className="space-y-1">
                    {systemHealth.healthChecks.map((check, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{check.name}:</span>
                        <span className={`text-sm ml-2 ${
                          check.status === 'healthy' ? 'text-green-600' : 
                          check.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {check.status} ({check.responseTime})
                          {check.details && <span className="block text-xs opacity-75">{check.details}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Data Overview Stats */}
      <div className="p-6 border-b bg-muted/20">
        {adminMetrics.loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">Loading metrics...</span>
          </div>
        ) : adminMetrics.error ? (
          <div className="text-center py-8 text-destructive">
            Error loading metrics: {adminMetrics.error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminMetrics.totalEntities.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{adminMetrics.unresolvedEntities}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Merged Today</CardTitle>
                <GitMerge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{adminMetrics.mergedToday}</div>
                <p className="text-xs text-muted-foreground">Automatic + manual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{adminMetrics.dataQualityScore}%</div>
                <p className="text-xs text-muted-foreground">Overall data quality</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="ai">AI & Content</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-6">
            <SystemManagementModule />
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <div className="space-y-6">
              <Tabs defaultValue="entities">
                <TabsList>
                  <TabsTrigger value="entities">Entity Graph</TabsTrigger>
                  <TabsTrigger value="timeline">Processing Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="entities" className="mt-4">
                  <EntityGraphAdminUI />
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Resume Processing Timeline
                      </CardTitle>
                      <CardDescription>
                        Monitor and manage resume processing workflows
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TimelineAdminPanel isAdmin={true} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecurityComplianceModule />
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <AIContentModule />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagementModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};