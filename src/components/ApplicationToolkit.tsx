
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileText, Mail, Briefcase } from 'lucide-react';

export const ApplicationToolkit = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterEnabled, setCoverLetterEnabled] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState(null);

  const handleGenerateResume = async () => {
    if (!user || !jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job description first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingResume(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tailored-resume', {
        body: {
          user_id: user.id,
          job_description: jobDescription.trim(),
        },
      });

      if (error) {
        throw error;
      }

      setGeneratedResume(data);
      setCoverLetterEnabled(true);
      
      toast({
        title: "Success",
        description: "Tailored resume generated successfully!",
      });
    } catch (error) {
      console.error('Error generating resume:', error);
      toast({
        title: "Error",
        description: "Failed to generate tailored resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!user || !jobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job description first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCoverLetter(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tailored-cover-letter', {
        body: {
          user_id: user.id,
          job_description: jobDescription.trim(),
        },
      });

      if (error) {
        throw error;
      }

      setGeneratedCoverLetter(data.coverLetter);
      
      toast({
        title: "Success",
        description: "Tailored cover letter generated successfully!",
      });
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast({
        title: "Error",
        description: "Failed to generate tailored cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          Application Toolkit
        </h2>
        <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Generate tailored resumes and cover letters for specific job opportunities
        </p>
      </div>

      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            <Briefcase className="w-5 h-5" />
            Job Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="min-h-[200px]"
          />
          
          <div className="flex gap-4">
            <Button
              onClick={handleGenerateResume}
              disabled={isGeneratingResume || !jobDescription.trim()}
              className="bg-career-accent hover:bg-career-accent-dark text-white flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {isGeneratingResume ? 'Generating Resume...' : 'Generate Tailored Resume'}
            </Button>
            
            <Button
              onClick={handleGenerateCoverLetter}
              disabled={!coverLetterEnabled || isGeneratingCoverLetter || !jobDescription.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {isGeneratingCoverLetter ? 'Generating Cover Letter...' : 'Generate Tailored Cover Letter'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};
