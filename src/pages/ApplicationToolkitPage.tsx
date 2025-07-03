
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { FileText, Mail, Target, Briefcase } from 'lucide-react';
import { EnhancedResumeGenerator } from '@/components/application-toolkit/EnhancedResumeGenerator';
import { CleanNavigation } from '@/components/navigation/CleanNavigation';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';

const ApplicationToolkitPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState<'overview' | 'resume-generator'>('overview');

  const toolkitSections = [
    {
      title: 'Resume Generator',
      description: 'Create tailored resumes for specific job opportunities',
      icon: FileText,
      comingSoon: false,
      sectionId: 'resume-generator',
    },
    {
      title: 'Cover Letter Generator',
      description: 'Generate personalized cover letters that match your target role',
      icon: Mail,
      comingSoon: true,
    },
    {
      title: 'Job Match Analysis',
      description: 'Analyze how well your profile matches job descriptions',
      icon: Target,
      comingSoon: true,
    },
    {
      title: 'Application Tracker',
      description: 'Track your job applications and follow-up activities',
      icon: Briefcase,
      comingSoon: true,
    },
  ];

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

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <CleanNavigation>
      <BreadcrumbNavigation />
      <div className="h-full flex flex-col">
        <div className="bg-white border-b p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Toolkit
          </h1>
          <p className="text-gray-600">
            Tools to help you create tailored resumes and cover letters for your job applications
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeSection === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {toolkitSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card
                    key={section.title}
                    className="bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Icon className="w-5 h-5 text-purple-600" />
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {section.comingSoon ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Coming soon...</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveSection(section.sectionId as any)}
                        >
                          Get Started
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : activeSection === 'resume-generator' ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setActiveSection('overview')}
                className="mb-4"
              >
                ← Back to Overview
              </Button>
              <EnhancedResumeGenerator />
            </div>
          ) : null}
        </div>
      </div>
    </CleanNavigation>
  );
};

export default ApplicationToolkitPage;
