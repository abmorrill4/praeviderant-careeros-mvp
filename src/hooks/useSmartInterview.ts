import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SmartInterviewSession {
  id: string;
  interview_type: string;
  context_data: any;
  current_phase: string;
  completion_percentage: number;
  session_insights: any;
  status?: string;
}

interface InterviewQuestion {
  id: string;
  text: string;
  category: string;
  expectedDataPoints?: string[];
  followUpTriggers?: string[];
}

interface InterviewContext {
  totalResponses: number;
  avgResponseLength: number;
  mentionedTopics: string[];
  conversationDepth: 'surface' | 'deep';
  responsiveness: 'brief' | 'detailed';
}

export const useSmartInterview = () => {
  const [session, setSession] = useState<SmartInterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [context, setContext] = useState<InterviewContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const initializeSession = useCallback(async (interviewType: string = 'general') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-interview-manager', {
        body: {
          action: 'initialize_session',
          interviewType
        }
      });

      if (error) throw error;

      setSession(data.session);
      setCurrentQuestion(data.firstQuestion);
      
      toast({
        title: "Interview Started",
        description: `Starting ${data.strategy} interview approach`,
      });

      return data.session;
    } catch (error) {
      console.error('Error initializing interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview session",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const submitResponse = useCallback(async (response: string) => {
    if (!session || !currentQuestion) {
      throw new Error('No active session');
    }

    setIsProcessingResponse(true);

    try {
      // Process the response
      const { data: processResult, error: processError } = await supabase.functions.invoke('smart-interview-manager', {
        body: {
          action: 'process_response',
          sessionId: session.id,
          userResponse: response
        }
      });

      if (processError) throw processError;

      // Get next question
      const { data: nextQuestionData, error: questionError } = await supabase.functions.invoke('smart-interview-manager', {
        body: {
          action: 'get_next_question',
          sessionId: session.id,
          userResponse: response
        }
      });

      if (questionError) throw questionError;

      setCurrentQuestion(nextQuestionData.question);
      setContext(nextQuestionData.context);
      
      // Update session completion
      setSession(prev => prev ? {
        ...prev,
        completion_percentage: nextQuestionData.sessionProgress
      } : null);

      // Process context in background for real-time insights
      if (processResult.extractedContext) {
        processingTimeoutRef.current = setTimeout(async () => {
          try {
            await supabase.functions.invoke('process-interview-context', {
              body: {
                sessionId: session.id,
                transcriptId: processResult.transcriptId,
                realTimeProcessing: true
              }
            });
          } catch (error) {
            console.error('Background context processing error:', error);
          }
        }, 1000);
      }

      return {
        nextQuestion: nextQuestionData.question,
        context: nextQuestionData.context,
        extractedContext: processResult.extractedContext
      };

    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to process your response",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessingResponse(false);
    }
  }, [session, currentQuestion, toast]);

  const getSessionInsights = useCallback(async () => {
    if (!session) return null;

    try {
      const { data, error } = await supabase.functions.invoke('smart-interview-manager', {
        body: {
          action: 'get_session_insights',
          sessionId: session.id
        }
      });

      if (error) throw error;
      return data.insights;
    } catch (error) {
      console.error('Error getting session insights:', error);
      return null;
    }
  }, [session]);

  const pauseSession = useCallback(async () => {
    if (!session) return;

    try {
      await supabase
        .from('interview_sessions')
        .update({ status: 'paused' })
        .eq('id', session.id);

      setSession(prev => prev ? { ...prev, status: 'paused' } : null);
      
      toast({
        title: "Session Paused",
        description: "You can resume your interview anytime",
      });
    } catch (error) {
      console.error('Error pausing session:', error);
    }
  }, [session, toast]);

  const resumeSession = useCallback(async () => {
    if (!session) return;

    try {
      await supabase
        .from('interview_sessions')
        .update({ status: 'active' })
        .eq('id', session.id);

      setSession(prev => prev ? { ...prev, status: 'active' } : null);
      
      toast({
        title: "Session Resumed",
        description: "Continuing your interview",
      });
    } catch (error) {
      console.error('Error resuming session:', error);
    }
  }, [session, toast]);

  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      // Clear any pending processing
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      await supabase
        .from('interview_sessions')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id);

      const insights = await getSessionInsights();
      
      setSession(null);
      setCurrentQuestion(null);
      setContext(null);

      toast({
        title: "Interview Completed",
        description: `Covered ${insights?.topics_covered || 0} topics with ${insights?.completion_percentage || 0}% completion`,
      });

      return insights;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }, [session, getSessionInsights, toast]);

  const skipQuestion = useCallback(async (reason?: string) => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('smart-interview-manager', {
        body: {
          action: 'get_next_question',
          sessionId: session.id,
          userResponse: `[SKIPPED: ${reason || 'User chose to skip'}]`
        }
      });

      if (error) throw error;

      setCurrentQuestion(data.question);
      setContext(data.context);

      toast({
        title: "Question Skipped",
        description: "Moving to next question",
      });
    } catch (error) {
      console.error('Error skipping question:', error);
    }
  }, [session, toast]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
  }, []);

  return {
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
  };
};