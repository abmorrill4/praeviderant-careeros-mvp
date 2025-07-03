
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { EnhancedResumeGenerator } from '@/components/application-toolkit/EnhancedResumeGenerator';
import { CleanNavigation } from '@/components/navigation/CleanNavigation';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';

const ApplicationToolkitPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if no user
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <CleanNavigation>
      <BreadcrumbNavigation />
      <div className="h-full flex flex-col">
        <div className="bg-white border-b p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Resume Generator
          </h1>
          <p className="text-gray-600">
            Create tailored resumes for specific job opportunities using AI
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <EnhancedResumeGenerator />
        </div>
      </div>
    </CleanNavigation>
  );
};

export default ApplicationToolkitPage;
