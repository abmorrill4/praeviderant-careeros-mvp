
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
  return parts.length > 1 ? parts[0] : 'general';
}
