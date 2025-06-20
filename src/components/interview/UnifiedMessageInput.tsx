
import { useState, KeyboardEvent } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, Loader2 } from 'lucide-react';

interface UnifiedMessageInputProps {
  mode: 'voice' | 'text';
  isProcessing: boolean;
  isRecording: boolean;
  disabled: boolean;
  onSendMessage: (message: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const UnifiedMessageInput = ({
  mode,
  isProcessing,
  isRecording,
  disabled,
  onSendMessage,
  onStartRecording,
  onStopRecording,
}: UnifiedMessageInputProps) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isProcessing && !disabled) {
      onSendMessage(message.trim());
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

  if (disabled) {
    return null;
  }

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/30 border-career-gray-dark/30' : 'bg-white border-career-gray-light/30'}`}>
      <CardContent className="p-4">
        {mode === 'text' ? (
          <div className="flex gap-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              disabled={isProcessing}
              className={`flex-1 min-h-[80px] resize-none ${
                theme === 'dark' 
                  ? 'bg-career-gray-dark/30 border-career-gray-dark/40 text-career-text-dark' 
                  : 'bg-white border-career-gray-light/40 text-career-text-light'
              }`}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isProcessing}
              className="bg-career-accent hover:bg-career-accent-dark text-white self-end"
            >
              {isProcessing ? (
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
        
        <div className={`text-xs text-center mt-2 ${
          theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
        }`}>
          {mode === 'text' 
            ? 'Press Enter to send, Shift+Enter for new line'
            : 'Voice input mode - speak clearly and tap to stop'
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedMessageInput;
