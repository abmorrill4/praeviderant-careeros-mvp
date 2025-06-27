
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Star, Target, MessageSquare } from 'lucide-react';
import { parseSkillData, formatProficiencyLevel, getCategoryColor } from '@/utils/skillDataParser';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import { useEntityActions } from '@/hooks/useEntityActions';
import { ProfileItemDisplay } from './ProfileItemDisplay';
import { ProfileItemEditor } from './ProfileItemEditor';
import { SkillForm } from './forms/SkillForm';
import type { Skill } from '@/types/versioned-entities';

interface SkillsSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

// Edit fields configuration for skills
const skillEditFields = [
  {
    key: 'name',
    label: 'Skill Name',
    type: 'text' as const,
    placeholder: 'Enter skill name'
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select' as const,
    options: [
      'programming_language',
      'framework',
      'tool',
      'database',
      'soft_skill',
      'technical_skill',
      'general'
    ],
    placeholder: 'Select category'
  },
  {
    key: 'proficiency_level',
    label: 'Proficiency Level',
    type: 'select' as const,
    options: ['beginner', 'intermediate', 'advanced', 'expert'],
    placeholder: 'Select proficiency level'
  },
  {
    key: 'years_of_experience',
    label: 'Years of Experience',
    type: 'number' as const,
    placeholder: 'Enter years of experience'
  },
  {
    key: 'narrative_context',
    label: 'Context & Story',
    type: 'textarea' as const,
    placeholder: 'Describe how you used this skill, key projects, achievements, or any relevant context...'
  }
];

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { data: skills = [], isLoading } = useLatestEntities<Skill>('skill');
  const { handleAccept, handleEdit } = useEntityActions<Skill>('skill');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const getProficiencyProgress = (level?: string): number => {
    if (!level) return 0;
    const levelMap: Record<string, number> = {
      'beginner': 25,
      'intermediate': 50,
      'advanced': 75,
      'expert': 100,
      '1': 25,
      '2': 50,
      '3': 75,
      '4': 100,
      '5': 100
    };
    return levelMap[level.toLowerCase()] || 0;
  };

  const processSkills = () => {
    const processedSkills = skills.map(skill => {
      const parsedData = parseSkillData(skill.name, skill.category, skill.proficiency_level);
      return {
        ...skill,
        displayName: parsedData.name,
        displayCategory: parsedData.category || skill.category || 'General',
        displayProficiency: parsedData.proficiency_level || skill.proficiency_level,
        displayYears: parsedData.years_of_experience || skill.years_of_experience
      };
    });

    // Group by category
    const grouped = processedSkills.reduce((acc, skill) => {
      const category = skill.displayCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {} as Record<string, typeof processedSkills>);

    return grouped;
  };

  const handleEditClick = (skill: Skill) => {
    setEditingSkillId(`${skill.logical_entity_id}-${skill.version}`);
  };

  const handleEditSave = (skill: Skill, updates: Partial<Skill>) => {
    // Ensure we're only updating the fields that should be editable
    const cleanUpdates = {
      name: updates.name,
      category: updates.category,
      proficiency_level: updates.proficiency_level,
      years_of_experience: updates.years_of_experience,
      narrative_context: updates.narrative_context
    };
    
    handleEdit(skill, cleanUpdates);
    setEditingSkillId(null);
  };

  const handleEditCancel = () => {
    setEditingSkillId(null);
  };

  const handleAddSkill = () => {
    setShowAddForm(true);
  };

  // Create a normalized skill object for editing
  const createNormalizedSkillForEdit = (skill: Skill) => {
    const parsedData = parseSkillData(skill.name, skill.category, skill.proficiency_level);
    
    return {
      ...skill,
      name: parsedData.name, // Use parsed name instead of raw JSON
      category: parsedData.category || skill.category || 'general',
      proficiency_level: parsedData.proficiency_level || skill.proficiency_level,
      years_of_experience: parsedData.years_of_experience || skill.years_of_experience || 0
    };
  };

  const renderSkillItem = (skill: Skill) => {
    const parsedSkill = parseSkillData(skill.name, skill.category, skill.proficiency_level);
    
    return (
      <div className="space-y-4">
        <div>
          <h4 className={`font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            {parsedSkill.name}
          </h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {(parsedSkill.category || skill.category) && (
              <Badge className={`text-xs ${getCategoryColor(parsedSkill.category || skill.category)}`}>
                {(parsedSkill.category || skill.category)?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
          </div>
        </div>

        {(parsedSkill.proficiency_level || skill.proficiency_level) && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Proficiency
              </span>
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                {formatProficiencyLevel(parsedSkill.proficiency_level || skill.proficiency_level)}
              </span>
            </div>
            <Progress 
              value={getProficiencyProgress(parsedSkill.proficiency_level || skill.proficiency_level)} 
              className="h-2"
            />
          </div>
        )}

        {(parsedSkill.years_of_experience || skill.years_of_experience) && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4" />
            <span className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              {parsedSkill.years_of_experience || skill.years_of_experience} years experience
            </span>
          </div>
        )}

        {skill.narrative_context && (
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`}>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Context & Story
              </span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              {skill.narrative_context}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Skills & Expertise
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-32 rounded-lg animate-pulse ${theme === 'dark' ? 'bg-career-gray-dark' : 'bg-career-gray-light'}`} />
          ))}
        </div>
      </div>
    );
  }

  const skillsByCategory = processSkills();

  if (skills.length === 0 && !showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
              Skills & Expertise
            </h2>
            <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Your technical and professional skills
            </p>
          </div>
          <Button 
            onClick={handleAddSkill}
            className={`${theme === 'dark' ? 'neumorphic-button dark' : 'neumorphic-button light'}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Skill
          </Button>
        </div>

        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'} text-center p-8`}>
          <Star className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
            No Skills Added Yet
          </h3>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-4`}>
            Start building your skills profile by adding your technical and professional expertise.
          </p>
          <Button 
            onClick={handleAddSkill}
            className={`${theme === 'dark' ? 'neumorphic-button dark' : 'neumorphic-button light'}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Skill
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
            Skills & Expertise
          </h2>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Your technical and professional skills
          </p>
        </div>
        <Button 
          onClick={handleAddSkill}
          className={`${theme === 'dark' ? 'neumorphic-button dark' : 'neumorphic-button light'}`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {/* Add Skill Form */}
      {showAddForm && (
        <SkillForm
          onSave={(data) => {
            // Handle save logic here
            console.log('Adding new skill:', data);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Skills by Category */}
      <div className="space-y-6">
        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <Badge variant="secondary" className={`${theme === 'dark' ? 'bg-career-gray-dark text-career-text-muted-dark' : 'bg-career-gray-light text-career-text-muted-light'}`}>
                {categorySkills.length} skills
              </Badge>
            </div>

            <div className="space-y-3">
              {categorySkills.map((skill) => {
                const itemKey = `${skill.logical_entity_id}-${skill.version}`;
                const isEditing = editingSkillId === itemKey;
                
                return (
                  <div key={itemKey}>
                    {isEditing ? (
                      <ProfileItemEditor
                        item={createNormalizedSkillForEdit(skill)}
                        editFields={skillEditFields}
                        title="Skills"
                        onEdit={handleEditSave}
                        onCancel={handleEditCancel}
                      />
                    ) : (
                      <ProfileItemDisplay
                        item={skill}
                        onAccept={handleAccept}
                        onEdit={handleEditClick}
                        renderItem={renderSkillItem}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
