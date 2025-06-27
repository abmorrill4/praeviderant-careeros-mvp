
import { useMemo } from 'react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import type { WorkExperience, Education, Skill } from '@/types/versioned-entities';

interface ProfileScoreBreakdown {
  overall: number;
  sections: {
    experience: { score: number; weight: number; details: ExperienceScoreDetails };
    education: { score: number; weight: number; details: EducationScoreDetails };
    skills: { score: number; weight: number; details: SkillsScoreDetails };
    interviews: { score: number; weight: number };
  };
  details: {
    totalEntities: number;
    completeEntities: number;
    qualityScore: number;
  };
  recommendations: string[];
  bestPracticeGaps: string[];
}

interface ExperienceScoreDetails {
  quantifiedAchievements: number;
  actionVerbUsage: number;
  industryKeywords: number;
  chronologyConsistency: number;
  descriptionQuality: number;
  impactStatements: number;
}

interface EducationScoreDetails {
  completeness: number;
  relevanceToCareer: number;
  additionalCredentials: number;
}

interface SkillsScoreDetails {
  technicalSkillsBalance: number;
  softSkillsBalance: number;
  industryRelevance: number;
  proficiencyClarity: number;
  contextualEvidence: number;
}

export const useEnhancedProfileScore = () => {
  const { data: workExperiences } = useLatestEntities<WorkExperience>('work_experience');
  const { data: education } = useLatestEntities<Education>('education');
  const { data: skills } = useLatestEntities<Skill>('skill');

  const profileScore = useMemo((): ProfileScoreBreakdown => {
    const weights = {
      experience: 45, // Increased weight for experience
      education: 20,  // Reduced weight for education
      skills: 25,     // Increased weight for skills
      interviews: 10, // Reduced weight for interviews
    };

    // Calculate enhanced experience score
    const experienceResult = calculateEnhancedExperienceScore(workExperiences || []);
    
    // Calculate enhanced education score
    const educationResult = calculateEnhancedEducationScore(education || []);
    
    // Calculate enhanced skills score
    const skillsResult = calculateEnhancedSkillsScore(skills || []);
    
    // Interview score (placeholder)
    const interviewsScore = 0;

    // Calculate weighted overall score
    const overallScore = Math.round(
      (experienceResult.score * weights.experience + 
       educationResult.score * weights.education + 
       skillsResult.score * weights.skills + 
       interviewsScore * weights.interviews) / 100
    );

    // Generate recommendations and gap analysis
    const recommendations = generateRecommendations(experienceResult, educationResult, skillsResult);
    const bestPracticeGaps = identifyBestPracticeGaps(experienceResult, educationResult, skillsResult);

    return {
      overall: overallScore,
      sections: {
        experience: { score: experienceResult.score, weight: weights.experience, details: experienceResult.details },
        education: { score: educationResult.score, weight: weights.education, details: educationResult.details },
        skills: { score: skillsResult.score, weight: weights.skills, details: skillsResult.details },
        interviews: { score: interviewsScore, weight: weights.interviews },
      },
      details: {
        totalEntities: (workExperiences?.length || 0) + (education?.length || 0) + (skills?.length || 0),
        completeEntities: calculateCompleteEntities(workExperiences || [], education || [], skills || []),
        qualityScore: calculateOverallQuality(experienceResult.score, educationResult.score, skillsResult.score),
      },
      recommendations,
      bestPracticeGaps,
    };
  }, [workExperiences, education, skills]);

  return profileScore;
};

