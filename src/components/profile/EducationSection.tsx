
import React from 'react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { TimelineCardFrame } from './TimelineCardFrame';
import { EducationCardContent } from './content/EducationCardContent';
import type { Education } from '@/types/versioned-entities';

interface EducationSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { data: educationItems, isLoading } = useLatestEntities<Education>('education');

  const handleCardToggle = (cardId: string) => {
    onCardFocus(focusedCard === cardId ? null : cardId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading education...</div>;
  }

  if (!educationItems || educationItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No education added yet</p>
        <button 
          onClick={() => console.log('Action: Add first education')}
          className="text-career-accent hover:underline"
        >
          Add your education
        </button>
      </div>
    );
  }

  return (
    <div>
      {educationItems.map((education) => (
        <TimelineCardFrame
          key={education.logical_entity_id}
          id={education.logical_entity_id}
          title={education.degree}
          badgeText={education.institution}
          isExpanded={focusedCard === education.logical_entity_id}
          onToggle={() => handleCardToggle(education.logical_entity_id)}
        >
          <EducationCardContent item={education} />
        </TimelineCardFrame>
      ))}
    </div>
  );
};
