
import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileOverview } from './ProfileOverview';
import { ExperienceSection } from './ExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';
import { ResumeUploadModal } from './ResumeUploadModal';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

interface ProfileTimelineProps {
  activeSection: TimelineSection;
  onSectionChange: (section: TimelineSection) => void;
}

export const ProfileTimeline: React.FC<ProfileTimelineProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { theme } = useTheme();
  const [focusedCard, setFocusedCard] = useState<string | null>(null);

  const handleCardFocus = (cardId: string | null) => {
    setFocusedCard(cardId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-gray-dark' : 'bg-career-panel-light border-career-gray-light'} border-b p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Career Timeline
          </h1>
          <ResumeUploadModal />
        </div>
        
        <Tabs value={activeSection} onValueChange={(value) => onSectionChange(value as TimelineSection)}>
          <TabsList className={`grid w-full grid-cols-4 ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeSection} onValueChange={(value) => onSectionChange(value as TimelineSection)}>
          <TabsContent value="overview" className="mt-0">
            <ProfileOverview focusedCard={focusedCard} onCardFocus={handleCardFocus} />
          </TabsContent>
          
          <TabsContent value="experience" className="mt-0">
            <ExperienceSection focusedCard={focusedCard} onCardFocus={handleCardFocus} />
          </TabsContent>
          
          <TabsContent value="education" className="mt-0">
            <EducationSection focusedCard={focusedCard} onCardFocus={handleCardFocus} />
          </TabsContent>
          
          <TabsContent value="skills" className="mt-0">
            <SkillsSection focusedCard={focusedCard} onCardFocus={handleCardFocus} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