function calculateEnhancedExperienceScore(experiences: WorkExperience[]): { score: number; details: ExperienceScoreDetails } {
  if (experiences.length === 0) {
    return { 
      score: 0, 
      details: { quantifiedAchievements: 0, actionVerbUsage: 0, industryKeywords: 0, chronologyConsistency: 0, descriptionQuality: 0, impactStatements: 0 }
    };
  }
  
  let totalScore = 0;
  const maxScore = experiences.length * 100;
  
  // Track detailed scoring metrics
  let quantifiedCount = 0;
  let actionVerbCount = 0;
  let industryKeywordCount = 0;
  let impactStatementCount = 0;
  let chronologyIssues = 0;
  
  const actionVerbs = ['achieved', 'developed', 'implemented', 'managed', 'led', 'created', 'improved', 'increased', 'reduced', 'launched', 'delivered', 'coordinated', 'optimized', 'established', 'designed'];
  const quantificationPatterns = /(\d+%|\$[\d,]+|\d+[km]?\+?|\d+x|increased by|reduced by|improved by)/gi;
  
  experiences.forEach((exp, index) => {
    let itemScore = 0;
    
    // Basic completeness (30 points)
    if (exp.title?.trim()) itemScore += 10;
    if (exp.company?.trim()) itemScore += 10;
    if (exp.start_date?.trim()) itemScore += 10;
    
    // Description quality and best practices (70 points)
    if (exp.description?.trim()) {
      const description = exp.description.trim();
      const descLength = description.length;
      
      // Length scoring (15 points)
      if (descLength > 300) itemScore += 15;
      else if (descLength > 200) itemScore += 12;
      else if (descLength > 100) itemScore += 8;
      else if (descLength > 50) itemScore += 5;
      
      // Quantified achievements (20 points)
      const quantifications = description.match(quantificationPatterns);
      if (quantifications && quantifications.length > 0) {
        itemScore += Math.min(20, quantifications.length * 5);
        quantifiedCount++;
      }
      
      // Action verb usage (15 points)
      const usedActionVerbs = actionVerbs.filter(verb => 
        description.toLowerCase().includes(verb.toLowerCase())
      );
      if (usedActionVerbs.length > 0) {
        itemScore += Math.min(15, usedActionVerbs.length * 3);
        actionVerbCount++;
      }
      
      // Impact statements detection (10 points)
      const impactKeywords = ['result', 'impact', 'outcome', 'achievement', 'success', 'improvement'];
      const hasImpactStatements = impactKeywords.some(keyword => 
        description.toLowerCase().includes(keyword)
      );
      if (hasImpactStatements) {
        itemScore += 10;
        impactStatementCount++;
      }
      
      // Industry keywords (10 points) - placeholder for now
      const commonIndustryTerms = ['strategy', 'process', 'team', 'project', 'client', 'customer', 'solution', 'technology', 'business', 'revenue'];
      const industryTermsFound = commonIndustryTerms.filter(term => 
        description.toLowerCase().includes(term)
      ).length;
      if (industryTermsFound > 0) {
        itemScore += Math.min(10, industryTermsFound * 2);
        industryKeywordCount++;
      }
    }
    
    // Chronology consistency check
    if (index > 0) {
      const prevExp = experiences[index - 1];
      if (exp.start_date && prevExp.end_date) {
        const currentStart = new Date(exp.start_date);
        const prevEnd = new Date(prevExp.end_date);
        if (currentStart < prevEnd) {
          chronologyIssues++;
        }
      }
    }
    
    totalScore += itemScore;
  });
  
  const score = Math.min(100, Math.round((totalScore / maxScore) * 100));
  
  const details: ExperienceScoreDetails = {
    quantifiedAchievements: Math.round((quantifiedCount / experiences.length) * 100),
    actionVerbUsage: Math.round((actionVerbCount / experiences.length) * 100),
    industryKeywords: Math.round((industryKeywordCount / experiences.length) * 100),
    chronologyConsistency: Math.max(0, 100 - (chronologyIssues * 20)),
    descriptionQuality: Math.round((experiences.filter(exp => exp.description && exp.description.length > 100).length / experiences.length) * 100),
    impactStatements: Math.round((impactStatementCount / experiences.length) * 100),
  };
  
  return { score, details };
}

function calculateEnhancedEducationScore(educationList: Education[]): { score: number; details: EducationScoreDetails } {
  if (educationList.length === 0) {
    return { 
      score: 0, 
      details: { completeness: 0, relevanceToCareer: 0, additionalCredentials: 0 }
    };
  }
  
  let totalScore = 0;
  const maxScore = educationList.length * 100;
  
  educationList.forEach(edu => {
    let itemScore = 0;
    
    // Basic completeness (60 points)
    if (edu.institution?.trim()) itemScore += 20;
    if (edu.degree?.trim()) itemScore += 20;
    if (edu.field_of_study?.trim()) itemScore += 20;
    
    // Dates (25 points)
    if (edu.start_date?.trim()) itemScore += 12;
    if (edu.end_date?.trim()) itemScore += 13;
    
    // Additional details (15 points)
    if (edu.description?.trim()) itemScore += 8;
    if (edu.gpa?.trim()) itemScore += 7;
    
    totalScore += itemScore;
  });
  
  const score = Math.min(100, Math.round((totalScore / maxScore) * 100));
  
  const details: EducationScoreDetails = {
    completeness: Math.round((educationList.filter(edu => 
      edu.institution && edu.degree && edu.field_of_study
    ).length / educationList.length) * 100),
    relevanceToCareer: 75, // Placeholder - would need career context
    additionalCredentials: educationList.length > 1 ? 100 : 50,
  };
  
  return { score, details };
}

