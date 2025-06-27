
import React from 'react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { TimelineCardFrame } from './TimelineCardFrame';
import { SkillCardContent } from './content/SkillCardContent';
import type { Skill } from '@/types/versioned-entities';

interface SkillsSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { data: skills, isLoading } = useLatestEntities<Skill>('skill');

  const handleCardToggle = (cardId: string) => {
    onCardFocus(focusedCard === cardId ? null : cardId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  if (!skills || skills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No skills added yet</p>
        <button 
          onClick={() => console.log('Action: Add first skill')}
          className="text-career-accent hover:underline"
        >
          Add your skills
        </button>
      </div>
    );
  }

  return (
    <div>
      {skills.map((skill) => (
        <TimelineCardFrame
          key={skill.logical_entity_id}
          id={skill.logical_entity_id}
          title={skill.name}
          badgeText={skill.category}
          isExpanded={focusedCard === skill.logical_entity_id}
          onToggle={() => handleCardToggle(skill.logical_entity_id)}
        >
          <SkillCardContent item={skill} />
        </TimelineCardFrame>
      ))}
    </div>
  );
};
