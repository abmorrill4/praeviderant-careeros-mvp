
import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewModes } from '@/hooks/useInterviewModes';
import StatusBanner from './StatusBanner';
import CollapsibleDataSidebar from './CollapsibleDataSidebar';
import UnifiedChatInput from './UnifiedChatInput';
import StructuredInterviewInterface from './StructuredInterviewInterface';

const VoiceInterview = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusBannerVisible, setStatusBannerVisible] = useState(false);

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

  // Auto-start interview session when component mounts
  useEffect(() => {
    const autoStartInterview = async () => {
      if (user && !isConnected && !isConnecting) {
        setIsConnecting(true);
        try {
          await createSession(false);
          setIsConnected(true);
          await addSystemMessage("Interview session started", "success");
        } catch (error) {
          console.error('Failed to auto-start interview:', error);
        } finally {
          setIsConnecting(false);
        }
      }
    };
    
    autoStartInterview();
  }, [user, isConnected, isConnecting, createSession, addSystemMessage]);

  const handleStopInterview = () => {
    setIsConnected(false);
    endSession();
  };

  const handleSendTextMessage = async (message: string) => {
    if (!isConnected || !session) return;
    
    // Add user message to transcript
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

  const getStatusMessage = () => {
    if (isConnecting) return "Connecting to interview session...";
    if (isResumedSession) return "Interview session resumed";
    if (mode === 'voice') return "Voice mode active";
    return "Text mode active";
  };

  const getStatusType = (): 'connecting' | 'listening' | 'thinking' | 'switching' | 'error' | 'success' | 'info' => {
    if (isConnecting) return 'connecting';
    if (isResumedSession) return 'success';
    return 'info';
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

          {isConnected && (
            <button
              onClick={handleStopInterview}
              className="px-4 py-2 font-medium bg-red-500 hover:bg-red-600 text-white transition-all rounded-lg"
            >
              End Interview
            </button>
          )}
        </div>

        {/* Status Banner */}
        <StatusBanner
          type={getStatusType()}
          message={getStatusMessage()}
          visible={statusBannerVisible}
          onDismiss={() => setStatusBannerVisible(false)}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          {/* Main Interview Interface */}
          <div className="lg:col-span-3">
            {isConnected ? (
              <StructuredInterviewInterface sessionId={session?.sessionId || null} />
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
