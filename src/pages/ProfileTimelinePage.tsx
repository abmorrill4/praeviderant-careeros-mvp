
import React, { useState } from 'react';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { ProfileTimeline } from '@/components/profile/ProfileTimeline';
import { ProfileLayout } from '@/components/layout/ProfileLayout';

export type TimelineSection = 'overview' | 'experience' | 'education' | 'skills';

const ProfileTimelinePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<TimelineSection>('overview');

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
