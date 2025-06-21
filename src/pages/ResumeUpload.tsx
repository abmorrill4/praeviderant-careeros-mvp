
import React from 'react';
import { ResumeUpload as ResumeUploadComponent } from '@/components/ResumeUpload';
import DashboardPageLayout from '@/components/dashboard/DashboardPageLayout';

const ResumeUpload = () => {
  return (
    <DashboardPageLayout>
      <div className="p-4">
        <div className="container mx-auto py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Resume Analysis</h1>
            <p className="text-muted-foreground mt-2">
              Upload your resume to automatically extract and analyze your career data
            </p>
          </div>

          <ResumeUploadComponent />
        </div>
      </div>
    </DashboardPageLayout>
  );
};

export default ResumeUpload;
