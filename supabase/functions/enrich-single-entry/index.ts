
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
    console.log('=== Enrich Single Entry Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Log headers for debugging
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Content-Type:', req.headers.get('content-type'));

    // Parse request body with better error handling
    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(rawBody);
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message,
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract and validate parameters
    const { parsed_entity_id, entityId, force_refresh = false } = requestBody;
    
    // Handle both possible parameter names for backward compatibility
    const finalEntityId = parsed_entity_id || entityId;
    
    console.log('Entity ID from parsed_entity_id:', parsed_entity_id);
    console.log('Entity ID from entityId:', entityId);
    console.log('Final entity ID:', finalEntityId);
    console.log('Force refresh:', force_refresh);

    if (!finalEntityId) {
      console.error('No entity ID provided in request');
      return new Response(JSON.stringify({ 
        error: 'Entity ID is required. Please provide either "parsed_entity_id" or "entityId" in the request body.',
        received_body: requestBody,
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing enrichment for entity:', finalEntityId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from auth header
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      console.error('No auth token provided');
      return new Response(JSON.stringify({ 
        error: 'Authentication token is required',
        success: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('User authentication result:', { userId: user?.id, error: authError?.message });

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError?.message,
        success: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the parsed entity with detailed logging
    console.log('Fetching entity from database...');
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
      .eq('id', finalEntityId)
      .single();

    console.log('Database query result:', { 
      entityFound: !!entity, 
      error: entityError?.message,
      entityId: entity?.id,
      userId: entity?.resume_versions?.resume_streams?.user_id
    });

    if (entityError) {
      console.error('Database error fetching entity:', entityError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch entity from database',
        details: entityError.message,
        entity_id: finalEntityId,
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!entity) {
      console.error('Entity not found:', finalEntityId);
      return new Response(JSON.stringify({ 
        error: 'Entity not found',
        entity_id: finalEntityId,
        success: false 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify user owns this entity
    const entityUserId = entity.resume_versions.resume_streams.user_id;
    console.log('Access check:', { requestUserId: user.id, entityUserId });
    
    if (entityUserId !== user.id) {
      console.error('Access denied - user mismatch');
      return new Response(JSON.stringify({ 
        error: 'Access denied - you do not own this entity',
        success: false 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if enrichment already exists with better error handling
    console.log('Checking for existing enrichment...');
    const { data: existingEnrichment, error: enrichmentError } = await supabase
      .from('entry_enrichment')
      .select('*')
      .eq('parsed_entity_id', finalEntityId)
      .maybeSingle();

    console.log('Existing enrichment check:', { 
      found: !!existingEnrichment, 
      error: enrichmentError?.message,
      forceRefresh: force_refresh
    });

    if (enrichmentError) {
      console.error('Error checking existing enrichment:', enrichmentError);
      return new Response(JSON.stringify({ 
        error: 'Failed to check existing enrichment',
        details: enrichmentError.message,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (existingEnrichment && !force_refresh) {
      console.log('Returning cached enrichment');
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
    console.log('Starting AI enrichment process...');
    const enrichmentData = await enrichSingleEntity(entity);
    console.log('AI enrichment completed successfully');

    // Store or update enrichment with proper upsert logic
    let result;
    try {
      if (existingEnrichment) {
        console.log('Updating existing enrichment...');
        const { data, error } = await supabase
          .from('entry_enrichment')
          .update({
            ...enrichmentData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEnrichment.id)
          .select()
          .single();
        
        if (error) {
          console.error('Failed to update enrichment:', error);
          throw new Error(`Failed to update enrichment: ${error.message}`);
        }
        result = data;
      } else {
        console.log('Creating new enrichment...');
        // Use upsert to handle race conditions
        const { data, error } = await supabase
          .from('entry_enrichment')
          .upsert({
            user_id: user.id,
            resume_version_id: entity.resume_version_id,
            parsed_entity_id: finalEntityId,
            ...enrichmentData
          }, {
            onConflict: 'parsed_entity_id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (error) {
          console.error('Failed to insert/upsert enrichment:', error);
          throw new Error(`Failed to insert enrichment: ${error.message}`);
        }
        result = data;
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save enrichment data',
        details: dbError.message,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Successfully enriched entity:', finalEntityId);

    return new Response(JSON.stringify({
      success: true,
      message: 'Entity enriched successfully',
      enrichment: result,
      was_cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('=== Error in enrich-single-entry ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      success: false,
      timestamp: new Date().toISOString()
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

  console.log('Starting OpenAI enrichment for field:', entity.field_name);

  // Parse the raw value to understand the data structure
  let parsedData;
  try {
    parsedData = JSON.parse(entity.raw_value);
  } catch {
    parsedData = entity.raw_value;
  }

  // Create enrichment prompt based on field type and data
  const enrichmentPrompt = createEnrichmentPrompt(entity.field_name, parsedData);
  console.log('Generated enrichment prompt length:', enrichmentPrompt.length);

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
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const enrichmentContent = data.choices[0].message.content;
  console.log('Received OpenAI response length:', enrichmentContent.length);

  try {
    const enrichmentData = JSON.parse(enrichmentContent);
    console.log('Successfully parsed AI enrichment data');
    
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
    console.error('Raw AI response:', enrichmentContent);
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
