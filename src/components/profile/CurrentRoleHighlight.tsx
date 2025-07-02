
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { formatDateRange } from '@/utils/dateUtils';
import type { WorkExperience } from '@/types/versioned-entities';

interface CurrentRoleHighlightProps {
  currentRole?: WorkExperience;
}

export const CurrentRoleHighlight: React.FC<CurrentRoleHighlightProps> = ({
  currentRole,
}) => {
  if (!currentRole) return null;

  return (
    <Card className="bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">
          Current Position
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-1">
              {currentRole.title}
            </h3>
            <p className="text-lg text-slate-600 mb-3">
              {currentRole.company}
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDateRange(currentRole.start_date, currentRole.end_date)}</span>
            </div>
            {!currentRole.end_date && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Active
              </Badge>
            )}
          </div>
          
          {currentRole.description && (
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
              {currentRole.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
