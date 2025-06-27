
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileTimeline } from '@/components/profile/ProfileTimeline';
import { ProfileLayout } from '@/components/layout/ProfileLayout';

export type TimelineSection = 'overview' | 'experience' | 'education' | 'skills';

const ProfileTimelinePage: React.FC = () => {
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

  return (
    <ProfileLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      <ProfileTimeline 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </ProfileLayout>
  );
};

export default ProfileTimelinePage;
