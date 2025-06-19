
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InterviewSession {
  sessionId: string;
  openAISessionId: string;
  clientSecret: string;
}

interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'assistant';
  content: string;
  timestamp_ms?: number;
  created_at: string;
}

export const useInterviewSession = () => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createSession = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-interview-session');
      
      if (error) {
        throw error;
      }

      setSession(data);
      setTranscript([]);
      
      toast({
        title: "Session Created",
        description: "Your interview session has been created successfully.",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create interview session. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addTranscriptEntry = async (speaker: 'user' | 'assistant', content: string, timestampMs?: number) => {
    if (!session) return;

    try {
      const { data, error } = await supabase
        .from('interview_transcripts')
        .insert({
          session_id: session.sessionId,
          speaker,
          content,
          timestamp_ms: timestampMs,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving transcript:', error);
        return;
      }

      // Type cast the database result to match our TranscriptEntry interface
      const typedEntry: TranscriptEntry = {
        id: data.id,
        speaker: data.speaker as 'user' | 'assistant',
        content: data.content,
        timestamp_ms: data.timestamp_ms,
        created_at: data.created_at,
      };

      setTranscript(prev => [...prev, typedEntry]);
    } catch (error) {
      console.error('Error adding transcript entry:', error);
    }
  };

  const updateSessionStatus = async (status: 'active' | 'completed' | 'failed') => {
    if (!session) return;

    try {
      const updates: any = { status };
      if (status === 'completed' || status === 'failed') {
        updates.ended_at = new Date().toISOString();
      }

      await supabase
        .from('interview_sessions')
        .update(updates)
        .eq('id', session.sessionId);
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const endSession = () => {
    if (session) {
      updateSessionStatus('completed');
    }
    setSession(null);
    setTranscript([]);
  };

  return {
    session,
    transcript,
    isLoading,
    createSession,
    addTranscriptEntry,
    updateSessionStatus,
    endSession,
  };
};
