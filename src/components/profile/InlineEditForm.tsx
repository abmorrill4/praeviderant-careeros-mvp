
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Save } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
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

  const renderField = (field: EditField) => {
    const value = formData[field.key];

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[80px]"
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(newValue) => updateField(field.key, newValue)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateField(field.key, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
          />
        );

      case 'array':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {(value || []).map((item: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                  <button
                    type="button"
                    onClick={() => {
                      const newArray = [...(value || [])];
                      newArray.splice(index, 1);
                      updateField(field.key, newArray);
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder={field.placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  const newValue = input.value.trim();
                  if (newValue) {
                    updateField(field.key, [...(value || []), newValue]);
                    input.value = '';
                  }
                }
              }}
            />
          </div>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            {field.label}
          </label>
          {renderField(field)}
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
