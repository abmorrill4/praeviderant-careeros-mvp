
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Edit, Plus, Target } from 'lucide-react';
import { parseSkillData, formatProficiencyLevel, getCategoryColor } from '@/utils/skillDataParser';
import type { Skill } from '@/types/versioned-entities';

interface SkillCardContentProps {
  item: Skill;
  onEdit?: () => void;
}

export const SkillCardContent: React.FC<SkillCardContentProps> = ({ item, onEdit }) => {
  const { theme } = useTheme();

  // Parse the skill data to handle malformed entries
  const parsedSkill = parseSkillData(
    item.name,
    item.category,
    item.proficiency_level
  );

  const handleAction = (action: string) => {
    console.log(`Action: ${action} for skill ID:`, item.logical_entity_id);
    if (action === 'Edit Skill' && onEdit) {
      onEdit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Skill Name Header */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-career-text-light">
          {parsedSkill.name}
        </h3>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(parsedSkill.category || item.category) && (
          <div>
            <h4 className="text-sm font-medium text-career-text-muted-light mb-2">
              Category
            </h4>
            <Badge 
              className={`${getCategoryColor(parsedSkill.category || item.category)} border-0`}
            >
              {(parsedSkill.category || item.category)?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
        )}
        
        {(parsedSkill.proficiency_level || item.proficiency_level) && (
          <div>
            <h4 className="text-sm font-medium text-career-text-muted-light mb-2">
              Proficiency
            </h4>
            <div className="flex items-center gap-2 text-sm text-career-text-light">
              <Star className="w-4 h-4 text-career-accent" />
              <span>{formatProficiencyLevel(parsedSkill.proficiency_level || item.proficiency_level)}</span>
            </div>
          </div>
        )}
        
        {(parsedSkill.years_of_experience || item.years_of_experience) && (
          <div>
            <h4 className="text-sm font-medium text-career-text-muted-light mb-2">
              Experience
            </h4>
            <p className="text-sm text-career-text-light">
              {parsedSkill.years_of_experience || item.years_of_experience} years
            </p>
          </div>
        )}
      </div>

      {/* Missing Information Prompts */}
      <div className="space-y-3">
        {!parsedSkill.category && !item.category && (
          <div className="p-4 rounded-lg border-2 border-dashed border-career-gray-light text-center">
            <p className="text-sm text-career-text-muted-light mb-3">
              No category assigned
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('Add Category')}
              className="border-career-gray-light hover:bg-career-gray-light"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        )}

        {!parsedSkill.proficiency_level && !item.proficiency_level && (
          <div className="p-4 rounded-lg border-2 border-dashed border-career-gray-light text-center">
            <p className="text-sm text-career-text-muted-light mb-3">
              No proficiency level set
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('Add Proficiency')}
              className="border-career-gray-light hover:bg-career-gray-light"
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
          className="border-career-gray-light hover:bg-career-gray-light"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Skill
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('Add Context')}
          className="border-career-gray-light hover:bg-career-gray-light"
        >
          <Target className="w-4 h-4 mr-2" />
          Add Context
        </Button>
      </div>
    </div>
  );
};
