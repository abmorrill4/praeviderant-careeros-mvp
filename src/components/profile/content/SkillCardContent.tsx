
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Edit, Plus, Target } from 'lucide-react';
import type { Skill } from '@/types/versioned-entities';

interface SkillCardContentProps {
  item: Skill;
}

export const SkillCardContent: React.FC<SkillCardContentProps> = ({ item }) => {
  const { theme } = useTheme();

  const handleAction = (action: string) => {
    console.log(`Action: ${action} for skill ID:`, item.logical_entity_id);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {item.category && (
          <div>
            <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-2`}>
              Category
            </h4>
            <Badge variant="secondary" className={`${theme === 'dark' ? 'bg-career-gray-dark text-career-text-dark' : 'bg-career-gray-light text-career-text-light'}`}>
              {item.category}
            </Badge>
          </div>
        )}
        
        {item.proficiency_level && (
          <div>
            <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-2`}>
              Proficiency
            </h4>
            <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              <Star className="w-4 h-4 text-career-accent" />
              <span>{item.proficiency_level}</span>
            </div>
          </div>
        )}
        
        {item.years_of_experience && (
          <div>
            <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-2`}>
              Experience
            </h4>
            <p className={`text-sm ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              {item.years_of_experience} years
            </p>
          </div>
        )}
      </div>

      {/* Missing Information Prompts */}
      <div className="space-y-3">
        {!item.category && (
          <div className={`p-4 rounded-lg border-2 border-dashed ${theme === 'dark' ? 'border-career-gray-dark' : 'border-career-gray-light'} text-center`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-3`}>
              No category assigned
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('Add Category')}
              className={`${theme === 'dark' ? 'border-career-gray-dark hover:bg-career-gray-dark' : 'border-career-gray-light hover:bg-career-gray-light'}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        )}

        {!item.proficiency_level && (
          <div className={`p-4 rounded-lg border-2 border-dashed ${theme === 'dark' ? 'border-career-gray-dark' : 'border-career-gray-light'} text-center`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-3`}>
              No proficiency level set
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('Add Proficiency')}
              className={`${theme === 'dark' ? 'border-career-gray-dark hover:bg-career-gray-dark' : 'border-career-gray-light hover:bg-career-gray-light'}`}
            >
              <Star className="w-4 h-4 mr-2" />
              Rate Proficiency
            </Button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-opacity-20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('Edit Skill')}
          className={`${theme === 'dark' ? 'border-career-gray-dark hover:bg-career-gray-dark' : 'border-career-gray-light hover:bg-career-gray-light'}`}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Skill
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('Add Context')}
          className={`${theme === 'dark' ? 'border-career-gray-dark hover:bg-career-gray-dark' : 'border-career-gray-light hover:bg-career-gray-light'}`}
        >
          <Target className="w-4 h-4 mr-2" />
          Add Context
        </Button>
      </div>
    </div>
  );
};
