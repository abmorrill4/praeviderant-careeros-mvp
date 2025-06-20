
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSystemPrompt } from './useSystemPrompt';

interface InterviewMessage {
  id: string;
  speaker: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface InterviewState {
  isActive: boolean;
  messages: InterviewMessage[];
  isLoading: boolean;
  isComplete: boolean;
}

export const useDirectInterview = (sessionId: string | null) => {
  const [state, setState] = useState<InterviewState>({
    isActive: false,
    messages: [],
    isLoading: false,
    isComplete: false,
  });
  
  const { toast } = useToast();
  const { systemPrompt, isLoading: promptLoading } = useSystemPrompt();

  const startInterview = useCallback(async () => {
    if (!sessionId || promptLoading) {
      toast({
        title: "Error",
        description: "No session available or system prompt loading. Please wait.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('direct-interview', {
        body: {
          sessionId,
          action: 'start',
          systemPrompt
        }
      });

      if (error) throw error;

      const newMessage: InterviewMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        isActive: true,
        messages: [newMessage],
        isLoading: false,
      }));

    } catch (error) {
      console.error('Error starting interview:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    }
  }, [sessionId, systemPrompt, promptLoading, toast]);

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
      const { data, error } = await supabase.functions.invoke('direct-interview', {
        body: {
          sessionId,
          userMessage: userMessage.trim(),
          action: 'chat',
          conversationHistory: state.messages
        }
      });

      if (error) throw error;

      const aiMessage: InterviewMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
        isComplete: data.isComplete || false,
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
  }, [sessionId, state.isLoading, state.messages, toast]);

  const resetInterview = useCallback(() => {
    setState({
      isActive: false,
      messages: [],
      isLoading: false,
      isComplete: false,
    });
  }, []);

  return {
    ...state,
    startInterview,
    sendMessage,
    resetInterview,
  };
};
