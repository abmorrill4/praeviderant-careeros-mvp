
export interface ParsedData {
  type: 'text' | 'array' | 'object' | 'json';
  value: any;
  displayValue: string;
}

export function parseResumeFieldValue(rawValue: string | null): ParsedData {
  if (!rawValue) {
    return {
      type: 'text',
      value: '',
      displayValue: 'No data'
    };
  }

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(rawValue);
    
    if (Array.isArray(parsed)) {
      return {
        type: 'array',
        value: parsed,
        displayValue: formatArrayDisplay(parsed)
      };
    } else if (typeof parsed === 'object' && parsed !== null) {
      return {
        type: 'object',
        value: parsed,
        displayValue: formatObjectDisplay(parsed)
      };
    } else {
      return {
        type: 'json',
        value: parsed,
        displayValue: String(parsed)
      };
    }
  } catch {
    // Not JSON, treat as regular text
    return {
      type: 'text',
      value: rawValue,
      displayValue: rawValue
    };
  }
}

function formatArrayDisplay(arr: any[]): string {
  if (arr.length === 0) return 'Empty list';
  
  // Handle arrays of simple values
  const simpleValues = arr.filter(item => typeof item !== 'object');
  const complexValues = arr.filter(item => typeof item === 'object');
  
  if (simpleValues.length === arr.length) {
    // All simple values
    return simpleValues.slice(0, 3).join(', ') + (arr.length > 3 ? `... (+${arr.length - 3} more)` : '');
  }
  
  if (complexValues.length === arr.length) {
    // All complex objects
    return `${arr.length} item${arr.length !== 1 ? 's' : ''}`;
  }
  
  // Mixed content
  return `${arr.length} item${arr.length !== 1 ? 's' : ''} (mixed)`;
}

function formatObjectDisplay(obj: Record<string, any>): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return 'Empty object';
  
  const nonEmptyEntries = entries.filter(([key, value]) => 
    value !== null && value !== undefined && value !== ''
  );
  
  if (nonEmptyEntries.length === 0) return 'No data';
  
  return nonEmptyEntries
    .slice(0, 2) // Show only first 2 properties for brevity
    .map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      if (Array.isArray(value)) {
        return `${formattedKey}: ${value.length} item${value.length !== 1 ? 's' : ''}`;
      }
      const displayValue = String(value).length > 30 ? String(value).substring(0, 30) + '...' : String(value);
      return `${formattedKey}: ${displayValue}`;
    })
    .join(' • ') + (nonEmptyEntries.length > 2 ? '...' : '');
}

export function getFieldDisplayName(fieldName: string): string {
  const parts = fieldName.split('.');
  const lastPart = parts[parts.length - 1];
  
  return lastPart
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function getSectionFromFieldName(fieldName: string): string {
  const parts = fieldName.split('.');
  const section = parts.length > 1 ? parts[0] : 'general';
  
  // Enhanced section mapping to handle more resume sections
  const sectionMappings: Record<string, string> = {
    'personal': 'personal_info',
    'contact_info': 'contact',
    'contact': 'contact',
    'work': 'work_experience',
    'experience': 'work_experience',
    'employment': 'work_experience',
    'jobs': 'work_experience',
    'education': 'education',
    'academic': 'education',
    'skills': 'skills',
    'technical_skills': 'skills',
    'technologies': 'skills',
    'tools': 'skills',
    'projects': 'projects',
    'portfolio': 'projects',
    'certifications': 'certifications',
    'certificates': 'certifications',
    'awards': 'awards',
    'honors': 'awards',
    'achievements': 'awards',
    'publications': 'publications',
    'papers': 'publications',
    'articles': 'publications',
    'volunteer': 'volunteer_work',
    'volunteering': 'volunteer_work',
    'community': 'volunteer_work',
    'languages': 'languages',
    'linguistic': 'languages',
    'associations': 'professional_associations',
    'memberships': 'professional_associations',
    'organizations': 'professional_associations',
    'references': 'references',
    'recommendations': 'references'
  };

  // Check if section matches any known mappings
  const mappedSection = sectionMappings[section.toLowerCase()];
  if (mappedSection) {
    return mappedSection;
  }

  // Check if any part of the field name contains keywords for specific sections
  const fieldLower = fieldName.toLowerCase();
  
  if (fieldLower.includes('project') || fieldLower.includes('portfolio')) return 'projects';
  if (fieldLower.includes('cert') || fieldLower.includes('license')) return 'certifications';
  if (fieldLower.includes('award') || fieldLower.includes('honor') || fieldLower.includes('achievement')) return 'awards';
  if (fieldLower.includes('publication') || fieldLower.includes('paper') || fieldLower.includes('article')) return 'publications';
  if (fieldLower.includes('volunteer') || fieldLower.includes('community')) return 'volunteer_work';
  if (fieldLower.includes('language') || fieldLower.includes('linguistic')) return 'languages';
  if (fieldLower.includes('association') || fieldLower.includes('membership') || fieldLower.includes('organization')) return 'professional_associations';
  if (fieldLower.includes('reference') || fieldLower.includes('recommendation')) return 'references';
  if (fieldLower.includes('skill') || fieldLower.includes('technology') || fieldLower.includes('tool')) return 'skills';
  if (fieldLower.includes('work') || fieldLower.includes('job') || fieldLower.includes('employment') || fieldLower.includes('experience')) return 'work_experience';
  if (fieldLower.includes('education') || fieldLower.includes('degree') || fieldLower.includes('school') || fieldLower.includes('university')) return 'education';
  if (fieldLower.includes('contact') || fieldLower.includes('phone') || fieldLower.includes('email') || fieldLower.includes('address')) return 'contact';
  if (fieldLower.includes('name') || fieldLower.includes('personal')) return 'personal_info';

  return section || 'general';
}
