
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { useEnhancedProfileScore } from '@/hooks/useEnhancedProfileScore';
import { calculateExperienceYears } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import type { WorkExperience, Education, Skill, Project, Certification } from '@/types/versioned-entities';

export interface UnifiedProfileData {
  // Core entities
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  
  // AI enrichment data
  careerEnrichment?: {
    persona_type: string;
    role_archetype: string;
    leadership_score: number;
    technical_depth_score: number;
    scope_score: number;
    leadership_explanation?: string;
    technical_depth_explanation?: string;
    scope_explanation?: string;
    persona_explanation?: string;
    role_archetype_explanation?: string;
  };
  
  careerNarratives: Array<{
    narrative_type: string;
    narrative_text: string;
    narrative_explanation?: string;
  }>;
  
  entryEnrichments: Array<{
    parsed_entity_id: string;
    experience_level?: string;
    market_relevance?: string;
    skills_identified: any[];
    recommendations: any[];
    insights: any[];
  }>;
  
  // Computed metrics
  metrics: {
    totalExperienceYears: number;
    totalPositions: number;
    totalSkills: number;
    totalProjects: number;
    totalCertifications: number;
    profileCompleteness: number;
    currentRole?: WorkExperience;
  };
  
  // Loading states
  isLoading: boolean;
  error?: Error;
}

export function useUnifiedProfileData(): UnifiedProfileData {
  const { user } = useAuth();
  
  // Fetch core entities
  const { data: workExperience = [], isLoading: loadingWork } = useLatestEntities<WorkExperience>('work_experience');
  const { data: education = [], isLoading: loadingEducation } = useLatestEntities<Education>('education');
  const { data: skills = [], isLoading: loadingSkills } = useLatestEntities<Skill>('skill');
  const { data: projects = [], isLoading: loadingProjects } = useLatestEntities<Project>('project');
  const { data: certifications = [], isLoading: loadingCerts } = useLatestEntities<Certification>('certification');
  
  const profileScore = useEnhancedProfileScore();
  
  // Fetch AI enrichment data
  const { data: enrichmentData, isLoading: loadingEnrichment } = useQuery({
    queryKey: ['unified-enrichment-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get career enrichment
      const { data: careerEnrichment } = await supabase
        .from('career_enrichment')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Get career narratives
      const { data: careerNarratives } = await supabase
        .from('career_narratives')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Get entry enrichments
      const { data: entryEnrichments } = await supabase
        .from('entry_enrichment')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      return {
        careerEnrichment,
        careerNarratives: careerNarratives || [],
        entryEnrichments: entryEnrichments || []
      };
    },
    enabled: !!user?.id,
  });
  
  const isLoading = loadingWork || loadingEducation || loadingSkills || loadingProjects || loadingCerts || loadingEnrichment;
  
  // Sort work experience by most recent first
  const sortedWorkExperience = [...workExperience].sort((a, b) => {
    // Current roles (no end date) come first
    if (!a.end_date && b.end_date) return -1;
    if (a.end_date && !b.end_date) return 1;
    
    // Then by start date, most recent first
    if (a.start_date && b.start_date) {
      return b.start_date.localeCompare(a.start_date);
    }
    
    return 0;
  });
  
  // Calculate metrics
  const totalExperienceYears = calculateExperienceYears(workExperience);
  const currentRole = sortedWorkExperience[0]; // Most recent after sorting
  
  const metrics = {
    totalExperienceYears,
    totalPositions: workExperience.length,
    totalSkills: skills.length,
    totalProjects: projects.length,
    totalCertifications: certifications.length,
    profileCompleteness: profileScore.overall,
    currentRole
  };
  
  // Transform entry enrichments to match expected interface
  const transformedEntryEnrichments = (enrichmentData?.entryEnrichments || []).map(enrichment => ({
    parsed_entity_id: enrichment.parsed_entity_id,
    experience_level: enrichment.experience_level,
    market_relevance: enrichment.market_relevance,
    skills_identified: Array.isArray(enrichment.skills_identified) 
      ? enrichment.skills_identified 
      : [],
    recommendations: Array.isArray(enrichment.recommendations) 
      ? enrichment.recommendations 
      : [],
    insights: Array.isArray(enrichment.insights) 
      ? enrichment.insights 
      : []
  }));
  
  console.log('UnifiedProfileData metrics:', {
    totalExperienceYears,
    workExperienceCount: workExperience.length,
    sortedExperiences: sortedWorkExperience.slice(0, 3).map(exp => ({
      title: exp.title,
      company: exp.company,
      start_date: exp.start_date,
      end_date: exp.end_date
    }))
  });
  
  return {
    workExperience: sortedWorkExperience,
    education,
    skills,
    projects,
    certifications,
    careerEnrichment: enrichmentData?.careerEnrichment || undefined,
    careerNarratives: enrichmentData?.careerNarratives || [],
    entryEnrichments: transformedEntryEnrichments,
    metrics,
    isLoading
  };
}
