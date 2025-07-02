
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { FlexibleDatePicker } from '@/components/ui/flexible-date-picker';

interface EditField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'array' | 'flexible-date';
  options?: string[];
  placeholder?: string;
}

interface FieldRendererProps {
  field: EditField;
  value: any;
  onChange: (value: any) => void;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange
}) => {
  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="min-h-[80px]"
        />
      );

    case 'select':
      return (
        <Select value={value || ''} onValueChange={onChange}>
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
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
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
                    onChange(newArray);
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
                  onChange([...(value || []), newValue]);
                  input.value = '';
                }
              }
            }}
          />
        </div>
      );

    case 'flexible-date':
      return (
        <FlexibleDatePicker
          value={value || ''}
          onChange={onChange}
          placeholder={field.placeholder}
        />
      );

    default:
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
  }
};
