
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface ResumesTabProps {
  onNavigateToInterview: () => void;
}

export const ResumesTab: React.FC<ResumesTabProps> = ({ onNavigateToInterview }) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
        My Resumes
      </h2>
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardContent className="p-8 text-center">
          <FileText className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            No resumes yet
          </h3>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-4`}>
            Complete an AI interview to generate your first resume
          </p>
          <Button 
            onClick={onNavigateToInterview}
            className="bg-career-accent hover:bg-career-accent-dark text-white"
          >
            Start Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
