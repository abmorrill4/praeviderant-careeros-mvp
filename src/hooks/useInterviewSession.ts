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
  speaker: 'user' | 'assistant' | 'system';
  content: string;
  timestamp_ms?: number;
  created_at: string;
  type?: 'info' | 'warning' | 'success';
}

interface InterviewContext {
  activeInterview: any;
  careerProfile: any;
  jobHistory: any[];
  recentSummaries: string[];
}

export const useInterviewSession = () => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewContext, setInterviewContext] = useState<InterviewContext | null>(null);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const { toast } = useToast();

  const fetchInterviewContext = async () => {
    try {
      const { data, error } = await supabase.rpc('get_interview_context', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) {
        console.error('Error fetching interview context:', error);
        return null;
      }

      if (data && data.length > 0) {
        const contextData = data[0];
        
        // Properly cast and handle the Json types
        const context: InterviewContext = {
          activeInterview: contextData.active_interview === 'null' ? null : contextData.active_interview,
          careerProfile: contextData.career_profile === 'null' ? null : contextData.career_profile,
          jobHistory: Array.isArray(contextData.job_history) ? contextData.job_history : [],
          recentSummaries: Array.isArray(contextData.recent_summaries) ? contextData.recent_summaries : []
        };
        
        return context;
      }

      return null;
    } catch (error) {
      console.error('Error in fetchInterviewContext:', error);
      return null;
    }
  };

  const createSession = async (resumeInterview = false) => {
    setIsLoading(true);
    try {
      // Fetch interview context first
      const context = await fetchInterviewContext();
      setInterviewContext(context);

      // Check if there's an active interview to resume
      if (resumeInterview && context?.activeInterview && typeof context.activeInterview === 'object' && context.activeInterview.id) {
        setIsResumedSession(true);
        
        // Load existing transcript from the active interview
        const { data: transcriptData, error: transcriptError } = await supabase
          .from('interview_transcripts')
          .select('*')
          .eq('session_id', context.activeInterview.id)
          .order('created_at', { ascending: true });

        if (!transcriptError && transcriptData) {
          const formattedTranscript: TranscriptEntry[] = transcriptData.map(entry => ({
            id: entry.id,
            speaker: entry.speaker as 'user' | 'assistant',
            content: entry.content,
            timestamp_ms: entry.timestamp_ms,
            created_at: entry.created_at,
          }));
          setTranscript(formattedTranscript);
        }

        // Update interview status to resumed
        await supabase
          .from('interviews')
          .update({ status: 'resumed' })
          .eq('id', context.activeInterview.id);

        toast({
          title: "Interview Resumed",
          description: "Continuing your previous interview session.",
        });
      } else {
        setIsResumedSession(false);
        setTranscript([]);
      }

      // Create new OpenAI session
      const { data, error } = await supabase.functions.invoke('create-interview-session', {
        body: { 
          resumeMode: resumeInterview,
          context: context 
        }
      });
      
      if (error) {
        throw error;
      }

      setSession(data);
      
      if (!resumeInterview) {
        toast({
          title: "Session Created",
          description: "Your interview session has been created successfully.",
        });
      }
      
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

  const checkForActiveInterview = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', user.user.id)
        .in('status', ['in_progress', 'resumed'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking for active interview:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in checkForActiveInterview:', error);
      return null;
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

  const addSystemMessage = async (message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const systemEntry: TranscriptEntry = {
      id: `system-${Date.now()}`,
      speaker: 'system',
      content: message,
      created_at: new Date().toISOString(),
      type,
    };

    setTranscript(prev => [...prev, systemEntry]);
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
    setInterviewContext(null);
    setIsResumedSession(false);
  };

  return {
    session,
    transcript,
    isLoading,
    interviewContext,
    isResumedSession,
    createSession,
    checkForActiveInterview,
    addTranscriptEntry,
    addSystemMessage,
    updateSessionStatus,
    endSession,
  };
};
