
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileTimeline } from '@/components/profile/ProfileTimeline';
import { useTheme } from '@/contexts/ThemeContext';

export type TimelineSection = 'overview' | 'experience' | 'education' | 'skills';

const ProfileTimelinePage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
      <div className="flex h-screen">
        {/* Left Sidebar - Reduced width */}
        <div className="w-64 flex-shrink-0">
          <ProfileSidebar 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>
        
        {/* Right Content Area - More space */}
        <div className="flex-1 overflow-hidden">
          <ProfileTimeline 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileTimelinePage;
