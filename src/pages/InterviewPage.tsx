
import React, { useState } from 'react';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import AIInterviewPage from '@/components/interview/AIInterviewPage';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

const InterviewPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');

  return (
    <ProfileLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      <div className="h-full flex flex-col">
        <div className="bg-career-panel border-career-gray border-b p-6">
          <h1 className="text-2xl font-bold text-career-text mb-2">
            AI Career Interview
          </h1>
          <p className="text-career-text-muted">
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
