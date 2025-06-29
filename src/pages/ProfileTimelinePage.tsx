
import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileTimeline } from '@/components/profile/ProfileTimeline';

export type TimelineSection = 'overview' | 'experience' | 'education' | 'skills';

const ProfileTimelinePage: React.FC = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state with URL parameter if present, otherwise default to 'overview'
  const getInitialSection = (): TimelineSection => {
    const sectionParam = searchParams.get('section') as TimelineSection;
    if (sectionParam && ['overview', 'experience', 'education', 'skills'].includes(sectionParam)) {
      return sectionParam;
    }
    return 'overview';
  };

  const [activeSection, setActiveSection] = useState<TimelineSection>(getInitialSection);

  // Clean up URL parameter after component mounts
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      // Clean up the URL parameter after setting the section
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams, setSearchParams]);

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
    <div className="min-h-screen bg-slate-50 transition-colors duration-300">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0">
          <ProfileSidebar 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>
        
        {/* Right Content Area */}
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
