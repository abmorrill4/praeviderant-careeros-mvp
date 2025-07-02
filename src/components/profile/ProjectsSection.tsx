import React, { useState } from 'react';
import { useLatestEntities, useCreateEntity, useUpdateEntity, useDeleteEntity } from '@/hooks/useVersionedEntities';
import { ProfileDataSection } from './ProfileDataSection';
import { projectFields } from './entityFieldConfigs';
import { useEntityActions } from '@/hooks/useEntityActions';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Code } from 'lucide-react';
import type { Project } from '@/types/versioned-entities';

interface ProjectsSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { data: projects, isLoading } = useLatestEntities<Project>('project');
  const createProject = useCreateEntity<Project>('project');
  const { handleAccept, handleEdit } = useEntityActions<Project>('project');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      await createProject.mutateAsync({
        entityData: {
          name: 'New Project',
          description: '',
          technologies_used: [],
          user_id: '', // This will be set by the backend
        },
        source: 'USER_MANUAL'
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const renderProject = (project: Project) => (
    <div>
      <h4 className="font-semibold text-career-text-light">{project.name}</h4>
      {project.description && (
        <p className="text-sm text-career-text-muted-light mt-1 line-clamp-2">
          {project.description}
        </p>
      )}
      {project.technologies_used && project.technologies_used.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {project.technologies_used.slice(0, 3).map((tech, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-career-gray-light text-xs rounded-full text-career-text-light"
            >
              {tech}
            </span>
          ))}
          {project.technologies_used.length > 3 && (
            <span className="text-xs text-career-text-muted-light">
              +{project.technologies_used.length - 3} more
            </span>
          )}
        </div>
      )}
      {(project.start_date || project.end_date) && (
        <p className="text-xs text-career-text-muted-light mt-2">
          {project.start_date || 'Started'} - {project.end_date || 'Ongoing'}
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-career-text-light">Projects</h2>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      <ProfileDataSection
        title="Projects"
        icon={<Code className="w-5 h-5" />}
        items={projects || []}
        editFields={projectFields}
        onAccept={handleAccept}
        onEdit={handleEdit}
        renderItem={renderProject}
        entityType="project"
      />

      {isCreating && (
        <div className="p-4 border rounded-lg bg-career-panel-light border-career-gray-light">
          <p className="text-sm text-career-text-muted-light mb-4">
            Create a new project entry
          </p>
          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">
              Create Project
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