
import React, { useState } from 'react';
import { useLatestEntities, useCreateEntity, useUpdateEntity } from '@/hooks/useVersionedEntities';
import { useToast } from '@/hooks/use-toast';
import { TimelineCardFrame } from './TimelineCardFrame';
import { SkillCardContent } from './content/SkillCardContent';
import { SkillForm } from './forms/SkillForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { parseSkillData } from '@/utils/skillDataParser';
import type { Skill, EntityData } from '@/types/versioned-entities';

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
  const updateSkill = useUpdateEntity<Skill>('skill');
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const handleCardToggle = (cardId: string) => {
    // Close editing when toggling cards
    if (editingSkillId) {
      setEditingSkillId(null);
    }
    onCardFocus(focusedCard === cardId ? null : cardId);
  };

  const handleCreateSkill = async (skillData: Partial<EntityData<Skill>>) => {
    try {
      await createSkill.mutateAsync({
        entityData: skillData as EntityData<Skill>,
        source: 'USER_MANUAL',
        sourceConfidence: 1.0,
      });
      
      setIsCreating(false);
      toast({
        title: "Skill added",
        description: "Your skill has been added to your profile.",
      });
    } catch (error) {
      console.error('Error creating skill:', error);
      toast({
        title: "Error",
        description: "Failed to add the skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSkill = async (skill: Skill, updates: Partial<EntityData<Skill>>) => {
    try {
      await updateSkill.mutateAsync({
        logicalEntityId: skill.logical_entity_id,
        updates,
        source: 'USER_MANUAL',
        sourceConfidence: 1.0,
      });
      
      setEditingSkillId(null);
      toast({
        title: "Skill updated",
        description: "Your skill has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating skill:', error);
      toast({
        title: "Error",
        description: "Failed to update the skill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditSkill = (skillId: string) => {
    setEditingSkillId(skillId);
    onCardFocus(skillId);
  };

  const handleCancelEdit = () => {
    setEditingSkillId(null);
    setIsCreating(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  // Handle the case where skills exist but are empty or undefined
  const validSkills = skills?.filter(skill => skill && skill.name) || [];

  if (validSkills.length === 0 && !isCreating) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No skills added yet</p>
        <Button 
          onClick={() => setIsCreating(true)}
          className="bg-career-accent hover:bg-career-accent-dark text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add your first skill
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add new skill form */}
      {isCreating && (
        <div className="mb-6">
          <SkillForm
            onSave={handleCreateSkill}
            onCancel={handleCancelEdit}
            isEditing={false}
          />
        </div>
      )}

      {/* Add skill button when not creating */}
      {!isCreating && (
        <div className="mb-4">
          <Button 
            onClick={() => setIsCreating(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Skill
          </Button>
        </div>
      )}

      {/* Skills list */}
      {validSkills.map((skill) => {
        const parsedSkill = parseSkillData(skill.name, skill.category, skill.proficiency_level);
        const isEditing = editingSkillId === skill.logical_entity_id;
        
        return (
          <TimelineCardFrame
            key={skill.logical_entity_id}
            id={skill.logical_entity_id}
            title={parsedSkill.name}
            badgeText={parsedSkill.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Uncategorized'}
            isExpanded={focusedCard === skill.logical_entity_id}
            onToggle={() => handleCardToggle(skill.logical_entity_id)}
          >
            {isEditing ? (
              <SkillForm
                skill={skill}
                onSave={(updates) => handleUpdateSkill(skill, updates)}
                onCancel={handleCancelEdit}
                isEditing={true}
              />
            ) : (
              <SkillCardContent 
                item={skill} 
                onEdit={() => handleEditSkill(skill.logical_entity_id)}
              />
            )}
          </TimelineCardFrame>
        );
      })}
    </div>
  );
};
