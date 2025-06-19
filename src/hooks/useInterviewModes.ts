
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type InterviewMode = 'voice' | 'text';

interface UseInterviewModesProps {
  onModeChange?: (mode: InterviewMode) => void;
}

export const useInterviewModes = ({ onModeChange }: UseInterviewModesProps = {}) => {
  const [mode, setMode] = useState<InterviewMode>(() => {
    const saved = localStorage.getItem('interview-mode-preference');
    return (saved as InterviewMode) || 'voice';
  });
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('interview-mode-preference', mode);
  }, [mode]);

  const switchMode = useCallback((newMode: InterviewMode, reason?: string) => {
    setMode(newMode);
    onModeChange?.(newMode);
    
    if (reason) {
      toast({
        title: `Switched to ${newMode} mode`,
        description: reason,
      });
    }
  }, [onModeChange, toast]);

  const handleMicrophonePermissionDenied = useCallback(() => {
    setIsVoiceAvailable(false);
    switchMode('text', "We couldn't access your microphone. Switched to text mode to keep going.");
  }, [switchMode]);

  const handleConnectionFailure = useCallback(async (attemptReconnect?: () => Promise<boolean>) => {
    if (reconnectAttempts >= 2) {
      setIsVoiceAvailable(false);
      switchMode('text', "Connection issue detected. We've switched you to text input while we try to reconnect.");
      return;
    }

    setIsReconnecting(true);
    setReconnectAttempts(prev => prev + 1);

    if (attemptReconnect) {
      try {
        const success = await attemptReconnect();
        if (success) {
          setReconnectAttempts(0);
          setIsReconnecting(false);
          toast({
            title: "Reconnected",
            description: "Resuming voice input.",
          });
          return;
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }

    setIsReconnecting(false);
    
    if (reconnectAttempts >= 1) {
      setIsVoiceAvailable(false);
      switchMode('text', "Connection issue detected. We've switched you to text input.");
    }
  }, [reconnectAttempts, switchMode, toast]);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'voice' ? 'text' : 'voice';
    
    if (newMode === 'voice' && !isVoiceAvailable) {
      toast({
        title: "Voice mode unavailable",
        description: "Please check your microphone permissions and connection.",
        variant: "destructive",
      });
      return;
    }

    switchMode(newMode);
  }, [mode, isVoiceAvailable, switchMode, toast]);

  const toggleMicrophone = useCallback(() => {
    setMicEnabled(prev => !prev);
    if (isRecording) {
      setIsRecording(false);
    }
  }, [isRecording]);

  const startRecording = useCallback(() => {
    if (micEnabled && isVoiceAvailable) {
      setIsRecording(true);
      setIsProcessing(false);
    }
  }, [micEnabled, isVoiceAvailable]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsProcessing(true);
  }, []);

  const resetVoiceAvailability = useCallback(() => {
    setIsVoiceAvailable(true);
    setReconnectAttempts(0);
    setIsReconnecting(false);
  }, []);

  return {
    mode,
    isVoiceAvailable,
    isReconnecting,
    reconnectAttempts,
    isProcessing,
    micEnabled,
    isRecording,
    toggleMode,
    switchMode,
    handleMicrophonePermissionDenied,
    handleConnectionFailure,
    resetVoiceAvailability,
    toggleMicrophone,
    startRecording,
    stopRecording,
  };
};
