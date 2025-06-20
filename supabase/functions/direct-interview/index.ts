
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

interface ConversationMessage {
  id: string;
  speaker: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userMessage, action, systemPrompt, conversationHistory } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    console.log(`Processing direct interview for session ${sessionId}, action: ${action}`);

    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found: ${sessionError?.message}`);
    }

    if (action === 'start') {
      return await startInterview(sessionId, systemPrompt);
    } else if (action === 'chat') {
      return await processChat(sessionId, userMessage, conversationHistory || []);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in direct interview:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function startInterview(sessionId: string, systemPrompt: string) {
  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ message: "Hi! I'm here to help you create a personalized resume. Could you start by telling me your name and what you currently do for work?" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt || `You are a professional career assistant named Praeviderant. Your role is to conduct a calm, structured interview to understand a user's work history, career goals, skills, education, and relevant accomplishments.

Always begin the interview proactively. Ask one question at a time, and wait for the user's response before proceeding. Be friendly, efficient, and conversational—aim to put the user at ease.

Start with a warm introduction and then ask the user to tell you about their current or most recent role. As the interview progresses, dynamically adapt questions based on what the user shares. Ask follow-up questions to clarify timeline, impact, scope, and technologies used.

You are helping build a comprehensive profile for tailored resumes, so focus on extracting facts and context, not judgment. Do not answer questions; this is a structured interview, not a coaching session.

If the user pauses or gets stuck, gently re-prompt or offer clarification.`
          },
          {
            role: 'user',
            content: 'Please start the interview.'
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate interview start');
    }

    const result = await response.json();
    const aiMessage = result.choices?.[0]?.message?.content || "Hi! I'm here to help you create a personalized resume. Could you start by telling me your name and what you currently do for work?";

    // Save AI message to transcript
    await supabase
      .from('interview_transcripts')
      .insert({
        session_id: sessionId,
        speaker: 'assistant',
        content: aiMessage
      });

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error starting interview:', error);
    return new Response(
      JSON.stringify({ message: "Hi! I'm here to help you create a personalized resume. Could you start by telling me your name and what you currently do for work?" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function processChat(sessionId: string, userMessage: string, conversationHistory: ConversationMessage[]) {
  // Save user message to transcript
  await supabase
    .from('interview_transcripts')
    .insert({
      session_id: sessionId,
      speaker: 'user',
      content: userMessage
    });

  if (!openAIApiKey) {
    const fallbackResponse = "Thank you for sharing that. Could you tell me more about your role and responsibilities?";
    
    await supabase
      .from('interview_transcripts')
      .insert({
        session_id: sessionId,
        speaker: 'assistant',
        content: fallbackResponse
      });

    return new Response(
      JSON.stringify({ message: fallbackResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are a professional career assistant conducting a structured interview. Continue the conversation naturally, asking follow-up questions based on what the user has shared. 

Focus on gathering information about:
- Work history and responsibilities
- Skills and technologies used
- Achievements and impact
- Education and certifications
- Career goals and aspirations

Ask one question at a time. Be conversational but thorough. If you feel you have enough information to create a comprehensive resume, you can indicate the interview is complete.`
      }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.speaker === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate response');
    }

    const result = await response.json();
    const aiMessage = result.choices?.[0]?.message?.content || "Thank you for sharing that. Could you tell me more?";

    // Check if interview should be complete (simple heuristic)
    const isComplete = aiMessage.toLowerCase().includes('complete') || 
                      aiMessage.toLowerCase().includes('thank you for the interview') ||
                      conversationHistory.length >= 20; // After 10 exchanges

    // Save AI response to transcript
    await supabase
      .from('interview_transcripts')
      .insert({
        session_id: sessionId,
        speaker: 'assistant',
        content: aiMessage
      });

    if (isComplete) {
      // Mark session as completed
      await supabase
        .from('interview_sessions')
        .update({ 
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    }

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        isComplete
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing chat:', error);
    const fallbackResponse = "Thank you for sharing that. Could you tell me more about your experience?";
    
    await supabase
      .from('interview_transcripts')
      .insert({
        session_id: sessionId,
        speaker: 'assistant',
        content: fallbackResponse
      });

    return new Response(
      JSON.stringify({ message: fallbackResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
