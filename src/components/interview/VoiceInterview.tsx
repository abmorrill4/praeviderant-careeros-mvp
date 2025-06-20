
import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewModes } from '@/hooks/useInterviewModes';
import { useStructuredInterview } from '@/hooks/useStructuredInterview';
import StatusBanner from './StatusBanner';
import CollapsibleDataSidebar from './CollapsibleDataSidebar';
import InterviewControlPanel from './InterviewControlPanel';
import UnifiedMessageInput from './UnifiedMessageInput';
import StructuredInterviewInterface from './StructuredInterviewInterface';

const VoiceInterview = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeEnabled, setVolumeEnabled] = useState(true);

  const {
    session,
    transcript,
    isLoading,
    interviewContext,
    isResumedSession,
    createSession,
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

  const {
    isActive: isInterviewActive,
    messages,
    isLoading: isInterviewLoading,
    isComplete,
    startInterview,
    sendMessage,
    resetInterview,
  } = useStructuredInterview(session?.sessionId || null);

  // Auto-start interview session when component mounts
  useEffect(() => {
    const autoStartInterview = async () => {
      if (user && !isConnected && !isConnecting) {
        setIsConnecting(true);
        try {
          await createSession(false);
          setIsConnected(true);
          await addSystemMessage("Interview session created", "success");
        } catch (error) {
          console.error('Failed to auto-start interview:', error);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    autoStartInterview();
  }, [user, isConnected, isConnecting, createSession, addSystemMessage]);

  const handleStartInterview = async () => {
    if (!isInterviewActive && session) {
      await startInterview();
    }
  };

  const handlePauseInterview = () => {
    // Implement pause logic if needed
    console.log('Pause interview');
  };

  const handleStopInterview = () => {
    setIsConnected(false);
    resetInterview();
    endSession();
  };

  const handleSendMessage = async (message: string) => {
    if (!isConnected || !session || !isInterviewActive) return;
    
    await sendMessage(message);
    await addTranscriptEntry('user', message);
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

  const handleToggleVolume = () => {
    setVolumeEnabled(prev => !prev);
  };

  // Create sample data for CollapsibleDataSidebar
  const structuredData = [
    {
      id: '1',
      type: 'company' as const,
      value: 'Sample Company Inc',
      status: 'new' as const,
      confidence: 0.95,
    }
  ];

  const handleConfirm = (id: string) => {
    console.log('Confirming data item:', id);
  };

  const handleEdit = (id: string, newValue: string) => {
    console.log('Editing data item:', id, newValue);
  };

  const handleRemove = (id: string) => {
    console.log('Removing data item:', id);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-bg-dark' : 'bg-career-bg-light'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
              AI Career Interview
            </h1>
            <p className={`text-lg mt-2 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              Interactive conversation to build your personalized resume
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {isConnecting && (
          <StatusBanner
            type="connecting"
            message="Setting up your interview session..."
            visible={true}
            onDismiss={() => {}}
          />
        )}

        {/* Control Panel */}
        {isConnected && (
          <div className="mb-6">
            <InterviewControlPanel
              isActive={isInterviewActive}
              mode={mode}
              isRecording={isRecording}
              micEnabled={micEnabled}
              volumeEnabled={volumeEnabled}
              onStart={handleStartInterview}
              onPause={handlePauseInterview}
              onStop={handleStopInterview}
              onModeToggle={toggleMode}
              onMicToggle={toggleMicrophone}
              onVolumeToggle={handleToggleVolume}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Interview Interface */}
          <div className="lg:col-span-3 space-y-6">
            {isConnected ? (
              <>
                <StructuredInterviewInterface sessionId={session?.sessionId || null} />
                
                {/* Message Input */}
                {isInterviewActive && (
                  <UnifiedMessageInput
                    mode={mode}
                    isProcessing={isProcessing || isInterviewLoading}
                    isRecording={isRecording}
                    disabled={!isConnected || isComplete}
                    onSendMessage={handleSendMessage}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                  />
                )}
              </>
            ) : (
              <div className={`rounded-xl border p-8 text-center ${
                theme === 'dark' 
                  ? 'bg-career-panel-dark/30 border-career-gray-dark/30' 
                  : 'bg-white border-career-gray-light/30'
              }`}>
                <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                  Preparing Your Interview...
                </h3>
                <p className={`mb-6 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                  Please wait while we set up your career interview session.
                </p>
              </div>
            )}
          </div>

          {/* Data Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <CollapsibleDataSidebar
              data={structuredData}
              onConfirm={handleConfirm}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterview;
