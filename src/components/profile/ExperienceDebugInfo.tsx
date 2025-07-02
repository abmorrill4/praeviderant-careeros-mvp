
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { calculateExperienceYears, formatExperienceYears } from '@/utils/dateUtils';
import { differenceInMonths, parseISO } from 'date-fns';
import type { WorkExperience } from '@/types/versioned-entities';

// Helper function to parse flexible date formats (matching the internal logic from dateUtils)
function parseFlexibleDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  try {
    // Try ISO format first
    if (dateString.includes('-') && dateString.length >= 7) {
      return parseISO(dateString);
    }
    
    // Handle "Month Year" format like "January 2020"
    const monthYearMatch = dateString.match(/^(\w+)\s+(\d{4})$/);
    if (monthYearMatch) {
      const [, month, year] = monthYearMatch;
      const monthIndex = getMonthIndex(month);
      if (monthIndex !== -1) {
        return new Date(parseInt(year), monthIndex, 1);
      }
    }
    
    // Handle "Year" format like "2020"
    const yearMatch = dateString.match(/^(\d{4})$/);
    if (yearMatch) {
      return new Date(parseInt(yearMatch[1]), 0, 1);
    }
    
    // Handle "MM/YYYY" format
    const mmYearMatch = dateString.match(/^(\d{1,2})\/(\d{4})$/);
    if (mmYearMatch) {
      const [, month, year] = mmYearMatch;
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
}

function getMonthIndex(monthName: string): number {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  return months.findIndex(month => 
    month.startsWith(monthName.toLowerCase().substring(0, 3))
  );
}

export const ExperienceDebugInfo: React.FC = () => {
  const { data: workExperiences } = useLatestEntities<WorkExperience>('work_experience');
  const totalExperience = calculateExperienceYears(workExperiences || []);

  if (!workExperiences || workExperiences.length === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">Experience Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-600">No work experiences found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm text-blue-800">Experience Calculation Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <strong>Total Experience: {formatExperienceYears(totalExperience)}</strong>
        </div>
        
        <div className="space-y-2">
          {workExperiences.map((exp, index) => {
            const startDate = parseFlexibleDate(exp.start_date || '');
            const endDate = exp.end_date ? parseFlexibleDate(exp.end_date) : new Date();
            
            let duration = 0;
            let durationMonths = 0;
            if (startDate && endDate) {
              durationMonths = differenceInMonths(endDate, startDate);
              duration = durationMonths / 12;
            }
            
            return (
              <div key={exp.logical_entity_id} className="text-xs bg-white p-2 rounded border">
                <div className="font-medium">{exp.title} at {exp.company}</div>
                <div className="text-gray-600">
                  Raw dates: {exp.start_date || 'N/A'} → {exp.end_date || 'Present'}
                </div>
                <div className="text-gray-600">
                  Parsed dates: {startDate?.toLocaleDateString() || 'Invalid'} → {endDate?.toLocaleDateString() || 'Invalid'}
                </div>
                <div className="text-blue-600 font-medium">
                  Duration: {duration > 0 ? `${Math.round(duration * 10) / 10} years (${durationMonths} months)` : 'Could not calculate'}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
