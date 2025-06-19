import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewModes } from '@/hooks/useInterviewModes';
import { useSystemPrompt } from '@/hooks/useSystemPrompt';
import { WebRTCAudioManager } from '@/utils/webrtcAudio';
import { useToast } from '@/hooks/use-toast';
import TranscriptDisplay from './TranscriptDisplay';
import UnifiedChatInput from './UnifiedChatInput';
import CompactAudioWaveform from './CompactAudioWaveform';
import StatusBanner from './StatusBanner';
import CollapsibleDataSidebar from './CollapsibleDataSidebar';
import FloatingInterviewControl from './FloatingInterviewControl';
import { StructuredDataItem } from './StructuredDataDisplay';

// Mock structured data for demonstration
const mockStructuredData: StructuredDataItem[] = [
  { id: '1', type: 'company', value: 'Tech Corp', status: 'new', confidence: 0.95 },
  { id: '2', type: 'job_title', value: 'Senior Developer', status: 'updated', confidence: 0.88 },
  { id: '3', type: 'skill', value: 'React', status: 'existing', confidence: 0.92 },
];

const VoiceInterview = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const { systemPrompt, isLoading: isLoadingPrompt } = useSystemPrompt();
  const {
    session,
    transcript,
    isLoading,
    createSession,
    addTranscriptEntry,
    addSystemMessage,
    updateSessionStatus,
    endSession,
  } = useInterviewSession();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'connecting' | 'listening' | 'thinking' | 'switching' | 'error' | 'success' | 'info';
    message: string;
    visible: boolean;
  }>({ type: 'info', message: '', visible: false });
  const [structuredData, setStructuredData] = useState<StructuredDataItem[]>(mockStructuredData);
  const [audioData, setAudioData] = useState<Float32Array>();

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
      
      showStatusBanner('switching', `Switched to ${newMode} mode`, 3000);
      
      if (session) {
        addSystemMessage(
          `Switched to ${newMode} mode`,
          newMode === 'voice' ? 'success' : 'info'
        );
      }
    }
  });

  const showStatusBanner = (
    type: typeof statusBanner.type, 
    message: string, 
    duration = 5000
  ) => {
    setStatusBanner({ type, message, visible: true });
    if (duration > 0) {
      setTimeout(() => {
        setStatusBanner(prev => ({ ...prev, visible: false }));
      }, duration);
    }
  };

  const handleStartInterview = async () => {
    if (isLoadingPrompt) {
      showStatusBanner('error', 'System prompt is still loading. Please wait.', 3000);
      return;
    }

    try {
      setIsConnecting(true);
      showStatusBanner('connecting', 'Connecting to AI interviewer...', 0);
      
      const sessionData = await createSession();
      
      if (mode === 'voice' && isVoiceAvailable) {
        try {
          await initializeVoiceMode(sessionData);
        } catch (error) {
          console.error('Voice initialization failed:', error);
          handleMicrophonePermissionDenied();
          showStatusBanner('error', 'Microphone access denied — switched to text mode.', 5000);
        }
      }

      await updateSessionStatus('active');
      setIsConnected(true);
      
      await addSystemMessage(
        `Interview started in ${mode} mode. ${mode === 'voice' ? 'The AI will greet you shortly.' : 'The AI will greet you - you can respond below.'}`,
        'success'
      );
      
      showStatusBanner('success', `Interview started in ${mode} mode`, 3000);
      
      // For text mode, simulate AI greeting
      if (mode === 'text') {
        setTimeout(async () => {
          const greeting = "Hello! I'm Praeviderant, your career assistant. I'm here to learn about your professional background to help create a tailored resume. To get started, could you tell me about your current or most recent role?";
          await addTranscriptEntry('assistant', greeting);
        }, 1500);
      } else {
        setIsListening(true);
        showStatusBanner('listening', 'AI is preparing to greet you...', 0);
      }
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      
      if (mode === 'voice') {
        handleMicrophonePermissionDenied();
        showStatusBanner('error', 'Voice connection failed — switched to text mode.', 5000);
      } else {
        showStatusBanner('error', 'Failed to start interview. Please try again.', 5000);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const initializeVoiceMode = async (sessionData: any) => {
    try {
      resetVoiceAvailability();
      
      audioManagerRef.current = new WebRTCAudioManager();
      
      await audioManagerRef.current.initialize(
        sessionData.clientSecret,
        systemPrompt,
        handleDataChannelMessage,
        handleConnectionStateChange
      );
    } catch (error) {
      console.error('Voice initialization failed:', error);
      if (session) {
        await addSystemMessage(
          "Microphone access denied — switched to text mode.",
          'warning'
        );
      }
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
    setIsRecording(false);
    setIsPlaying(false);
    setIsListening(false);
    setIsThinking(false);
    setStatusBanner(prev => ({ ...prev, visible: false }));
    endSession();
    
    toast({
      title: "Interview Ended",
      description: "Your interview session has been saved.",
    });
  };

  const handleTextMessage = async (message: string) => {
    if (!session) return;
    
    setIsProcessingText(true);
    setIsThinking(true);
    showStatusBanner('thinking', 'AI is thinking...', 0);
    
    try {
      await addTranscriptEntry('user', message);
      
      // Simulate AI response
      setTimeout(async () => {
        const aiResponse = `Thank you for sharing that. Can you tell me more about your experience with that?`;
        await addTranscriptEntry('assistant', aiResponse);
        setIsProcessingText(false);
        setIsThinking(false);
        setStatusBanner(prev => ({ ...prev, visible: false }));
      }, 1500);
      
    } catch (error) {
      console.error('Error processing text message:', error);
      setIsProcessingText(false);
      setIsThinking(false);
      showStatusBanner('error', 'Failed to process your message. Please try again.', 5000);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsListening(true);
    setIsThinking(false);
    showStatusBanner('listening', 'Listening...', 0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsListening(false);
    setIsThinking(true);
    showStatusBanner('thinking', 'Processing your response...', 0);
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
          setIsListening(false);
          setIsThinking(true);
          showStatusBanner('thinking', 'AI is responding...', 0);
        }
        break;

      case 'response.audio.delta':
        setIsPlaying(true);
        setIsThinking(false);
        setStatusBanner(prev => ({ ...prev, visible: false }));
        
        // Convert base64 audio to Float32Array for waveform
        if (data.delta) {
          try {
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Convert PCM16 to Float32Array
            const float32Data = new Float32Array(bytes.length / 2);
            for (let i = 0; i < float32Data.length; i++) {
              const int16 = (bytes[i * 2 + 1] << 8) | bytes[i * 2];
              float32Data[i] = int16 / 32768.0;
            }
            setAudioData(float32Data);
          } catch (error) {
            console.error('Error processing audio data:', error);
          }
        }
        break;

      case 'response.audio.done':
        setIsPlaying(false);
        setIsListening(true);
        showStatusBanner('listening', 'Listening for your response...', 0);
        break;
        
      case 'error':
        console.error('OpenAI error:', data.error);
        showStatusBanner('error', 'Connection error occurred', 5000);
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
      if (session) {
        addSystemMessage(
          "Voice connection lost. You're now in text mode.",
          'warning'
        );
      }
      showStatusBanner('error', 'Voice connection lost — switched to text mode.', 5000);
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
      showStatusBanner('info', `Microphone ${newState ? 'enabled' : 'disabled'}`, 2000);
    }
  };

  const toggleAudio = () => {
    if (audioManagerRef.current) {
      const newState = !audioEnabled;
      audioManagerRef.current.setAudioOutputEnabled(newState);
      setAudioEnabled(newState);
      showStatusBanner('info', `Audio output ${newState ? 'enabled' : 'disabled'}`, 2000);
    }
  };

  // Structured data handlers
  const handleConfirmData = (id: string) => {
    setStructuredData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, confirmed: true } : item
      )
    );
  };

  const handleEditData = (id: string, newValue: string) => {
    setStructuredData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, value: newValue, status: 'updated' as const } : item
      )
    );
  };

  const handleRemoveData = (id: string) => {
    setStructuredData(prev => prev.filter(item => item.id !== id));
  };

  // Handle mode changes during active session
  useEffect(() => {
    if (isConnected && mode === 'voice' && isVoiceAvailable && !audioManagerRef.current && session && !isLoadingPrompt) {
      initializeVoiceMode(session).catch(console.error);
    } else if (mode === 'text' && audioManagerRef.current) {
      audioManagerRef.current.disconnect();
      audioManagerRef.current = null;
      setIsPlaying(false);
      setIsListening(false);
      setStatusBanner(prev => ({ ...prev, visible: false }));
    }
  }, [mode, isConnected, isVoiceAvailable, session, isLoadingPrompt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="relative h-screen flex">
      {/* Status Banner */}
      <StatusBanner
        type={statusBanner.type}
        message={statusBanner.message}
        visible={statusBanner.visible}
        onDismiss={() => setStatusBanner(prev => ({ ...prev, visible: false }))}
      />

      {/* Floating Interview Control */}
      <FloatingInterviewControl
        isConnected={isConnected}
        isConnecting={isConnecting || isLoadingPrompt}
        onStartInterview={handleStartInterview}
        onStopInterview={handleStopInterview}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Compact Waveform */}
        {isConnected && (
          <div className="px-6 pt-6">
            <CompactAudioWaveform
              isPlaying={isPlaying}
              isListening={isListening}
              isThinking={isThinking}
              audioData={audioData}
            />
          </div>
        )}

        {/* Transcript Display */}
        <TranscriptDisplay
          transcript={transcript}
          isConnected={isConnected}
          mode={mode}
        />
      </div>

      {/* Collapsible Data Sidebar */}
      <CollapsibleDataSidebar
        data={structuredData}
        onConfirm={handleConfirmData}
        onEdit={handleEditData}
        onRemove={handleRemoveData}
      />

      {/* Unified Chat Input */}
      <UnifiedChatInput
        mode={mode}
        isVoiceAvailable={isVoiceAvailable}
        isConnected={isConnected}
        isProcessing={isProcessingText || isReconnecting}
        micEnabled={micEnabled}
        isRecording={isRecording}
        onModeToggle={toggleMode}
        onSendTextMessage={handleTextMessage}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onToggleMicrophone={toggleMicrophone}
      />
    </div>
  );
};

export default VoiceInterview;
