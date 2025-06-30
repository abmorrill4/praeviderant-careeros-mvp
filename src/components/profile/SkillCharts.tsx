
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Code, Zap } from 'lucide-react';
import { useLatestEntities } from '@/hooks/useVersionedEntities';
import type { Skill } from '@/types/versioned-entities';

interface SkillChartData {
  name: string;
  category: string;
  proficiency: number;
  years?: number;
  color: string;
}

const PROFICIENCY_MAP: Record<string, number> = {
  'beginner': 20,
  'intermediate': 50,
  'advanced': 75,
  'expert': 95,
  'novice': 25,
  'proficient': 60,
  'senior': 80,
  'lead': 90
};

const CATEGORY_COLORS: Record<string, string> = {
  'programming_languages': 'bg-blue-500',
  'frameworks': 'bg-green-500',
  'tools': 'bg-purple-500',
  'databases': 'bg-orange-500',
  'cloud': 'bg-cyan-500',
  'soft_skills': 'bg-pink-500',
  'methodologies': 'bg-indigo-500',
  'other': 'bg-gray-500'
};

export const SkillCharts: React.FC = () => {
  const { data: skills } = useLatestEntities<Skill>('skill');

  const skillChartData: SkillChartData[] = (skills || []).map(skill => {
    const proficiencyLevel = skill.proficiency_level?.toLowerCase() || 'intermediate';
    const proficiency = PROFICIENCY_MAP[proficiencyLevel] || 50;
    const category = skill.category || 'other';
    
    return {
      name: skill.name,
      category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      proficiency,
      years: skill.years_of_experience,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other
    };
  }).sort((a, b) => b.proficiency - a.proficiency);

  // Group skills by category for the category chart
  const categoryGroups = skillChartData.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, SkillChartData[]>);

  const topSkills = skillChartData.slice(0, 8);

  if (skillChartData.length === 0) {
    return (
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-600" />
            Skills Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-600">
            <p>No skills data available</p>
            <p className="text-sm mt-1">Add your skills to see visual analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Skills Chart */}
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Top Skills Proficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSkills.map((skill, index) => (
              <div key={skill.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{skill.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {skill.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {skill.years && (
                      <span>{skill.years}y exp</span>
                    )}
                    <span className="font-medium">{skill.proficiency}%</span>
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={skill.proficiency} 
                    className="h-3"
                  />
                  <div 
                    className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ease-out ${skill.color}`}
                    style={{ 
                      width: `${skill.proficiency}%`,
                      animationDelay: `${index * 200}ms`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills by Category */}
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-600" />
            Skills by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categoryGroups).map(([category, categorySkills]) => {
              const avgProficiency = categorySkills.reduce((sum, skill) => sum + skill.proficiency, 0) / categorySkills.length;
              const color = categorySkills[0]?.color || CATEGORY_COLORS.other;
              
              return (
                <div key={category} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-900">{category}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {categorySkills.length} skills
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600">Average Proficiency</span>
                      <span className="text-sm font-medium">{Math.round(avgProficiency)}%</span>
                    </div>
                    <div className="relative">
                      <Progress value={avgProficiency} className="h-2" />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full ${color} transition-all duration-1000 ease-out`}
                        style={{ width: `${avgProficiency}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {categorySkills.slice(0, 4).map(skill => (
                      <Badge key={skill.name} variant="outline" className="text-xs">
                        {skill.name}
                      </Badge>
                    ))}
                    {categorySkills.length > 4 && (
                      <Badge variant="outline" className="text-xs text-slate-500">
                        +{categorySkills.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skills Statistics */}
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Skills Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {skillChartData.length}
              </div>
              <div className="text-sm text-blue-700">Total Skills</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {skillChartData.filter(s => s.proficiency >= 75).length}
              </div>
              <div className="text-sm text-green-700">Advanced+</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Object.keys(categoryGroups).length}
              </div>
              <div className="text-sm text-purple-700">Categories</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {Math.round(skillChartData.reduce((sum, skill) => sum + skill.proficiency, 0) / skillChartData.length)}%
              </div>
              <div className="text-sm text-orange-700">Avg Proficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
