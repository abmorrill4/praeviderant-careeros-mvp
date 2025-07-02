
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimplifiedProfileOverview } from './SimplifiedProfileOverview';
import { ExperienceSection } from './ExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';
import { ResumeUploadModal } from './ResumeUploadModal';
import { NewUserGuidance } from './NewUserGuidance';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import type { TimelineSection } from '@/pages/ProfileTimelinePage';

interface ProfileTimelineProps {
  activeSection: TimelineSection;
  onSectionChange: (section: TimelineSection) => void;
}

export const ProfileTimeline: React.FC<ProfileTimelineProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const [focusedCard, setFocusedCard] = useState<string | null>(null);
  const profileCompleteness = useProfileCompleteness();

  const handleCardFocus = (cardId: string | null) => {
    setFocusedCard(cardId);
  };

  // Show new user guidance if the user has very little or no data
  const showNewUserGuidance = profileCompleteness.isNewUser || profileCompleteness.completionPercentage < 25;

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Career Profile
          </h1>
          <ResumeUploadModal />
        </div>
        
        <Tabs value={activeSection} onValueChange={(value) => onSectionChange(value as TimelineSection)}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-100">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeSection} onValueChange={(value) => onSectionChange(value as TimelineSection)}>
          <TabsContent value="overview" className="mt-0">
            {showNewUserGuidance ? (
              <div className="p-6 bg-slate-50">
                <NewUserGuidance
                  hasResumeData={profileCompleteness.hasResumeData}
                  hasExperience={profileCompleteness.hasExperience}
                  hasEducation={profileCompleteness.hasEducation}
                  hasSkills={profileCompleteness.hasSkills}
                />
              </div>
            ) : (
              <SimplifiedProfileOverview />
            )}
          </TabsContent>
          
          <TabsContent value="experience" className="mt-0">
            <div className="p-6 bg-slate-50">
              <ExperienceSection focusedCard={focusedCard} onCardFocus={handleCardFocus} />
            </div>
          </TabsContent>
          
          <TabsContent value="education" className="mt-0">
            <div className="p-6 bg-slate-50">
              <EducationSection focusedCard={focusedCard} onCardFocus={handleCardFocus} />
            </div>
          </TabsContent>
          
          <TabsContent value="skills" className="mt-0">
            <div className="p-6 bg-slate-50">
              <SkillsSection focusedCard={focusedCard} onCardFocus={handleCardFocus} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Sections Notice */}
        <div className="p-6 bg-slate-50">
          <div className="mt-6 p-4 border rounded-lg bg-white border-slate-200">
            <h3 className="font-medium mb-2 text-slate-900">
              Complete Resume Analysis
            </h3>
            <p className="text-sm text-slate-600">
              Your uploaded resumes are analyzed for all sections including Projects, Certifications, Awards, 
              Publications, Volunteer Work, Languages, Professional Associations, and References. 
              Use the resume upload feature to extract and organize all your career data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
