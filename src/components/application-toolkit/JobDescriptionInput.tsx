
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase } from 'lucide-react';

interface JobDescriptionInputProps {
  jobDescription: string;
  onChange: (value: string) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  jobDescription,
  onChange
}) => {
  return (
    <Card className="bg-career-panel border-career-text/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-career-text">
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
