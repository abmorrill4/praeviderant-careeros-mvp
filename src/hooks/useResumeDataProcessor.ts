
import { useCreateEntity } from '@/hooks/useVersionedEntities';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { WorkExperience, Education, Skill, Project, Certification } from '@/types/versioned-entities';

interface ResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  workExperience: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    technologies?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    fieldOfStudy?: string;
  }>;
  skills: Array<{
    name: string;
    category?: string;
  }>;
  projects: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate?: string;
    expirationDate?: string;
  }>;
}

export const useResumeDataProcessor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const createWorkExperience = useCreateEntity<WorkExperience>('work_experience');
  const createEducation = useCreateEntity<Education>('education');
  const createSkill = useCreateEntity<Skill>('skill');
  const createProject = useCreateEntity<Project>('project');
  const createCertification = useCreateEntity<Certification>('certification');

  const processResumeData = async (resumeData: ResumeData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      let totalEntities = 0;

      // Process work experience
      for (const work of resumeData.workExperience || []) {
        await createWorkExperience.mutateAsync({
          entityData: {
            user_id: user.id,
            title: work.title,
            company: work.company,
            start_date: work.startDate || null,
            end_date: work.endDate || null,
            description: work.description || null,
          },
          source: 'AI_EXTRACTION',
          sourceConfidence: 0.8,
        });
        totalEntities++;
      }

      // Process education
      for (const edu of resumeData.education || []) {
        await createEducation.mutateAsync({
          entityData: {
            user_id: user.id,
            degree: edu.degree,
            institution: edu.institution,
            start_date: edu.startDate || null,
            end_date: edu.endDate || null,
            field_of_study: edu.fieldOfStudy || null,
            gpa: edu.gpa || null,
          },
          source: 'AI_EXTRACTION',
          sourceConfidence: 0.8,
        });
        totalEntities++;
      }

      // Process skills
      for (const skill of resumeData.skills || []) {
        await createSkill.mutateAsync({
          entityData: {
            user_id: user.id,
            name: skill.name,
            category: skill.category || null,
            proficiency_level: null,
            years_of_experience: null,
          },
          source: 'AI_EXTRACTION',
          sourceConfidence: 0.8,
        });
        totalEntities++;
      }

      // Process projects
      for (const project of resumeData.projects || []) {
        await createProject.mutateAsync({
          entityData: {
            user_id: user.id,
            name: project.name,
            description: project.description || null,
            technologies_used: project.technologies || null,
            project_url: project.url || null,
            repository_url: null,
            start_date: null,
            end_date: null,
          },
          source: 'AI_EXTRACTION',
          sourceConfidence: 0.8,
        });
        totalEntities++;
      }

      // Process certifications
      for (const cert of resumeData.certifications || []) {
        await createCertification.mutateAsync({
          entityData: {
            user_id: user.id,
            name: cert.name,
            issuing_organization: cert.issuer,
            issue_date: cert.issueDate || null,
            expiration_date: cert.expirationDate || null,
            credential_id: null,
            credential_url: null,
          },
          source: 'AI_EXTRACTION',
          sourceConfidence: 0.8,
        });
        totalEntities++;
      }

      toast({
        title: "Resume processed successfully",
        description: `${totalEntities} items extracted and added to your profile for review`,
      });

    } catch (error) {
      console.error('Error processing resume data:', error);
      toast({
        title: "Error processing resume",
        description: "Failed to extract data from resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    processResumeData,
    isProcessing: createWorkExperience.isPending || createEducation.isPending || 
                  createSkill.isPending || createProject.isPending || createCertification.isPending,
  };
};
