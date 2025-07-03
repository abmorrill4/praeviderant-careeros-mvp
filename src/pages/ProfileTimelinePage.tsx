
import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CleanNavigation } from '@/components/navigation/CleanNavigation';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';
import { ProfileTimeline } from '@/components/profile/ProfileTimeline';

export type TimelineSection = 'overview' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications';

const ProfileTimelinePage: React.FC = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state with URL parameter if present, otherwise default to 'overview'
  const getInitialSection = (): TimelineSection => {
    const sectionParam = searchParams.get('section') as TimelineSection;
    if (sectionParam && ['overview', 'experience', 'education', 'skills', 'projects', 'certifications'].includes(sectionParam)) {
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
    console.log('ProfileTimelinePage: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('ProfileTimelinePage: Rendering for user:', user.email, 'activeSection:', activeSection);

  return (
    <CleanNavigation>
      <BreadcrumbNavigation />
      <ProfileTimeline 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </CleanNavigation>
  );
};

export default ProfileTimelinePage;
