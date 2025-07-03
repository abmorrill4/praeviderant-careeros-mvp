import React, { useState } from 'react';
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

  console.log('ProfileTimeline rendering:', { activeSection, profileCompleteness });

  const handleCardFocus = (cardId: string | null) => {
    setFocusedCard(cardId);
  };

  // Show new user guidance if the user has very little or no data
  const showNewUserGuidance = profileCompleteness.isNewUser || profileCompleteness.completionPercentage < 25;

  console.log('ProfileTimeline decision:', { 
    showNewUserGuidance, 
    isNewUser: profileCompleteness.isNewUser, 
    completionPercentage: profileCompleteness.completionPercentage 
  });

  // Simple test render to ensure the component works
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Career Profile (Test Render)
          </h1>
          <div className="text-sm text-slate-500">Active: {activeSection}</div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => onSectionChange('overview')}
            className={`px-4 py-2 rounded ${activeSection === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => onSectionChange('experience')}
            className={`px-4 py-2 rounded ${activeSection === 'experience' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Experience
          </button>
          <button 
            onClick={() => onSectionChange('education')}
            className={`px-4 py-2 rounded ${activeSection === 'education' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Education
          </button>
          <button 
            onClick={() => onSectionChange('skills')}
            className={`px-4 py-2 rounded ${activeSection === 'skills' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Skills
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-slate-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Profile Timeline Component</h2>
          <p>Active Section: {activeSection}</p>
          <p>Profile Loading: {profileCompleteness.loading ? 'Yes' : 'No'}</p>
          <p>Is New User: {profileCompleteness.isNewUser ? 'Yes' : 'No'}</p>
          <p>Completion %: {profileCompleteness.completionPercentage}</p>
          <p>Show Guidance: {showNewUserGuidance ? 'Yes' : 'No'}</p>
          <p>Has Resume Data: {profileCompleteness.hasResumeData ? 'Yes' : 'No'}</p>
          <p>Has Experience: {profileCompleteness.hasExperience ? 'Yes' : 'No'}</p>
          <p>Has Education: {profileCompleteness.hasEducation ? 'Yes' : 'No'}</p>
          <p>Has Skills: {profileCompleteness.hasSkills ? 'Yes' : 'No'}</p>
          
          {profileCompleteness.error && (
            <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded">
              <p className="text-red-700">Error: {profileCompleteness.error}</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Section Content for: {activeSection}</h3>
          <p>This is where the {activeSection} content would be displayed.</p>
        </div>
      </div>
    </div>
  );
};