
import React from 'react';
import { ProfileTab } from './ProfileTab';
import { ResumesTab } from './ResumesTab';
import { AnalyticsTab } from './AnalyticsTab';
import { TeamTab } from './TeamTab';
import AIInterviewPage from '@/components/interview/AIInterviewPage';
import { ApplicationToolkit } from '@/components/ApplicationToolkit';

interface DashboardContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  activeTab,
  onTabChange
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />;
      case "interview":
        return <AIInterviewPage />;
      case "toolkit":
        return <ApplicationToolkit />;
      case "resumes":
        return <ResumesTab onNavigateToInterview={() => onTabChange("interview")} />;
      case "analytics":
        return <AnalyticsTab />;
      case "team":
        return <TeamTab />;
      default:
        return <AIInterviewPage />;
    }
  };

  return renderContent();
};
