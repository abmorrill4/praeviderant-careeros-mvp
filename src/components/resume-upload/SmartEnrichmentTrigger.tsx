
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

  useEffect(() => {
    if (!status || isLoading) return;

    // Notify parent of completion status
    onStatusChange?.(status.isComplete);

    // Auto-trigger enrichment when entities are ready but enrichment hasn't started
    if (status.hasEntities && !status.hasEnrichment && status.processingStage !== 'failed') {
      console.log('Auto-triggering AI enrichment for version:', versionId);
      
      const triggerEnrichment = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('enrich-resume', {
            body: { versionId }
          });

          if (error) {
            console.error('Error triggering enrichment:', error);
            toast({
              title: "Processing Warning",
              description: "AI analysis may take longer than expected. Please wait or refresh the page.",
              variant: "default",
            });
          } else {
            console.log('AI enrichment triggered successfully:', data);
          }
        } catch (error) {
          console.error('Failed to trigger enrichment:', error);
        }
      };

      // Small delay to avoid race conditions
      const timeoutId = setTimeout(triggerEnrichment, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [status, isLoading, versionId, onStatusChange, toast]);

  // This component doesn't render anything - it's purely for logic
  return null;
};
