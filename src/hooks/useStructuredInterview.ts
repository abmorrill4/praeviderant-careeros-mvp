
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFollowupFlags } from '@/hooks/useFollowupFlags';

interface InterviewMessage {
  id: string;
  speaker: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isFollowup?: boolean;
  phase?: string;
  questionId?: string;
}

interface PhaseProgress {
  current: number;
  total: number;
  percentage: number;
}

interface InterviewState {
  isActive: boolean;
  currentPhase: string;
  messages: InterviewMessage[];
  phaseProgress: PhaseProgress | null;
  isLoading: boolean;
  isComplete: boolean;
  currentQuestionId: string | null;
  isProcessingFollowup: boolean;
}

export const useStructuredInterview = (sessionId: string | null) => {
  const [state, setState] = useState<InterviewState>({
    isActive: false,
    currentPhase: 'warmup',
    messages: [],
    phaseProgress: null,
    isLoading: false,
    isComplete: false,
    currentQuestionId: null,
    isProcessingFollowup: false,
  });
  
  const { toast } = useToast();
  const { getNextFollowup } = useFollowupFlags(sessionId);

  const startInterview = useCallback(async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No session available. Please create a session first.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('structured-interview', {
        body: {
          sessionId,
          action: 'start'
        }
      });

      if (error) throw error;

      const newMessage: InterviewMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        phase: data.phase,
        questionId: data.questionId,
      };

      setState(prev => ({
        ...prev,
        isActive: true,
        currentPhase: data.phase,
        messages: [newMessage],
        phaseProgress: data.phaseProgress,
        isLoading: false,
        currentQuestionId: data.questionId,
      }));

      toast({
        title: "Interview Started",
        description: "Your structured career interview has begun.",
      });

    } catch (error) {
      console.error('Error starting interview:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    }
  }, [sessionId, toast]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!sessionId || !userMessage.trim() || state.isLoading) {
      return;
    }

    // Add user message immediately
    const userMsg: InterviewMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      content: userMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('structured-interview', {
        body: {
          sessionId,
          userMessage: userMessage.trim(),
          action: 'process_response'
        }
      });

      if (error) throw error;

      const aiMessage: InterviewMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        isFollowup: data.isFollowup,
        phase: data.phase,
        questionId: data.questionId,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        currentPhase: data.phase || prev.currentPhase,
        phaseProgress: data.phaseProgress || prev.phaseProgress,
        isLoading: false,
        isComplete: data.isComplete || false,
        currentQuestionId: data.questionId || prev.currentQuestionId,
      }));

      if (data.isComplete) {
        setState(prev => ({ ...prev, isActive: false }));
        toast({
          title: "Interview Complete",
          description: "Your career interview has been completed successfully!",
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [sessionId, state.isLoading, toast]);

  const processFollowup = useCallback(async () => {
    if (!sessionId || state.isProcessingFollowup) {
      return;
    }

    setState(prev => ({ ...prev, isProcessingFollowup: true }));

    try {
      // Get the next pending follow-up
      const followup = await getNextFollowup();
      
      if (!followup) {
        toast({
          title: "No Follow-ups",
          description: "No pending follow-ups to process.",
        });
        return;
      }

      // Process the follow-up by asking the related question again
      const followupMessage: InterviewMessage = {
        id: `followup-${Date.now()}`,
        speaker: 'assistant',
        content: `Let's revisit this topic: ${followup.question_flows?.question_text}\n\nFollow-up reason: ${followup.reason}`,
        timestamp: new Date().toISOString(),
        isFollowup: true,
        phase: followup.question_flows?.phase,
        questionId: followup.question_id,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, followupMessage],
        currentQuestionId: followup.question_id,
      }));

      toast({
        title: "Processing Follow-up",
        description: "Revisiting a previously flagged topic.",
      });

    } catch (error) {
      console.error('Error processing follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to process follow-up.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isProcessingFollowup: false }));
    }
  }, [sessionId, state.isProcessingFollowup, getNextFollowup, toast]);

  const nextQuestion = useCallback(async () => {
    if (!sessionId || state.isLoading) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('structured-interview', {
        body: {
          sessionId,
          action: 'next_question'
        }
      });

      if (error) throw error;

      const aiMessage: InterviewMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        phase: data.phase,
        questionId: data.questionId,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        currentPhase: data.phase,
        phaseProgress: data.phaseProgress,
        isLoading: false,
        isComplete: data.isComplete || false,
        currentQuestionId: data.questionId,
      }));

      if (data.isComplete) {
        setState(prev => ({ ...prev, isActive: false }));
      }

    } catch (error) {
      console.error('Error getting next question:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Error",
        description: "Failed to get next question. Please try again.",
        variant: "destructive",
      });
    }
  }, [sessionId, state.isLoading, toast]);

  const resetInterview = useCallback(() => {
    setState({
      isActive: false,
      currentPhase: 'warmup',
      messages: [],
      phaseProgress: null,
      isLoading: false,
      isComplete: false,
      currentQuestionId: null,
      isProcessingFollowup: false,
    });
  }, []);

  return {
    ...state,
    startInterview,
    sendMessage,
    nextQuestion,
    resetInterview,
    processFollowup,
  };
};
