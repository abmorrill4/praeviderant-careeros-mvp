
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Square, Play, Loader2 } from 'lucide-react';

interface FloatingInterviewControlProps {
  isConnected: boolean;
  isConnecting: boolean;
  onStartInterview: () => void;
  onStopInterview: () => void;
}

const FloatingInterviewControl = ({
  isConnected,
  isConnecting,
  onStartInterview,
  onStopInterview,
}: FloatingInterviewControlProps) => {
  const { theme } = useTheme();

  return (
    <div className="fixed top-4 left-4 z-50">
      {!isConnected ? (
        <Button
          onClick={onStartInterview}
          disabled={isConnecting}
          className={`rounded-full shadow-lg px-6 py-2 ${
            isConnecting 
              ? 'bg-gray-500 hover:bg-gray-600' 
              : 'bg-career-accent hover:bg-career-accent-dark'
          } text-white`}
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
          className="rounded-full shadow-lg px-4 py-2"
        >
          <Square className="w-4 h-4 mr-2" />
          End
        </Button>
      )}
    </div>
  );
};

export default FloatingInterviewControl;
