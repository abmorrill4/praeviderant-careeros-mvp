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

    const { sessionId, transcriptId, realTimeProcessing = false } = await req.json();

    console.log(`Processing interview context - Session: ${sessionId}, Transcript: ${transcriptId}`);

    // Get the transcript content
    const { data: transcript, error: transcriptError } = await supabase
      .from('interview_transcripts')
      .select('*')
      .eq('id', transcriptId)
      .single();

    if (transcriptError || !transcript) {
      throw new Error('Transcript not found');
    }

    // Process the transcript for enhanced context extraction
    const processedContext = await processTranscriptWithAI(transcript.content, realTimeProcessing);

    // Update transcript with extracted entities and metadata
    await supabase
      .from('interview_transcripts')
      .update({
        extracted_entities: processedContext.entities,
        sentiment_score: processedContext.sentiment,
        topic_tags: processedContext.topicTags,
        processing_metadata: {
          processed_at: new Date().toISOString(),
          processing_type: realTimeProcessing ? 'realtime' : 'batch',
          confidence_score: processedContext.confidence
        }
      })
      .eq('id', transcriptId);

    // Store structured context data
    const contextEntries = await createContextEntries(supabase, sessionId, transcript.user_id, processedContext);

    // Check for merge opportunities with existing profile data
    const mergeOpportunities = await identifyMergeOpportunities(supabase, transcript.user_id, processedContext);

    // Update session insights
    await updateSessionInsights(supabase, sessionId, processedContext);

    return new Response(
      JSON.stringify({
        success: true,
        processedContext,
        contextEntries,
        mergeOpportunities,
        sessionId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-interview-context:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processTranscriptWithAI(content: string, realTimeProcessing: boolean) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = realTimeProcessing 
    ? "You are an AI assistant that quickly extracts key career information from interview responses. Focus on the most important details for resume building."
    : "You are an AI assistant that comprehensively analyzes interview transcripts to extract detailed career information, sentiment, and insights.";

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Analyze this interview response and extract structured information:

Content: "${content}"

Please extract and return a JSON object with:
1. entities: Object containing extracted entities (companies, roles, skills, etc.)
2. sentiment: Number between -1 and 1 indicating sentiment
3. topicTags: Array of relevant topic tags
4. confidence: Overall confidence score (0-1)
5. workExperience: Array of work experience objects if mentioned
6. education: Array of education objects if mentioned  
7. skills: Array of skill objects if mentioned
8. goals: Array of career goals if mentioned
9. keyInsights: Array of important insights or achievements
10. actionItems: Array of follow-up questions or areas to explore

Format the response as a clean JSON object.`
        }
      ],
      temperature: realTimeProcessing ? 0.3 : 0.1,
      max_tokens: realTimeProcessing ? 1000 : 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  const content_text = result.choices[0].message.content;

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content_text);
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);
    // Return a basic structure if parsing fails
    return {
      entities: {},
      sentiment: 0,
      topicTags: ['general'],
      confidence: 0.5,
      workExperience: [],
      education: [],
      skills: [],
      goals: [],
      keyInsights: [content_text],
      actionItems: []
    };
  }
}

async function createContextEntries(supabase: any, sessionId: string, userId: string, processedContext: any) {
  const contextEntries = [];

  // Create context entries for each type of extracted data
  const contextTypes = [
    { key: 'workExperience', type: 'work_experience' },
    { key: 'education', type: 'education' },
    { key: 'skills', type: 'skills' },
    { key: 'goals', type: 'goals' }
  ];

  for (const { key, type } of contextTypes) {
    const data = processedContext[key];
    if (data && Array.isArray(data) && data.length > 0) {
      const { data: entry, error } = await supabase
        .from('interview_contexts')
        .insert({
          session_id: sessionId,
          user_id: userId,
          context_type: type,
          extracted_data: {
            items: data,
            entities: processedContext.entities,
            insights: processedContext.keyInsights,
            confidence: processedContext.confidence
          },
          confidence_score: processedContext.confidence || 0.7,
          processing_status: 'processed'
        })
        .select()
        .single();

      if (!error && entry) {
        contextEntries.push(entry);
      }
    }
  }

  return contextEntries;
}

async function identifyMergeOpportunities(supabase: any, userId: string, processedContext: any) {
  const mergeOpportunities = [];

  // Check work experience for potential merges
  if (processedContext.workExperience && processedContext.workExperience.length > 0) {
    for (const newWork of processedContext.workExperience) {
      if (newWork.company) {
        const { data: existingWork } = await supabase
          .from('work_experience')
          .select('*')
          .eq('user_id', userId)
          .ilike('company', `%${newWork.company}%`)
          .limit(3);

        if (existingWork && existingWork.length > 0) {
          mergeOpportunities.push({
            type: 'work_experience',
            newData: newWork,
            existingData: existingWork,
            mergeType: 'company_match',
            confidence: 0.8
          });
        }
      }
    }
  }

  // Check education for potential merges
  if (processedContext.education && processedContext.education.length > 0) {
    for (const newEdu of processedContext.education) {
      if (newEdu.institution) {
        const { data: existingEdu } = await supabase
          .from('education')
          .select('*')
          .eq('user_id', userId)
          .ilike('institution', `%${newEdu.institution}%`)
          .limit(3);

        if (existingEdu && existingEdu.length > 0) {
          mergeOpportunities.push({
            type: 'education',
            newData: newEdu,
            existingData: existingEdu,
            mergeType: 'institution_match',
            confidence: 0.8
          });
        }
      }
    }
  }

  // Check skills for potential merges or additions
  if (processedContext.skills && processedContext.skills.length > 0) {
    const { data: existingSkills } = await supabase
      .from('skill')
      .select('*')
      .eq('user_id', userId);

    const existingSkillNames = new Set(existingSkills?.map(s => s.name.toLowerCase()) || []);
    
    const newSkills = processedContext.skills.filter(skill => 
      !existingSkillNames.has(skill.name?.toLowerCase())
    );

    if (newSkills.length > 0) {
      mergeOpportunities.push({
        type: 'skills',
        newData: newSkills,
        existingData: existingSkills,
        mergeType: 'new_skills',
        confidence: 0.9
      });
    }
  }

  return mergeOpportunities;
}

async function updateSessionInsights(supabase: any, sessionId: string, processedContext: any) {
  const insights = {
    latest_sentiment: processedContext.sentiment,
    topics_covered: processedContext.topicTags,
    confidence_score: processedContext.confidence,
    key_insights: processedContext.keyInsights,
    action_items: processedContext.actionItems,
    updated_at: new Date().toISOString()
  };

  await supabase
    .from('interview_sessions')
    .update({
      session_insights: insights
    })
    .eq('id', sessionId);

  // Also update analytics
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  await supabase
    .from('session_analytics')
    .insert({
      session_id: sessionId,
      user_id: userId,
      metric_type: 'sentiment_score',
      metric_value: processedContext.sentiment || 0,
      metadata: { topicTags: processedContext.topicTags }
    });
}