
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Star, BarChart3, Target } from 'lucide-react';
import { TimelineCardFrame } from './TimelineCardFrame';
import { parseSkillData, formatProficiencyLevel, getCategoryColor } from '@/utils/skillDataParser';

interface SkillsSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSkills = async () => {
      if (!user) return;

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('skill')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching skills:', error);
          return;
        }

        setSkills(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [user]);

  const toggleSkillExpansion = (skillId: string) => {
    setExpandedSkills(prev => ({
      ...prev,
      [skillId]: !prev[skillId]
    }));
  };

  const getProficiencyProgress = (level?: string): number => {
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
    return levelMap[level?.toLowerCase() || ''] || 0;
  };

  if (loading) {
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

  const skillsByCategory = skills.reduce((acc, skill) => {
    const parsedSkill = parseSkillData(skill.name, skill.category, skill.proficiency_level);
    const category = parsedSkill.category || 'General';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      ...skill,
      parsedName: parsedSkill.name,
      parsedCategory: parsedSkill.category,
      parsedProficiency: parsedSkill.proficiency_level,
      parsedYears: parsedSkill.years_of_experience
    });
    return acc;
  }, {} as Record<string, any[]>);

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
          className={`${theme === 'dark' ? 'neumorphic-button dark' : 'neumorphic-button light'}`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {/* Skills by Category */}
      {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
        <TimelineCardFrame
          key={category}
          id={`skills-${category}`}
          title={category}
          badgeText={`${Array.isArray(categorySkills) ? categorySkills.length : 0} skills`}
          isExpanded={expandedSkills[category] || false}
          onToggle={() => toggleSkillExpansion(category)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(categorySkills) && categorySkills.map((skill) => (
              <Card
                key={skill.logical_entity_id}
                className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'} hover:shadow-lg transition-all duration-200`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-1`}>
                        {skill.parsedName}
                      </h3>
                      <Badge 
                        className={`text-xs ${getCategoryColor(skill.parsedCategory)}`}
                      >
                        {skill.parsedCategory || category}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>

                  {skill.parsedProficiency && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                          Proficiency
                        </span>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                          {formatProficiencyLevel(skill.parsedProficiency)}
                        </span>
                      </div>
                      <Progress 
                        value={getProficiencyProgress(skill.parsedProficiency)} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {skill.years_of_experience && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4" />
                      <span className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                        {skill.years_of_experience} years experience
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TimelineCardFrame>
      ))}

      {skills.length === 0 && (
        <Card className={`${theme === 'dark' ? 'neumorphic-panel dark bg-career-panel-dark' : 'neumorphic-panel light bg-career-panel-light'} text-center p-8`}>
          <Star className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
            No Skills Added Yet
          </h3>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-4`}>
            Start building your skills profile by adding your technical and professional expertise.
          </p>
          <Button className={`${theme === 'dark' ? 'neumorphic-button dark' : 'neumorphic-button light'}`}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Skill
          </Button>
        </Card>
      )}
    </div>
  );
};
