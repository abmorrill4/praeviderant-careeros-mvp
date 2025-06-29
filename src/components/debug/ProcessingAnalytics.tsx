
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProcessingAnalyticsProps {
  versionId?: string;
  refreshTrigger: number;
}

interface ProcessingMetrics {
  totalProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  stageBreakdown: {
    parsing: number;
    enriching: number;
    complete: number;
    failed: number;
  };
  recentActivity: Array<{
    id: string;
    stage: string;
    status: string;
    timestamp: string;
  }>;
}

export const ProcessingAnalytics: React.FC<ProcessingAnalyticsProps> = ({
  versionId,
  refreshTrigger
}) => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('24h');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['processing-analytics', user?.id, timeRange, refreshTrigger],
    queryFn: async (): Promise<ProcessingMetrics> => {
      if (!user) throw new Error('User not authenticated');

      // Get recent resume versions
      const { data: versions, error } = await supabase
        .from('resume_versions')
        .select(`
          id,
          processing_status,
          current_stage,
          created_at,
          updated_at,
          resume_streams!inner(user_id)
        `)
        .eq('resume_streams.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate metrics
      const totalProcessed = versions?.length || 0;
      const completed = versions?.filter(v => v.processing_status === 'completed').length || 0;
      const successRate = totalProcessed > 0 ? (completed / totalProcessed) * 100 : 0;

      // Stage breakdown
      const stageBreakdown = {
        parsing: versions?.filter(v => v.current_stage === 'parse').length || 0,
        enriching: versions?.filter(v => v.current_stage === 'enrich').length || 0,
        complete: versions?.filter(v => v.current_stage === 'complete').length || 0,
        failed: versions?.filter(v => v.processing_status === 'failed').length || 0
      };

      // Recent activity
      const recentActivity = versions?.slice(0, 10).map(v => ({
        id: v.id,
        stage: v.current_stage,
        status: v.processing_status,
        timestamp: v.updated_at
      })) || [];

      return {
        totalProcessed,
        successRate,
        averageProcessingTime: 45, // Mock data for now
        stageBreakdown,
        recentActivity
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.totalProcessed || 0}</p>
                <p className="text-xs text-muted-foreground">Total Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.successRate.toFixed(1) || 0}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.averageProcessingTime || 0}s</p>
                <p className="text-xs text-muted-foreground">Avg Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{metrics?.stageBreakdown.complete || 0}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Processing Stage Distribution
          </CardTitle>
          <CardDescription>
            Current distribution of resumes across processing stages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics?.stageBreakdown && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Parsing</span>
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <Progress value={(metrics.stageBreakdown.parsing / metrics.totalProcessed) * 100} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {metrics.stageBreakdown.parsing}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Enriching</span>
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <Progress value={(metrics.stageBreakdown.enriching / metrics.totalProcessed) * 100} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {metrics.stageBreakdown.enriching}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Complete</span>
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <Progress value={(metrics.stageBreakdown.complete / metrics.totalProcessed) * 100} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {metrics.stageBreakdown.complete}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Failed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <Progress value={(metrics.stageBreakdown.failed / metrics.totalProcessed) * 100} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {metrics.stageBreakdown.failed}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Processing Activity</CardTitle>
          <CardDescription>
            Latest resume processing events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {activity.stage}
                  </Badge>
                  <span className="text-sm font-mono">
                    {activity.id.slice(-8)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
