import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { 
  ResumeGenerationRequest, 
  GeneratedResume, 
  ExportResult,
  ResumeFormat,
  GenerationAnalytics,
  JobExtractionRequest,
  JobExtractionResult,
  ExtractedJobData
} from '@/types/resume-generation';

interface UseResumeGenerationReturn {
  generateResume: (request: Omit<ResumeGenerationRequest, 'userId'>) => Promise<GeneratedResume | null>;
  extractJobFromUrl: (url: string) => Promise<ExtractedJobData | null>;
  exportResume: (resumeId: string, format: ResumeFormat) => Promise<ExportResult | null>;
  analyzeJobMatch: (resumeId: string) => Promise<GenerationAnalytics | null>;
  isGenerating: boolean;
  isExtracting: boolean;
  isExporting: boolean;
  isAnalyzing: boolean;
  error: string | null;
  progress: number;
}

export const useResumeGeneration = (): UseResumeGenerationReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateResume = useCallback(async (
    request: Omit<ResumeGenerationRequest, 'userId'>
  ): Promise<GeneratedResume | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      console.log('Starting enhanced resume generation for user:', user.id);
      
      const fullRequest: ResumeGenerationRequest = {
        ...request,
        userId: user.id,
      };

      // Call the enhanced resume generation function
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-enhanced-resume',
        {
          body: fullRequest,
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Resume generation failed');
      }

      if (!data) {
        throw new Error('No data received from resume generation');
      }

      setProgress(100);
      
      toast({
        title: "Resume Generated Successfully",
        description: "Your tailored resume has been created and is ready for export.",
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate resume';
      console.error('Resume generation error:', err);
      setError(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [user?.id, toast]);

  const extractJobFromUrl = useCallback(async (url: string): Promise<ExtractedJobData | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsExtracting(true);
    setError(null);

    try {
      console.log('Extracting job from URL:', url);

      const { data, error: functionError } = await supabase.functions.invoke(
        'extract-job-from-url',
        {
          body: {
            url,
            userId: user.id,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Job extraction failed');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to extract job information');
      }

      toast({
        title: "Job Extracted Successfully",
        description: `Found job: ${data.data.title} at ${data.data.company}`,
      });

      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract job from URL';
      console.error('Job extraction error:', err);
      setError(errorMessage);
      
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, [user?.id, toast]);

  const exportResume = useCallback(async (
    resumeId: string, 
    format: ResumeFormat
  ): Promise<ExportResult | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsExporting(true);
    setError(null);

    try {
      console.log('Exporting resume:', resumeId, 'to format:', format.type);

      const { data, error: functionError } = await supabase.functions.invoke(
        'export-resume',
        {
          body: {
            resumeId,
            format,
            userId: user.id,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Resume export failed');
      }

      if (!data) {
        throw new Error('No data received from resume export');
      }

      toast({
        title: "Export Successful",
        description: `Resume exported as ${format.type.toUpperCase()}`,
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export resume';
      console.error('Resume export error:', err);
      setError(errorMessage);
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [user?.id, toast]);

  const analyzeJobMatch = useCallback(async (
    resumeId: string
  ): Promise<GenerationAnalytics | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('Analyzing job match for resume:', resumeId);

      const { data, error: functionError } = await supabase.functions.invoke(
        'analyze-job-match',
        {
          body: {
            resumeId,
            userId: user.id,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Job match analysis failed');
      }

      if (!data) {
        throw new Error('No data received from job match analysis');
      }

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze job match';
      console.error('Job match analysis error:', err);
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user?.id, toast]);

  return {
    generateResume,
    extractJobFromUrl,
    exportResume,
    analyzeJobMatch,
    isGenerating,
    isExtracting,
    isExporting,
    isAnalyzing,
    error,
    progress,
  };
};