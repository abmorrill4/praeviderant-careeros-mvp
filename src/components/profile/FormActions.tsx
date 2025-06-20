
import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Save } from 'lucide-react';

interface FormActionsProps {
  onSave: () => void;
  onCancel: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSave,
  onCancel
}) => {
  return (
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
  );
};
