
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { JobDescriptionInput } from '@/components/application-toolkit/JobDescriptionInput';
import { ResumeGenerator } from '@/components/application-toolkit/ResumeGenerator';
import { CoverLetterGenerator } from '@/components/application-toolkit/CoverLetterGenerator';
import { GeneratedContentDisplay } from '@/components/application-toolkit/GeneratedContentDisplay';
import { useToast } from '@/hooks/use-toast';

export const ApplicationToolkit: React.FC = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [jobDescription, setJobDescription] = useState('');
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<any>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);

  const handleGenerateResume = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please enter a job description to generate a tailored resume.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingResume(true);
    try {
      // TODO: Implement resume generation API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setGeneratedResume({
        message: "Resume generated successfully",
        jobDescription: jobDescription.substring(0, 100) + "...",
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Resume Generated",
        description: "Your tailored resume has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please enter a job description to generate a tailored cover letter.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCoverLetter(true);
    try {
      // TODO: Implement cover letter generation API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setGeneratedCoverLetter(`Dear Hiring Manager,

I am writing to express my strong interest in the position described in your job posting. Based on the requirements outlined, I believe my background and experience make me an excellent candidate for this role.

[This is a placeholder cover letter. The actual implementation would generate personalized content based on the job description and user's profile data.]

Thank you for your consideration.

Best regards,
[Your Name]`);
      
      toast({
        title: "Cover Letter Generated",
        description: "Your tailored cover letter has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const canGenerate = jobDescription.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
        <CardHeader>
          <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Application Toolkit
          </CardTitle>
          <CardDescription>
            Generate tailored resumes and cover letters based on job descriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <JobDescriptionInput
            jobDescription={jobDescription}
            onChange={setJobDescription}
          />
          
          <div className="flex flex-col sm:flex-row gap-4">
            <ResumeGenerator
              onGenerate={handleGenerateResume}
              isGenerating={isGeneratingResume}
              disabled={!canGenerate}
            />
            
            <CoverLetterGenerator
              onGenerate={handleGenerateCoverLetter}
              isGenerating={isGeneratingCoverLetter}
              disabled={!canGenerate}
            />
          </div>
        </CardContent>
      </Card>

      <GeneratedContentDisplay
        generatedResume={generatedResume}
        generatedCoverLetter={generatedCoverLetter}
      />
    </div>
  );
};
