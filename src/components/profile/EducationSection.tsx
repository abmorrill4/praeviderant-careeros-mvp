
import React, { useState } from 'react';
import { useLatestEntities, useCreateEntity } from '@/hooks/useVersionedEntities';
import { ProfileDataSection } from './ProfileDataSection';
import { educationFields } from './entityFieldConfigs';
import { useEntityActions } from '@/hooks/useEntityActions';
import { Plus, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Education } from '@/types/versioned-entities';

interface EducationSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { data: education, isLoading } = useLatestEntities<Education>('education');
  const createEducation = useCreateEntity<Education>('education');
  const { handleAccept, handleEdit } = useEntityActions<Education>('education');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      await createEducation.mutateAsync({
        entityData: {
          degree: 'New Degree',
          institution: 'Institution Name',
          user_id: '', // This will be set by the backend
        },
        source: 'USER_MANUAL'
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating education:', error);
    }
  };

  const renderEducation = (education: Education) => (
    <div>
      <h4 className="font-semibold text-career-text-light">{education.degree}</h4>
      <p className="text-sm text-career-text-muted-light">{education.institution}</p>
      {education.field_of_study && (
        <p className="text-sm text-career-text-muted-light mt-1">
          {education.field_of_study}
        </p>
      )}
      {(education.start_date || education.end_date) && (
        <p className="text-xs text-career-text-muted-light mt-2">
          {education.start_date || 'Started'} - {education.end_date || 'Completed'}
        </p>
      )}
      {education.gpa && (
        <p className="text-xs text-career-text-muted-light mt-1">
          GPA: {education.gpa}
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading education...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-career-text-light">Education</h2>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Education
        </Button>
      </div>

      <ProfileDataSection
        title="Education"
        icon={<GraduationCap className="w-5 h-5" />}
        items={education || []}
        editFields={educationFields}
        onAccept={handleAccept}
        onEdit={handleEdit}
        renderItem={renderEducation}
        entityType="education"
      />

      {isCreating && (
        <div className="p-4 border rounded-lg bg-career-panel-light border-career-gray-light">
          <p className="text-sm text-career-text-muted-light mb-4">
            Create a new education entry
          </p>
          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">
              Create Education
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
