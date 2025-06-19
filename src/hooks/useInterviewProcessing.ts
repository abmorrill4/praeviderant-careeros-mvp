
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessingResult {
  success: boolean;
  message: string;
  extractedProfile?: any;
  deltasCount?: number;
  newJobsCount?: number;
}

export const useInterviewProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processInterview = async (interviewId: string, userId: string): Promise<ProcessingResult | null> => {
    setIsProcessing(true);
    
    try {
      console.log(`Processing interview ${interviewId} for user ${userId}`);
      
      const { data, error } = await supabase.functions.invoke('process-interview', {
        body: { interviewId, userId }
      });

      if (error) {
        console.error('Error processing interview:', error);
        throw error;
      }

      console.log('Processing result:', data);

      toast({
        title: "Interview Processed",
        description: `${data.message}. Found ${data.deltasCount || 0} profile changes.`,
      });

      return data;
    } catch (error) {
      console.error('Error in processInterview:', error);
      
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Failed to process interview',
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processInterview,
    isProcessing
  };
};
