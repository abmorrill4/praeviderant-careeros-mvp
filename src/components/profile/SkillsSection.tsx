
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
  const { data: skills, isLoading, error } = useLatestEntities<Skill>('skill');

  // Add debugging
  console.log('SkillsSection - Skills data:', skills);
  console.log('SkillsSection - Is loading:', isLoading);
  console.log('SkillsSection - Error:', error);

  const handleCardToggle = (cardId: string) => {
    onCardFocus(focusedCard === cardId ? null : cardId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  if (error) {
    console.error('SkillsSection - Error loading skills:', error);
    return <div className="text-center py-8 text-red-500">Error loading skills</div>;
  }

  if (!skills || skills.length === 0) {
    console.log('SkillsSection - No skills found - this could indicate successful data deletion or empty profile');
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

  console.log(`SkillsSection - Rendering ${skills.length} skills`);

  return (
    <div>
      {skills.map((skill) => {
        console.log('SkillsSection - Rendering skill:', skill);
        return (
          <TimelineCardFrame
            key={skill.logical_entity_id}
            id={skill.logical_entity_id}
            title={skill.name}
            badgeText={skill.category || 'Skill'}
            isExpanded={focusedCard === skill.logical_entity_id}
            onToggle={() => handleCardToggle(skill.logical_entity_id)}
          >
            <SkillCardContent item={skill} />
          </TimelineCardFrame>
        );
      })}
    </div>
  );
};
