import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FeedbackData {
  id: string;
  insight_type: string;
  insight_id: string;
  feedback_type: string;
  feedback_text: string;
  user_context: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useAIInsightsFeedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's feedback history
  const { data: feedbackHistory, isLoading } = useQuery({
    queryKey: ['ai-insights-feedback', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ai_insights_feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FeedbackData[];
    },
    enabled: !!user,
  });

  // Submit feedback mutation
  const submitFeedback = useMutation({
    mutationFn: async ({
      insightType,
      insightId,
      feedbackType,
      feedbackText,
      userContext = {}
    }: {
      insightType: string;
      insightId: string;
      feedbackType: string;
      feedbackText: string;
      userContext?: any;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ai_insights_feedback')
        .insert({
          user_id: user.id,
          insight_type: insightType,
          insight_id: insightId,
          feedback_type: feedbackType,
          feedback_text: feedbackText,
          user_context: userContext
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights-feedback'] });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll use it to improve future insights.",
      });
    },
    onError: (error) => {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Process feedback (trigger AI regeneration)
  const processFeedback = useMutation({
    mutationFn: async (feedbackId: string) => {
      const { data, error } = await supabase.functions.invoke('process-ai-feedback', {
        body: { feedbackId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights-feedback'] });
      toast({
        title: "Processing Started",
        description: "We're working on improving the insight based on your feedback.",
      });
    },
    onError: (error) => {
      console.error('Error processing feedback:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process feedback. Please try again later.",
        variant: "destructive",
      });
    },
  });

  return {
    feedbackHistory,
    isLoading,
    submitFeedback: submitFeedback.mutate,
    isSubmitting: submitFeedback.isPending,
    processFeedback: processFeedback.mutate,
    isProcessing: processFeedback.isPending,
  };
};