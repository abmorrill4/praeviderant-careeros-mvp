
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  micEnabled: boolean;
  disabled?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleMic: () => void;
}

const VoiceInputButton = ({
  isRecording,
  isProcessing,
  micEnabled,
  disabled = false,
  onStartRecording,
  onStopRecording,
  onToggleMic,
}: VoiceInputButtonProps) => {
  const { theme } = useTheme();
  const [audioLevel, setAudioLevel] = useState(0);

  // Simulate audio level animation when recording
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isRecording]);

  const handleClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mic toggle button */}
      <Button
        onClick={onToggleMic}
        variant="outline"
        size="sm"
        disabled={disabled}
        className={`${
          micEnabled 
            ? 'border-career-accent text-career-accent' 
            : 'border-red-500 text-red-500'
        }`}
        aria-label={micEnabled ? 'Disable microphone' : 'Enable microphone'}
      >
        {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </Button>

      {/* Main voice input button */}
      <Button
        onClick={handleClick}
        disabled={disabled || !micEnabled || isProcessing}
        className={`relative overflow-hidden min-w-[120px] ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-career-accent hover:bg-career-accent-dark'
        } text-white transition-all duration-200`}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {/* Audio level visualization */}
        {isRecording && (
          <div 
            className="absolute inset-0 bg-white/20 transition-all duration-150"
            style={{ transform: `scaleX(${audioLevel / 100})`, transformOrigin: 'left' }}
          />
        )}
        
        <div className="relative flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          <span className="font-medium">
            {isProcessing 
              ? 'Processing...' 
              : isRecording 
                ? 'Stop Recording' 
                : 'Hold to Speak'
            }
          </span>
        </div>
      </Button>
    </div>
  );
};

export default VoiceInputButton;
