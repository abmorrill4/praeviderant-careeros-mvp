
import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import { FileText, Mail, Target, Briefcase } from 'lucide-react';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

const ApplicationToolkitPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');

  const toolkitSections = [
    {
      title: 'Resume Generator',
      description: 'Create tailored resumes for specific job opportunities',
      icon: FileText,
      comingSoon: true,
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
    <ProfileLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="h-full flex flex-col">
        <div className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark' : 'bg-career-panel-light border-career-gray-light'} border-b p-6`}>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
            Application Toolkit
          </h1>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Tools to help you create tailored resumes and cover letters for your job applications
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {toolkitSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.title}
                  className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'}`}
                >
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                      <Icon className="w-5 h-5 text-career-accent" />
                      {section.title}
                    </CardTitle>
                    <CardDescription className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {section.comingSoon ? (
                      <div className={`text-center py-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                        <p className="text-sm">Coming soon...</p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className={`w-full ${theme === 'dark' ? 'border-career-gray-dark hover:bg-career-gray-dark' : 'border-career-gray-light hover:bg-career-gray-light'}`}
                      >
                        Get Started
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ApplicationToolkitPage;
