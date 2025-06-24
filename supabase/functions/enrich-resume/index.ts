
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { versionId } = await req.json();

    if (!versionId) {
      throw new Error('Version ID is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log('Starting enrichment for version:', versionId, 'user:', user.id);

    // Create enrichment job
    const { data: job, error: jobError } = await supabase
      .from('enrichment_jobs')
      .insert({
        user_id: user.id,
        resume_version_id: versionId,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating enrichment job:', jobError);
      throw jobError;
    }

    // Get parsed entities for this resume version
    const { data: entities, error: entitiesError } = await supabase
      .from('parsed_resume_entities')
      .select('*')
      .eq('resume_version_id', versionId);

    if (entitiesError) {
      console.error('Error fetching parsed entities:', entitiesError);
      throw entitiesError;
    }

    if (!entities || entities.length === 0) {
      await supabase
        .from('enrichment_jobs')
        .update({
          status: 'failed',
          error_message: 'No parsed entities found for this resume version',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      throw new Error('No parsed entities found for this resume version');
    }

    // Prepare structured data for AI analysis
    const structuredData = entities.reduce((acc, entity) => {
      const section = entity.field_name.split('.')[0];
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push({
        field: entity.field_name,
        value: entity.raw_value,
        confidence: entity.confidence_score
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Call OpenAI for enrichment analysis
    const enrichmentPrompt = `
Analyze this resume data and provide comprehensive career insights:

${JSON.stringify(structuredData, null, 2)}

Provide analysis in this JSON format:
{
  "role_archetype": "string (e.g., Individual Contributor, People Manager, Technical Leader, etc.)",
  "role_archetype_explanation": "brief explanation of the archetype",
  "persona_type": "string (e.g., Builder, Optimizer, Strategist, etc.)",
  "persona_explanation": "brief explanation of the persona",
  "leadership_score": number (0-100),
  "leadership_explanation": "explanation of leadership capabilities",
  "scope_score": number (0-100),
  "scope_explanation": "explanation of scope and impact",
  "technical_depth_score": number (0-100),
  "technical_depth_explanation": "explanation of technical skills",
  "career_summary": "comprehensive career summary paragraph",
  "key_strengths": "paragraph highlighting key strengths",
  "growth_trajectory": "paragraph describing career growth pattern"
}

Base scores on concrete evidence from the resume. Be analytical and specific.
`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a career analysis expert. Analyze resumes and provide structured insights about career progression, skills, and potential.'
          },
          {
            role: 'user',
            content: enrichmentPrompt
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await openAIResponse.json();
    
    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', aiData);
      throw new Error(`OpenAI API error: ${aiData.error?.message || 'Unknown error'}`);
    }

    const analysis = JSON.parse(aiData.choices[0].message.content);
    console.log('AI analysis completed:', analysis);

    // Store career enrichment
    const { data: enrichment, error: enrichmentError } = await supabase
      .from('career_enrichment')
      .upsert({
        user_id: user.id,
        resume_version_id: versionId,
        role_archetype: analysis.role_archetype,
        role_archetype_explanation: analysis.role_archetype_explanation,
        persona_type: analysis.persona_type,
        persona_explanation: analysis.persona_explanation,
        leadership_score: analysis.leadership_score,
        leadership_explanation: analysis.leadership_explanation,
        scope_score: analysis.scope_score,
        scope_explanation: analysis.scope_explanation,
        technical_depth_score: analysis.technical_depth_score,
        technical_depth_explanation: analysis.technical_depth_explanation,
        model_version: 'gpt-4o-mini',
        confidence_score: 0.8
      })
      .select()
      .single();

    if (enrichmentError) {
      console.error('Error storing enrichment:', enrichmentError);
      throw enrichmentError;
    }

    // Store narratives
    const narratives = [
      {
        user_id: user.id,
        resume_version_id: versionId,
        narrative_type: 'career_summary',
        narrative_text: analysis.career_summary,
        model_version: 'gpt-4o-mini',
        confidence_score: 0.8
      },
      {
        user_id: user.id,
        resume_version_id: versionId,
        narrative_type: 'key_strengths',
        narrative_text: analysis.key_strengths,
        model_version: 'gpt-4o-mini',
        confidence_score: 0.8
      },
      {
        user_id: user.id,
        resume_version_id: versionId,
        narrative_type: 'growth_trajectory',
        narrative_text: analysis.growth_trajectory,
        model_version: 'gpt-4o-mini',
        confidence_score: 0.8
      }
    ];

    const { data: narrativeData, error: narrativeError } = await supabase
      .from('career_narratives')
      .upsert(narratives)
      .select();

    if (narrativeError) {
      console.error('Error storing narratives:', narrativeError);
      throw narrativeError;
    }

    // Update job status
    await supabase
      .from('enrichment_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log('Enrichment completed successfully');

    return new Response(JSON.stringify({
      job: { ...job, status: 'completed' },
      enrichment,
      narratives: narrativeData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-resume function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
