
import { useTheme } from '@/contexts/ThemeContext';
import { AlertCircle, CheckCircle, Info, Loader2, Mic, MessageSquare } from 'lucide-react';

interface StatusBannerProps {
  type: 'connecting' | 'listening' | 'thinking' | 'switching' | 'error' | 'success' | 'info';
  message: string;
  visible: boolean;
  onDismiss?: () => void;
}

const StatusBanner = ({ type, message, visible, onDismiss }: StatusBannerProps) => {
  const { theme } = useTheme();

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'connecting':
      case 'thinking':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'listening':
        return <Mic className="w-4 h-4 text-blue-500" />;
      case 'switching':
        return <MessageSquare className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    const baseClass = theme === 'dark' 
      ? 'bg-career-panel-dark/95 border-career-text-dark/20' 
      : 'bg-career-panel-light/95 border-career-text-light/20';
    
    switch (type) {
      case 'error':
        return `${baseClass} border-l-4 border-red-500`;
      case 'success':
        return `${baseClass} border-l-4 border-green-500`;
      case 'listening':
        return `${baseClass} border-l-4 border-blue-500`;
      case 'switching':
        return `${baseClass} border-l-4 border-yellow-500`;
      default:
        return `${baseClass} border-l-4 border-career-accent`;
    }
  };

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md animate-fade-in`}>
      <div className={`flex items-center gap-3 p-3 rounded-lg shadow-lg backdrop-blur-sm border ${getBgColor()}`}>
        {getIcon()}
        <span className={`text-sm font-medium ${
          theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
        }`}>
          {message}
        </span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-auto text-xs ${
              theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-text-dark' : 'text-career-text-muted-light hover:text-career-text-light'
            }`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusBanner;
