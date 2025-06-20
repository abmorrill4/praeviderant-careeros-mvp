
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

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeMode = false, context } = await req.json();
    
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

    console.log(`Creating interview session for user: ${user.id} Resume mode: ${resumeMode}`);

    // Create OpenAI session if API key is available
    let openAISessionId = null;
    let clientSecret = null;

    if (openAIApiKey) {
      try {
        const openAIResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-realtime-preview-2024-10-01',
            voice: 'alloy',
          }),
        });

        if (openAIResponse.ok) {
          const sessionData = await openAIResponse.json();
          openAISessionId = sessionData.id;
          clientSecret = sessionData.client_secret?.value;
          console.log(`OpenAI session created: ${openAISessionId}`);
        } else {
          console.warn('Failed to create OpenAI session, continuing without voice features');
        }
      } catch (error) {
        console.warn('OpenAI session creation failed:', error);
      }
    }

    // Handle resume mode - check for existing active interview
    if (resumeMode && context?.activeInterview) {
      const activeInterview = context.activeInterview;
      
      // Get existing session
      const { data: existingSession } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('id', activeInterview.id)
        .single();

      if (existingSession) {
        // Update session with new OpenAI session if available
        const updateData: any = { status: 'active' };
        if (openAISessionId) {
          updateData.session_id = openAISessionId;
        }

        await supabase
          .from('interview_sessions')
          .update(updateData)
          .eq('id', activeInterview.id);

        return new Response(
          JSON.stringify({
            sessionId: activeInterview.id,
            openAISessionId: openAISessionId || existingSession.session_id,
            clientSecret: clientSecret || 'demo-secret',
            isResumed: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create new interview session
    const { data: newSession, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        session_id: openAISessionId || `session-${Date.now()}`,
        status: 'active',
        current_phase: 'warmup',
        phase_data: {}
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // Also create a corresponding interview record
    await supabase
      .from('interviews')
      .insert({
        user_id: user.id,
        interview_type: 'structured_career',
        status: 'in_progress',
        started_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        sessionId: newSession.id,
        openAISessionId: openAISessionId || newSession.session_id,
        clientSecret: clientSecret || 'demo-secret'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-interview-session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
