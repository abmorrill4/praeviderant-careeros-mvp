
import React, { useState } from 'react';
import { CleanNavigation } from '@/components/navigation/CleanNavigation';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';
import AIInterviewPage from '@/components/interview/AIInterviewPage';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

const InterviewPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');

  return (
    <CleanNavigation>
      <BreadcrumbNavigation />
      <div className="h-full flex flex-col">
        <div className="bg-white border-b p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            AI Career Interview
          </h1>
          <p className="text-gray-600">
            Have a natural conversation about your career to build your profile
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <AIInterviewPage />
        </div>
      </div>
    </CleanNavigation>
  );
};

export default InterviewPage;
