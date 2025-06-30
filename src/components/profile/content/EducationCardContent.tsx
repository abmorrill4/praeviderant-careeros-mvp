
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Calendar, GraduationCap, Edit, Plus, FileText } from 'lucide-react';
import type { Education } from '@/types/versioned-entities';

interface EducationCardContentProps {
  item: Education;
}

export const EducationCardContent: React.FC<EducationCardContentProps> = ({ item }) => {
  const { theme } = useTheme();

  const handleAction = (action: string) => {
    console.log(`Action: ${action} for education ID:`, item.logical_entity_id);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-career-text-muted-light mb-2">
            Duration
          </h4>
          <div className="flex items-center gap-2 text-sm text-career-text-light">
            <Calendar className="w-4 h-4" />
            <span>{item.start_date} - {item.end_date || 'Present'}</span>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-career-text-muted-light mb-2">
            Institution
          </h4>
          <div className="flex items-center gap-2 text-sm text-career-text-light">
            <GraduationCap className="w-4 h-4" />
            <span>{item.institution}</span>
          </div>
        </div>
      </div>

      {/* Field of Study */}
      {item.field_of_study && (
        <div>
          <h4 className="text-sm font-medium text-career-text-muted-light mb-2">
            Field of Study
          </h4>
          <p className="text-sm text-career-text-light">
            {item.field_of_study}
          </p>
        </div>
      )}

      {/* GPA */}
      {item.gpa && (
        <div>
          <h4 className="text-sm font-medium text-career-text-muted-light mb-2">
            GPA
          </h4>
          <p className="text-sm text-career-text-light">
            {item.gpa}
          </p>
        </div>
      )}

      {/* Description */}
      {item.description ? (
        <div>
          <h4 className="text-sm font-medium text-career-text-muted-light mb-2">
            Description
          </h4>
          <p className="text-sm text-career-text-light leading-relaxed">
            {item.description}
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-lg border-2 border-dashed border-career-gray-light text-center">
          <p className="text-sm text-career-text-muted-light mb-3">
            No additional details added yet
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleAction('Add Description')}
            className="border-career-gray-light hover:bg-career-gray-light"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Description
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-opacity-20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('Edit Basic Info')}
          className="border-career-gray-light hover:bg-career-gray-light"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Details
        </Button>

        {!item.field_of_study && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('Add Field of Study')}
            className="border-career-gray-light hover:bg-career-gray-light"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field of Study
          </Button>
        )}

        {!item.description && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('Add Context')}
            className="border-career-gray-light hover:bg-career-gray-light"
          >
            <FileText className="w-4 h-4 mr-2" />
            Add Context
          </Button>
        )}
      </div>
    </div>
  );
};
