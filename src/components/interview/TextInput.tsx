
import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, Loader2 } from 'lucide-react';

interface TextInputProps {
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

const TextInput = ({ onSendMessage, isProcessing = false, disabled = false }: TextInputProps) => {
  const [message, setMessage] = useState('');
  const { theme } = useTheme();

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

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            💬 Type your response and press Enter to send (Shift+Enter for new line)
          </div>
          
          <div className="flex gap-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={disabled || isProcessing}
              className={`flex-1 min-h-[80px] resize-none ${
                theme === 'dark' 
                  ? 'bg-career-gray-dark/20 border-career-text-dark/20 text-career-text-dark placeholder:text-career-text-muted-dark' 
                  : 'bg-white border-career-text-light/20 text-career-text-light placeholder:text-career-text-muted-light'
              }`}
              aria-label="Interview message input"
            />
            
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isProcessing || disabled}
              className="bg-career-accent hover:bg-career-accent-dark text-white self-end"
              aria-label="Send message"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TextInput;
