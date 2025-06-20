
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FormField } from './FormField';
import { FormActions } from './FormActions';
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
  const { toast } = useToast();
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
        <FormField
          key={field.key}
          field={field}
          value={formData[field.key]}
          onChange={(value) => updateField(field.key, value)}
        />
      ))}
      
      <FormActions onSave={() => {}} onCancel={onCancel} />
    </form>
  );
};
