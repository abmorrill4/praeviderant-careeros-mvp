
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

interface InterviewState {
  currentPhase: string;
  currentQuestionId: string | null;
  phaseData: Record<string, any>;
  extractedData: Record<string, any>;
}

interface QuestionFlow {
  id: string;
  phase: string;
  order_num: number;
  question_text: string;
  followup_trigger_keywords: string[];
  branch_condition_json?: any;
  metadata: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, userMessage, action } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    console.log(`Processing structured interview for session ${sessionId}, action: ${action}`);

    // Get current session state
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`Session not found: ${sessionError?.message}`);
    }

    let currentState: InterviewState = {
      currentPhase: session.current_phase || 'warmup',
      currentQuestionId: session.current_question_id,
      phaseData: session.phase_data || {},
      extractedData: {}
    };

    // Handle different actions
    if (action === 'start' || action === 'next_question') {
      return await handleNextQuestion(sessionId, currentState);
    } else if (action === 'process_response') {
      return await processUserResponse(sessionId, userMessage, currentState);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in structured interview:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleNextQuestion(sessionId: string, state: InterviewState) {
  // Get questions for current phase
  const { data: questions, error: questionsError } = await supabase
    .from('question_flows')
    .select('*')
    .eq('phase', state.currentPhase)
    .order('order_num', { ascending: true });

  if (questionsError) {
    throw new Error(`Failed to get questions: ${questionsError.message}`);
  }

  if (!questions || questions.length === 0) {
    // No more questions in this phase, advance to next phase
    const nextPhase = getNextPhase(state.currentPhase);
    if (!nextPhase) {
      // Interview complete
      return await completeInterview(sessionId);
    }
    
    // Update to next phase and get first question
    await supabase
      .from('interview_sessions')
      .update({ 
        current_phase: nextPhase,
        current_question_id: null,
        phase_data: { ...state.phaseData, [`${state.currentPhase}_completed`]: true }
      })
      .eq('id', sessionId);

    state.currentPhase = nextPhase;
    return await handleNextQuestion(sessionId, state);
  }

  // Find current question or get first question
  let currentQuestion: QuestionFlow;
  const currentQuestionIndex = state.currentQuestionId 
    ? questions.findIndex(q => q.id === state.currentQuestionId)
    : -1;

  if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length - 1) {
    // Get next question in sequence
    currentQuestion = questions[currentQuestionIndex + 1];
  } else {
    // Get first question in phase
    currentQuestion = questions[0];
  }

  // Update session with current question
  await supabase
    .from('interview_sessions')
    .update({ 
      current_question_id: currentQuestion.id,
      phase_data: { ...state.phaseData, current_question_order: currentQuestion.order_num }
    })
    .eq('id', sessionId);

  // Generate AI response with context
  const aiResponse = await generateContextualResponse(currentQuestion, state);

  // Save AI message to transcript
  await supabase
    .from('interview_transcripts')
    .insert({
      session_id: sessionId,
      speaker: 'assistant',
      content: aiResponse,
      question_id: currentQuestion.id
    });

  return new Response(
    JSON.stringify({
      message: aiResponse,
      phase: state.currentPhase,
      questionId: currentQuestion.id,
      questionMetadata: currentQuestion.metadata,
      phaseProgress: await getPhaseProgress(state.currentPhase, currentQuestion.order_num)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processUserResponse(sessionId: string, userMessage: string, state: InterviewState) {
  if (!userMessage || !state.currentQuestionId) {
    throw new Error('User message and current question required');
  }

  // Get current question
  const { data: currentQuestion, error: questionError } = await supabase
    .from('question_flows')
    .select('*')
    .eq('id', state.currentQuestionId)
    .single();

  if (questionError || !currentQuestion) {
    throw new Error(`Current question not found: ${questionError?.message}`);
  }

  // Save user response to transcript
  const { data: transcriptEntry } = await supabase
    .from('interview_transcripts')
    .insert({
      session_id: sessionId,
      speaker: 'user',
      content: userMessage,
      question_id: currentQuestion.id,
      user_answer: userMessage
    })
    .select()
    .single();

  // Extract structured data from user response
  const extractedData = await extractStructuredData(userMessage, currentQuestion);

  // Update transcript with structured response
  if (extractedData && transcriptEntry) {
    await supabase
      .from('interview_transcripts')
      .update({ structured_response: extractedData })
      .eq('id', transcriptEntry.id);
  }

  // Check if we need a follow-up question
  const needsFollowup = checkFollowupNeeded(userMessage, currentQuestion);
  
  if (needsFollowup) {
    const followupResponse = await generateFollowupQuestion(userMessage, currentQuestion);
    
    // Save follow-up to transcript
    await supabase
      .from('interview_transcripts')
      .insert({
        session_id: sessionId,
        speaker: 'assistant',
        content: followupResponse,
        question_id: currentQuestion.id,
        ai_followup: followupResponse
      });

    return new Response(
      JSON.stringify({
        message: followupResponse,
        isFollowup: true,
        phase: state.currentPhase,
        questionId: currentQuestion.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Move to next question
  return await handleNextQuestion(sessionId, state);
}

async function extractStructuredData(userMessage: string, question: QuestionFlow) {
  if (!openAIApiKey) {
    console.warn('OpenAI API key not available, skipping structured extraction');
    return null;
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
            content: `You are a career data extraction specialist. Extract structured information from interview responses based on the question context.

Question Category: ${question.metadata?.category || 'general'}
Question: ${question.question_text}

Extract relevant career data in JSON format. Focus on:
- Skills and technologies mentioned
- Job titles and companies
- Dates and timeframes
- Quantifiable achievements
- Career goals and aspirations

Return only valid JSON with extracted data or null if no relevant data found.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse extracted data as JSON:', content);
        return { raw_extraction: content };
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting structured data:', error);
    return null;
  }
}

async function generateContextualResponse(question: QuestionFlow, state: InterviewState) {
  if (!openAIApiKey) {
    return question.question_text;
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
            content: `You are a professional career counselor conducting a structured interview to create a personalized resume. 

Current Phase: ${state.currentPhase}
Question Category: ${question.metadata?.category || 'general'}

Be conversational, encouraging, and professional. Ask the provided question naturally, adding brief context if helpful. Keep responses concise (1-2 sentences max).`
          },
          {
            role: 'user',
            content: `Please ask this interview question: "${question.question_text}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      return question.question_text;
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || question.question_text;
  } catch (error) {
    console.error('Error generating contextual response:', error);
    return question.question_text;
  }
}

async function generateFollowupQuestion(userMessage: string, question: QuestionFlow) {
  if (!openAIApiKey) {
    return "Could you tell me more about that?";
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
            content: `You are a career counselor. The user just answered a question but you need more specific details for their resume. Generate a brief follow-up question to get:
- More specific details
- Quantifiable metrics 
- Concrete examples
- Missing context

Keep the follow-up natural and conversational (1 sentence).

Original Question: ${question.question_text}
Question Category: ${question.metadata?.category || 'general'}`
          },
          {
            role: 'user',
            content: `User answered: "${userMessage}"\n\nGenerate a follow-up question to get more specific details.`
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      return "Could you tell me more about that?";
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "Could you tell me more about that?";
  } catch (error) {
    console.error('Error generating follow-up:', error);
    return "Could you tell me more about that?";
  }
}

function checkFollowupNeeded(userMessage: string, question: QuestionFlow): boolean {
  // Simple heuristics for follow-up detection
  const message = userMessage.toLowerCase();
  
  // Always follow up if answer is too short
  if (message.length < 20) {
    return true;
  }

  // Follow up if missing key information based on question category
  const category = question.metadata?.category;
  
  if (category === 'achievements' || category === 'quantified_impact') {
    // Look for numbers or metrics
    const hasNumbers = /\d+/.test(message);
    const hasMetrics = /\b(percent|%|dollar|\$|increase|decrease|improve|save|revenue|time|cost)\b/.test(message);
    return !hasNumbers && !hasMetrics;
  }

  if (category === 'technical_skills') {
    // Should mention specific tools or technologies
    const hasSpecificTools = message.length > 50 && /\b(software|tool|technology|platform|framework|language)\b/.test(message);
    return !hasSpecificTools;
  }

  // Check for vague answers
  const vaguePhrases = ['okay', 'fine', 'good', 'not much', 'nothing special', 'the usual'];
  return vaguePhrases.some(phrase => message.includes(phrase));
}

function getNextPhase(currentPhase: string): string | null {
  const phases = ['warmup', 'identity', 'impact', 'deep_dive'];
  const currentIndex = phases.indexOf(currentPhase);
  return currentIndex >= 0 && currentIndex < phases.length - 1 ? phases[currentIndex + 1] : null;
}

async function getPhaseProgress(phase: string, currentOrder: number) {
  const { data: questions } = await supabase
    .from('question_flows')
    .select('order_num')
    .eq('phase', phase)
    .order('order_num', { ascending: true });

  if (!questions || questions.length === 0) {
    return { current: 1, total: 1, percentage: 100 };
  }

  const total = questions.length;
  const current = questions.findIndex(q => q.order_num === currentOrder) + 1;
  
  return {
    current: Math.max(1, current),
    total,
    percentage: Math.round((current / total) * 100)
  };
}

async function completeInterview(sessionId: string) {
  // Mark session as completed
  await supabase
    .from('interview_sessions')
    .update({ 
      status: 'completed',
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  return new Response(
    JSON.stringify({
      message: "Thank you! That completes our interview. I now have everything I need to create your personalized resume. You can review the extracted information and generated resume in your dashboard.",
      isComplete: true,
      phase: 'completed'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
