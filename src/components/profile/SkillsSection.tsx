
import React, { useState } from 'react';
import { useLatestEntities, useCreateEntity } from '@/hooks/useVersionedEntities';
import { ProfileDataSection } from './ProfileDataSection';
import { skillFields } from './entityFieldConfigs';
import { useEntityActions } from '@/hooks/useEntityActions';
import { Plus, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const createSkill = useCreateEntity<Skill>('skill');
  const { handleAccept, handleEdit } = useEntityActions<Skill>('skill');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      await createSkill.mutateAsync({
        entityData: {
          name: 'New Skill',
          category: 'Technical Skill',
          user_id: '', // This will be set by the backend
        },
        source: 'USER_MANUAL'
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating skill:', error);
    }
  };

  const renderSkill = (skill: Skill) => (
    <div>
      <h4 className="font-semibold text-career-text-light">{skill.name}</h4>
      {skill.category && (
        <p className="text-sm text-career-text-muted-light">{skill.category}</p>
      )}
      <div className="flex items-center gap-4 mt-2">
        {skill.proficiency_level && (
          <span className="text-xs px-2 py-1 bg-career-gray-light rounded-full text-career-text-light">
            {skill.proficiency_level}
          </span>
        )}
        {skill.years_of_experience && (
          <span className="text-xs text-career-text-muted-light">
            {skill.years_of_experience} year{skill.years_of_experience !== 1 ? 's' : ''} experience
          </span>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-career-text-light">Skills</h2>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Skill
        </Button>
      </div>

      <ProfileDataSection
        title="Skills"
        icon={<Code className="w-5 h-5" />}
        items={skills || []}
        editFields={skillFields}
        onAccept={handleAccept}
        onEdit={handleEdit}
        renderItem={renderSkill}
        entityType="skill"
      />

      {isCreating && (
        <div className="p-4 border rounded-lg bg-career-panel-light border-career-gray-light">
          <p className="text-sm text-career-text-muted-light mb-4">
            Create a new skill entry
          </p>
          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">
              Create Skill
            </Button>
            <Button 
              onClick={() => setIsCreating(false)} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
