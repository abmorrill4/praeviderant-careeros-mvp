
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ResumeTimeline } from '@/components/ResumeTimeline';
import { ResumeTimelineFilters } from '@/components/ResumeTimelineFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Clock, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { useResumeTimelineList } from '@/hooks/useResumeTimeline';
import type { TimelineFilters } from '@/types/resume-timeline';

const ResumeTimelinePage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const { data: resumeList, isLoading, error } = useResumeTimelineList(filters);

  console.log('ResumeTimelinePage - User:', user?.id);
  console.log('ResumeTimelinePage - Loading:', isLoading);
  console.log('ResumeTimelinePage - Error:', error);
  console.log('ResumeTimelinePage - Resume List:', resumeList);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Auto-select first resume if available
  useEffect(() => {
    if (resumeList && resumeList.length > 0 && !selectedResumeId) {
      console.log('Auto-selecting first resume:', resumeList[0].id);
      setSelectedResumeId(resumeList[0].id);
    }
  }, [resumeList, selectedResumeId]);

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

  const handleResumeSelect = (resumeId: string) => {
    console.log('Selecting resume:', resumeId);
    setSelectedResumeId(resumeId);
  };

  if (isLoading) {
    console.log('Showing loading state');
    return (
      <DashboardLayout activeTab="resume-timeline" onTabChange={() => {}}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading resume data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    console.error('Showing error state:', error);
    return (
      <DashboardLayout activeTab="resume-timeline" onTabChange={() => {}}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600 mb-4">Error loading resume data: {error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!resumeList || resumeList.length === 0) {
    console.log('Showing empty state');
    return (
      <DashboardLayout activeTab="resume-timeline" onTabChange={() => {}}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Resume Processing Timeline</h1>
            <p className="text-muted-foreground mt-2">
              Track the progress of resume processing jobs across all pipeline stages
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Resumes Found</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                You haven't uploaded any resumes yet. Upload a resume to see its processing timeline and track progress through each stage.
              </p>
              <Button onClick={() => window.location.href = '/resume-upload-v2'}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  console.log('Rendering main timeline page with', resumeList.length, 'resumes');
  console.log('Selected resume ID:', selectedResumeId);

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

        {/* Resume Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Resume</CardTitle>
            <CardDescription>
              Choose a resume to view its processing timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {resumeList.map((resume) => (
                <div 
                  key={resume.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedResumeId === resume.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleResumeSelect(resume.id)}
                >
                  <div className="flex items-center justify-between">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline - only show if a resume is selected */}
        {selectedResumeId && (
          <ResumeTimeline 
            resumeVersionId={selectedResumeId}
            showFilters={false} 
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResumeTimelinePage;
