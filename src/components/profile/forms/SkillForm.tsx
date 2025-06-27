
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { X, Save } from 'lucide-react';
import type { Skill, EntityData } from '@/types/versioned-entities';

interface SkillFormData {
  name: string;
  category: string;
  proficiency_level: string;
  years_of_experience: number;
  narrative_context: string;
}

interface SkillFormProps {
  skill?: Skill;
  onSave: (data: Partial<EntityData<Skill>>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const SKILL_CATEGORIES = [
  'Programming Language',
  'Framework',
  'Tool',
  'Database',
  'Soft Skill',
  'Technical Skill',
  'Other'
];

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

export const SkillForm: React.FC<SkillFormProps> = ({
  skill,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { theme } = useTheme();
  
  const form = useForm<SkillFormData>({
    defaultValues: {
      name: skill?.name || '',
      category: skill?.category || '',
      proficiency_level: skill?.proficiency_level || '',
      years_of_experience: skill?.years_of_experience || 0,
      narrative_context: skill?.narrative_context || '',
    }
  });

  const handleSubmit = (data: SkillFormData) => {
    onSave({
      name: data.name,
      category: data.category,
      proficiency_level: data.proficiency_level,
      years_of_experience: data.years_of_experience,
      narrative_context: data.narrative_context,
    });
  };

  return (
    <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-career-gray-dark bg-career-panel-dark' : 'border-career-gray-light bg-career-panel-light'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          {isEditing ? 'Edit Skill' : 'Add New Skill'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Skill name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skill Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. React, Python, Project Management"
                    {...field}
                    className={theme === 'dark' ? 'bg-career-gray-dark border-career-gray-dark text-career-text-dark' : 'bg-white border-career-gray-light text-career-text-light'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={theme === 'dark' ? 'bg-career-gray-dark border-career-gray-dark text-career-text-dark' : 'bg-white border-career-gray-light text-career-text-light'}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SKILL_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase().replace(' ', '_')}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="proficiency_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proficiency Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={theme === 'dark' ? 'bg-career-gray-dark border-career-gray-dark text-career-text-dark' : 'bg-white border-career-gray-light text-career-text-light'}>
                      <SelectValue placeholder="Select proficiency level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROFICIENCY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="years_of_experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className={theme === 'dark' ? 'bg-career-gray-dark border-career-gray-dark text-career-text-dark' : 'bg-white border-career-gray-light text-career-text-light'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="narrative_context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Context & Story (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe how you used this skill, key projects, achievements, or any relevant context..."
                    rows={4}
                    {...field}
                    className={theme === 'dark' ? 'bg-career-gray-dark border-career-gray-dark text-career-text-dark' : 'bg-white border-career-gray-light text-career-text-light'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="bg-career-accent hover:bg-career-accent-dark text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Update Skill' : 'Add Skill'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
