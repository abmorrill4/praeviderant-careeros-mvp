
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Building,
  GraduationCap,
  Award,
  Code,
  Trophy
} from 'lucide-react';
import { ProfileDataSection } from '@/components/profile/ProfileDataSection';
import { 
  WorkExperienceRenderer,
  EducationRenderer,
  SkillRenderer,
  ProjectRenderer,
  CertificationRenderer
} from '@/components/profile/EntityRenderers';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { useEntityActions } from '@/hooks/useEntityActions';
import type { WorkExperience, Education, Skill, Project, Certification } from '@/types/versioned-entities';
import {
  workExperienceFields,
  educationFields,
  skillFields,
  projectFields,
  certificationFields
} from '@/components/profile/entityFieldConfigs';

export const ProfileTab: React.FC = () => {
  const { theme } = useTheme();

  // Fetch all entity data
  const { data: workExperience = [], isLoading: loadingWork } = useLatestEntities<WorkExperience>('work_experience');
  const { data: education = [], isLoading: loadingEducation } = useLatestEntities<Education>('education');
  const { data: skills = [], isLoading: loadingSkills } = useLatestEntities<Skill>('skill');
  const { data: projects = [], isLoading: loadingProjects } = useLatestEntities<Project>('project');
  const { data: certifications = [], isLoading: loadingCertifications } = useLatestEntities<Certification>('certification');

  // Entity action hooks
  const workActions = useEntityActions<WorkExperience>('work_experience');
  const educationActions = useEntityActions<Education>('education');
  const skillActions = useEntityActions<Skill>('skill');
  const projectActions = useEntityActions<Project>('project');
  const certificationActions = useEntityActions<Certification>('certification');

  const isLoading = loadingWork || loadingEducation || loadingSkills || loadingProjects || loadingCertifications;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          Profile Data
        </h2>
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          Profile Data
        </h2>
        <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Review and manage your career information
        </p>
      </div>
      
      <div className="grid gap-6">
        <ProfileDataSection
          title="Work Experience"
          icon={<Building className="w-5 h-5" />}
          items={workExperience}
          editFields={workExperienceFields}
          onAccept={workActions.handleAccept}
          onEdit={workActions.handleEdit}
          renderItem={(item) => <WorkExperienceRenderer item={item as WorkExperience} />}
        />
        
        <ProfileDataSection
          title="Education"
          icon={<GraduationCap className="w-5 h-5" />}
          items={education}
          editFields={educationFields}
          onAccept={educationActions.handleAccept}
          onEdit={educationActions.handleEdit}
          renderItem={(item) => <EducationRenderer item={item as Education} />}
        />
        
        <ProfileDataSection
          title="Skills"
          icon={<Award className="w-5 h-5" />}
          items={skills}
          editFields={skillFields}
          onAccept={skillActions.handleAccept}
          onEdit={skillActions.handleEdit}
          renderItem={(item) => <SkillRenderer item={item as Skill} />}
        />
        
        <ProfileDataSection
          title="Projects"
          icon={<Code className="w-5 h-5" />}
          items={projects}
          editFields={projectFields}
          onAccept={projectActions.handleAccept}
          onEdit={projectActions.handleEdit}
          renderItem={(item) => <ProjectRenderer item={item as Project} />}
        />
        
        <ProfileDataSection
          title="Certifications"
          icon={<Trophy className="w-5 h-5" />}
          items={certifications}
          editFields={certificationFields}
          onAccept={certificationActions.handleAccept}
          onEdit={certificationActions.handleEdit}
          renderItem={(item) => <CertificationRenderer item={item as Certification} />}
        />
      </div>
    </div>
  );
};
