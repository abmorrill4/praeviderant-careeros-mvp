
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import { FileText, Mail, Target, Briefcase } from 'lucide-react';
import { EnhancedResumeGenerator } from '@/components/application-toolkit/EnhancedResumeGenerator';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

const ApplicationToolkitPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'resume-generator'>('overview');
  const [profileSection, setProfileSection] = useState<TimelineSection>('overview');

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

  return (
    <ProfileLayout activeSection={profileSection} onSectionChange={setProfileSection}>
      <div className="h-full flex flex-col">
        <div className="bg-career-panel border-career-gray border-b p-6">
          <h1 className="text-2xl font-bold text-career-text mb-2">
            Application Toolkit
          </h1>
          <p className="text-career-text-muted">
            Tools to help you create tailored resumes and cover letters for your job applications
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {toolkitSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Card
                    key={section.title}
                    className="neumorphic-panel bg-career-panel"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-career-text">
                        <Icon className="w-5 h-5 text-career-accent" />
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-career-text-muted">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {section.comingSoon ? (
                        <div className="text-center py-8 text-career-text-muted">
                          <p className="text-sm">Coming soon...</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-career-gray hover:bg-career-gray"
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
    </ProfileLayout>
  );
};

export default ApplicationToolkitPage;
