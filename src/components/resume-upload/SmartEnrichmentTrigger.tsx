
import React, { useEffect, useState } from 'react';
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
  const [hasTriggeredEnrichment, setHasTriggeredEnrichment] = useState(false);

  console.log('SmartEnrichmentTrigger Debug:', {
    versionId,
    status,
    isLoading,
    hasTriggeredEnrichment,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (!status || isLoading || hasTriggeredEnrichment) {
      console.log('SmartEnrichmentTrigger: Skipping trigger:', { 
        hasStatus: !!status, 
        isLoading, 
        hasTriggeredEnrichment 
      });
      return;
    }

    console.log('SmartEnrichmentTrigger: Current status check:', {
      hasEntities: status.hasEntities,
      hasEnrichment: status.hasEnrichment,
      hasNarratives: status.hasNarratives,
      isComplete: status.isComplete,
      processingStage: status.processingStage,
      processingProgress: status.processingProgress
    });

    // Notify parent of completion status
    onStatusChange?.(status.isComplete);

    // If we don't have entities yet, we need to wait for parsing to complete
    if (!status.hasEntities && status.processingStage !== 'failed') {
      console.log('SmartEnrichmentTrigger: Waiting for entities to be parsed...');
      return;
    }

    // Auto-trigger enrichment when entities are ready but enrichment hasn't started
    if (status.hasEntities && !status.hasEnrichment && !hasTriggeredEnrichment && status.processingStage !== 'failed') {
      console.log('SmartEnrichmentTrigger: Conditions met for auto-triggering enrichment');
      
      setHasTriggeredEnrichment(true);
      
      const triggerEnrichment = async () => {
        try {
          console.log('SmartEnrichmentTrigger: Starting enrichment for version:', versionId);
          
          toast({
            title: "Starting AI Analysis",
            description: "Beginning career analysis and insight generation...",
            variant: "default",
          });

          const { data, error } = await supabase.functions.invoke('enrich-resume', {
            body: { versionId },
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('SmartEnrichmentTrigger: Enrichment function response:', { 
            data, 
            error,
            hasData: !!data,
            hasError: !!error 
          });

          if (error) {
            console.error('SmartEnrichmentTrigger: Enrichment function error:', error);
            setHasTriggeredEnrichment(false); // Allow retry
            
            toast({
              title: "AI Analysis Error",
              description: `Failed to start AI analysis: ${error.message}`,
              variant: "destructive",
            });
            return;
          }

          // Check if the function returned an error in the data
          if (data?.error || !data?.success) {
            console.error('SmartEnrichmentTrigger: Function returned error:', data?.error || 'Unknown error');
            setHasTriggeredEnrichment(false); // Allow retry
            
            toast({
              title: "Analysis Error",
              description: `AI analysis failed: ${data?.error || 'Unknown error'}`,
              variant: "destructive",
            });
            return;
          }

          // Success - show appropriate message
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

        } catch (error) {
          console.error('SmartEnrichmentTrigger: Failed to trigger enrichment:', error);
          setHasTriggeredEnrichment(false); // Allow retry
          
          toast({
            title: "Analysis Error",
            description: "Failed to start AI analysis. Please try refreshing the page.",
            variant: "destructive",
          });
        }
      };

      // Trigger immediately since we have entities
      console.log('SmartEnrichmentTrigger: Triggering enrichment immediately...');
      triggerEnrichment();
    } else if (!status.hasEntities) {
      console.log('SmartEnrichmentTrigger: No entities found, checking if we need to trigger parsing...');
      
      // If we don't have entities and processing seems stuck, try to restart the pipeline
      if (status.processingProgress === 100 && !status.hasEntities) {
        console.log('SmartEnrichmentTrigger: Processing shows 100% but no entities found, may need manual intervention');
        
        toast({
          title: "Processing Issue Detected",
          description: "The system shows complete but entities are missing. Please try uploading again.",
          variant: "destructive",
        });
      }
    } else {
      console.log('SmartEnrichmentTrigger: Conditions not met for auto-triggering:', {
        hasEntities: status.hasEntities,
        hasEnrichment: status.hasEnrichment,
        hasTriggeredEnrichment,
        processingStage: status.processingStage
      });
    }
  }, [status, isLoading, versionId, hasTriggeredEnrichment, onStatusChange, toast]);

  // This component doesn't render anything - it's purely for logic
  return null;
};
