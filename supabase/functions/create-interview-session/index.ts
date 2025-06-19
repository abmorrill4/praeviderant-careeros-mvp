
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeMode = false, context = null } = await req.json();
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Extract the JWT token (remove 'Bearer ' prefix)
    const token = authHeader.replace('Bearer ', '');
    
    // Validate the token with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Verify the JWT token
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseServiceKey,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Invalid authentication token');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    console.log('Creating interview session for user:', userId, 'Resume mode:', resumeMode);

    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a session with OpenAI Realtime API
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: resumeMode && context ? 
          createContextualInstructions(context) : 
          getBaseInstructions(),
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200,
        },
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('OpenAI session creation failed:', errorText);
      throw new Error(`Failed to create OpenAI session: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('OpenAI session created:', sessionData.id);

    // Create or update interview record in database
    let interviewId;
    
    if (resumeMode && context?.activeInterview) {
      // Update existing interview
      interviewId = context.activeInterview.id;
      console.log('Resuming existing interview:', interviewId);
    } else {
      // Create new interview record
      const { data: supabase } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseClient = supabase.createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: interview, error: interviewError } = await supabaseClient
        .from('interviews')
        .insert({
          user_id: userId,
          status: 'in_progress',
          interview_type: 'career_background',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (interviewError) {
        console.error('Error creating interview:', interviewError);
        throw new Error('Failed to create interview record');
      }

      interviewId = interview.id;
      console.log('New interview created:', interviewId);
    }

    // Return session data
    const responseData = {
      sessionId: interviewId,
      openAISessionId: sessionData.id,
      clientSecret: sessionData.client_secret.value,
    };

    console.log('Session creation completed successfully');

    return new Response(JSON.stringify(responseData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Error in create-interview-session:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});

function getBaseInstructions(): string {
  return `You are a professional career assistant named Praeviderant. Your role is to conduct a calm, structured interview to understand a user's work history, career goals, skills, education, and relevant accomplishments.

Always begin the interview proactively. Ask one question at a time, and wait for the user's response before proceeding. Be friendly, efficient, and conversational—aim to put the user at ease.

Start with a warm introduction and then ask the user to tell you about their current or most recent role. As the interview progresses, dynamically adapt questions based on what the user shares. Ask follow-up questions to clarify timeline, impact, scope, and technologies used.

You are helping build a comprehensive profile for tailored resumes, so focus on extracting facts and context, not judgment. Do not answer questions; this is a structured interview, not a coaching session.

If the user pauses or gets stuck, gently re-prompt or offer clarification.`;
}

function createContextualInstructions(context: any): string {
  const baseInstructions = getBaseInstructions();
  
  const contextSections = [];
  
  if (context.careerProfile) {
    contextSections.push(`CURRENT PROFILE: ${JSON.stringify(context.careerProfile)}`);
  }
  
  if (context.jobHistory && context.jobHistory.length > 0) {
    contextSections.push(`JOB HISTORY: ${JSON.stringify(context.jobHistory)}`);
  }
  
  if (context.recentSummaries && context.recentSummaries.length > 0) {
    contextSections.push(`PREVIOUS SESSION SUMMARIES: ${context.recentSummaries.join('; ')}`);
  }
  
  const contextPrefix = `RESUMING INTERVIEW - You have the following context about the user:

${contextSections.join('\n\n')}

Use this context to continue the conversation naturally without asking for information you already have. Focus on filling gaps, getting updates to existing information, or exploring areas not yet covered. Acknowledge that you're continuing from where you left off.

`;
  
  return contextPrefix + baseInstructions;
}
