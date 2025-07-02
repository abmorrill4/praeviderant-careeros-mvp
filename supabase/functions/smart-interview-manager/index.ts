import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, sessionId, userResponse, interviewType } = await req.json();

    console.log(`Smart Interview Manager - Action: ${action}, Session: ${sessionId}`);

    switch (action) {
      case 'initialize_session':
        return await initializeSession(supabase, interviewType);
      
      case 'get_next_question':
        return await getNextQuestion(supabase, sessionId, userResponse);
      
      case 'process_response':
        return await processResponse(supabase, sessionId, userResponse);
      
      case 'get_session_insights':
        return await getSessionInsights(supabase, sessionId);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in smart-interview-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function initializeSession(supabase: any, interviewType: string) {
  console.log(`Initializing session for interview type: ${interviewType}`);
  
  // Get user context to personalize the interview
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Check existing profile data to determine starting point
  const { data: existingProfile } = await supabase
    .from('work_experience')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  const hasExistingData = existingProfile && existingProfile.length > 0;

  // Create session with context-aware settings
  const { data: session, error } = await supabase
    .from('interview_sessions')
    .insert({
      user_id: userId,
      interview_type: interviewType,
      context_data: {
        has_existing_profile: hasExistingData,
        starting_phase: hasExistingData ? 'validation' : 'discovery',
        interview_strategy: interviewType === 'focused' ? 'deep_dive' : 'comprehensive'
      },
      current_phase: hasExistingData ? 'validation' : 'warmup',
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;

  // Get first question based on context
  const firstQuestion = await getContextualFirstQuestion(supabase, session.id, interviewType, hasExistingData);

  return new Response(
    JSON.stringify({ 
      session: session,
      firstQuestion: firstQuestion,
      strategy: hasExistingData ? 'validation' : 'discovery'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getContextualFirstQuestion(supabase: any, sessionId: string, interviewType: string, hasExistingData: boolean) {
  if (hasExistingData) {
    return {
      id: 'validation-001',
      text: "I can see you already have some profile information. Let's start by validating and expanding on what you've shared. Could you tell me about your current role and how it's been going?",
      category: 'work_experience',
      expectedDataPoints: ['current_role_satisfaction', 'recent_achievements', 'current_challenges']
    };
  } else {
    return {
      id: 'discovery-001', 
      text: "Great! I'm here to help you build a comprehensive career profile. Let's start with your current situation - are you currently working, and if so, what's your role?",
      category: 'work_experience',
      expectedDataPoints: ['employment_status', 'current_company', 'current_title']
    };
  }
}

async function getNextQuestion(supabase: any, sessionId: string, userResponse?: string) {
  console.log(`Getting next question for session: ${sessionId}`);

  // Get current session state
  const { data: session } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    throw new Error('Session not found');
  }

  // Get conversation history
  const { data: transcripts } = await supabase
    .from('interview_transcripts')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  // Analyze conversation context
  const context = await analyzeConversationContext(transcripts || []);
  
  // Get appropriate next question based on context and phase
  const nextQuestion = await selectNextQuestion(supabase, session, context, userResponse);

  // Update session analytics
  await updateSessionAnalytics(supabase, sessionId, context);

  return new Response(
    JSON.stringify({ 
      question: nextQuestion,
      context: context,
      sessionProgress: session.completion_percentage
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function analyzeConversationContext(transcripts: any[]) {
  const userMessages = transcripts.filter(t => t.speaker === 'user');
  const totalResponses = userMessages.length;
  const avgResponseLength = userMessages.reduce((acc, msg) => acc + msg.content.length, 0) / totalResponses || 0;
  
  // Extract topics mentioned
  const mentionedTopics = new Set();
  const keywords = {
    work: ['job', 'work', 'company', 'role', 'position', 'career', 'professional'],
    education: ['degree', 'university', 'college', 'school', 'study', 'education', 'course'],
    skills: ['skill', 'proficient', 'experience', 'technology', 'tool', 'programming', 'language'],
    goals: ['goal', 'aspiration', 'future', 'want', 'hope', 'plan', 'objective']
  };

  userMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    Object.entries(keywords).forEach(([topic, words]) => {
      if (words.some(word => content.includes(word))) {
        mentionedTopics.add(topic);
      }
    });
  });

  return {
    totalResponses,
    avgResponseLength,
    mentionedTopics: Array.from(mentionedTopics),
    conversationDepth: totalResponses > 3 ? 'deep' : 'surface',
    responsiveness: avgResponseLength > 50 ? 'detailed' : 'brief'
  };
}

async function selectNextQuestion(supabase: any, session: any, context: any, lastResponse?: string) {
  const { data: questions } = await supabase
    .from('interview_questions')
    .select('*')
    .eq('is_active', true)
    .order('complexity_level', { ascending: true });

  if (!questions || questions.length === 0) {
    return {
      id: 'fallback-001',
      text: "Is there anything else about your background or goals you'd like to share?",
      category: 'general'
    };
  }

  // Filter questions based on context
  let candidateQuestions = questions.filter(q => {
    // Don't repeat topics if we've covered them thoroughly
    if (context.mentionedTopics.includes(q.category) && context.conversationDepth === 'deep') {
      return false;
    }
    return true;
  });

  // If no candidates, get unexplored categories
  if (candidateQuestions.length === 0) {
    candidateQuestions = questions.filter(q => !context.mentionedTopics.includes(q.category));
  }

  // Select question based on interview strategy
  const selectedQuestion = candidateQuestions[0] || questions[0];

  return {
    id: selectedQuestion.id,
    text: selectedQuestion.question_text,
    category: selectedQuestion.category,
    expectedDataPoints: selectedQuestion.expected_data_points,
    followUpTriggers: selectedQuestion.follow_up_triggers
  };
}

async function processResponse(supabase: any, sessionId: string, userResponse: string) {
  console.log(`Processing response for session: ${sessionId}`);

  // Store the response
  const { error: transcriptError } = await supabase
    .from('interview_transcripts')
    .insert({
      session_id: sessionId,
      speaker: 'user',
      content: userResponse,
      timestamp_ms: Date.now()
    });

  if (transcriptError) throw transcriptError;

  // Extract context using the existing extract-context function
  const { data: extractionResult } = await supabase.functions.invoke('extract-context', {
    body: {
      transcript: userResponse,
      interviewType: 'general',
      promptTemplate: 'Extract relevant career information from this interview response.'
    }
  });

  // Store extracted context
  if (extractionResult?.extractedContext) {
    const context = extractionResult.extractedContext;
    
    // Store in interview_contexts table
    const { error: contextError } = await supabase
      .from('interview_contexts')
      .insert({
        session_id: sessionId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        context_type: context.workExperience ? 'work_experience' : 
                     context.education ? 'education' :
                     context.skills ? 'skills' : 'general',
        extracted_data: context,
        confidence_score: 0.8, // Default confidence
        processing_status: 'processed'
      });

    if (contextError) {
      console.error('Error storing context:', contextError);
    }
  }

  // Update session progress
  const completionPercentage = await calculateSessionCompletion(supabase, sessionId);
  
  await supabase
    .from('interview_sessions')
    .update({ 
      completion_percentage: completionPercentage,
      total_questions_asked: supabase.sql`total_questions_asked + 1`
    })
    .eq('id', sessionId);

  return new Response(
    JSON.stringify({ 
      success: true,
      extractedContext: extractionResult?.extractedContext,
      completionPercentage
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function calculateSessionCompletion(supabase: any, sessionId: string) {
  const { data: contexts } = await supabase
    .from('interview_contexts')
    .select('context_type')
    .eq('session_id', sessionId)
    .eq('processing_status', 'processed');

  const uniqueTopics = new Set(contexts?.map(c => c.context_type) || []);
  const expectedTopics = 5; // work, education, skills, goals, projects
  
  return Math.min(100, (uniqueTopics.size / expectedTopics) * 100);
}

async function updateSessionAnalytics(supabase: any, sessionId: string, context: any) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  await supabase
    .from('session_analytics')
    .insert([
      {
        session_id: sessionId,
        user_id: userId,
        metric_type: 'response_count',
        metric_value: context.totalResponses
      },
      {
        session_id: sessionId,
        user_id: userId,
        metric_type: 'avg_response_length',
        metric_value: context.avgResponseLength
      },
      {
        session_id: sessionId,
        user_id: userId,
        metric_type: 'topic_coverage',
        metric_value: context.mentionedTopics.length
      }
    ]);
}

async function getSessionInsights(supabase: any, sessionId: string) {
  const { data: insights } = await supabase
    .rpc('get_session_insights', { p_session_id: sessionId });

  return new Response(
    JSON.stringify({ insights }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}