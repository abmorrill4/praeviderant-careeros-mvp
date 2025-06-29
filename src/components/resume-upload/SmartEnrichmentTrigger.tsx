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

  // FIXED: Reset trigger state when processing completes
  useEffect(() => {
    if (status?.isComplete && status?.processingProgress === 100) {
      console.log('SmartEnrichmentTrigger: Processing complete, resetting trigger state');
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
    }
  }, [status?.isComplete, status?.processingProgress]);

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

    // Don't trigger if already complete
    if (status.isComplete && status.processingProgress === 100) {
      console.log('SmartEnrichmentTrigger: Processing already complete, no action needed');
      return;
    }

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

    // Auto-trigger enrichment when we need either enrichment OR narratives
    const needsEnrichment = status.hasEntities && (!status.hasEnrichment || !status.hasNarratives);
    
    if (needsEnrichment && !triggerStateRef.current.hasTriggeredEnrichment) {
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

      console.log('SmartEnrichmentTrigger: Triggering bulk enrichment for work/education entries');
      
      triggerStateRef.current.hasTriggeredEnrichment = true;
      triggerStateRef.current.attemptCount += 1;
      triggerStateRef.current.lastAttemptTime = Date.now();
      
      setDebugInfo({
        lastUpdate: new Date().toISOString(),
        triggerState: { ...triggerStateRef.current }
      });
      
      const triggerBulkEnrichment = async () => {
        try {
          console.log('SmartEnrichmentTrigger: Starting bulk enrichment for version:', versionId);
          
          toast({
            title: "Starting AI Analysis",
            description: `Analyzing work and education entries... (Attempt ${triggerStateRef.current.attemptCount}/${MAX_ATTEMPTS})`,
            variant: "default",
          });

          // Use the bulk enrichment approach instead of the general enrich-resume function
          console.log('SmartEnrichmentTrigger: Calling bulk enrichment');

          // Import and use the bulk enrichment hook directly
          const { useBulkEntryEnrichment } = await import('@/hooks/useBulkEntryEnrichment');
          
          // Note: We can't use the hook here directly, so we'll call the enrich-resume function
          // but it should now handle bulk enrichment internally
          const { data, error } = await supabase.functions.invoke('enrich-resume', {
            body: { versionId },
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('SmartEnrichmentTrigger: Bulk enrichment response:', { 
            data, 
            error,
            hasData: !!data,
            hasError: !!error 
          });

          if (error) {
            console.error('SmartEnrichmentTrigger: Bulk enrichment error:', error);
            
            // Reset trigger state to allow retry after delay
            triggerStateRef.current.hasTriggeredEnrichment = false;
            
            toast({
              title: "AI Analysis Error",
              description: `Failed to analyze entries: ${error.message}. Will retry automatically.`,
              variant: "destructive",
            });
            return;
          }

          // Success - show appropriate message
          console.log('SmartEnrichmentTrigger: Bulk enrichment completed successfully:', data);
          
          toast({
            title: "AI Analysis Complete",
            description: "Successfully analyzed work and education entries.",
            variant: "default",
          });

        } catch (error) {
          console.error('SmartEnrichmentTrigger: Failed to trigger bulk enrichment:', error);
          
          // Reset trigger state to allow retry after delay
          triggerStateRef.current.hasTriggeredEnrichment = false;
          
          toast({
            title: "Analysis Error",
            description: "Failed to start AI analysis. Will retry automatically.",
            variant: "destructive",
          });
        }
      };

      // Trigger the bulk enrichment
      triggerBulkEnrichment();
    } else {
      console.log('SmartEnrichmentTrigger: Conditions not met for auto-triggering:', {
        hasEntities: status.hasEntities,
        hasEnrichment: status.hasEnrichment,
        hasNarratives: status.hasNarratives,
        hasTriggeredEnrichment: triggerStateRef.current.hasTriggeredEnrichment,
        processingStage: status.processingStage,
        needsEnrichment
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
        <div>Has Enrichment: {status?.hasEnrichment ? 'Yes' : 'No'}</div>
        <div>Has Narratives: {status?.hasNarratives ? 'Yes' : 'No'}</div>
        <div>Is Complete: {status?.isComplete ? 'Yes' : 'No'}</div>
        <div>Progress: {status?.processingProgress || 0}%</div>
        <div>Last Update: {debugInfo.lastUpdate.split('T')[1].slice(0, 8)}</div>
      </div>
    );
  }

  // This component doesn't render anything in production
  return null;
};
