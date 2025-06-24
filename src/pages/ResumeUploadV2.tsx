
import React from 'react';
import { ResumeUploadV2 as ResumeUploadV2Component } from '@/components/ResumeUploadV2';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';

const ResumeUploadV2 = () => {
  return (
    <DashboardPageLayout>
      <div className="p-4">
        <div className="container mx-auto py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Resume Upload v2.0</h1>
            <p className="text-muted-foreground mt-2">
              Advanced resume management with versioning, duplicate detection, and stream organization
            </p>
          </div>

          <ResumeUploadV2Component />
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default ResumeUploadV2;
