
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Square,
  Loader2 
} from 'lucide-react';

interface VoiceControlsProps {
  mode: 'voice' | 'text';
  connectionState: RTCPeerConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  micEnabled: boolean;
  audioEnabled: boolean;
  hasAudioManager: boolean;
  onStartInterview: () => void;
  onStopInterview: () => void;
  onToggleMicrophone: () => void;
  onToggleAudio: () => void;
}

const VoiceControls = ({
  mode,
  connectionState,
  isConnected,
  isConnecting,
  isLoading,
  micEnabled,
  audioEnabled,
  hasAudioManager,
  onStartInterview,
  onStopInterview,
  onToggleMicrophone,
  onToggleAudio,
}: VoiceControlsProps) => {
  const { theme } = useTheme();

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'failed': case 'disconnected': return 'text-red-500';
      default: return theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light';
    }
  };

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} flex items-center justify-between`}>
          <span>Interview Controls</span>
          {mode === 'voice' && isConnected && (
            <span className={`text-sm font-normal ${getConnectionStatusColor()}`}>
              {connectionState}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          {!isConnected ? (
            <Button
              onClick={onStartInterview}
              disabled={isLoading || isConnecting}
              className="bg-career-accent hover:bg-career-accent-dark text-white"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Interview
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onStopInterview}
              variant="destructive"
            >
              <Square className="w-4 h-4 mr-2" />
              End Interview
            </Button>
          )}
          
          {isConnected && mode === 'voice' && hasAudioManager && (
            <Button
              onClick={onToggleAudio}
              variant={audioEnabled ? "default" : "destructive"}
              size="sm"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          )}
        </div>
        
        {isConnected && (
          <div className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
            {mode === 'voice' 
              ? '🎤 Speak naturally - the AI will respond when you finish talking.'
              : '💬 Type your responses below or switch to voice mode.'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceControls;
