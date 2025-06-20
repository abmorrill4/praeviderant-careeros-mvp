
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { FileText, Mail } from 'lucide-react';

interface GeneratedContentDisplayProps {
  generatedResume: any;
  generatedCoverLetter: string | null;
}

export const GeneratedContentDisplay: React.FC<GeneratedContentDisplayProps> = ({
  generatedResume,
  generatedCoverLetter
}) => {
  const { theme } = useTheme();

  return (
    <>
      {generatedResume && (
        <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              <FileText className="w-5 h-5" />
              Generated Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-career-background-dark/50 border-career-text-dark/10' : 'bg-career-background-light/50 border-career-text-light/10'}`}>
              <pre className={`text-sm whitespace-pre-wrap ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                {JSON.stringify(generatedResume, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedCoverLetter && (
        <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              <Mail className="w-5 h-5" />
              Generated Cover Letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-career-background-dark/50 border-career-text-dark/10' : 'bg-career-background-light/50 border-career-text-light/10'}`}>
              <div className={`prose max-w-none ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                <pre className="whitespace-pre-wrap font-sans">
                  {generatedCoverLetter}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
