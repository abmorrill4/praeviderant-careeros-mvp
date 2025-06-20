
import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { JobDescriptionInput } from './application-toolkit/JobDescriptionInput';
import { ResumeGenerator } from './application-toolkit/ResumeGenerator';
import { CoverLetterGenerator } from './application-toolkit/CoverLetterGenerator';
import { GeneratedContentDisplay } from './application-toolkit/GeneratedContentDisplay';

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

      <JobDescriptionInput
        jobDescription={jobDescription}
        onChange={setJobDescription}
      />
      
      <div className="flex gap-4">
        <ResumeGenerator
          onGenerate={handleGenerateResume}
          isGenerating={isGeneratingResume}
          disabled={!jobDescription.trim()}
        />
        
        <CoverLetterGenerator
          onGenerate={handleGenerateCoverLetter}
          isGenerating={isGeneratingCoverLetter}
          disabled={!coverLetterEnabled || !jobDescription.trim()}
        />
      </div>

      <GeneratedContentDisplay
        generatedResume={generatedResume}
        generatedCoverLetter={generatedCoverLetter}
      />
    </div>
  );
};
