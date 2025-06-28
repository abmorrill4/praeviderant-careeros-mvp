
import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEnrichmentStatus } from '@/hooks/useEnrichmentStatus';

interface SmartEnrichmentTriggerProps {
  versionId: string;
  onStatusChange?: (isComplete: boolean) => void;
}

interface TriggerState {
  hasTriggeredEnrichment: boolean;
  attemptCount: number;
  lastAttemptTime: number;
  isBlocked: boolean;
  blockUntil: number;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 30000; // 30 seconds between attempts
const BLOCK_DURATION_MS = 300000; // 5 minutes block after max attempts

export const SmartEnrichmentTrigger: React.FC<SmartEnrichmentTriggerProps> = ({
  versionId,
  onStatusChange
}) => {
  const { toast } = useToast();
  const { data: status, isLoading } = useEnrichmentStatus(versionId);
  
  // Use ref to persist state across renders
  const triggerStateRef = useRef<TriggerState>({
    hasTriggeredEnrichment: false,
    attemptCount: 0,
    lastAttemptTime: 0,
    isBlocked: false,
    blockUntil: 0
  });

  const [debugInfo, setDebugInfo] = useState({
    lastUpdate: new Date().toISOString(),
    triggerState: triggerStateRef.current
  });

  console.log('SmartEnrichmentTrigger Debug:', {
    versionId,
    status,
    isLoading,
    triggerState: triggerStateRef.current,
    timestamp: new Date().toISOString()
  });

  // Reset trigger state when versionId changes
  useEffect(() => {
    triggerStateRef.current = {
      hasTriggeredEnrichment: false,
      attemptCount: 0,
      lastAttemptTime: 0,
      isBlocked: false,
      blockUntil: 0
    };
    setDebugInfo({
      lastUpdate: new Date().toISOString(),
      triggerState: triggerStateRef.current
    });
  }, [versionId]);

  // Check if we're currently blocked
  const isCurrentlyBlocked = () => {
    const now = Date.now();
    if (triggerStateRef.current.isBlocked && now < triggerStateRef.current.blockUntil) {
      return true;
    } else if (triggerStateRef.current.isBlocked && now >= triggerStateRef.current.blockUntil) {
      // Unblock if time has passed
      triggerStateRef.current.isBlocked = false;
      triggerStateRef.current.blockUntil = 0;
      return false;
    }
    return false;
  };

  // Check if we should wait before next attempt
  const shouldWaitBeforeRetry = () => {
    const now = Date.now();
    const timeSinceLastAttempt = now - triggerStateRef.current.lastAttemptTime;
    return timeSinceLastAttempt < RETRY_DELAY_MS;
  };

  useEffect(() => {
    if (!status || isLoading) {
      console.log('SmartEnrichmentTrigger: Skipping trigger - no status or loading:', { 
        hasStatus: !!status, 
        isLoading
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

    // Check if blocked
    if (isCurrentlyBlocked()) {
      const remainingTime = Math.ceil((triggerStateRef.current.blockUntil - Date.now()) / 1000);
      console.log(`SmartEnrichmentTrigger: Blocked for ${remainingTime} more seconds`);
      return;
    }

    // If we don't have entities yet, we need to wait for parsing to complete
    if (!status.hasEntities && status.processingStage !== 'failed') {
      console.log('SmartEnrichmentTrigger: Waiting for entities to be parsed...');
      return;
    }

    // Check for failed state
    if (status.processingStage === 'failed') {
      console.log('SmartEnrichmentTrigger: Processing failed, not triggering enrichment');
      return;
    }

    // Auto-trigger enrichment when entities are ready but enrichment hasn't started
    if (status.hasEntities && !status.hasEnrichment && !triggerStateRef.current.hasTriggeredEnrichment) {
      // Check attempt limits
      if (triggerStateRef.current.attemptCount >= MAX_ATTEMPTS) {
        console.log('SmartEnrichmentTrigger: Max attempts reached, blocking future attempts');
        triggerStateRef.current.isBlocked = true;
        triggerStateRef.current.blockUntil = Date.now() + BLOCK_DURATION_MS;
        
        toast({
          title: "AI Analysis Temporarily Blocked",
          description: `Maximum attempts reached. Please try again in ${Math.ceil(BLOCK_DURATION_MS / 60000)} minutes.`,
          variant: "destructive",
        });
        return;
      }

      // Check if we should wait before retry
      if (shouldWaitBeforeRetry()) {
        const remainingTime = Math.ceil((RETRY_DELAY_MS - (Date.now() - triggerStateRef.current.lastAttemptTime)) / 1000);
        console.log(`SmartEnrichmentTrigger: Waiting ${remainingTime}s before next attempt`);
        return;
      }

      console.log('SmartEnrichmentTrigger: Conditions met for auto-triggering enrichment');
      
      triggerStateRef.current.hasTriggeredEnrichment = true;
      triggerStateRef.current.attemptCount += 1;
      triggerStateRef.current.lastAttemptTime = Date.now();
      
      setDebugInfo({
        lastUpdate: new Date().toISOString(),
        triggerState: { ...triggerStateRef.current }
      });
      
      const triggerEnrichment = async () => {
        try {
          console.log('SmartEnrichmentTrigger: Starting enrichment for version:', versionId);
          
          toast({
            title: "Starting AI Analysis",
            description: `Beginning career analysis and insight generation... (Attempt ${triggerStateRef.current.attemptCount}/${MAX_ATTEMPTS})`,
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
            
            // Reset trigger state to allow retry after delay
            triggerStateRef.current.hasTriggeredEnrichment = false;
            
            toast({
              title: "AI Analysis Error",
              description: `Failed to start AI analysis: ${error.message}. Will retry automatically.`,
              variant: "destructive",
            });
            return;
          }

          // Check if the function returned an error in the data
          if (!data?.success) {
            console.error('SmartEnrichmentTrigger: Function returned error:', data?.error || 'Unknown error');
            
            // Handle specific error types
            if (data?.error?.includes('No entities available')) {
              // This is expected - entities not ready yet
              triggerStateRef.current.hasTriggeredEnrichment = false;
              console.log('SmartEnrichmentTrigger: Entities not ready, will retry later');
              return;
            }

            // Reset trigger state to allow retry after delay
            triggerStateRef.current.hasTriggeredEnrichment = false;
            
            toast({
              title: "Analysis Error",
              description: `AI analysis failed: ${data?.error || 'Unknown error'}. Will retry automatically.`,
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
          
          // Reset trigger state to allow retry after delay
          triggerStateRef.current.hasTriggeredEnrichment = false;
          
          toast({
            title: "Analysis Error",
            description: "Failed to start AI analysis. Will retry automatically.",
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
        hasTriggeredEnrichment: triggerStateRef.current.hasTriggeredEnrichment,
        processingStage: status.processingStage
      });
    }
  }, [status, isLoading, versionId, onStatusChange, toast]);

  // Debug display in development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white text-xs rounded max-w-sm">
        <div><strong>SmartEnrichmentTrigger Debug</strong></div>
        <div>Version: {versionId.slice(-8)}</div>
        <div>Attempts: {debugInfo.triggerState.attemptCount}/{MAX_ATTEMPTS}</div>
        <div>Blocked: {debugInfo.triggerState.isBlocked ? 'Yes' : 'No'}</div>
        <div>Last Update: {debugInfo.lastUpdate.split('T')[1].slice(0, 8)}</div>
      </div>
    );
  }

  // This component doesn't render anything in production
  return null;
};
