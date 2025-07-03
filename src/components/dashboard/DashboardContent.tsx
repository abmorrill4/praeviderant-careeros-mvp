
import React from 'react';
import { ProfileTab } from './ProfileTab';
import { ResumesTab } from './ResumesTab';
import { AnalyticsTab } from './AnalyticsTab';
import AIInterviewPage from '@/components/interview/AIInterviewPage';

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
      case "resumes":
        return <ResumesTab onNavigateToInterview={() => onTabChange("interview")} />;
      case "analytics":
        return <AnalyticsTab />;
      default:
        return <ProfileTab />;
    }
  };

  return renderContent();
};
