
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
          
          const { data, error } = await supabase.functions.invoke('enrich-resume', {
            body: { versionId }
          });

          console.log('SmartEnrichmentTrigger: Function response:', { data, error });

          if (error) {
            console.error('SmartEnrichmentTrigger: Error triggering enrichment:', error);
            toast({
              title: "Processing Warning",
              description: "AI analysis may take longer than expected. Please wait or refresh the page.",
              variant: "default",
            });
          } else {
            console.log('SmartEnrichmentTrigger: AI enrichment triggered successfully:', data);
            toast({
              title: "AI Analysis Started",
              description: "Your resume is being analyzed. This may take 30-60 seconds.",
              variant: "default",
            });
          }
        } catch (error) {
          console.error('SmartEnrichmentTrigger: Failed to trigger enrichment:', error);
          toast({
            title: "Analysis Error",
            description: "Failed to start AI analysis. Please try refreshing the page.",
            variant: "destructive",
          });
        }
      };

      // Add a small delay to avoid race conditions, but make it shorter
      console.log('SmartEnrichmentTrigger: Setting timeout for enrichment trigger...');
      const timeoutId = setTimeout(() => {
        console.log('SmartEnrichmentTrigger: Timeout fired, calling triggerEnrichment...');
        triggerEnrichment();
      }, 1000); // Reduced from 2000ms to 1000ms
      
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
