
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ResumeTimeline } from '@/components/ResumeTimeline';
import { ResumeTimelineFilters } from '@/components/ResumeTimelineFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useResumeTimelineList } from '@/hooks/useResumeTimeline';
import type { TimelineFilters } from '@/types/resume-timeline';

const ResumeTimelinePage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TimelineFilters>({});
  const { data: resumeList, isLoading } = useResumeTimelineList(filters);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Calculate stats from resume list
  const stats = resumeList ? {
    total: resumeList.length,
    completed: resumeList.filter(r => r.processing_status === 'completed').length,
    processing: resumeList.filter(r => r.processing_status === 'processing').length,
    failed: resumeList.filter(r => r.processing_status === 'failed').length,
  } : { total: 0, completed: 0, processing: 0, failed: 0 };

  const handleFiltersChange = (newFilters: TimelineFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <DashboardLayout activeTab="resume-timeline" onTabChange={() => {}}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Resume Processing Timeline</h1>
          <p className="text-muted-foreground mt-2">
            Track the progress of resume processing jobs across all pipeline stages
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <ResumeTimelineFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Timeline */}
        <ResumeTimeline showFilters={false} />

        {/* Recent Activity */}
        {resumeList && resumeList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Resume Activity</CardTitle>
              <CardDescription>
                Latest resume processing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resumeList.slice(0, 5).map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium">{resume.file_name}</div>
                      <Badge variant="outline">v{resume.version_number}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={
                          resume.processing_status === 'completed' ? 'bg-green-100 text-green-600' :
                          resume.processing_status === 'processing' ? 'bg-blue-100 text-blue-600' :
                          resume.processing_status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }
                      >
                        {resume.processing_status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResumeTimelinePage;
