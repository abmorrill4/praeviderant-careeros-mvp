
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SafeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

export const SafeSelect: React.FC<SafeSelectProps> = ({
  value,
  onValueChange,
  placeholder,
  children,
  className
}) => {
  const safeValue = value || 'all';
  
  const handleValueChange = (newValue: string) => {
    // Ensure we never pass an empty string
    onValueChange(newValue || 'all');
  };

  return (
    <Select value={safeValue} onValueChange={handleValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
};

interface SafeSelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const SafeSelectItem: React.FC<SafeSelectItemProps> = ({
  value,
  children,
  className
}) => {
  // Ensure the value is never an empty string
  const safeValue = value || 'default';
  
  return (
    <SelectItem value={safeValue} className={className}>
      {children}
    </SelectItem>
  );
};
