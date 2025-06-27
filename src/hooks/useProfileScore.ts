
import { useMemo } from 'react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import type { WorkExperience, Education, Skill } from '@/types/versioned-entities';

interface ProfileScoreBreakdown {
  overall: number;
  sections: {
    experience: { score: number; weight: number };
    education: { score: number; weight: number };
    skills: { score: number; weight: number };
    interviews: { score: number; weight: number }; // Placeholder for future implementation
  };
  details: {
    totalEntities: number;
    completeEntities: number;
    qualityScore: number;
  };
}

export const useProfileScore = () => {
  const { data: workExperiences } = useLatestEntities<WorkExperience>('work_experience');
  const { data: education } = useLatestEntities<Education>('education');
  const { data: skills } = useLatestEntities<Skill>('skill');

  const profileScore = useMemo((): ProfileScoreBreakdown => {
    // Section weights (should total 100)
    const weights = {
      experience: 40,
      education: 25,
      skills: 20,
      interviews: 15, // Reserved for future mini-interviews
    };

    // Calculate experience score
    const experienceScore = calculateExperienceScore(workExperiences || []);
    
    // Calculate education score
    const educationScore = calculateEducationScore(education || []);
    
    // Calculate skills score
    const skillsScore = calculateSkillsScore(skills || []);
    
    // Interview score (placeholder - will be 0 until interviews are implemented)
    const interviewsScore = 0;

    // Calculate weighted overall score
    const overallScore = Math.round(
      (experienceScore * weights.experience + 
       educationScore * weights.education + 
       skillsScore * weights.skills + 
       interviewsScore * weights.interviews) / 100
    );

    return {
      overall: overallScore,
      sections: {
        experience: { score: experienceScore, weight: weights.experience },
        education: { score: educationScore, weight: weights.education },
        skills: { score: skillsScore, weight: weights.skills },
        interviews: { score: interviewsScore, weight: weights.interviews },
      },
      details: {
        totalEntities: (workExperiences?.length || 0) + (education?.length || 0) + (skills?.length || 0),
        completeEntities: calculateCompleteEntities(workExperiences || [], education || [], skills || []),
        qualityScore: calculateOverallQuality(workExperiences || [], education || [], skills || []),
      },
    };
  }, [workExperiences, education, skills]);

  return profileScore;
};

// Helper functions for score calculations
function calculateExperienceScore(experiences: WorkExperience[]): number {
  if (experiences.length === 0) return 0;
  
  let totalScore = 0;
  const maxScore = experiences.length * 100;
  
  experiences.forEach(exp => {
    let itemScore = 0;
    
    // Basic fields (40 points)
    if (exp.title?.trim()) itemScore += 15;
    if (exp.company?.trim()) itemScore += 15;
    if (exp.start_date?.trim()) itemScore += 10;
    
    // Description quality (40 points)
    if (exp.description?.trim()) {
      const descLength = exp.description.trim().length;
      if (descLength > 200) itemScore += 40;
      else if (descLength > 100) itemScore += 30;
      else if (descLength > 50) itemScore += 20;
      else itemScore += 10;
    }
    
    // Date completeness (20 points)
    if (exp.start_date?.trim()) itemScore += 10;
    if (exp.end_date?.trim() || isCurrentRole(exp)) itemScore += 10;
    
    totalScore += itemScore;
  });
  
  return Math.min(100, Math.round((totalScore / maxScore) * 100));
}

function calculateEducationScore(educationList: Education[]): number {
  if (educationList.length === 0) return 0;
  
  let totalScore = 0;
  const maxScore = educationList.length * 100;
  
  educationList.forEach(edu => {
    let itemScore = 0;
    
    // Basic fields (60 points)
    if (edu.institution?.trim()) itemScore += 20;
    if (edu.degree?.trim()) itemScore += 20;
    if (edu.field_of_study?.trim()) itemScore += 20;
    
    // Dates (30 points)
    if (edu.start_date?.trim()) itemScore += 15;
    if (edu.end_date?.trim()) itemScore += 15;
    
    // Additional details (10 points)
    if (edu.description?.trim() || edu.gpa?.trim()) itemScore += 10;
    
    totalScore += itemScore;
  });
  
  return Math.min(100, Math.round((totalScore / maxScore) * 100));
}

function calculateSkillsScore(skillsList: Skill[]): number {
  if (skillsList.length === 0) return 0;
  
  // Base score for having skills
  let baseScore = Math.min(60, skillsList.length * 5); // Up to 60 points for quantity
  
  // Quality bonus
  let qualityScore = 0;
  const skillsWithContext = skillsList.filter(skill => skill.narrative_context?.trim());
  const skillsWithProficiency = skillsList.filter(skill => skill.proficiency_level?.trim());
  const skillsWithExperience = skillsList.filter(skill => skill.years_of_experience && skill.years_of_experience > 0);
  
  qualityScore += Math.min(15, skillsWithContext.length * 2);
  qualityScore += Math.min(15, skillsWithProficiency.length * 2);
  qualityScore += Math.min(10, skillsWithExperience.length * 2);
  
  return Math.min(100, baseScore + qualityScore);
}

function calculateCompleteEntities(experiences: WorkExperience[], education: Education[], skills: Skill[]): number {
  let complete = 0;
  
  // Count complete experiences
  experiences.forEach(exp => {
    if (exp.title?.trim() && exp.company?.trim() && exp.start_date?.trim() && exp.description?.trim()) {
      complete++;
    }
  });
  
  // Count complete education
  education.forEach(edu => {
    if (edu.institution?.trim() && edu.degree?.trim() && edu.start_date?.trim()) {
      complete++;
    }
  });
  
  // Count complete skills (basic threshold)
  skills.forEach(skill => {
    if (skill.name?.trim() && skill.proficiency_level?.trim()) {
      complete++;
    }
  });
  
  return complete;
}

function calculateOverallQuality(experiences: WorkExperience[], education: Education[], skills: Skill[]): number {
  const expScore = calculateExperienceScore(experiences);
  const eduScore = calculateEducationScore(education);
  const skillScore = calculateSkillsScore(skills);
  
  const totalEntities = experiences.length + education.length + skills.length;
  if (totalEntities === 0) return 0;
  
  // Weighted average based on entity counts
  const expWeight = experiences.length / totalEntities;
  const eduWeight = education.length / totalEntities;
  const skillWeight = skills.length / totalEntities;
  
  return Math.round(expScore * expWeight + eduScore * eduWeight + skillScore * skillWeight);
}

function isCurrentRole(experience: WorkExperience): boolean {
  return !experience.end_date || experience.end_date.toLowerCase().includes('current') || experience.end_date.toLowerCase().includes('present');
}
