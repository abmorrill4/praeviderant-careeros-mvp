
import React, { useState } from 'react';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';
import { ResumeTimeline } from '@/components/ResumeTimeline';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

const ResumeTimelinePage: React.FC = () => {
  return (
    <DashboardPageLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Resume Processing Timeline
            </CardTitle>
            <CardDescription>
              Track the progress of resume uploads and processing jobs in real-time
            </CardDescription>
          </CardHeader>
        </Card>
        
        <ErrorBoundary>
          <ResumeTimeline showFilters={true} />
        </ErrorBoundary>
      </div>
    </DashboardPageLayout>
  );
};

export default ResumeTimelinePage;
