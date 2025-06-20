
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { FieldRenderer } from './FieldRenderer';
import type { VersionedEntity } from '@/types/versioned-entities';

interface EditField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'array';
  options?: string[];
  placeholder?: string;
}

interface InlineEditFormProps {
  item: VersionedEntity;
  fields: EditField[];
  onSave: (updates: Record<string, any>) => void;
  onCancel: () => void;
}

export const InlineEditForm: React.FC<InlineEditFormProps> = ({
  item,
  fields,
  onSave,
  onCancel
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(field => {
      initial[field.key] = (item as any)[field.key] || '';
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            {field.label}
          </label>
          <FieldRenderer
            field={field}
            value={formData[field.key]}
            onChange={(value) => updateField(field.key, value)}
          />
        </div>
      ))}
      
      <div className="flex gap-2 pt-2">
        <Button type="submit" size="sm" className="bg-career-accent hover:bg-career-accent-dark text-white">
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
    </form>
  );
};
