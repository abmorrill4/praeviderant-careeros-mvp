
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewModes } from '@/hooks/useInterviewModes';
import { WebRTCAudioManager } from '@/utils/webrtcAudio';
import { useToast } from '@/hooks/use-toast';
import VoiceControls from './VoiceControls';
import TranscriptDisplay from './TranscriptDisplay';
import UnifiedChatInput from './UnifiedChatInput';
import AudioWaveform from './AudioWaveform';
import StatusBanner from './StatusBanner';
import StructuredDataDisplay from './StructuredDataDisplay';

// Mock structured data for demonstration
const mockStructuredData = [
  { id: '1', type: 'company' as const, value: 'Tech Corp', status: 'new' as const, confidence: 0.95 },
  { id: '2', type: 'job_title' as const, value: 'Senior Developer', status: 'updated' as const, confidence: 0.88 },
  { id: '3', type: 'skill' as const, value: 'React', status: 'existing' as const, confidence: 0.92 },
];

const VoiceInterview = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
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
  const [structuredData, setStructuredData] = useState(mockStructuredData);
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
        `Interview started in ${mode} mode. ${mode === 'voice' ? 'Speak naturally when ready.' : 'Type your responses below.'}`,
        'success'
      );
      
      showStatusBanner('success', `Interview started in ${mode} mode`, 3000);
      
      if (mode === 'voice') {
        setIsListening(true);
        showStatusBanner('listening', 'Listening for your response...', 0);
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
    if (isConnected && mode === 'voice' && isVoiceAvailable && !audioManagerRef.current && session) {
      initializeVoiceMode(session).catch(console.error);
    } else if (mode === 'text' && audioManagerRef.current) {
      audioManagerRef.current.disconnect();
      audioManagerRef.current = null;
      setIsPlaying(false);
      setIsListening(false);
      setStatusBanner(prev => ({ ...prev, visible: false }));
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Status Banner */}
      <StatusBanner
        type={statusBanner.type}
        message={statusBanner.message}
        visible={statusBanner.visible}
        onDismiss={() => setStatusBanner(prev => ({ ...prev, visible: false }))}
      />

      {/* Left Column: Interview Interface */}
      <div className="lg:col-span-2 space-y-6">
        {/* Audio Waveform */}
        <div className={`p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-career-panel-dark border-career-text-dark/20' 
            : 'bg-career-panel-light border-career-text-light/20'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
          }`}>
            AI Voice Interface
          </h3>
          <AudioWaveform
            isPlaying={isPlaying}
            isListening={isListening}
            isThinking={isThinking}
            audioData={audioData}
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

      {/* Right Column: Transcript & Data */}
      <div className="space-y-6">
        {/* Transcript */}
        <TranscriptDisplay
          transcript={transcript}
          isConnected={isConnected}
          mode={mode}
        />

        {/* Structured Data */}
        <StructuredDataDisplay
          data={structuredData}
          onConfirm={handleConfirmData}
          onEdit={handleEditData}
          onRemove={handleRemoveData}
        />
      </div>
    </div>
  );
};

export default VoiceInterview;
