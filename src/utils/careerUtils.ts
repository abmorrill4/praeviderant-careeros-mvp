
import type { WorkExperience } from '@/types/versioned-entities';

export interface CareerMilestone {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  duration: number; // in months
  level: number; // career progression level
}

const SENIORITY_LEVELS: Record<string, number> = {
  'intern': 1,
  'junior': 2,
  'associate': 3,
  'mid': 4,
  'senior': 5,
  'lead': 6,
  'principal': 7,
  'director': 8,
  'vp': 9,
  'executive': 10
};

export function processCareerMilestones(workExperiences: WorkExperience[]): CareerMilestone[] {
  return workExperiences
    .filter(exp => exp.start_date)
    .map(exp => {
      const startDate = new Date(exp.start_date!);
      const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      // Determine seniority level from title
      const titleLower = exp.title.toLowerCase();
      let level = 3; // default mid-level
      
      for (const [keyword, levelValue] of Object.entries(SENIORITY_LEVELS)) {
        if (titleLower.includes(keyword)) {
          level = levelValue;
          break;
        }
      }
      
      return {
        id: exp.logical_entity_id,
        title: exp.title,
        company: exp.company,
        startDate: exp.start_date!,
        endDate: exp.end_date,
        duration,
        level
      };
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function calculateCareerStats(milestones: CareerMilestone[]) {
  const totalExperience = milestones.reduce((sum, milestone) => sum + milestone.duration, 0);
  const careerSpan = milestones.length > 0 ? 
    Math.round((new Date().getTime() - new Date(milestones[0].startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
  const currentLevel = milestones[milestones.length - 1]?.level || 0;
  const maxLevel = Math.max(...milestones.map(m => m.level));

  return {
    totalExperience,
    careerSpan,
    currentLevel,
    maxLevel,
    averagePositionDuration: milestones.length > 0 ? Math.round(totalExperience / milestones.length) : 0,
    careerProgression: milestones.length > 1 ? 
      (currentLevel > milestones[0].level ? 'Upward trajectory' : 'Stable progression') : 
      'Building experience'
  };
}
