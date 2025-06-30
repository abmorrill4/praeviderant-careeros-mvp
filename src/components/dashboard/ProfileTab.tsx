
import React, { useState } from 'react';
import { 
  Building,
  GraduationCap,
  Award,
  Code,
  Trophy,
  BookOpen,
  Heart,
  Globe,
  Users,
  Star,
  Zap,
  Brain
} from 'lucide-react';
import { ProfileDataSection } from '@/components/profile/ProfileDataSection';
import { EnrichmentSummaryCards } from '@/components/profile/EnrichmentSummaryCards';
import { 
  EnhancedWorkExperienceRenderer,
  EnhancedEducationRenderer,
  EnhancedSkillRenderer,
  EnhancedProjectRenderer,
  EnhancedCertificationRenderer
} from '@/components/profile/EnhancedEntityRenderers';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { WorkExperience, Education, Skill, Project, Certification } from '@/types/versioned-entities';
import {
  workExperienceFields,
  educationFields,
  skillFields,
  projectFields,
  certificationFields
} from '@/components/profile/entityFieldConfigs';

export const ProfileTab: React.FC = () => {
  const { user } = useAuth();
  const [showEnhancedView, setShowEnhancedView] = useState(true);

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
        <h2 className="text-3xl font-bold text-career-text">
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
        <h2 className="text-3xl font-bold text-career-text">
          Profile Data
        </h2>
        <div className="flex items-center space-x-2">
          <Switch
            id="enhanced-view"
            checked={showEnhancedView}
            onCheckedChange={setShowEnhancedView}
          />
          <Label htmlFor="enhanced-view" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Enhanced View
          </Label>
        </div>
      </div>

      <p className="text-sm text-career-text-muted">
        Review and manage your comprehensive career information with AI-powered insights
      </p>

      {/* Enrichment Summary */}
      {showEnhancedView && user && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-career-text">
            AI Analysis Summary
          </h3>
          <EnrichmentSummaryCards userId={user.id} />
        </div>
      )}
      
      <div className="grid gap-6">
        <ProfileDataSection
          title="Work Experience"
          icon={<Building className="w-5 h-5" />}
          items={workExperience}
          editFields={workExperienceFields}
          onAccept={workActions.handleAccept}
          onEdit={workActions.handleEdit}
          renderItem={(item) => 
            showEnhancedView ? (
              <EnhancedWorkExperienceRenderer 
                item={item as WorkExperience} 
                entityId={item.logical_entity_id} 
              />
            ) : (
              <div>
                <h4 className="font-medium text-sm">{(item as WorkExperience).title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Building className="w-3 h-3" />
                  <span>{(item as WorkExperience).company}</span>
                  {(item as WorkExperience).start_date && (
                    <>
                      <span className="ml-2">
                        {(item as WorkExperience).start_date} - {(item as WorkExperience).end_date || 'Present'}
                      </span>
                    </>
                  )}
                </div>
                {(item as WorkExperience).description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {(item as WorkExperience).description}
                  </p>
                )}
              </div>
            )
          }
        />
        
        <ProfileDataSection
          title="Education"
          icon={<GraduationCap className="w-5 h-5" />}
          items={education}
          editFields={educationFields}
          onAccept={educationActions.handleAccept}
          onEdit={educationActions.handleEdit}
          renderItem={(item) => 
            showEnhancedView ? (
              <EnhancedEducationRenderer 
                item={item as Education} 
                entityId={item.logical_entity_id} 
              />
            ) : (
              <div>
                <h4 className="font-medium text-sm">{(item as Education).degree}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Building className="w-3 h-3" />
                  <span>{(item as Education).institution}</span>
                  {(item as Education).start_date && (
                    <span className="ml-2">
                      {(item as Education).start_date} - {(item as Education).end_date || 'Present'}
                    </span>
                  )}
                </div>
                {(item as Education).field_of_study && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Field: {(item as Education).field_of_study}
                  </p>
                )}
              </div>
            )
          }
        />
        
        <ProfileDataSection
          title="Skills & Technologies"
          icon={<Code className="w-5 h-5" />}
          items={skills}
          editFields={skillFields}
          onAccept={skillActions.handleAccept}
          onEdit={skillActions.handleEdit}
          renderItem={(item) => 
            showEnhancedView ? (
              <EnhancedSkillRenderer 
                item={item as Skill} 
                entityId={item.logical_entity_id} 
              />
            ) : (
              <div>
                <h4 className="font-medium text-sm">{(item as Skill).name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  {(item as Skill).category && (
                    <span className="bg-muted px-2 py-1 rounded">{(item as Skill).category}</span>
                  )}
                  {(item as Skill).proficiency_level && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>{(item as Skill).proficiency_level}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          }
        />
        
        <ProfileDataSection
          title="Projects & Portfolio"
          icon={<Zap className="w-5 h-5" />}
          items={projects}
          editFields={projectFields}
          onAccept={projectActions.handleAccept}
          onEdit={projectActions.handleEdit}
          renderItem={(item) => 
            showEnhancedView ? (
              <EnhancedProjectRenderer 
                item={item as Project} 
                entityId={item.logical_entity_id} 
              />
            ) : (
              <div>
                <h4 className="font-medium text-sm">{(item as Project).name}</h4>
                {(item as Project).start_date && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>
                      {(item as Project).start_date} - {(item as Project).end_date || 'Ongoing'}
                    </span>
                  </div>
                )}
                {(item as Project).description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {(item as Project).description}
                  </p>
                )}
              </div>
            )
          }
        />
        
        <ProfileDataSection
          title="Certifications & Licenses"
          icon={<Award className="w-5 h-5" />}
          items={certifications}
          editFields={certificationFields}
          onAccept={certificationActions.handleAccept}
          onEdit={certificationActions.handleEdit}
          renderItem={(item) => 
            showEnhancedView ? (
              <EnhancedCertificationRenderer 
                item={item as Certification} 
                entityId={item.logical_entity_id} 
              />
            ) : (
              <div>
                <h4 className="font-medium text-sm">{(item as Certification).name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Building className="w-3 h-3" />
                  <span>{(item as Certification).issuing_organization}</span>
                  {(item as Certification).issue_date && (
                    <span className="ml-2">
                      Issued: {(item as Certification).issue_date}
                    </span>
                  )}
                </div>
              </div>
            )
          }
        />
      </div>

      {/* Note about additional sections */}
      <div className="mt-8 p-4 border rounded-lg bg-career-panel border-career-gray">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-career-accent mt-0.5" />
          <div>
            <h3 className="font-medium text-career-text">
              AI-Enhanced Profile Analysis
            </h3>
            <p className="text-sm mt-1 text-career-text-muted">
              Your profile includes AI-powered insights that analyze your experience, identify key skills, 
              assess market relevance, and provide personalized recommendations for career advancement. 
              Toggle the AI Enhanced View to see or hide these insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
