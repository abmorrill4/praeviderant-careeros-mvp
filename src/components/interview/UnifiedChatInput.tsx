
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
    <div className={`border-t p-4 ${
      theme === 'dark' 
        ? 'bg-career-panel-dark/95 backdrop-blur-sm border-career-gray-dark/30' 
        : 'bg-career-panel-light/95 backdrop-blur-sm border-career-gray-light/30'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className={`flex items-end gap-3 p-4 rounded-2xl border shadow-sm ${
          theme === 'dark' 
            ? 'bg-career-gray-dark/30 border-career-gray-dark/40' 
            : 'bg-white border-career-gray-light/40 shadow-neumorphic-sm-light'
        }`}>
          {/* Mode Toggle */}
          <Button
            onClick={onModeToggle}
            variant="ghost"
            size="sm"
            disabled={isProcessing || isRecording}
            className={`rounded-xl p-2 transition-all ${
              mode === 'voice' 
                ? 'bg-career-accent/20 text-career-accent hover:bg-career-accent/30' 
                : `${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-text-dark hover:bg-career-gray-dark/40' : 'text-career-text-muted-light hover:text-career-text-light hover:bg-career-gray-light/40'}`
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
                className={`flex-1 min-h-[48px] max-h-32 resize-none border-0 shadow-none focus:ring-0 focus-visible:ring-0 ${
                  theme === 'dark' 
                    ? 'bg-transparent text-career-text-dark placeholder:text-career-text-muted-dark' 
                    : 'bg-transparent text-career-text-light placeholder:text-career-text-muted-light'
                }`}
              />
              
              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isProcessing}
                className="bg-career-accent hover:bg-career-accent-dark text-white rounded-xl shadow-sm"
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
                  className={`rounded-full px-6 py-3 transition-all font-medium ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg' 
                      : 'bg-career-accent hover:bg-career-accent-dark shadow-sm'
                  } text-white`}
                >
                  <Mic className="w-5 h-5 mr-2" />
                  {isProcessing 
                    ? 'Processing...' 
                    : isRecording 
                      ? 'Recording... (tap to stop)' 
                      : 'Voice mode (demo)'
                  }
                </Button>
              </div>

              {/* Mic Toggle */}
              <Button
                onClick={onToggleMicrophone}
                variant="ghost"
                size="sm"
                className={`rounded-xl p-2 transition-all ${
                  !micEnabled 
                    ? 'text-red-500 hover:bg-red-50 hover:text-red-600' 
                    : `${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-text-dark hover:bg-career-gray-dark/40' : 'text-career-text-muted-light hover:text-career-text-light hover:bg-career-gray-light/40'}`
                }`}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </>
          )}
        </div>
        
        {/* Helper Text */}
        <div className={`text-xs text-center mt-3 ${
          theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
        }`}>
          {mode === 'voice' 
            ? '🎤 Voice mode (demo) - Switch to text mode for interactive chat'
            : '💬 Press Enter to send, Shift+Enter for new line'
          }
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatInput;
