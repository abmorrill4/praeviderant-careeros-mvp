
import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewModes } from '@/hooks/useInterviewModes';
import FloatingInterviewControl from './FloatingInterviewControl';
import StatusBanner from './StatusBanner';
import CollapsibleDataSidebar from './CollapsibleDataSidebar';
import UnifiedChatInput from './UnifiedChatInput';
import StructuredInterviewInterface from './StructuredInterviewInterface';

const VoiceInterview = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasActiveInterview, setHasActiveInterview] = useState(false);

  const {
    session,
    transcript,
    isLoading,
    interviewContext,
    isResumedSession,
    isDemoMode,
    createSession,
    checkForActiveInterview,
    addTranscriptEntry,
    addSystemMessage,
    endSession,
  } = useInterviewSession();

  const {
    mode,
    isVoiceAvailable,
    isProcessing,
    micEnabled,
    isRecording,
    toggleMode,
    toggleMicrophone,
    startRecording,
    stopRecording,
  } = useInterviewModes();

  // Check for active interview on component mount
  useEffect(() => {
    const checkActiveInterview = async () => {
      if (user) {
        const activeInterview = await checkForActiveInterview();
        setHasActiveInterview(!!activeInterview);
      }
    };
    
    checkActiveInterview();
  }, [user, checkForActiveInterview]);

  const handleStartInterview = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      await createSession(false);
      setIsConnected(true);
      await addSystemMessage("Interview session started", "success");
    } catch (error) {
      console.error('Failed to start interview:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleResumeInterview = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      await createSession(true);
      setIsConnected(true);
      await addSystemMessage("Interview session resumed", "success");
    } catch (error) {
      console.error('Failed to resume interview:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStopInterview = () => {
    setIsConnected(false);
    endSession();
  };

  const handleSendTextMessage = async (message: string) => {
    if (!isConnected || !session) return;
    
    // Add user message to transcript
    await addTranscriptEntry('user', message);
    
    // Simulate AI response (in demo mode)
    if (isDemoMode) {
      setTimeout(async () => {
        await addTranscriptEntry('assistant', "Thanks for sharing! Could you tell me more about your specific achievements in that role?");
      }, 1000);
    }
  };

  const handleStartRecording = () => {
    if (isVoiceAvailable && micEnabled) {
      startRecording();
    }
  };

  const handleStopRecording = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-bg-dark' : 'bg-career-bg-light'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header with Controls */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              AI Career Interview
            </h1>
            <p className={`text-lg mt-2 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Interactive conversation to build your personalized resume
            </p>
          </div>

          <FloatingInterviewControl
            isConnected={isConnected}
            isConnecting={isConnecting}
            hasActiveInterview={hasActiveInterview}
            onStartInterview={handleStartInterview}
            onResumeInterview={handleResumeInterview}
            onStopInterview={handleStopInterview}
          />
        </div>

        {/* Status Banner */}
        <StatusBanner
          isConnected={isConnected}
          isDemoMode={isDemoMode}
          isResumedSession={isResumedSession}
          currentMode={mode}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Interview Interface */}
          <div className="lg:col-span-2">
            {isConnected ? (
              <StructuredInterviewInterface sessionId={session?.sessionId || null} />
            ) : (
              <div className={`rounded-xl border p-8 text-center ${
                theme === 'dark' 
                  ? 'bg-career-panel-dark/30 border-career-gray-dark/30' 
                  : 'bg-white border-career-gray-light/30'
              }`}>
                <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Ready to Start Your Career Interview?
                </h3>
                <p className={`mb-6 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Our AI will guide you through a structured conversation to capture your professional background and create a personalized resume.
                </p>
              </div>
            )}
          </div>

          {/* Data Sidebar */}
          <div className="lg:col-span-1">
            <CollapsibleDataSidebar
              transcript={transcript}
              interviewContext={interviewContext}
              isConnected={isConnected}
            />
          </div>
        </div>

        {/* Chat Input - Fixed at bottom when connected */}
        {isConnected && mode === 'text' && (
          <div className="fixed bottom-0 left-0 right-0 z-10">
            <UnifiedChatInput
              mode={mode}
              isVoiceAvailable={isVoiceAvailable}
              isConnected={isConnected}
              isProcessing={isProcessing}
              micEnabled={micEnabled}
              isRecording={isRecording}
              onModeToggle={toggleMode}
              onSendTextMessage={handleSendTextMessage}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onToggleMicrophone={toggleMicrophone}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInterview;
