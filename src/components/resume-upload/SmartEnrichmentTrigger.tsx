
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';

interface SmartEnrichmentTriggerProps {
  versionId: string;
  onStatusChange?: (isComplete: boolean) => void;
}

export const SmartEnrichmentTrigger: React.FC<SmartEnrichmentTriggerProps> = ({
  versionId,
  onStatusChange
}) => {
  const { toast } = useToast();
  const { data: status, isLoading } = useEnrichmentStatus(versionId);

  console.log('SmartEnrichmentTrigger Debug:', {
    versionId,
    status,
    isLoading,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (!status || isLoading) {
      console.log('SmartEnrichmentTrigger: Waiting for status or loading...', { status, isLoading });
      return;
    }

    console.log('SmartEnrichmentTrigger: Status received:', {
      hasEntities: status.hasEntities,
      hasEnrichment: status.hasEnrichment,
      hasNarratives: status.hasNarratives,
      isComplete: status.isComplete,
      processingStage: status.processingStage
    });

    // Notify parent of completion status
    onStatusChange?.(status.isComplete);

    // Auto-trigger enrichment when entities are ready but enrichment hasn't started
    if (status.hasEntities && !status.hasEnrichment && status.processingStage !== 'failed') {
      console.log('SmartEnrichmentTrigger: Conditions met for auto-triggering enrichment');
      console.log('Auto-triggering AI enrichment for version:', versionId);
      
      const triggerEnrichment = async () => {
        try {
          console.log('SmartEnrichmentTrigger: Calling enrich-resume function...');
          
          // Use proper error handling and timeout for the function call
          const { data, error } = await supabase.functions.invoke('enrich-resume', {
            body: { versionId },
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('SmartEnrichmentTrigger: Function response:', { 
            data, 
            error,
            hasData: !!data,
            hasError: !!error 
          });

          if (error) {
            console.error('SmartEnrichmentTrigger: Supabase function error:', error);
            
            // Check if it's a network/timeout error vs function error
            if (error.message?.includes('fetch')) {
              toast({
                title: "Network Error",
                description: "Failed to connect to AI service. Please check your connection and try again.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "AI Analysis Error",
                description: `Failed to start AI analysis: ${error.message}`,
                variant: "destructive",
              });
            }
            return;
          }

          // Check if the function returned an error in the data
          if (data?.error) {
            console.error('SmartEnrichmentTrigger: Function returned error:', data.error);
            toast({
              title: "Analysis Error",
              description: `AI analysis failed: ${data.error}`,
              variant: "destructive",
            });
            return;
          }

          // Success - show appropriate message
          if (data?.success) {
            console.log('SmartEnrichmentTrigger: AI enrichment triggered successfully:', data);
            
            if (data.message?.includes('already exists')) {
              toast({
                title: "Analysis Complete",
                description: "AI analysis already completed for this resume.",
                variant: "default",
              });
            } else {
              toast({
                title: "AI Analysis Started",
                description: "Your resume is being analyzed. This may take 30-60 seconds.",
                variant: "default",
              });
            }
          } else {
            console.warn('SmartEnrichmentTrigger: Unexpected response format:', data);
            toast({
              title: "Analysis Started",
              description: "AI analysis is processing your resume.",
              variant: "default",
            });
          }

        } catch (error) {
          console.error('SmartEnrichmentTrigger: Failed to trigger enrichment:', error);
          
          // More specific error handling
          if (error instanceof TypeError && error.message.includes('fetch')) {
            toast({
              title: "Connection Error",
              description: "Unable to reach AI service. Please try refreshing the page.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Analysis Error",
              description: "Failed to start AI analysis. Please try refreshing the page.",
              variant: "destructive",
            });
          }
        }
      };

      // Add a small delay to avoid race conditions
      console.log('SmartEnrichmentTrigger: Setting timeout for enrichment trigger...');
      const timeoutId = setTimeout(() => {
        console.log('SmartEnrichmentTrigger: Timeout fired, calling triggerEnrichment...');
        triggerEnrichment();
      }, 1000);
      
      return () => {
        console.log('SmartEnrichmentTrigger: Cleaning up timeout');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('SmartEnrichmentTrigger: Conditions not met for auto-triggering:', {
        hasEntities: status.hasEntities,
        hasEnrichment: status.hasEnrichment,
        processingStage: status.processingStage
      });
    }
  }, [status, isLoading, versionId, onStatusChange, toast]);

  // This component doesn't render anything - it's purely for logic
  return null;
};
