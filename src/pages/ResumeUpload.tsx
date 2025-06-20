
import React from 'react';
import { ResumeUpload as ResumeUploadComponent } from '@/components/ResumeUpload';

const ResumeUpload = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
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
  );
};

export default ResumeUpload;
