
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { Mic, MessageSquare } from 'lucide-react';
import { InterviewMode } from '@/hooks/useInterviewModes';

interface InterviewModeSwitchProps {
  mode: InterviewMode;
  onToggle: () => void;
  isVoiceAvailable: boolean;
  disabled?: boolean;
}

const InterviewModeSwitch = ({ 
  mode, 
  onToggle, 
  isVoiceAvailable, 
  disabled = false 
}: InterviewModeSwitchProps) => {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
      theme === 'dark' 
        ? 'bg-career-panel-dark/50 border border-career-text-dark/10' 
        : 'bg-career-panel-light/50 border border-career-text-light/10'
    }`}>
      <div className="flex items-center gap-2">
        <MessageSquare className={`w-4 h-4 ${
          mode === 'text' 
            ? 'text-career-accent' 
            : theme === 'dark' 
              ? 'text-career-text-muted-dark' 
              : 'text-career-text-muted-light'
        }`} />
        <span className={`text-sm font-medium ${
          theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
        }`}>
          Text
        </span>
      </div>
      
      <Switch
        checked={mode === 'voice'}
        onCheckedChange={onToggle}
        disabled={disabled || (mode === 'text' && !isVoiceAvailable)}
        className="data-[state=checked]:bg-career-accent"
        aria-label={`Switch to ${mode === 'voice' ? 'text' : 'voice'} mode`}
      />
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${
          theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
        }`}>
          Voice
        </span>
        <Mic className={`w-4 h-4 ${
          mode === 'voice' && isVoiceAvailable
            ? 'text-career-accent' 
            : theme === 'dark' 
              ? 'text-career-text-muted-dark' 
              : 'text-career-text-muted-light'
        }`} />
      </div>
      
      {mode === 'text' && !isVoiceAvailable && (
        <span className={`text-xs ml-2 ${
          theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
        }`}>
          (Voice unavailable)
        </span>
      )}
    </div>
  );
};

export default InterviewModeSwitch;
