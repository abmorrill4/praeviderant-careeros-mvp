
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { parsed_entity_id, force_refresh = false } = await req.json();

    if (!parsed_entity_id) {
      throw new Error('parsed_entity_id is required');
    }

    console.log('Enriching single entity:', parsed_entity_id);

    // Get the user from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Get the parsed entity
    const { data: entity, error: entityError } = await supabase
      .from('parsed_resume_entities')
      .select(`
        *,
        resume_versions!inner(
          id,
          resume_streams!inner(
            user_id
          )
        )
      `)
      .eq('id', parsed_entity_id)
      .single();

    if (entityError || !entity) {
      throw new Error('Entity not found or access denied');
    }

    // Verify user owns this entity
    if (entity.resume_versions.resume_streams.user_id !== user.id) {
      throw new Error('Access denied');
    }

    // Check if enrichment already exists
    const { data: existingEnrichment, error: enrichmentError } = await supabase
      .from('entry_enrichment')
      .select('*')
      .eq('parsed_entity_id', parsed_entity_id)
      .maybeSingle();

    if (enrichmentError) {
      throw new Error(`Failed to check existing enrichment: ${enrichmentError.message}`);
    }

    if (existingEnrichment && !force_refresh) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Enrichment already exists',
        enrichment: existingEnrichment,
        was_cached: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Enrich the entity
    const enrichmentData = await enrichSingleEntity(entity);

    // Store or update enrichment
    let result;
    if (existingEnrichment) {
      const { data, error } = await supabase
        .from('entry_enrichment')
        .update(enrichmentData)
        .eq('id', existingEnrichment.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update enrichment: ${error.message}`);
      }
      result = data;
    } else {
      const { data, error } = await supabase
        .from('entry_enrichment')
        .insert({
          user_id: user.id,
          resume_version_id: entity.resume_version_id,
          parsed_entity_id: parsed_entity_id,
          ...enrichmentData
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to insert enrichment: ${error.message}`);
      }
      result = data;
    }

    console.log('Successfully enriched entity:', parsed_entity_id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Entity enriched successfully',
      enrichment: result,
      was_cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in enrich-single-entry:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function enrichSingleEntity(entity: any) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Parse the raw value to understand the data structure
  let parsedData;
  try {
    parsedData = JSON.parse(entity.raw_value);
  } catch {
    parsedData = entity.raw_value;
  }

  // Create enrichment prompt based on field type and data
  const enrichmentPrompt = createEnrichmentPrompt(entity.field_name, parsedData);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          content: `You are a career analysis AI that provides insights about resume entries. 
          Analyze the given resume entry and provide structured enrichment data.
          Always respond with valid JSON matching the expected schema.`
        },
        {
          role: 'user',
          content: enrichmentPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const enrichmentContent = data.choices[0].message.content;

  try {
    const enrichmentData = JSON.parse(enrichmentContent);
    return {
      insights: enrichmentData.insights || [],
      skills_identified: enrichmentData.skills_identified || [],
      experience_level: enrichmentData.experience_level,
      career_progression: enrichmentData.career_progression,
      market_relevance: enrichmentData.market_relevance,
      recommendations: enrichmentData.recommendations || [],
      parsed_structure: enrichmentData.parsed_structure,
      confidence_score: enrichmentData.confidence_score || 0.8,
      model_version: 'gpt-4o-mini',
      enrichment_metadata: {
        field_name: entity.field_name,
        enriched_at: new Date().toISOString(),
        source_confidence: entity.confidence_score
      }
    };
  } catch (error) {
    console.error('Failed to parse enrichment response:', error);
    throw new Error('Invalid enrichment response from AI');
  }
}

function createEnrichmentPrompt(fieldName: string, parsedData: any): string {
  const dataStr = typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData, null, 2);
  
  return `Analyze this resume entry and provide detailed career insights:

Field: ${fieldName}
Data: ${dataStr}

Please provide a JSON response with the following structure:
{
  "insights": ["insight1", "insight2", ...],
  "skills_identified": ["skill1", "skill2", ...],
  "experience_level": "entry/mid/senior/executive",
  "career_progression": "description of career progression indicators",
  "market_relevance": "assessment of market relevance and demand",
  "recommendations": ["recommendation1", "recommendation2", ...],
  "parsed_structure": {...enhanced structured data...},
  "confidence_score": 0.85
}

Focus on:
- Technical and soft skills demonstrated
- Career level and progression indicators
- Market relevance and industry demand
- Actionable recommendations for improvement
- Enhanced structured representation of the data

Provide practical, actionable insights that would be valuable for career development and job searching.`;
}
