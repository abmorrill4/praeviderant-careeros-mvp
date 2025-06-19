
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
    <div className="fixed top-6 left-6 z-50">
      {!isConnected ? (
        <Button
          onClick={onStartInterview}
          disabled={isConnecting}
          className={`rounded-full shadow-lg px-6 py-3 font-medium transition-all ${
            isConnecting 
              ? 'bg-career-text-muted-dark hover:bg-career-text-muted-dark cursor-not-allowed' 
              : 'bg-career-accent hover:bg-career-accent-dark hover:shadow-xl'
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
          className="rounded-full shadow-lg px-4 py-3 font-medium bg-red-500 hover:bg-red-600 hover:shadow-xl text-white transition-all"
        >
          <Square className="w-4 h-4 mr-2" />
          End
        </Button>
      )}
    </div>
  );
};

export default FloatingInterviewControl;
