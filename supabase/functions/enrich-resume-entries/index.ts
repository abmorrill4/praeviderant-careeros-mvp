
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
    const { resume_version_id } = await req.json();

    if (!resume_version_id) {
      throw new Error('resume_version_id is required');
    }

    console.log('Starting entry enrichment for resume version:', resume_version_id);

    // Get the user from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Get all parsed entities for this resume version
    const { data: entities, error: entitiesError } = await supabase
      .from('parsed_resume_entities')
      .select('*')
      .eq('resume_version_id', resume_version_id);

    if (entitiesError) {
      throw new Error(`Failed to fetch entities: ${entitiesError.message}`);
    }

    if (!entities || entities.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No entities found to enrich',
        enriched_count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${entities.length} entities to enrich`);

    // Check which entities already have enrichment
    const { data: existingEnrichments, error: enrichmentError } = await supabase
      .from('entry_enrichment')
      .select('parsed_entity_id')
      .eq('resume_version_id', resume_version_id);

    if (enrichmentError) {
      throw new Error(`Failed to check existing enrichments: ${enrichmentError.message}`);
    }

    const enrichedEntityIds = new Set(existingEnrichments?.map(e => e.parsed_entity_id) || []);
    const entitiesToEnrich = entities.filter(entity => !enrichedEntityIds.has(entity.id));

    console.log(`${entitiesToEnrich.length} entities need enrichment`);

    let enrichedCount = 0;
    const enrichmentPromises = entitiesToEnrich.map(async (entity) => {
      try {
        const enrichmentData = await enrichSingleEntity(entity);
        
        // Store enrichment in database
        const { error: insertError } = await supabase
          .from('entry_enrichment')
          .insert({
            user_id: user.id,
            resume_version_id: resume_version_id,
            parsed_entity_id: entity.id,
            ...enrichmentData
          });

        if (insertError) {
          console.error(`Failed to insert enrichment for entity ${entity.id}:`, insertError);
          return null;
        }

        enrichedCount++;
        return entity.id;
      } catch (error) {
        console.error(`Failed to enrich entity ${entity.id}:`, error);
        return null;
      }
    });

    // Wait for all enrichments to complete
    const results = await Promise.all(enrichmentPromises);
    const successfulEnrichments = results.filter(r => r !== null);

    console.log(`Successfully enriched ${successfulEnrichments.length} entities`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully enriched ${successfulEnrichments.length} out of ${entitiesToEnrich.length} entities`,
      enriched_count: successfulEnrichments.length,
      total_entities: entities.length,
      enriched_entity_ids: successfulEnrichments
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in enrich-resume-entries:', error);
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
