
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewModes } from '@/hooks/useInterviewModes';
import { useSystemPrompt } from '@/hooks/useSystemPrompt';
import { WebRTCAudioManager } from '@/utils/webrtcAudio';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import TranscriptDisplay from './TranscriptDisplay';
import UnifiedChatInput from './UnifiedChatInput';
import CompactAudioWaveform from './CompactAudioWaveform';
import StatusBanner from './StatusBanner';
import CollapsibleDataSidebar from './CollapsibleDataSidebar';
import FloatingInterviewControl from './FloatingInterviewControl';
import InterviewModeSwitch from './InterviewModeSwitch';
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
    interviewContext,
    isResumedSession,
    createSession,
    checkForActiveInterview,
    addTranscriptEntry,
    addSystemMessage,
    updateSessionStatus,
    endSession,
  } = useInterviewSession();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasActiveInterview, setHasActiveInterview] = useState(false);
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

  // Check for active interview on component mount
  useEffect(() => {
    const checkActiveInterview = async () => {
      const activeInterview = await checkForActiveInterview();
      setHasActiveInterview(!!activeInterview);
    };
    
    checkActiveInterview();
  }, []);

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

  const handleStartInterview = async (resumeMode = false) => {
    // For demo purposes, let's bypass the edge function and simulate a working interview
    try {
      setIsConnecting(true);
      showStatusBanner('connecting', resumeMode ? 'Resuming interview...' : 'Starting demo interview...', 0);
      
      // Simulate session creation without the edge function
      const mockSession = {
        sessionId: `mock-session-${Date.now()}`,
        openAISessionId: `mock-openai-${Date.now()}`,
        clientSecret: 'mock-secret'
      };
      
      // Set the mock session
      // Note: We'll need to modify useInterviewSession to handle demo mode
      
      setIsConnected(true);
      setHasActiveInterview(false);
      
      const sessionMessage = resumeMode 
        ? `Demo interview resumed in ${mode} mode. This is a demonstration version.`
        : `Demo interview started in ${mode} mode. ${mode === 'voice' ? 'Voice features are simulated.' : 'You can type messages below to test the interface.'}`;
      
      await addSystemMessage(sessionMessage, 'success');
      
      showStatusBanner('success', resumeMode ? `Demo interview resumed in ${mode} mode` : `Demo interview started in ${mode} mode`, 3000);
      
      // For text mode, simulate AI greeting
      if (mode === 'text') {
        setTimeout(async () => {
          const greeting = resumeMode 
            ? "Welcome back! I see we were discussing your career background. Let me review where we left off and continue from there. Based on our previous conversation, what would you like to elaborate on or update?"
            : "Hello! I'm Praeviderant, your career assistant. I'm here to learn about your professional background to help create a tailored resume. To get started, could you tell me about your current or most recent role?";
          await addTranscriptEntry('assistant', greeting);
        }, 1500);
      } else {
        setIsListening(true);
        showStatusBanner('listening', resumeMode ? 'AI is reviewing your previous session...' : 'AI is preparing to greet you...', 0);
      }
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      showStatusBanner('error', 'Failed to start interview. Please try again.', 5000);
    } finally {
      setIsConnecting(false);
    }
  };

  const initializeVoiceMode = async (sessionData: any) => {
    try {
      resetVoiceAvailability();
      
      audioManagerRef.current = new WebRTCAudioManager();
      
      // Create enhanced system prompt with context for resumed sessions
      let enhancedPrompt = systemPrompt;
      if (isResumedSession && interviewContext) {
        enhancedPrompt = createContextualPrompt(systemPrompt, interviewContext);
      }
      
      await audioManagerRef.current.initialize(
        sessionData.clientSecret,
        enhancedPrompt,
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

  const createContextualPrompt = (basePrompt: string, context: any) => {
    const contextSections = [];
    
    if (context.careerProfile) {
      contextSections.push(`CURRENT PROFILE: ${JSON.stringify(context.careerProfile)}`);
    }
    
    if (context.jobHistory && context.jobHistory.length > 0) {
      contextSections.push(`JOB HISTORY: ${JSON.stringify(context.jobHistory)}`);
    }
    
    if (context.recentSummaries && context.recentSummaries.length > 0) {
      contextSections.push(`PREVIOUS SESSION SUMMARIES: ${context.recentSummaries.join('; ')}`);
    }
    
    const contextPrefix = `RESUMING INTERVIEW - You have the following context about the user:\n${contextSections.join('\n\n')}\n\nUse this context to continue the conversation naturally without asking for information you already have. Focus on filling gaps or getting updates to existing information.\n\n`;
    
    return contextPrefix + basePrompt;
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
    // Simulate working without session requirement for demo
    setIsProcessingText(true);
    setIsThinking(true);
    showStatusBanner('thinking', 'AI is thinking...', 0);
    
    try {
      // Add user message directly to transcript for demo
      const userEntry = {
        id: `user-${Date.now()}`,
        speaker: 'user' as const,
        content: message,
        created_at: new Date().toISOString(),
      };
      
      // Update transcript state directly for demo
      // await addTranscriptEntry('user', message);
      
      // Simulate AI response
      setTimeout(async () => {
        const responses = [
          "That's very interesting. Can you tell me more about your responsibilities in that role?",
          "Great experience! What were some of the key challenges you faced?",
          "Thank you for sharing that. What skills did you develop or strengthen in that position?",
          "That sounds like valuable experience. How did that role prepare you for your next career step?",
          "Excellent! Can you walk me through a specific project or achievement you're proud of?"
        ];
        
        const aiResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const aiEntry = {
          id: `ai-${Date.now()}`,
          speaker: 'assistant' as const,
          content: aiResponse,
          created_at: new Date().toISOString(),
        };
        
        // For demo, add directly without database
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
    <div className="h-full flex relative">
      {/* Status Banner */}
      <StatusBanner
        type={statusBanner.type}
        message={statusBanner.message}
        visible={statusBanner.visible}
        onDismiss={() => setStatusBanner(prev => ({ ...prev, visible: false }))}
      />

      {/* Main Interview Content - properly sized to not overlap with sidebar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Interview Controls Header */}
        <div className={`border-b p-4 flex items-center justify-between ${
          theme === 'dark' 
            ? 'bg-career-panel-dark/95 border-career-text-dark/10' 
            : 'bg-career-panel-light/95 border-career-text-light/10'
        }`}>
          <div className="flex items-center gap-4">
            <FloatingInterviewControl
              isConnected={isConnected}
              isConnecting={isConnecting || isLoadingPrompt}
              hasActiveInterview={hasActiveInterview}
              onStartInterview={() => handleStartInterview(false)}
              onResumeInterview={() => handleStartInterview(true)}
              onStopInterview={handleStopInterview}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <InterviewModeSwitch
              mode={mode}
              onToggle={toggleMode}
              isVoiceAvailable={isVoiceAvailable}
              disabled={isConnecting || isLoadingPrompt}
            />
          </div>
        </div>

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

        {/* Transcript Display - ensure it takes available space */}
        <div className="flex-1 min-h-0">
          <TranscriptDisplay
            transcript={transcript}
            isConnected={isConnected}
            mode={mode}
          />
        </div>

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
          onStartRecording={() => {}}
          onStopRecording={() => {}}
          onToggleMicrophone={() => {}}
        />
      </div>

      {/* Collapsible Data Sidebar - positioned to not overlap main content */}
      <CollapsibleDataSidebar
        data={structuredData}
        onConfirm={handleConfirmData}
        onEdit={handleEditData}
        onRemove={handleRemoveData}
      />
    </div>
  );
};

export default VoiceInterview;
