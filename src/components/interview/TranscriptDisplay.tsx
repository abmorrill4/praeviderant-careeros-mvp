
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import SystemMessage from './SystemMessage';

interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'assistant' | 'system';
  content: string;
  timestamp_ms?: number;
  created_at: string;
  type?: 'info' | 'warning' | 'success';
}

interface TranscriptDisplayProps {
  transcript: TranscriptEntry[];
  isConnected: boolean;
  mode: 'voice' | 'text';
}

const TranscriptDisplay = ({ transcript, isConnected, mode }: TranscriptDisplayProps) => {
  const { theme } = useTheme();

  return (
    <Card className={`${theme === 'dark' ? 'bg-career-panel-dark border-career-text-dark/20' : 'bg-career-panel-light border-career-text-light/20'}`}>
      <CardHeader>
        <CardTitle className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
          Interview Conversation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transcript.length === 0 ? (
            <div className={`text-center py-8 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
              {isConnected ? 
                `Start chatting - use ${mode === 'voice' ? 'voice input or switch to text' : 'text input or switch to voice'} mode.` : 
                "Click 'Start Interview' to begin the conversation."
              }
            </div>
          ) : (
            transcript.map((entry, index) => {
              if (entry.speaker === 'system') {
                return (
                  <SystemMessage
                    key={entry.id || index}
                    type={entry.type || 'info'}
                    message={entry.content}
                    timestamp={new Date(entry.created_at).toLocaleTimeString()}
                  />
                );
              }

              return (
                <div
                  key={entry.id || index}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    entry.speaker === 'user'
                      ? theme === 'dark'
                        ? 'bg-career-accent/20 ml-8'
                        : 'bg-career-accent/10 ml-8'
                      : theme === 'dark'
                        ? 'bg-career-gray-dark/20 mr-8'
                        : 'bg-career-gray-light/20 mr-8'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    {entry.speaker === 'user' ? 'You' : 'AI Interviewer'}
                  </div>
                  <div className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    {entry.content}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-career-text-muted-dark/70' : 'text-career-text-muted-light/70'}`}>
                    {new Date(entry.created_at).toLocaleTimeString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TranscriptDisplay;
