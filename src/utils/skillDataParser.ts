
export interface ParsedSkillData {
  name: string;
  category?: string;
  proficiency_level?: string;
  years_of_experience?: number;
}

export function parseSkillData(skillName: string, skillCategory?: string, skillProficiency?: string): ParsedSkillData {
  // First, check if we have proper data in separate fields
  if (skillCategory || skillProficiency) {
    return {
      name: skillName,
      category: skillCategory,
      proficiency_level: skillProficiency,
    };
  }

  // Handle JSON string in name field
  if (skillName && (skillName.startsWith('{') || skillName.startsWith('['))) {
    try {
      const parsed = JSON.parse(skillName);
      
      // Handle array of skills
      if (Array.isArray(parsed)) {
        const firstSkill = parsed[0];
        if (typeof firstSkill === 'object' && firstSkill.name) {
          return {
            name: firstSkill.name,
            category: firstSkill.category,
            proficiency_level: firstSkill.proficiency_level,
            years_of_experience: firstSkill.years_of_experience,
          };
        }
        return { name: String(firstSkill) };
      }
      
      // Handle single skill object
      if (typeof parsed === 'object' && parsed.name) {
        return {
          name: parsed.name,
          category: parsed.category,
          proficiency_level: parsed.proficiency_level,
          years_of_experience: parsed.years_of_experience,
        };
      }
      
      return { name: String(parsed) };
    } catch {
      // If JSON parsing fails, treat as regular text
      return { name: skillName };
    }
  }

  // Handle [object Object] format
  if (skillName === '[object Object]') {
    return { name: 'Unknown Skill' };
  }

  // Return as-is for regular text
  return { name: skillName || 'Unknown Skill' };
}

export function formatProficiencyLevel(level?: string): string {
  if (!level) return 'Not specified';
  
  const levelMap: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
    'expert': 'Expert',
    '1': 'Beginner',
    '2': 'Intermediate', 
    '3': 'Advanced',
    '4': 'Expert',
    '5': 'Expert'
  };
  
  return levelMap[level.toLowerCase()] || level;
}

export function getCategoryColor(category?: string): string {
  if (!category) return 'bg-gray-100 text-gray-800';
  
  const colorMap: Record<string, string> = {
    'programming': 'bg-blue-100 text-blue-800',
    'framework': 'bg-green-100 text-green-800',
    'tool': 'bg-purple-100 text-purple-800',
    'language': 'bg-orange-100 text-orange-800',
    'database': 'bg-red-100 text-red-800',
    'soft': 'bg-pink-100 text-pink-800',
    'technical': 'bg-indigo-100 text-indigo-800',
  };
  
  return colorMap[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
}
