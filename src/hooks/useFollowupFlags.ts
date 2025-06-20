
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FollowupFlag {
  id: string;
  session_id: string;
  question_id: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'resolved';
  created_at: string;
  resolved_at?: string;
  question_flows?: {
    question_text: string;
    phase: string;
  };
}

export const useFollowupFlags = (sessionId: string | null) => {
  const [followups, setFollowups] = useState<FollowupFlag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const flagForFollowup = useCallback(async (
    questionId: string, 
    reason: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "No active session to flag follow-up",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('flag-followup', {
        body: {
          sessionId,
          action: 'flag',
          questionId,
          reason,
          priority
        }
      });

      if (error) throw error;

      toast({
        title: "Follow-up Flagged",
        description: `Question flagged for ${priority} priority follow-up`,
      });

      // Refresh the followups list
      await listFollowups();
      
      return data.followupId;
    } catch (error) {
      console.error('Error flagging follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to flag for follow-up",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, toast]);

  const listFollowups = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('flag-followup', {
        body: {
          sessionId,
          action: 'list'
        }
      });

      if (error) throw error;

      setFollowups(data.followups || []);
    } catch (error) {
      console.error('Error listing follow-ups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const resolveFollowup = useCallback(async (followupId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('flag-followup', {
        body: {
          sessionId,
          action: 'resolve',
          followupId
        }
      });

      if (error) throw error;

      toast({
        title: "Follow-up Resolved",
        description: "Follow-up has been marked as resolved",
      });

      // Refresh the followups list
      await listFollowups();
      
      return data.followup;
    } catch (error) {
      console.error('Error resolving follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to resolve follow-up",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, toast, listFollowups]);

  const getNextFollowup = useCallback(async () => {
    if (!sessionId) return null;

    try {
      const { data, error } = await supabase.functions.invoke('flag-followup', {
        body: {
          sessionId,
          action: 'get_next'
        }
      });

      if (error) throw error;

      return data.followup;
    } catch (error) {
      console.error('Error getting next follow-up:', error);
      return null;
    }
  }, [sessionId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return {
    followups,
    isLoading,
    flagForFollowup,
    listFollowups,
    resolveFollowup,
    getNextFollowup,
    getPriorityColor,
  };
};
