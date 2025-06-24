
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Clock,
  Activity
} from 'lucide-react';
import { useResumeTimelineList } from '@/hooks/useResumeTimeline';
import { useTimelineCache } from '@/hooks/useTimelineCache';
import { supabase } from '@/integrations/supabase/client';

interface TimelineAdminPanelProps {
  isAdmin?: boolean;
}

export const TimelineAdminPanel: React.FC<TimelineAdminPanelProps> = ({
  isAdmin = false
}) => {
  const [cleanupStatus, setCleanupStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const { data: resumeList, refetch } = useResumeTimelineList();
  const { getCacheStats, invalidateCache } = useTimelineCache();

  const handleCleanupOldLogs = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Admin access required for this operation',
        variant: 'destructive',
      });
      return;
    }

    setCleanupStatus('running');

    try {
      // Delete logs older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('job_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      setCleanupStatus('completed');
      toast({
        title: 'Cleanup Completed',
        description: 'Old job logs have been cleaned up successfully',
      });
      
      refetch();
    } catch (error) {
      console.error('Cleanup error:', error);
      setCleanupStatus('idle');
      toast({
        title: 'Cleanup Failed',
        description: 'Failed to clean up old logs',
        variant: 'destructive',
      });
    }
  };

  const handleInvalidateCache = () => {
    invalidateCache();
    toast({
      title: 'Cache Cleared',
      description: 'Timeline cache has been invalidated',
    });
  };

  const handleRetryFailedJobs = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Admin access required for this operation',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Reset failed normalization jobs
      const { error: normError } = await supabase
        .from('normalization_jobs')
        .update({ 
          status: 'pending', 
          error_message: null,
          started_at: null,
          completed_at: null
        })
        .eq('status', 'failed');

      // Reset failed enrichment jobs
      const { error: enrichError } = await supabase
        .from('enrichment_jobs')
        .update({ 
          status: 'pending', 
          error_message: null,
          started_at: null,
          completed_at: null
        })
        .eq('status', 'failed');

      if (normError || enrichError) {
        throw new Error('Failed to retry jobs');
      }

      toast({
        title: 'Jobs Retried',
        description: 'Failed jobs have been reset and will be retried',
      });
      
      refetch();
    } catch (error) {
      console.error('Retry error:', error);
      toast({
        title: 'Retry Failed',
        description: 'Failed to retry jobs',
        variant: 'destructive',
      });
    }
  };

  const cacheStats = getCacheStats();
  const systemStats = resumeList ? {
    totalResumes: resumeList.length,
    completedResumes: resumeList.filter(r => r.processing_status === 'completed').length,
    failedResumes: resumeList.filter(r => r.processing_status === 'failed').length,
    processingResumes: resumeList.filter(r => r.processing_status === 'processing').length,
  } : null;

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
          <span>Admin access required</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Timeline Administration</h2>
        <p className="text-muted-foreground">
          Manage resume processing timelines and system performance
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats?.totalResumes || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{systemStats?.completedResumes || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{systemStats?.processingResumes || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{systemStats?.failedResumes || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cache Statistics</CardTitle>
              <CardDescription>
                Current timeline cache performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Cache Entries:</span>
                  <Badge>{cacheStats.totalEntries}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cache Size:</span>
                  <Badge>{Math.round(cacheStats.cacheSize / 1024)} KB</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Oldest Entry:</span>
                  <Badge>
                    {new Date(cacheStats.oldestEntry).toLocaleTimeString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>
                  Perform maintenance operations on the timeline system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Clean Up Old Logs</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove job logs older than 30 days
                    </p>
                  </div>
                  <Button
                    onClick={handleCleanupOldLogs}
                    disabled={cleanupStatus === 'running'}
                    variant="outline"
                  >
                    {cleanupStatus === 'running' && (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {cleanupStatus === 'running' ? 'Cleaning...' : 'Clean Up'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Clear Cache</h4>
                    <p className="text-sm text-muted-foreground">
                      Invalidate all cached timeline data
                    </p>
                  </div>
                  <Button onClick={handleInvalidateCache} variant="outline">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Retry Failed Jobs</h4>
                    <p className="text-sm text-muted-foreground">
                      Reset failed jobs to retry processing
                    </p>
                  </div>
                  <Button onClick={handleRetryFailedJobs} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Failed
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>
                Monitor timeline system performance and health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Recent Activity</h4>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {resumeList?.slice(0, 5).map((resume) => (
                        <div key={resume.id} className="flex items-center justify-between text-sm">
                          <span>{resume.file_name}</span>
                          <Badge variant="outline">{resume.processing_status}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div>
                  <h4 className="font-medium mb-2">User Filter</h4>
                  <Input
                    placeholder="Filter by user ID..."
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
