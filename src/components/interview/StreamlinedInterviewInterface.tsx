
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useDirectInterview } from '@/hooks/useDirectInterview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Send, 
  Loader2, 
  MessageSquare, 
  CheckCircle, 
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX
} from 'lucide-react';

interface StreamlinedInterviewInterfaceProps {
  sessionId: string | null;
  isConnected: boolean;
  mode: 'voice' | 'text';
  isVoiceAvailable: boolean;
  isProcessing: boolean;
  micEnabled: boolean;
  isRecording: boolean;
  onSendMessage: (message: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onModeToggle: () => void;
  onMicToggle: () => void;
  onEndInterview: () => void;
}

const StreamlinedInterviewInterface = ({
  sessionId,
  isConnected,
  mode,
  isVoiceAvailable,
  isProcessing,
  micEnabled,
  isRecording,
  onSendMessage,
  onStartRecording,
  onStopRecording,
  onModeToggle,
  onMicToggle,
  onEndInterview,
}: StreamlinedInterviewInterfaceProps) => {
  const { theme } = useTheme();
  const [inputMessage, setInputMessage] = useState('');
  const [volumeEnabled, setVolumeEnabled] = useState(true);
  
  const {
    isActive,
    messages,
    isLoading,
    isComplete,
    startInterview,
    sendMessage,
    resetInterview,
  } = useDirectInterview(sessionId);

  const handleSendMessage = async (message: string) => {
    if (message.trim()) {
      await sendMessage(message);
      onSendMessage(message);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const handleEndInterview = () => {
    resetInterview();
    onEndInterview();
  };

  if (!isConnected) {
    return (
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/30 border-career-gray-dark/30' : 'bg-white border-career-gray-light/30'}`}>
        <CardContent className="p-12 text-center">
          <Loader2 className={`w-12 h-12 mx-auto mb-4 animate-spin ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
          <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
            Preparing Your Interview...
          </h3>
          <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            Please wait while we set up your career interview session.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Single Header */}
      <div className="text-center">
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
          AI Career Interview
        </h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
          Interactive conversation to build your personalized resume
        </p>
      </div>

      {/* Controls Bar */}
      {isActive && (
        <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/30 border-career-gray-dark/30' : 'bg-white border-career-gray-light/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={onModeToggle}
                  variant={mode === 'voice' ? 'default' : 'outline'}
                  size="sm"
                  className={mode === 'voice' ? 'bg-career-accent hover:bg-career-accent-dark text-white' : ''}
                >
                  {mode === 'voice' ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  <span className="ml-2">{mode === 'voice' ? 'Voice' : 'Text'}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={onMicToggle}
                  variant="ghost"
                  size="sm"
                  className={`${!micEnabled ? 'text-red-500' : ''}`}
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => setVolumeEnabled(!volumeEnabled)}
                  variant="ghost"
                  size="sm"
                  className={`${!volumeEnabled ? 'text-red-500' : ''}`}
                >
                  {volumeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={handleEndInterview}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interview Card */}
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/30 border-career-gray-dark/30' : 'bg-white border-career-gray-light/30'}`}>
        <CardContent className="p-6">
          {!isActive && !isComplete ? (
            <div className="text-center py-12">
              <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Ready for Your Career Interview?
              </h3>
              <p className={`text-sm mb-6 max-w-md mx-auto ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                I'll ask you some questions about your professional background to create a personalized resume.
              </p>
              <Button
                onClick={startInterview}
                disabled={isLoading || !sessionId}
                className="bg-career-accent hover:bg-career-accent-dark text-white px-6 py-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.speaker === 'user'
                            ? 'bg-career-accent text-white'
                            : `${theme === 'dark' ? 'bg-career-gray-dark/40 text-career-text-dark' : 'bg-career-gray-light/40 text-career-text-light'}`
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl px-4 py-3 ${theme === 'dark' ? 'bg-career-gray-dark/40' : 'bg-career-gray-light/40'}`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              {isActive && !isComplete && (
                <div className="border-t pt-4">
                  {mode === 'text' ? (
                    <div className="flex gap-3">
                      <Textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your response..."
                        disabled={isLoading}
                        className={`flex-1 min-h-[48px] max-h-32 resize-none ${
                          theme === 'dark' 
                            ? 'bg-career-gray-dark/30 border-career-gray-dark/40 text-career-text-dark' 
                            : 'bg-white border-career-gray-light/40 text-career-text-light'
                        }`}
                      />
                      <Button
                        onClick={() => handleSendMessage(inputMessage)}
                        disabled={!inputMessage.trim() || isLoading}
                        className="bg-career-accent hover:bg-career-accent-dark text-white px-4"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <Button
                        onClick={handleVoiceToggle}
                        disabled={isProcessing}
                        className={`rounded-full px-8 py-4 transition-all font-medium ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-career-accent hover:bg-career-accent-dark'
                        } text-white`}
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        {isProcessing 
                          ? 'Processing...' 
                          : isRecording 
                            ? 'Recording... (tap to stop)' 
                            : 'Tap to speak'
                        }
                      </Button>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 text-center ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {mode === 'text' 
                      ? 'Press Enter to send, Shift+Enter for new line'
                      : 'Voice input mode - speak clearly and tap to stop'
                    }
                  </p>
                </div>
              )}

              {/* Complete State */}
              {isComplete && (
                <div className="text-center py-6 border-t">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Interview Complete!
                  </h4>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Thank you for sharing your experience. Check your dashboard for the generated resume.
                  </p>
                  <Button
                    onClick={resetInterview}
                    variant="outline"
                    className="border-career-accent text-career-accent hover:bg-career-accent hover:text-white"
                  >
                    Start New Interview
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StreamlinedInterviewInterface;
