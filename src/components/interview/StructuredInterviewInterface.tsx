
import { useTheme } from '@/contexts/ThemeContext';
import { useStructuredInterview } from '@/hooks/useStructuredInterview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Play, Send, Loader2, MessageSquare, Target, Zap, CheckCircle } from 'lucide-react';

interface StructuredInterviewInterfaceProps {
  sessionId: string | null;
}

const StructuredInterviewInterface = ({ sessionId }: StructuredInterviewInterfaceProps) => {
  const { theme } = useTheme();
  const [inputMessage, setInputMessage] = useState('');
  
  const {
    isActive,
    currentPhase,
    messages,
    phaseProgress,
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

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'warmup': return <MessageSquare className="w-4 h-4" />;
      case 'identity': return <Target className="w-4 h-4" />;
      case 'impact': return <Zap className="w-4 h-4" />;
      case 'deep_dive': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'warmup': return 'Getting Started';
      case 'identity': return 'Professional Identity';
      case 'impact': return 'Achievements & Impact';
      case 'deep_dive': return 'Skills & Goals';
      default: return phase;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Phase Progress Header */}
      {isActive && (
        <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/50 border-career-gray-dark/30' : 'bg-career-panel-light/50 border-career-gray-light/30'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPhaseIcon(currentPhase)}
                <div>
                  <CardTitle className={`text-lg ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    {getPhaseLabel(currentPhase)}
                  </CardTitle>
                  <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Phase {['warmup', 'identity', 'impact', 'deep_dive'].indexOf(currentPhase) + 1} of 4
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-career-accent/10 text-career-accent border-career-accent/30">
                {currentPhase.replace('_', ' ')}
              </Badge>
            </div>
            
            {phaseProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}>
                    Question {phaseProgress.current} of {phaseProgress.total}
                  </span>
                  <span className="text-career-accent font-medium">
                    {phaseProgress.percentage}%
                  </span>
                </div>
                <Progress value={phaseProgress.percentage} className="h-2" />
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      {/* Interview Messages */}
      <Card className={`${theme === 'dark' ? 'bg-career-panel-dark/30 border-career-gray-dark/30' : 'bg-white border-career-gray-light/30'}`}>
        <CardContent className="p-6">
          {!isActive && !isComplete ? (
            <div className="text-center py-12">
              <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                Structured Career Interview
              </h3>
              <p className={`text-sm mb-6 max-w-md mx-auto ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Our AI will guide you through a structured interview to capture your professional background, skills, and achievements for a personalized resume.
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
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.speaker === 'user'
                          ? 'bg-career-accent text-white'
                          : `${theme === 'dark' ? 'bg-career-gray-dark/40 text-career-text-dark' : 'bg-career-gray-light/40 text-career-text-light'}`
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.isFollowup && (
                        <Badge variant="outline" className="mt-2 text-xs bg-orange-50 text-orange-600 border-orange-200">
                          Follow-up
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl px-4 py-3 ${theme === 'dark' ? 'bg-career-gray-dark/40' : 'bg-career-gray-light/40'}`}>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                          AI is thinking...
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
                    Your responses have been processed. Check your dashboard for the generated resume.
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
