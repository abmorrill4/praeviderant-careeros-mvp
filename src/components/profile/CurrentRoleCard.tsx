
import React from 'react';
import { Building, Calendar, MapPin } from 'lucide-react';
import { formatDateRange } from '@/utils/dateUtils';
import type { WorkExperience } from '@/types/versioned-entities';

interface CurrentRoleCardProps {
  currentRole?: WorkExperience;
}

export const CurrentRoleCard: React.FC<CurrentRoleCardProps> = ({ currentRole }) => {
  if (!currentRole) {
    return (
      <div className="neo-card p-6">
        <h3 className="text-lg font-semibold neo-text mb-4">Current Position</h3>
        <div className="text-center py-8">
          <Building className="w-12 h-12 neo-text-muted mx-auto mb-4" />
          <p className="neo-text-muted">No current position found</p>
          <p className="text-sm neo-text-muted mt-2">
            Add your work experience to see your current role
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="neo-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Building className="w-5 h-5 neo-text-accent" />
        <h3 className="text-lg font-semibold neo-text">Current Position</h3>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xl font-bold neo-text mb-1">
            {currentRole.title}
          </h4>
          <p className="text-lg neo-text-muted mb-3">
            {currentRole.company}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm neo-text-muted">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDateRange(currentRole.start_date, currentRole.end_date)}</span>
          </div>
          {!currentRole.end_date && (
            <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Active
            </div>
          )}
        </div>

        {currentRole.description && (
          <div className="mt-4">
            <p className="text-sm neo-text leading-relaxed line-clamp-3">
              {currentRole.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
