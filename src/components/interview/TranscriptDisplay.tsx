
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
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        theme === 'dark' 
          ? 'border-career-text-dark/10' 
          : 'border-career-text-light/10'
      }`}>
        <h2 className={`text-xl font-semibold ${
          theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
        }`}>
          Career Interview
        </h2>
        <p className={`text-sm ${
          theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
        }`}>
          {isConnected 
            ? `Active conversation in ${mode} mode`
            : 'Ready to start your interview'
          }
        </p>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          {transcript.length === 0 ? (
            <div className={`text-center py-16 ${
              theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
            }`}>
              <div className="mb-4 text-4xl">👋</div>
              <h3 className={`text-xl font-medium mb-2 ${
                theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'
              }`}>
                Welcome to your AI Career Interview
              </h3>
              <p className="text-lg">
                {isConnected 
                  ? `Start the conversation using ${mode === 'voice' ? 'voice or text' : 'text or voice'}`
                  : 'Click "Start Interview" to begin your personalized career conversation'
                }
              </p>
            </div>
          ) : (
            transcript.map((entry, index) => {
              if (entry.speaker === 'system') {
                return (
                  <div key={entry.id || index} className="flex justify-center">
                    <SystemMessage
                      type={entry.type || 'info'}
                      message={entry.content}
                      timestamp={new Date(entry.created_at).toLocaleTimeString()}
                    />
                  </div>
                );
              }

              const isUser = entry.speaker === 'user';
              const isAI = entry.speaker === 'assistant';

              return (
                <div
                  key={entry.id || index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
                    {/* Speaker Label */}
                    <div className={`text-xs font-medium mb-1 ${
                      isUser 
                        ? 'text-right' 
                        : 'text-left'
                    } ${
                      theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'
                    }`}>
                      {isUser ? 'You' : 'AI Career Coach'}
                    </div>

                    {/* Message Bubble */}
                    <div className={`rounded-2xl px-4 py-3 ${
                      isUser
                        ? `${theme === 'dark' 
                            ? 'bg-career-accent text-white' 
                            : 'bg-career-accent text-white'
                          } rounded-br-md`
                        : `${theme === 'dark' 
                            ? 'bg-career-gray-dark/30 text-career-text-dark' 
                            : 'bg-career-gray-light/40 text-career-text-light'
                          } rounded-bl-md`
                    } ${
                      isAI && index === transcript.length - 1 
                        ? 'animate-fade-in shadow-lg ring-2 ring-career-accent/20' 
                        : ''
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs mt-1 ${
                      isUser ? 'text-right' : 'text-left'
                    } ${
                      theme === 'dark' ? 'text-career-text-muted-dark/70' : 'text-career-text-muted-light/70'
                    }`}>
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptDisplay;
