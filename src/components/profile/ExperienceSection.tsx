
import React, { useState } from 'react';
import { useLatestEntities, useCreateEntity } from '@/hooks/useVersionedEntities';
import { ProfileDataSection } from './ProfileDataSection';
import { workExperienceFields } from './entityFieldConfigs';
import { useEntityActions } from '@/hooks/useEntityActions';
import { Plus, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkExperience } from '@/types/versioned-entities';


interface ExperienceSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { data: rawWorkExperiences, isLoading } = useLatestEntities<WorkExperience>('work_experience');
  const createExperience = useCreateEntity<WorkExperience>('work_experience');
  const { handleAccept, handleEdit } = useEntityActions<WorkExperience>('work_experience');
  const [isCreating, setIsCreating] = useState(false);

  // Sort work experience by most recent first (same logic as useUnifiedProfileData)
  const workExperiences = React.useMemo(() => {
    if (!rawWorkExperiences) return [];
    
    return [...rawWorkExperiences].sort((a, b) => {
      // Current roles (no end date) come first
      if (!a.end_date && b.end_date) return -1;
      if (a.end_date && !b.end_date) return 1;
      
      // Then by start date, most recent first
      if (a.start_date && b.start_date) {
        return b.start_date.localeCompare(a.start_date);
      }
      
      return 0;
    });
  }, [rawWorkExperiences]);

  const handleCreate = async () => {
    try {
      await createExperience.mutateAsync({
        entityData: {
          title: 'New Position',
          company: 'Company Name',
          user_id: '', // This will be set by the backend
        },
        source: 'USER_MANUAL'
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating work experience:', error);
    }
  };

  const renderExperience = (experience: WorkExperience) => (
    <div>
      <h4 className="font-semibold text-career-text-light">{experience.title}</h4>
      <p className="text-sm text-career-text-muted-light">{experience.company}</p>
      {experience.description && (
        <p className="text-sm text-career-text-muted-light mt-1 line-clamp-2">
          {experience.description}
        </p>
      )}
      {(experience.start_date || experience.end_date) && (
        <p className="text-xs text-career-text-muted-light mt-2">
          {experience.start_date || 'Started'} - {experience.end_date || 'Present'}
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading work experience...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-career-text-light">Work Experience</h2>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </Button>
      </div>

      <ProfileDataSection
        title="Work Experience"
        icon={<Building className="w-5 h-5" />}
        items={workExperiences || []}
        editFields={workExperienceFields}
        onAccept={handleAccept}
        onEdit={handleEdit}
        renderItem={renderExperience}
      />

      {isCreating && (
        <div className="p-4 border rounded-lg bg-career-panel-light border-career-gray-light">
          <p className="text-sm text-career-text-muted-light mb-4">
            Create a new work experience entry
          </p>
          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">
              Create Experience
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
