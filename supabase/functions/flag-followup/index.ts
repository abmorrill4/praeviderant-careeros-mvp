
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, action, followupId, questionId, reason, priority } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log(`Processing follow-up action: ${action} for session ${sessionId}`);

    if (action === 'flag') {
      return await flagForFollowup(sessionId, questionId, reason, priority);
    } else if (action === 'list') {
      return await listFollowups(sessionId);
    } else if (action === 'resolve') {
      return await resolveFollowup(followupId);
    } else if (action === 'get_next') {
      return await getNextFollowup(sessionId);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in flag-followup function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function flagForFollowup(sessionId: string, questionId: string, reason: string, priority: 'low' | 'medium' | 'high') {
  // Check if already flagged
  const { data: existing } = await supabase
    .from('interview_followups')
    .select('id')
    .eq('session_id', sessionId)
    .eq('question_id', questionId)
    .eq('status', 'pending')
    .single();

  if (existing) {
    return new Response(
      JSON.stringify({ message: 'Already flagged for follow-up', followupId: existing.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create new follow-up flag
  const { data: followup, error } = await supabase
    .from('interview_followups')
    .insert({
      session_id: sessionId,
      question_id: questionId,
      reason,
      priority,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to flag for follow-up: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      message: 'Successfully flagged for follow-up',
      followupId: followup.id,
      priority
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listFollowups(sessionId: string) {
  const { data: followups, error } = await supabase
    .from('interview_followups')
    .select(`
      *,
      question_flows (
        question_text,
        phase
      )
    `)
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to list follow-ups: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ followups }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function resolveFollowup(followupId: string) {
  const { data: followup, error } = await supabase
    .from('interview_followups')
    .update({ 
      status: 'resolved',
      resolved_at: new Date().toISOString()
    })
    .eq('id', followupId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to resolve follow-up: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      message: 'Follow-up resolved successfully',
      followup
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getNextFollowup(sessionId: string) {
  const { data: followup, error } = await supabase
    .from('interview_followups')
    .select(`
      *,
      question_flows (
        question_text,
        phase,
        metadata
      )
    `)
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get next follow-up: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      followup: followup || null,
      hasFollowups: !!followup
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
