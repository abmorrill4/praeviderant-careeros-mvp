import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSmartInterview } from '@/hooks/useSmartInterview';
import { Brain, MessageCircle, Clock, SkipForward, Play, Pause, Square, Lightbulb, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmartInterviewFlowProps {
  interviewType?: string;
  onComplete?: (insights: any) => void;
}

export const SmartInterviewFlow: React.FC<SmartInterviewFlowProps> = ({
  interviewType = 'general',
  onComplete
}) => {
  const {
    session,
    currentQuestion,
    context,
    isLoading,
    isProcessingResponse,
    initializeSession,
    submitResponse,
    getSessionInsights,
    pauseSession,
    resumeSession,
    endSession,
    skipQuestion,
    cleanup
  } = useSmartInterview();

  const [response, setResponse] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionInsights, setSessionInsights] = useState<any>(null);
  const responseTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleStartInterview = async () => {
    try {
      await initializeSession(interviewType);
      setIsSessionActive(true);
      // Focus on response textarea after question loads
      setTimeout(() => {
        responseTextareaRef.current?.focus();
      }, 500);
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast({
        title: "Response Required",
        description: "Please enter a response before continuing",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await submitResponse(response.trim());
      setResponse('');
      
      // Auto-focus for next response
      setTimeout(() => {
        responseTextareaRef.current?.focus();
      }, 100);

      // Show insights if extracted
      if (result.extractedContext) {
        const insights = await getSessionInsights();
        setSessionInsights(insights);
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };

  const handlePauseResume = async () => {
    if (session?.status === 'paused') {
      await resumeSession();
    } else {
      await pauseSession();
    }
  };

  const handleEndSession = async () => {
    try {
      const finalInsights = await endSession();
      setIsSessionActive(false);
      setSessionInsights(finalInsights);
      
      if (onComplete) {
        onComplete(finalInsights);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleSkipQuestion = async () => {
    await skipQuestion('User chose to skip this question');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  if (!isSessionActive && !session) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Smart AI Interview
          </CardTitle>
          <p className="text-muted-foreground">
            Start an intelligent conversation to build your comprehensive career profile
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col items-center gap-2">
                <MessageCircle className="w-8 h-8 text-blue-500" />
                <span className="font-medium">Adaptive Questions</span>
                <span className="text-muted-foreground">Questions adapt based on your responses</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Brain className="w-8 h-8 text-purple-500" />
                <span className="font-medium">AI-Powered Insights</span>
                <span className="text-muted-foreground">Real-time context extraction</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className="font-medium">Smart Progress</span>
                <span className="text-muted-foreground">Tracks completion intelligently</span>
              </div>
            </div>
            
            <Button 
              onClick={handleStartInterview}
              disabled={isLoading}
              size="lg"
              className="min-w-48"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Interview
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <span className="font-medium">Smart Interview</span>
                <Badge variant="outline">
                  {session?.interview_type || 'General'}
                </Badge>
              </div>
              {session?.completion_percentage !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Progress:</span>
                  <Progress value={session.completion_percentage} className="w-24" />
                  <span className="text-sm font-medium">{session.completion_percentage}%</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseResume}
                disabled={isProcessingResponse}
              >
                {session?.status === 'paused' ? (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSession}
                disabled={isProcessingResponse}
              >
                <Square className="w-3 h-3 mr-1" />
                End
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <Badge variant="secondary">{currentQuestion.category}</Badge>
                  {currentQuestion.expectedDataPoints && (
                    <span className="text-xs text-muted-foreground">
                      Looking for: {currentQuestion.expectedDataPoints.slice(0, 2).join(', ')}
                      {currentQuestion.expectedDataPoints.length > 2 && '...'}
                    </span>
                  )}
                </div>
                <p className="text-lg leading-relaxed">{currentQuestion.text}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipQuestion}
                disabled={isProcessingResponse}
              >
                <SkipForward className="w-3 h-3 mr-1" />
                Skip
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                ref={responseTextareaRef}
                placeholder="Share your thoughts here... (Ctrl/Cmd + Enter to submit)"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                onKeyDown={handleKeyPress}
                className="min-h-32 resize-none"
                disabled={isProcessingResponse}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {response.length} characters
                  {response.length > 0 && response.length < 20 && (
                    <span className="text-yellow-600 ml-2">• Consider adding more detail</span>
                  )}
                </div>
                
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!response.trim() || isProcessingResponse}
                  className="min-w-32"
                >
                  {isProcessingResponse ? (
                    <>
                      <Clock className="w-3 h-3 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context & Insights */}
      {(context || sessionInsights) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Interview Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {context && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{context.totalResponses}</div>
                    <div className="text-sm text-muted-foreground">Responses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{context.mentionedTopics.length}</div>
                    <div className="text-sm text-muted-foreground">Topics Covered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(context.avgResponseLength)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Length</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={context.conversationDepth === 'deep' ? 'default' : 'secondary'}>
                      {context.conversationDepth}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Depth</div>
                  </div>
                </>
              )}
            </div>
            
            {sessionInsights && sessionInsights.key_insights && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Key Insights:</h4>
                <div className="space-y-1">
                  {sessionInsights.key_insights.slice(0, 3).map((insight: string, index: number) => (
                    <div key={index} className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};