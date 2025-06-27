
import React from 'react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { TimelineCardFrame } from './TimelineCardFrame';
import { WorkExperienceCardContent } from './content/WorkExperienceCardContent';
import type { WorkExperience } from '@/types/versioned-entities';

interface ExperienceSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { data: workExperiences, isLoading } = useLatestEntities<WorkExperience>('work_experience');

  const handleCardToggle = (cardId: string) => {
    onCardFocus(focusedCard === cardId ? null : cardId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading work experience...</div>;
  }

  if (!workExperiences || workExperiences.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No work experience added yet</p>
        <button 
          onClick={() => console.log('Action: Add first work experience')}
          className="text-career-accent hover:underline"
        >
          Add your first role
        </button>
      </div>
    );
  }

  return (
    <div>
      {workExperiences.map((experience) => (
        <TimelineCardFrame
          key={experience.logical_entity_id}
          id={experience.logical_entity_id}
          title={experience.title}
          badgeText={experience.company}
          isExpanded={focusedCard === experience.logical_entity_id}
          onToggle={() => handleCardToggle(experience.logical_entity_id)}
        >
          <WorkExperienceCardContent item={experience} />
        </TimelineCardFrame>
      ))}
    </div>
  );
};
