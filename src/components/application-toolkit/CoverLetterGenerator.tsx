
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface CoverLetterGeneratorProps {
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  onGenerate,
  isGenerating,
  disabled
}) => {
  return (
    <Button
      onClick={onGenerate}
      disabled={disabled || isGenerating}
      variant="outline"
      className="flex items-center gap-2"
    >
      <Mail className="w-4 h-4" />
      {isGenerating ? 'Generating Cover Letter...' : 'Generate Tailored Cover Letter'}
    </Button>
  );
};