function calculateEnhancedSkillsScore(skillsList: Skill[]): { score: number; details: SkillsScoreDetails } {
  if (skillsList.length === 0) {
    return { 
      score: 0, 
      details: { technicalSkillsBalance: 0, softSkillsBalance: 0, industryRelevance: 0, proficiencyClarity: 0, contextualEvidence: 0 }
    };
  }
  
  // Base score for having skills (40 points)
  let baseScore = Math.min(40, skillsList.length * 3);
  
  // Quality scoring (60 points)
  const skillsWithContext = skillsList.filter(skill => skill.narrative_context?.trim());
  const skillsWithProficiency = skillsList.filter(skill => skill.proficiency_level?.trim());
  const skillsWithExperience = skillsList.filter(skill => skill.years_of_experience && skill.years_of_experience > 0);
  
  const technicalSkills = skillsList.filter(skill => 
    ['programming_language', 'framework', 'tool', 'database', 'technical_skill'].includes(skill.category || '')
  );
  const softSkills = skillsList.filter(skill => skill.category === 'soft_skill');
  
  let qualityScore = 0;
  qualityScore += Math.min(20, skillsWithContext.length * 3); // Context bonus
  qualityScore += Math.min(20, skillsWithProficiency.length * 3); // Proficiency bonus
  qualityScore += Math.min(10, skillsWithExperience.length * 2); // Experience bonus
  qualityScore += Math.min(10, (technicalSkills.length > 0 && softSkills.length > 0) ? 10 : 5); // Balance bonus
  
  const score = Math.min(100, baseScore + qualityScore);
  
  const details: SkillsScoreDetails = {
    technicalSkillsBalance: Math.min(100, technicalSkills.length * 10),
    softSkillsBalance: Math.min(100, softSkills.length * 20),
    industryRelevance: 75, // Placeholder
    proficiencyClarity: Math.round((skillsWithProficiency.length / skillsList.length) * 100),
    contextualEvidence: Math.round((skillsWithContext.length / skillsList.length) * 100),
  };
  
  return { score, details };
}

function generateRecommendations(expResult: any, eduResult: any, skillsResult: any): string[] {
  const recommendations: string[] = [];
  
  // Experience recommendations
  if (expResult.details.quantifiedAchievements < 50) {
    recommendations.push("Add quantified achievements with specific numbers, percentages, or dollar amounts to your work experience");
  }
  
  if (expResult.details.actionVerbUsage < 70) {
    recommendations.push("Start more bullet points with strong action verbs like 'achieved', 'developed', 'led', or 'implemented'");
  }
  
  if (expResult.details.impactStatements < 50) {
    recommendations.push("Include more impact statements that clearly describe the results and outcomes of your work");
  }
  
  // Skills recommendations
  if (skillsResult.details.contextualEvidence < 60) {
    recommendations.push("Add context and stories to your skills to show how you've applied them in real situations");
  }
  
  if (skillsResult.details.technicalSkillsBalance < 50 && skillsResult.details.softSkillsBalance < 50) {
    recommendations.push("Balance your skills section with both technical and soft skills relevant to your target roles");
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push("Your profile is looking strong! Consider adding more specific examples and quantified results to stand out further");
  }
  
  return recommendations.slice(0, 3); // Limit to top 3 recommendations
}

function identifyBestPracticeGaps(expResult: any, eduResult: any, skillsResult: any): string[] {
  const gaps: string[] = [];
  
  if (expResult.details.chronologyConsistency < 90) {
    gaps.push("Chronology inconsistencies detected in work experience dates");
  }
  
  if (expResult.details.descriptionQuality < 70) {
    gaps.push("Work experience descriptions could be more detailed and comprehensive");
  }
  
  if (skillsResult.details.proficiencyClarity < 80) {
    gaps.push("Skill proficiency levels need clarification for better employer understanding");
  }
  
  if (eduResult.details.completeness < 90) {
    gaps.push("Education section missing some key details like field of study or dates");
  }
  
  return gaps;
}

function calculateCompleteEntities(experiences: WorkExperience[], education: Education[], skills: Skill[]): number {
  let complete = 0;
  
  // Count complete experiences (stricter criteria)
  experiences.forEach(exp => {
    if (exp.title?.trim() && exp.company?.trim() && exp.start_date?.trim() && 
        exp.description?.trim() && exp.description.length > 100) {
      complete++;
    }
  });
  
  // Count complete education
  education.forEach(edu => {
    if (edu.institution?.trim() && edu.degree?.trim() && edu.start_date?.trim() && edu.field_of_study?.trim()) {
      complete++;
    }
  });
  
  // Count complete skills (stricter criteria)
  skills.forEach(skill => {
    if (skill.name?.trim() && skill.proficiency_level?.trim() && skill.category?.trim()) {
      complete++;
    }
  });
  
  return complete;
}

function calculateOverallQuality(expScore: number, eduScore: number, skillScore: number): number {
  return Math.round((expScore * 0.45 + eduScore * 0.20 + skillScore * 0.35));
}
