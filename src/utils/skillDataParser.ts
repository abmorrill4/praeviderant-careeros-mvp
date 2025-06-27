
export interface ParsedSkillData {
  name: string;
  category?: string;
  proficiency_level?: string;
  years_of_experience?: number;
}

export function parseSkillData(skillName: string, skillCategory?: string, skillProficiency?: string): ParsedSkillData {
  console.log('Parsing skill data:', { skillName, skillCategory, skillProficiency });
  
  // Handle null/undefined cases
  if (!skillName || skillName === 'null' || skillName === 'undefined') {
    return { name: 'Unknown Skill' };
  }

  // First, check if we have proper data in separate fields
  if (skillCategory && skillCategory !== 'null' && skillCategory !== 'undefined') {
    return {
      name: cleanSkillName(skillName),
      category: skillCategory,
      proficiency_level: skillProficiency,
    };
  }

  // Handle [object Object] format
  if (skillName === '[object Object]' || skillName.includes('[object Object]')) {
    return { name: 'Unknown Skill' };
  }

  // Handle JSON string in name field - this is the main issue we're fixing
  if (skillName && (skillName.startsWith('{') && skillName.endsWith('}'))) {
    try {
      const parsed = JSON.parse(skillName);
      console.log('Successfully parsed JSON from skill name:', parsed);
      
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          name: cleanSkillName(parsed.name || parsed.skill || 'Unknown Skill'),
          category: parsed.category,
          proficiency_level: parsed.proficiency_level || parsed.proficiency,
          years_of_experience: parsed.years_of_experience || parsed.years,
        };
      }
    } catch (error) {
      console.log('Failed to parse skill JSON:', skillName, error);
      // Fall through to other parsing methods
    }
  }

  // Handle comma-separated key-value pairs (Name:Agile,Category:...)
  if (skillName.includes('Name:') && skillName.includes(',')) {
    try {
      const parsed = parseKeyValueString(skillName);
      return {
        name: cleanSkillName(parsed.Name || parsed.name || 'Unknown Skill'),
        category: parsed.Category || parsed.category,
        proficiency_level: parsed.ProficiencyLevel || parsed.proficiency_level || parsed.Proficiency,
        years_of_experience: parsed.YearsOfExperience ? parseInt(parsed.YearsOfExperience) : undefined,
      };
    } catch (error) {
      console.log('Failed to parse key-value string:', skillName, error);
    }
  }

  // Handle array format
  if (skillName && skillName.startsWith('[')) {
    try {
      const parsed = JSON.parse(skillName);
      
      // Handle array of skills - take the first one
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return { name: 'Unknown Skill' };
        
        const firstSkill = parsed[0];
        if (typeof firstSkill === 'object' && firstSkill !== null) {
          return {
            name: cleanSkillName(firstSkill.name || firstSkill.skill || 'Unknown Skill'),
            category: firstSkill.category,
            proficiency_level: firstSkill.proficiency_level || firstSkill.proficiency,
            years_of_experience: firstSkill.years_of_experience || firstSkill.years,
          };
        }
        return { name: cleanSkillName(String(firstSkill)) };
      }
    } catch (error) {
      console.log('Failed to parse skill array:', skillName, error);
    }
  }

  // Handle stringified objects that don't start with { or [
  if (skillName.includes('name:') || skillName.includes('"name"')) {
    try {
      // Try to extract name from string representations
      const nameMatch = skillName.match(/(?:name[:\s]*["\']([^"\']+)["\']|"name"[:\s]*"([^"]+)")/i);
      if (nameMatch) {
        return { name: cleanSkillName(nameMatch[1] || nameMatch[2]) };
      }
    } catch (error) {
      console.log('Failed to extract name from skill string:', skillName);
    }
  }

  // Return cleaned skill name for regular text
  return { name: cleanSkillName(skillName) };
}

function parseKeyValueString(str: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Split by comma and process each key-value pair
  const pairs = str.split(',');
  
  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex > -1) {
      const key = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();
      if (key && value) {
        result[key] = value;
      }
    }
  }
  
  return result;
}

function cleanSkillName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'Unknown Skill';
  }
  
  // Remove common prefixes and clean up the name
  let cleaned = name
    .replace(/^(skill[:\s]*|name[:\s]*)/i, '') // Remove "skill:" or "name:" prefixes
    .replace(/[{}"'\[\]]/g, '') // Remove JSON-like characters
    .replace(/^\s*,\s*/, '') // Remove leading comma and spaces
    .trim();
    
  // If the cleaned name is empty or just whitespace, return default
  if (!cleaned || cleaned.length === 0) {
    return 'Unknown Skill';
  }
  
  // Capitalize first letter of each word
  return cleaned.replace(/\b\w/g, l => l.toUpperCase());
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
    'programming_language': 'bg-blue-100 text-blue-800',
    'framework': 'bg-green-100 text-green-800',
    'tool': 'bg-purple-100 text-purple-800',
    'language': 'bg-orange-100 text-orange-800',
    'database': 'bg-red-100 text-red-800',
    'soft': 'bg-pink-100 text-pink-800',
    'soft_skill': 'bg-pink-100 text-pink-800',
    'technical': 'bg-indigo-100 text-indigo-800',
    'technical_skill': 'bg-indigo-100 text-indigo-800',
    'general': 'bg-gray-100 text-gray-800',
  };
  
  return colorMap[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
}
