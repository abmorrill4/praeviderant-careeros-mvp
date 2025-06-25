
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
        displayValue: parsed.join(', ')
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

function formatObjectDisplay(obj: Record<string, any>): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return 'Empty object';
  
  return entries
    .slice(0, 3) // Show only first 3 properties
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ') + (entries.length > 3 ? '...' : '');
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
