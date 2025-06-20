
import { useTheme } from '@/contexts/ThemeContext';
import { useStructuredInterview } from '@/hooks/useStructuredInterview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Play, Send, Loader2, MessageSquare, CheckCircle } from 'lucide-react';

interface StructuredInterviewInterfaceProps {
  sessionId: string | null;
}

const StructuredInterviewInterface = ({ sessionId }: StructuredInterviewInterfaceProps) => {
  const { theme } = useTheme();
  const [inputMessage, setInputMessage] = useState('');
  
  const {
    isActive,
    messages,
    isLoading,
    isComplete,
    startInterview,
    sendMessage,
    resetInterview,
  } = useStructuredInterview(sessionId);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Interview Messages */}
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/30 border-career-gray-dark/30' : 'bg-white border-career-gray-light/30'}`}>
        <CardContent className="p-6">
          {!isActive && !isComplete ? (
            <div className="text-center py-12">
              <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Ready for Your Career Interview?
              </h3>
              <p className={`text-sm mb-6 max-w-md mx-auto ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                I'll ask you some questions about your professional background to create a personalized resume.
              </p>
              <Button
                onClick={startInterview}
                disabled={isLoading || !sessionId}
                className="bg-career-accent hover:bg-career-accent-dark text-white px-6 py-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.speaker === 'user'
                            ? 'bg-career-accent text-white'
                            : `${theme === 'dark' ? 'bg-career-gray-dark/40 text-career-text-dark' : 'bg-career-gray-light/40 text-career-text-light'}`
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl px-4 py-3 ${theme === 'dark' ? 'bg-career-gray-dark/40' : 'bg-career-gray-light/40'}`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              {isActive && !isComplete && (
                <div className="border-t pt-4">
                  <div className="flex gap-3">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response..."
                      disabled={isLoading}
                      className={`flex-1 min-h-[48px] max-h-32 resize-none ${
                        theme === 'dark' 
                          ? 'bg-career-gray-dark/30 border-career-gray-dark/40 text-career-text-dark' 
                          : 'bg-white border-career-gray-light/40 text-career-text-light'
                      }`}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-career-accent hover:bg-career-accent-dark text-white px-4"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              )}

              {/* Complete State */}
              {isComplete && (
                <div className="text-center py-6 border-t">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Interview Complete!
                  </h4>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Thank you for sharing your experience. Check your dashboard for the generated resume.
                  </p>
                  <Button
                    onClick={resetInterview}
                    variant="outline"
                    className="border-career-accent text-career-accent hover:bg-career-accent hover:text-white"
                  >
                    Start New Interview
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StructuredInterviewInterface;
