import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  GitMerge, 
  Settings, 
  BarChart3,
  FileText,
  Users,
  Activity,
  Filter
} from 'lucide-react';
import EntityGraphAdminUI from '@/components/admin/EntityGraphAdminUI';
import { TimelineAdminPanel } from '@/components/admin/TimelineAdminPanel';

export const DataManagementModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('entities');

  // Mock data statistics - replace with real data
  const dataStats = {
    totalEntities: 15420,
    unresolvedEntities: 234,
    mergedToday: 45,
    dataQualityScore: 94.2
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Data Management</h1>
        <p className="text-muted-foreground">
          Manage entity graphs, data normalization, and quality control
        </p>
      </div>

      {/* Data Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataStats.totalEntities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dataStats.unresolvedEntities}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merged Today</CardTitle>
            <GitMerge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dataStats.mergedToday}</div>
            <p className="text-xs text-muted-foreground">Automatic + manual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dataStats.dataQualityScore}%</div>
            <p className="text-xs text-muted-foreground">Overall data quality</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entities">Entity Graph</TabsTrigger>
          <TabsTrigger value="timeline">Processing Timeline</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="entities">
          {/* Use existing EntityGraphAdminUI but remove the tabs since we're managing them here */}
          <div className="space-y-6">
            <EntityGraphAdminUI />
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <div className="space-y-6">
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
          </div>
        </TabsContent>

        <TabsContent value="quality">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Data Quality Dashboard
                </CardTitle>
                <CardDescription>
                  Monitor data quality metrics and identify issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Data quality dashboard coming soon</p>
                  <p className="text-sm mt-2">Will include completeness, accuracy, and consistency metrics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Data Analytics
                </CardTitle>
                <CardDescription>
                  Insights and trends from your data processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics coming soon</p>
                  <p className="text-sm mt-2">Usage patterns, processing trends, and optimization insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};