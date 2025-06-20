
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  MessageSquare, 
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

interface InterviewControlPanelProps {
  isActive: boolean;
  mode: 'voice' | 'text';
  isRecording: boolean;
  micEnabled: boolean;
  volumeEnabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onModeToggle: () => void;
  onMicToggle: () => void;
  onVolumeToggle: () => void;
  onSettings?: () => void;
}

const InterviewControlPanel = ({
  isActive,
  mode,
  isRecording,
  micEnabled,
  volumeEnabled,
  onStart,
  onPause,
  onStop,
  onModeToggle,
  onMicToggle,
  onVolumeToggle,
  onSettings,
}: InterviewControlPanelProps) => {
  const { theme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);

  const handlePause = () => {
    setIsPaused(!isPaused);
    onPause();
  };

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/30 border-career-gray-dark/30' : 'bg-white border-career-gray-light/30'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Main Controls */}
          <div className="flex items-center gap-2">
            {!isActive ? (
              <Button
                onClick={onStart}
                className="bg-career-accent hover:bg-career-accent-dark text-white"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Interview
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePause}
                  variant="outline"
                  size="sm"
                  className={`${theme === 'dark' ? 'border-career-gray-dark/40' : 'border-career-gray-light/40'}`}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={onStop}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Mode Toggle */}
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

          {/* Audio Controls */}
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
              onClick={onVolumeToggle}
              variant="ghost"
              size="sm"
              className={`${!volumeEnabled ? 'text-red-500' : ''}`}
            >
              {volumeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>

          {/* Settings */}
          {onSettings && (
            <Button
              onClick={onSettings}
              variant="ghost"
              size="sm"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-3 text-center">
          <div className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            {!isActive && 'Interview not started'}
            {isActive && isPaused && 'Interview paused'}
            {isActive && !isPaused && mode === 'voice' && isRecording && 'Recording...'}
            {isActive && !isPaused && mode === 'voice' && !isRecording && 'Voice mode ready'}
            {isActive && !isPaused && mode === 'text' && 'Text mode active'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewControlPanel;
