
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

interface ProfileLayoutProps {
  children: React.ReactNode;
  activeSection: TimelineSection;
  onSectionChange: (section: TimelineSection) => void;
}

export const ProfileLayout: React.FC<ProfileLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0">
          <ProfileSidebar 
            activeSection={activeSection}
            onSectionChange={onSectionChange}
          />
        </div>
        
        {/* Right Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
