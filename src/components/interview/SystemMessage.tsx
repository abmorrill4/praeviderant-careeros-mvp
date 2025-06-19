
import { useTheme } from '@/contexts/ThemeContext';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface SystemMessageProps {
  type: 'info' | 'warning' | 'success';
  message: string;
  timestamp?: string;
}

const SystemMessage = ({ type, message, timestamp }: SystemMessageProps) => {
  const { theme } = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    const base = theme === 'dark' ? 'bg-career-gray-dark/10' : 'bg-career-gray-light/10';
    switch (type) {
      case 'warning':
        return `${base} border-l-4 border-yellow-500`;
      case 'success':
        return `${base} border-l-4 border-green-500`;
      default:
        return `${base} border-l-4 border-blue-500`;
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg mx-4 my-2 ${getBgColor()}`}>
      {getIcon()}
      <div className="flex-1">
        <p className={`text-sm italic ${
          theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
        }`}>
          {message}
        </p>
        {timestamp && (
          <span className={`text-xs ${
            theme === 'dark' ? 'text-career-text-muted-dark/70' : 'text-career-text-muted-light/70'
          }`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
};

export default SystemMessage;
