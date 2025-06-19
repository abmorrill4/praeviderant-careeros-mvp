
import { useState, KeyboardEvent } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { InterviewMode } from '@/hooks/useInterviewModes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, MessageSquare, Loader2 } from 'lucide-react';

interface UnifiedChatInputProps {
  mode: InterviewMode;
  isVoiceAvailable: boolean;
  isConnected: boolean;
  isProcessing: boolean;
  micEnabled: boolean;
  isRecording: boolean;
  onModeToggle: () => void;
  onSendTextMessage: (message: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleMicrophone: () => void;
}

const UnifiedChatInput = ({
  mode,
  isVoiceAvailable,
  isConnected,
  isProcessing,
  micEnabled,
  isRecording,
  onModeToggle,
  onSendTextMessage,
  onStartRecording,
  onStopRecording,
  onToggleMicrophone,
}: UnifiedChatInputProps) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isProcessing && isConnected) {
      onSendTextMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-4 border-t ${
      theme === 'dark' 
        ? 'bg-career-panel-dark/95 backdrop-blur border-career-text-dark/20' 
        : 'bg-career-panel-light/95 backdrop-blur border-career-text-light/20'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className={`flex items-end gap-3 p-3 rounded-2xl border ${
          theme === 'dark' 
            ? 'bg-career-gray-dark/20 border-career-text-dark/20' 
            : 'bg-white border-career-text-light/20'
        }`}>
          {/* Mode Toggle */}
          <Button
            onClick={onModeToggle}
            variant="ghost"
            size="sm"
            disabled={isProcessing || isRecording}
            className={`rounded-xl ${
              mode === 'voice' 
                ? 'bg-career-accent/20 text-career-accent' 
                : 'text-gray-500'
            }`}
          >
            {mode === 'voice' ? <Mic className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          </Button>

          {mode === 'text' ? (
            <>
              {/* Text Input */}
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                disabled={isProcessing}
                className={`flex-1 min-h-[48px] max-h-32 resize-none border-0 shadow-none focus:ring-0 ${
                  theme === 'dark' 
                    ? 'bg-transparent text-career-text-dark placeholder:text-career-text-muted-dark' 
                    : 'bg-transparent text-career-text-light placeholder:text-career-text-muted-light'
                }`}
              />
              
              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isProcessing}
                className="bg-career-accent hover:bg-career-accent-dark text-white rounded-xl"
                size="sm"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Voice Input Area */}
              <div className="flex-1 flex items-center justify-center py-2">
                <Button
                  onClick={handleVoiceToggle}
                  disabled={!micEnabled || isProcessing}
                  className={`rounded-full px-6 py-3 transition-all ${
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

              {/* Mic Toggle */}
              <Button
                onClick={onToggleMicrophone}
                variant="ghost"
                size="sm"
                className={`rounded-xl ${
                  !micEnabled ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </>
          )}
        </div>
        
        {/* Helper Text */}
        <div className={`text-xs text-center mt-2 ${
          theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
        }`}>
          {mode === 'voice' 
            ? '🎤 Speak naturally - AI responds when you finish talking'
            : '💬 Press Enter to send, Shift+Enter for new line'
          }
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatInput;
