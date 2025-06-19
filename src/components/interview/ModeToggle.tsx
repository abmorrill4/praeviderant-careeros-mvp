
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Mic, MessageSquare, Loader2 } from 'lucide-react';
import { InterviewMode } from '@/hooks/useInterviewModes';

interface ModeToggleProps {
  mode: InterviewMode;
  onToggle: () => void;
  isVoiceAvailable: boolean;
  isReconnecting: boolean;
  disabled?: boolean;
}

const ModeToggle = ({ 
  mode, 
  onToggle, 
  isVoiceAvailable, 
  isReconnecting, 
  disabled = false 
}: ModeToggleProps) => {
  const { theme } = useTheme();

  const getButtonText = () => {
    if (isReconnecting) return 'Reconnecting...';
    if (mode === 'voice') return 'Use Text Mode';
    return isVoiceAvailable ? 'Use Voice Mode' : 'Voice Unavailable';
  };

  const getIcon = () => {
    if (isReconnecting) return <Loader2 className="w-4 h-4 animate-spin" />;
    return mode === 'voice' ? <MessageSquare className="w-4 h-4" /> : <Mic className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center justify-center">
      <Button
        onClick={onToggle}
        disabled={disabled || isReconnecting || (mode === 'text' && !isVoiceAvailable)}
        variant="outline"
        className={`flex items-center gap-2 transition-all duration-200 ${
          theme === 'dark'
            ? 'border-career-text-dark/20 text-career-text-dark hover:bg-career-accent/20'
            : 'border-career-text-light/20 text-career-text-light hover:bg-career-accent/10'
        }`}
        aria-label={`Switch to ${mode === 'voice' ? 'text' : 'voice'} mode`}
        aria-live="polite"
      >
        {getIcon()}
        <span>{getButtonText()}</span>
      </Button>
    </div>
  );
};

export default ModeToggle;
