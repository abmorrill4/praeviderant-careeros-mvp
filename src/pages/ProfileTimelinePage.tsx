
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileTimeline } from '@/components/profile/ProfileTimeline';
import { ProfileLayout } from '@/components/layout/ProfileLayout';

export type TimelineSection = 'overview' | 'experience' | 'education' | 'skills';

const ProfileTimelinePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');

  // Read section from URL params on mount
  useEffect(() => {
    const sectionParam = searchParams.get('section') as TimelineSection;
    if (sectionParam && ['overview', 'experience', 'education', 'skills'].includes(sectionParam)) {
      setActiveSection(sectionParam);
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
