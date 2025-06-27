
import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import AIInterviewPage from '@/components/interview/AIInterviewPage';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

const InterviewPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');

  return (
    <ProfileLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="h-full flex flex-col">
        <div className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark' : 'bg-career-panel-light border-career-gray-light'} border-b p-6`}>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
            AI Career Interview
          </h1>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Have a natural conversation about your career to build your profile
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AIInterviewPage />
        </div>
      </div>
    </ProfileLayout>
  );
};

export default InterviewPage;
