
import React from 'react';
import { Code, Star } from 'lucide-react';
import type { Skill } from '@/types/versioned-entities';

interface SkillsOverviewCardProps {
  skills: Skill[];
}

export const SkillsOverviewCard: React.FC<SkillsOverviewCardProps> = ({ skills }) => {
  const topSkills = skills.slice(0, 8);
  const skillCategories = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="neo-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <Code className="w-5 h-5 neo-text-accent" />
        <h3 className="text-lg font-semibold neo-text">Skills Overview</h3>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-8">
          <Code className="w-12 h-12 neo-text-muted mx-auto mb-4" />
          <p className="neo-text-muted">No skills added yet</p>
          <p className="text-sm neo-text-muted mt-2">
            Add skills to showcase your expertise
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Skills */}
          <div>
            <h4 className="font-medium neo-text mb-3">Top Skills</h4>
            <div className="flex flex-wrap gap-2">
              {topSkills.map((skill) => (
                <div key={skill.logical_entity_id} className="neo-card-subtle px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm neo-text">{skill.name}</span>
                    {skill.proficiency_level && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 neo-text-accent" />
                        <span className="text-xs neo-text-muted">
                          {skill.proficiency_level}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Categories */}
          {Object.keys(skillCategories).length > 1 && (
            <div>
              <h4 className="font-medium neo-text mb-3">Categories</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(skillCategories).map(([category, count]) => (
                  <div key={category} className="neo-card-subtle p-3 text-center">
                    <div className="text-lg font-bold neo-text">{count}</div>
                    <div className="text-sm neo-text-muted capitalize">
                      {category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
