
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/contexts/ThemeContext';
import { Briefcase } from 'lucide-react';

interface JobDescriptionInputProps {
  jobDescription: string;
  onChange: (value: string) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  jobDescription,
  onChange
}) => {
  const { theme } = useTheme();

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          <Briefcase className="w-5 h-5" />
          Job Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[200px]"
        />
      </CardContent>
    </Card>
  );
};
