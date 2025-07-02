
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { calculateExperienceYears, parseDate, formatExperienceYears } from '@/utils/dateUtils';
import type { WorkExperience } from '@/types/versioned-entities';

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
            const startDate = parseDate(exp.start_date || '');
            const endDate = exp.end_date ? parseDate(exp.end_date) : new Date();
            
            let duration = 0;
            if (startDate && endDate) {
              const timeDiff = endDate.getTime() - startDate.getTime();
              duration = timeDiff / (1000 * 60 * 60 * 24 * 365.25);
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
                  Duration: {duration > 0 ? formatExperienceYears(duration) : 'Could not calculate'}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
