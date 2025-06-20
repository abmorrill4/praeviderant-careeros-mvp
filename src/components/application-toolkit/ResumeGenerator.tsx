
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface ResumeGeneratorProps {
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export const ResumeGenerator: React.FC<ResumeGeneratorProps> = ({
  onGenerate,
  isGenerating,
  disabled
}) => {
  return (
    <Button
      onClick={onGenerate}
      disabled={isGenerating || disabled}
      className="bg-career-accent hover:bg-career-accent-dark text-white flex items-center gap-2"
    >
      <FileText className="w-4 h-4" />
      {isGenerating ? 'Generating Resume...' : 'Generate Tailored Resume'}
    </Button>
  );
};
