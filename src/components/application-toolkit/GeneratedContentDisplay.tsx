
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mail } from 'lucide-react';

interface GeneratedContentDisplayProps {
  generatedResume: any;
  generatedCoverLetter: string | null;
}

export const GeneratedContentDisplay: React.FC<GeneratedContentDisplayProps> = ({
  generatedResume,
  generatedCoverLetter
}) => {
  return (
    <>
      {generatedResume && (
        <Card className="bg-career-panel border-career-text/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-career-text">
              <FileText className="w-5 h-5" />
              Generated Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border bg-career-background/50 border-career-text/10">
              <pre className="text-sm whitespace-pre-wrap text-career-text">
                {JSON.stringify(generatedResume, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedCoverLetter && (
        <Card className="bg-career-panel border-career-text/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-career-text">
              <Mail className="w-5 h-5" />
              Generated Cover Letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border bg-career-background/50 border-career-text/10">
              <div className="prose max-w-none text-career-text">
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
