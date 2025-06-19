
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Square, Play, Loader2, RotateCcw } from 'lucide-react';

interface FloatingInterviewControlProps {
  isConnected: boolean;
  isConnecting: boolean;
  hasActiveInterview: boolean;
  onStartInterview: () => void;
  onResumeInterview: () => void;
  onStopInterview: () => void;
}

const FloatingInterviewControl = ({
  isConnected,
  isConnecting,
  hasActiveInterview,
  onStartInterview,
  onResumeInterview,
  onStopInterview,
}: FloatingInterviewControlProps) => {
  const { theme } = useTheme();

  if (isConnected) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={onStopInterview}
          className="rounded-full shadow-lg px-4 py-3 font-medium bg-red-500 hover:bg-red-600 hover:shadow-xl text-white transition-all"
        >
          <Square className="w-4 h-4 mr-2" />
          End
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 flex gap-3">
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
      
      {hasActiveInterview && (
        <Button
          onClick={onResumeInterview}
          disabled={isConnecting}
          className="rounded-full shadow-lg px-6 py-2 bg-career-accent hover:bg-career-accent-dark text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Resume Interview
        </Button>
      )}
    </div>
  );
};

export default FloatingInterviewControl;
