
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewModes } from '@/hooks/useInterviewModes';
import { WebRTCAudioManager } from '@/utils/webrtcAudio';
import { useToast } from '@/hooks/use-toast';
import TextInput from './TextInput';
import ModeToggle from './ModeToggle';
import VoiceControls from './VoiceControls';
import TranscriptDisplay from './TranscriptDisplay';

const VoiceInterview = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const {
    session,
    transcript,
    isLoading,
    createSession,
    addTranscriptEntry,
    updateSessionStatus,
    endSession,
  } = useInterviewSession();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isProcessingText, setIsProcessingText] = useState(false);
  
  const audioManagerRef = useRef<WebRTCAudioManager | null>(null);

  const {
    mode,
    isVoiceAvailable,
    isReconnecting,
    toggleMode,
    handleMicrophonePermissionDenied,
    handleConnectionFailure,
    resetVoiceAvailability,
  } = useInterviewModes({
    onModeChange: (newMode) => {
      console.log('Interview mode changed to:', newMode);
      
      // Announce mode change for screen readers
      const announcement = `Switched to ${newMode} mode`;
      const ariaLiveRegion = document.createElement('div');
      ariaLiveRegion.setAttribute('aria-live', 'polite');
      ariaLiveRegion.setAttribute('aria-atomic', 'true');
      ariaLiveRegion.style.position = 'absolute';
      ariaLiveRegion.style.left = '-10000px';
      ariaLiveRegion.textContent = announcement;
      document.body.appendChild(ariaLiveRegion);
      
      setTimeout(() => {
        document.body.removeChild(ariaLiveRegion);
      }, 1000);
    }
  });

  const handleStartInterview = async () => {
    try {
      setIsConnecting(true);
      
      // Create session first
      const sessionData = await createSession();
      
      if (mode === 'voice' && isVoiceAvailable) {
        await initializeVoiceMode(sessionData);
      }

      await updateSessionStatus('active');
      setIsConnected(true);
      
      toast({
        title: "Interview Started",
        description: `Ready for ${mode} input.`,
      });
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      
      // If voice mode failed, try falling back to text
      if (mode === 'voice') {
        handleMicrophonePermissionDenied();
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to start the interview. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const initializeVoiceMode = async (sessionData: any) => {
    try {
      // Reset voice availability when attempting to connect
      resetVoiceAvailability();
      
      audioManagerRef.current = new WebRTCAudioManager();
      
      await audioManagerRef.current.initialize(
        sessionData.clientSecret,
        handleDataChannelMessage,
        handleConnectionStateChange
      );
    } catch (error) {
      console.error('Voice initialization failed:', error);
      handleMicrophonePermissionDenied();
      throw error;
    }
  };

  const handleStopInterview = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.disconnect();
      audioManagerRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('new');
    endSession();
    
    toast({
      title: "Interview Ended",
      description: "Your interview session has been saved.",
    });
  };

  const handleTextMessage = async (message: string) => {
    if (!session) return;
    
    setIsProcessingText(true);
    
    try {
      // Add user message to transcript
      await addTranscriptEntry('user', message);
      
      // Simulate AI response (replace with actual AI call)
      setTimeout(async () => {
        const aiResponse = `Thank you for sharing that. Can you tell me more about your experience with that?`;
        await addTranscriptEntry('assistant', aiResponse);
        setIsProcessingText(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error processing text message:', error);
      setIsProcessingText(false);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDataChannelMessage = (data: any) => {
    console.log('Received message:', data.type);
    
    switch (data.type) {
      case 'conversation.item.created':
        if (data.item?.content && data.item.content.length > 0) {
          const content = data.item.content[0];
          if (content.type === 'text') {
            addTranscriptEntry('assistant', content.text);
          }
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (data.transcript) {
          addTranscriptEntry('user', data.transcript);
        }
        break;
        
      case 'error':
        console.error('OpenAI error:', data.error);
        handleConnectionFailure(async () => {
          if (session) {
            await initializeVoiceMode(session);
            return true;
          }
          return false;
        });
        break;
    }
  };

  const handleConnectionStateChange = (state: RTCPeerConnectionState) => {
    setConnectionState(state);
    
    if (state === 'failed' || state === 'disconnected') {
      handleConnectionFailure(async () => {
        if (session) {
          await initializeVoiceMode(session);
          return true;
        }
        return false;
      });
    }
  };

  const toggleMicrophone = () => {
    if (audioManagerRef.current) {
      const newState = !micEnabled;
      audioManagerRef.current.setMicrophoneEnabled(newState);
      setMicEnabled(newState);
    }
  };

  const toggleAudio = () => {
    if (audioManagerRef.current) {
      const newState = !audioEnabled;
      audioManagerRef.current.setAudioOutputEnabled(newState);
      setAudioEnabled(newState);
    }
  };

  // Handle mode changes during active session
  useEffect(() => {
    if (isConnected && mode === 'voice' && isVoiceAvailable && !audioManagerRef.current && session) {
      initializeVoiceMode(session).catch(console.error);
    } else if (mode === 'text' && audioManagerRef.current) {
      audioManagerRef.current.disconnect();
      audioManagerRef.current = null;
    }
  }, [mode, isConnected, isVoiceAvailable, session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <ModeToggle
          mode={mode}
          onToggle={toggleMode}
          isVoiceAvailable={isVoiceAvailable}
          isReconnecting={isReconnecting}
          disabled={isConnecting}
        />
      </div>

      {/* Controls */}
      <VoiceControls
        mode={mode}
        connectionState={connectionState}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isLoading={isLoading}
        micEnabled={micEnabled}
        audioEnabled={audioEnabled}
        hasAudioManager={!!audioManagerRef.current}
        onStartInterview={handleStartInterview}
        onStopInterview={handleStopInterview}
        onToggleMicrophone={toggleMicrophone}
        onToggleAudio={toggleAudio}
      />

      {/* Text Input (only shown in text mode and when connected) */}
      {isConnected && mode === 'text' && (
        <TextInput
          onSendMessage={handleTextMessage}
          isProcessing={isProcessingText}
          disabled={!session}
        />
      )}

      {/* Transcript */}
      <TranscriptDisplay
        transcript={transcript}
        isConnected={isConnected}
        mode={mode}
      />
    </div>
  );
};

export default VoiceInterview;
