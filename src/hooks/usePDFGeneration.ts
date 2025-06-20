
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

interface UsePDFGenerationReturn {
  generatePDF: (resumeData: any, options?: PDFGenerationOptions) => Promise<Blob>;
  isGenerating: boolean;
  error: string | null;
}

export const usePDFGeneration = (): UsePDFGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (resumeData: any, options: PDFGenerationOptions = {}): Promise<Blob> => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('Generating print-ready HTML for resume data:', resumeData);

      const { data, error: functionError } = await supabase.functions.invoke('generate-resume-pdf', {
        body: {
          resumeData,
          format: options.format || 'A4',
          margin: options.margin || {
            top: '20mm',
            bottom: '20mm',
            left: '20mm',
            right: '20mm'
          }
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (functionError) {
        throw new Error(`PDF generation failed: ${functionError.message}`);
      }

      // The response is now HTML that can be printed to PDF
      const htmlBlob = new Blob([data], { type: 'text/html' });
      
      console.log('Print-ready HTML generated successfully');
      return htmlBlob;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      console.error('PDF generation error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    isGenerating,
    error,
  };
};
