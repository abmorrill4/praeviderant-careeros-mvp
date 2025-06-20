
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { FieldRenderer } from './FieldRenderer';

interface EditField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'array';
  options?: string[];
  placeholder?: string;
}

interface FormFieldProps {
  field: EditField;
  value: any;
  onChange: (value: any) => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  field,
  value,
  onChange
}) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-1">
      <label className={`text-sm font-medium ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
        {field.label}
      </label>
      <FieldRenderer
        field={field}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
