
import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useInterviewSession } from '@/hooks/useInterviewSession';
import { useInterviewModes } from '@/hooks/useInterviewModes';
import StatusBanner from './StatusBanner';
import CollapsibleDataSidebar from './CollapsibleDataSidebar';
import StreamlinedInterviewInterface from './StreamlinedInterviewInterface';

const VoiceInterview = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

  const handleEndInterview = () => {
    setIsConnected(false);
    endSession();
  };

  const handleSendMessage = async (message: string) => {
    if (!isConnected || !session) return;
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-bg-dark' : 'bg-career-bg-light'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Status Banner */}
        {isConnecting && (
          <StatusBanner
            type="connecting"
            message="Setting up your interview session..."
            visible={true}
            onDismiss={() => {}}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Interview Interface */}
          <div className="lg:col-span-3">
            <StreamlinedInterviewInterface
              sessionId={session?.sessionId || null}
              isConnected={isConnected}
              mode={mode}
              isVoiceAvailable={isVoiceAvailable}
              isProcessing={isProcessing}
              micEnabled={micEnabled}
              isRecording={isRecording}
              onSendMessage={handleSendMessage}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onModeToggle={toggleMode}
              onMicToggle={toggleMicrophone}
              onEndInterview={handleEndInterview}
            />
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
