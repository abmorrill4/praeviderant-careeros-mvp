import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Play,
  Pause,
  Upload,
  FileText,
  GitCompare,
  Target,
  Sparkles,
  Eye,
  RefreshCw,
  Filter,
  Search,
  Zap,
  Bell
} from 'lucide-react';
import { useResumeTimeline, useResumeTimelineList } from '@/hooks/useResumeTimeline';
import { supabase } from '@/integrations/supabase/client';
import type { TimelineStage, TimelineFilters } from '@/types/resume-timeline';
import { formatDistanceToNow } from 'date-fns';

interface ResumeTimelineProps {
  resumeVersionId?: string;
  showFilters?: boolean;
}

const STAGE_ICONS = {
  upload: Upload,
  parse: FileText,
  diff: GitCompare,
  normalize: Target,
  enrich: Sparkles,
  review: Eye,
  update: RefreshCw,
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-600 border-blue-200',
  completed: 'bg-green-100 text-green-600 border-green-200',
  failed: 'bg-red-100 text-red-600 border-red-200',
  skipped: 'bg-yellow-100 text-yellow-600 border-yellow-200',
};

const LOG_LEVEL_COLORS = {
  debug: 'text-gray-500',
  info: 'text-blue-600',
  warn: 'text-yellow-600',
  error: 'text-red-600',
};

export const ResumeTimeline: React.FC<ResumeTimelineProps> = ({
  resumeVersionId,
  showFilters = true
}) => {
  const [selectedResumeId, setSelectedResumeId] = useState(resumeVersionId);
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const { data: timelineData, isLoading, error, refetch } = useResumeTimeline(selectedResumeId, filters);
  const { data: resumeList } = useResumeTimelineList(filters);

  // Real-time updates using Supabase realtime
  useEffect(() => {
    if (!realTimeEnabled || !selectedResumeId) return;

    const channel = supabase
      .channel('timeline-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_logs',
        },
        (payload) => {
          console.log('Real-time job log update:', payload);
          setLastUpdateTime(new Date());
          refetch();
          
          // Show toast notification for important updates
          if (payload.eventType === 'INSERT' && payload.new?.level === 'error') {
            toast({
              title: 'Job Error Detected',
              description: `Error in ${payload.new.stage}: ${payload.new.message}`,
              variant: 'destructive',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'normalization_jobs',
        },
        () => {
          console.log('Normalization job update');
          setLastUpdateTime(new Date());
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrichment_jobs',
        },
        () => {
          console.log('Enrichment job update');
          setLastUpdateTime(new Date());
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realTimeEnabled, selectedResumeId, refetch]);

  const handleFilterChange = (key: keyof TimelineFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value || undefined
    }));
  };

  const getStatusIcon = (status: TimelineStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'skipped':
        return <Pause className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return null;
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  // Auto-refresh every 30 seconds when real-time is disabled
  useEffect(() => {
    if (realTimeEnabled) return;
    
    const interval = setInterval(() => {
      refetch();
      setLastUpdateTime(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [realTimeEnabled, refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading timeline...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <XCircle className="w-6 h-6 text-red-600 mr-2" />
          <span>Error loading timeline</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Timeline Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Resume</label>
                <Select value={selectedResumeId || 'all'} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resume..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resumeList?.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.file_name} (v{resume.version_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <Input
                  placeholder="Filter by user ID..."
                  value={filters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stage</label>
                <Select value={filters.stage || 'all'} onValueChange={(value) => handleFilterChange('stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    <SelectItem value="upload">Upload</SelectItem>
                    <SelectItem value="parse">Parse</SelectItem>
                    <SelectItem value="diff">Diff</SelectItem>
                    <SelectItem value="normalize">Normalize</SelectItem>
                    <SelectItem value="enrich">Enrich</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {timelineData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resume Processing Timeline</CardTitle>
                <CardDescription>
                  Resume ID: {timelineData.resumeVersionId} • 
                  Status: <Badge className={`ml-1 ${STATUS_COLORS[timelineData.overallStatus]}`}>
                    {timelineData.overallStatus.replace('_', ' ')}
                  </Badge>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                  className={realTimeEnabled ? 'text-green-600' : 'text-gray-600'}
                >
                  {realTimeEnabled ? <Zap className="w-4 h-4 mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                  {realTimeEnabled ? 'Live' : 'Manual'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Last updated: {formatDistanceToNow(lastUpdateTime, { addSuffix: true })}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timelineData.stages.map((stage, index) => {
                const StageIcon = STAGE_ICONS[stage.name as keyof typeof STAGE_ICONS];
                const isExpanded = expandedStage === stage.id;
                
                return (
                  <div key={stage.id} className="relative">
                    {index < timelineData.stages.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200" />
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${STATUS_COLORS[stage.status]}`}>
                        <StageIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-medium">{stage.label}</h3>
                            {getStatusIcon(stage.status)}
                            <Badge variant="outline" className={STATUS_COLORS[stage.status]}>
                              {stage.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {stage.logs.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                            >
                              <Search className="w-4 h-4 mr-1" />
                              {stage.logs.length} logs
                            </Button>
                          )}
                        </div>
                        
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {stage.startedAt && (
                            <div>Started: {formatDistanceToNow(new Date(stage.startedAt), { addSuffix: true })}</div>
                          )}
                          {stage.completedAt && (
                            <div>Completed: {formatDistanceToNow(new Date(stage.completedAt), { addSuffix: true })}</div>
                          )}
                          {stage.duration && (
                            <div>Duration: {formatDuration(stage.duration)}</div>
                          )}
                          {stage.errorMessage && (
                            <div className="text-red-600 font-medium">Error: {stage.errorMessage}</div>
                          )}
                        </div>
                        
                        {isExpanded && stage.logs.length > 0 && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-3">Stage Logs</h4>
                            <ScrollArea className="h-48">
                              <div className="space-y-2">
                                {stage.logs.map((log) => (
                                  <div key={log.id} className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(log.created_at).toLocaleTimeString()}
                                      </span>
                                      <Badge variant="outline" className={`text-xs ${LOG_LEVEL_COLORS[log.level]}`}>
                                        {log.level}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 pl-2 border-l-2 border-muted">
                                      {log.message}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {!timelineData && selectedResumeId && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <AlertCircle className="w-6 h-6 text-muted-foreground mr-2" />
            <span>No timeline data found for the selected resume</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
