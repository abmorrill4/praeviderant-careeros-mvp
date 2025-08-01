
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  versionId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Enhanced Enrich Resume Starting ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Enhanced request body parsing with validation
    let requestData: EnrichRequest;
    
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Empty request body');
      }
      
      requestData = JSON.parse(rawBody);
      console.log('Parsed request data:', requestData);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError.message,
        received_body: await req.text().catch(() => 'Unable to read body')
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { versionId } = requestData;
    console.log('Processing enrichment for versionId:', versionId);

    // Enhanced versionId validation
    if (!versionId || typeof versionId !== 'string') {
      console.error('Invalid or missing versionId:', versionId);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Version ID is required and must be a valid string',
        received: { type: typeof versionId, value: versionId }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for parameter placeholder that wasn't replaced
    if (versionId.startsWith(':') || versionId === 'undefined' || versionId === 'null') {
      console.error('Version ID appears to be a parameter placeholder:', versionId);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid version ID - appears to be a parameter placeholder',
        received: versionId,
        hint: 'Check that the version ID is being passed correctly from the client'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(versionId)) {
      console.error('Version ID is not a valid UUID format:', versionId);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Version ID must be a valid UUID format',
        received: versionId,
        expected_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role key for internal operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Server configuration error - missing Supabase credentials'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Supabase configuration verified');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Schema validation - Check if required tables exist
    console.log('Step 1: Validating database schema...');
    try {
      const { data: schemaCheck, error: schemaError } = await supabase
        .from('career_enrichment')
        .select('id, enrichment_metadata')
        .limit(1);
      
      if (schemaError) {
        if (schemaError.code === '42P01') {
          console.error('Schema validation failed - career_enrichment table does not exist');
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Database schema is outdated',
            details: 'career_enrichment table does not exist. Please run pending migrations.',
            schema_error: true
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (schemaError.message?.includes('enrichment_metadata')) {
          console.error('Schema validation failed - enrichment_metadata column missing');
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Database schema is outdated',
            details: 'enrichment_metadata column is missing. Please run pending migrations.',
            schema_error: true
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.error('Schema validation failed with unexpected error:', schemaError);
          throw schemaError;
        }
      }
      
      console.log('Schema validation passed');
    } catch (schemaValidationError) {
      console.error('Schema validation error:', schemaValidationError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Schema validation failed',
        details: schemaValidationError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Get resume version details with user info
    console.log('Step 2: Fetching resume version details...');
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select(`
        *,
        resume_streams!inner(user_id, name)
      `)
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      console.error('Error fetching resume version:', versionError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Resume version not found',
        details: versionError?.message || 'No version data returned',
        version_id: versionId
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found version:', version.file_name, 'for user:', version.resume_streams.user_id);

    // Step 3: Update processing stage to 'enrich' 
    console.log('Step 3: Updating processing stage...');
    const { error: stageUpdateError } = await supabase.rpc('update_resume_processing_stage', {
      p_version_id: versionId,
      p_stage: 'enrich',
      p_status: 'in_progress',
      p_progress: 60
    });

    if (stageUpdateError) {
      console.error('Failed to update processing stage:', stageUpdateError);
    }

    // Step 4: Enhanced existing enrichment check with proper error handling
    console.log('Step 4: Checking for existing enrichment...');
    const { data: existingEnrichment, error: existingError } = await supabase
      .from('career_enrichment')
      .select('id, created_at')
      .eq('resume_version_id', versionId)
      .eq('user_id', version.resume_streams.user_id)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing enrichment:', existingError);
      // Don't fail here, but log the error
    }

    if (existingEnrichment) {
      console.log('Enrichment already exists for this version:', existingEnrichment.id);
      
      // Update processing stage to complete
      await supabase.rpc('update_resume_processing_stage', {
        p_version_id: versionId,
        p_stage: 'complete',
        p_status: 'completed',
        p_progress: 100
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Enrichment already exists',
        enrichment_id: existingEnrichment.id,
        created_at: existingEnrichment.created_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Get existing parsed entities for this version with better error handling
    console.log('Step 5: Fetching parsed entities...');
    const { data: entities, error: entitiesError } = await supabase
      .from('parsed_resume_entities')
      .select('*')
      .eq('resume_version_id', versionId);

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError);
      
      // Update processing stage to failed
      await supabase.rpc('update_resume_processing_stage', {
        p_version_id: versionId,
        p_stage: 'enrich',
        p_status: 'failed',
        p_error: `Failed to fetch parsed entities: ${entitiesError.message}`
      });

      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to fetch parsed entities',
        details: entitiesError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!entities || entities.length === 0) {
      console.log('No entities found for enrichment - resume may not be fully parsed yet');
      
      // Update processing stage to indicate waiting for entities
      await supabase.rpc('update_resume_processing_stage', {
        p_version_id: versionId,
        p_stage: 'parse',
        p_status: 'in_progress',
        p_error: 'Waiting for resume parsing to complete',
        p_progress: 40
      });

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No entities available for enrichment',
        message: 'Resume parsing may still be in progress. Please wait and try again.',
        entities_count: 0,
        retry_after: 30
      }), {
        status: 422, // Unprocessable Entity - indicates client should retry later
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Step 6: Found ${entities.length} entities to analyze:`, entities.map(e => ({ id: e.id, field: e.field_name })));

    // Step 7: Process entities to create structured career data
    const careerData = processEntitiesForEnrichment(entities);
    console.log('Step 7: Processed career data structure:', {
      hasPersonalInfo: !!careerData.personal_info,
      workExperienceCount: careerData.work_experience?.length || 0,
      educationCount: careerData.education?.length || 0,
      skillsCount: careerData.skills?.length || 0,
      projectsCount: careerData.projects?.length || 0,
      certificationsCount: careerData.certifications?.length || 0,
      hasSummary: !!careerData.summary
    });

    // Step 8: Generate AI enrichment using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      
      // Update processing stage to failed
      await supabase.rpc('update_resume_processing_stage', {
        p_version_id: versionId,
        p_stage: 'enrich',
        p_status: 'failed',
        p_error: 'AI service not configured - missing OpenAI API key'
      });

      return new Response(JSON.stringify({ 
        success: false,
        error: 'AI service not configured - missing OpenAI API key'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Step 8: Calling OpenAI for career enrichment...');
    let enrichmentResult;
    try {
      enrichmentResult = await generateCareerEnrichment(careerData, openaiApiKey);
      console.log('AI enrichment generated successfully:', {
        roleArchetype: enrichmentResult.role_archetype,
        personaType: enrichmentResult.persona_type,
        narrativesCount: enrichmentResult.narratives?.length || 0
      });
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      
      // Update processing stage to failed
      await supabase.rpc('update_resume_processing_stage', {
        p_version_id: versionId,
        p_stage: 'enrich',
        p_status: 'failed',
        p_error: `AI analysis failed: ${aiError.message}`
      });

      return new Response(JSON.stringify({ 
        success: false,
        error: 'AI analysis failed',
        details: aiError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 9: Store enrichment data with enhanced error handling and metadata
    console.log('Step 9: Storing enrichment data...');
    
    // Use INSERT with ON CONFLICT handling instead of UPSERT for better error control
    const { data: enrichmentData, error: enrichmentError } = await supabase
      .from('career_enrichment')
      .insert({
        user_id: version.resume_streams.user_id,
        resume_version_id: versionId,
        role_archetype: enrichmentResult.role_archetype,
        role_archetype_explanation: enrichmentResult.role_archetype_explanation,
        persona_type: enrichmentResult.persona_type,
        persona_explanation: enrichmentResult.persona_explanation,
        leadership_score: enrichmentResult.leadership_score,
        leadership_explanation: enrichmentResult.leadership_explanation || '',
        scope_score: enrichmentResult.scope_score,
        scope_explanation: enrichmentResult.scope_explanation || '',
        technical_depth_score: enrichmentResult.technical_depth_score,
        technical_depth_explanation: enrichmentResult.technical_depth_explanation || '',
        confidence_score: enrichmentResult.confidence_score || 0.9,
        model_version: 'gpt-4o',
        enrichment_metadata: {
          processing_time: new Date().toISOString(),
          entities_analyzed: entities.length,
          career_data: careerData,
          processing_version: '2.0',
          schema_version: 'enrichment_v2'
        }
      })
      .select()
      .single();

    if (enrichmentError) {
      console.error('Error storing enrichment:', enrichmentError);
      
      // Check if it's a duplicate key error and handle gracefully
      if (enrichmentError.code === '23505') {
        console.log('Enrichment already exists due to race condition, fetching existing...');
        const { data: existingData } = await supabase
          .from('career_enrichment')
          .select('id, created_at')
          .eq('user_id', version.resume_streams.user_id)
          .eq('resume_version_id', versionId)
          .single();

        if (existingData) {
          await supabase.rpc('update_resume_processing_stage', {
            p_version_id: versionId,
            p_stage: 'complete',
            p_status: 'completed',
            p_progress: 100
          });

          return new Response(JSON.stringify({ 
            success: true,
            message: 'Enrichment completed (existing data found)',
            enrichment_id: existingData.id,
            created_at: existingData.created_at
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Update processing stage to failed
      await supabase.rpc('update_resume_processing_stage', {
        p_version_id: versionId,
        p_stage: 'enrich',
        p_status: 'failed',
        p_error: `Failed to store enrichment data: ${enrichmentError.message}`
      });

      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to store enrichment data',
        details: enrichmentError.message,
        code: enrichmentError.code
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Enrichment data stored successfully with ID:', enrichmentData.id);

    // Step 10: Store career narratives with enhanced error handling
    console.log('Step 10: Storing career narratives...');
    const narrativePromises = enrichmentResult.narratives.map(async (narrative) => {
      console.log('Storing narrative:', narrative.type);
      return await supabase
        .from('career_narratives')
        .insert({
          user_id: version.resume_streams.user_id,
          resume_version_id: versionId,
          narrative_type: narrative.type,
          narrative_text: narrative.text,
          confidence_score: narrative.confidence || 0.9,
          model_version: 'gpt-4o'
        })
        .select()
        .single();
    });

    const narrativeResults = await Promise.allSettled(narrativePromises);
    
    // Check if any narratives failed
    const failedNarratives = narrativeResults.filter(result => result.status === 'rejected');
    if (failedNarratives.length > 0) {
      console.error('Some narratives failed to store:', failedNarratives);
    }
    
    const successfulNarratives = narrativeResults.filter(result => result.status === 'fulfilled').length;
    console.log('Career narratives stored:', successfulNarratives, 'out of', narrativeResults.length);

    // Step 11: Update processing stage to complete
    console.log('Step 11: Updating processing stage to complete...');
    const { error: finalStageError } = await supabase.rpc('update_resume_processing_stage', {
      p_version_id: versionId,
      p_stage: 'complete',
      p_status: 'completed',
      p_progress: 100
    });

    if (finalStageError) {
      console.error('Failed to update final processing stage:', finalStageError);
    }

    // Step 12: Enhanced logging for monitoring
    try {
      // Create or find a job for logging
      const { data: jobData } = await supabase
        .from('enrichment_jobs')
        .upsert({
          user_id: version.resume_streams.user_id,
          resume_version_id: versionId,
          job_type: 'full_enrichment',
          status: 'completed',
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,resume_version_id'
        })
        .select()
        .single();

      if (jobData) {
        await supabase
          .from('job_logs')
          .insert({
            job_id: jobData.id,
            stage: 'enrich',
            level: 'info',
            message: `Enhanced AI career enrichment completed successfully. Generated ${successfulNarratives} narratives.`,
            metadata: {
              version_id: versionId,
              entities_analyzed: entities.length,
              enrichment_id: enrichmentData.id,
              processing_version: '2.0',
              schema_validated: true,
              career_data_structure: {
                work_experience: careerData.work_experience?.length || 0,
                education: careerData.education?.length || 0,
                skills: careerData.skills?.length || 0
              }
            }
          });
      }
    } catch (logError) {
      console.warn('Failed to log to job_logs (non-critical):', logError);
    }

    console.log('=== Enhanced Enrich Resume Complete ===');

    return new Response(JSON.stringify({
      success: true,
      message: 'Enhanced career enrichment completed successfully',
      enrichment_id: enrichmentData.id,
      narratives_count: successfulNarratives,
      entities_processed: entities.length,
      processing_version: '2.0',
      schema_version: 'enrichment_v2'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in enhanced enrich-resume:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message,
      type: error.constructor.name,
      processing_version: '2.0'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to process entities into structured career data
function processEntitiesForEnrichment(entities: any[]): any {
  const careerData: any = {
    personal_info: {},
    work_experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  };

  entities.forEach(entity => {
    try {
      const value = JSON.parse(entity.raw_value);
      
      if (entity.field_name === 'name') {
        careerData.personal_info.name = value;
      } else if (entity.field_name === 'email') {
        careerData.personal_info.email = value;
      } else if (entity.field_name === 'phone') {
        careerData.personal_info.phone = value;
      } else if (entity.field_name === 'location') {
        careerData.personal_info.location = value;
      } else if (entity.field_name === 'summary') {
        careerData.summary = value;
      } else if (entity.field_name.startsWith('work_experience_')) {
        careerData.work_experience.push(value);
      } else if (entity.field_name.startsWith('education_')) {
        careerData.education.push(value);
      } else if (entity.field_name.startsWith('skill_')) {
        careerData.skills.push(value);
      } else if (entity.field_name.startsWith('project_')) {
        careerData.projects.push(value);
      } else if (entity.field_name.startsWith('certification_')) {
        careerData.certifications.push(value);
      }
    } catch (error) {
      // Handle non-JSON values
      if (entity.field_name === 'name') {
        careerData.personal_info.name = entity.raw_value;
      } else if (entity.field_name === 'email') {
        careerData.personal_info.email = entity.raw_value;
      } else if (entity.field_name === 'phone') {
        careerData.personal_info.phone = entity.raw_value;
      } else if (entity.field_name === 'location') {
        careerData.personal_info.location = entity.raw_value;
      } else if (entity.field_name === 'summary') {
        careerData.summary = entity.raw_value;
      }
    }
  });

  return careerData;
}

// Enhanced AI enrichment generation function
async function generateCareerEnrichment(careerData: any, openaiApiKey: string): Promise<any> {
  const prompt = `
Analyze the following career profile and provide structured insights. Focus on professional patterns, career trajectory, and leadership indicators.

Career Data:
${JSON.stringify(careerData, null, 2)}

Return a JSON object with this exact structure:
{
  "role_archetype": "one of: Strategic Leader, Technical Expert, Creative Innovator, Operations Specialist, Growth Driver, People Manager, or Product Visionary",
  "role_archetype_explanation": "2-3 sentence explanation of why this archetype fits",
  "persona_type": "one of: Executor, Strategist, Innovator, Collaborator, or Specialist", 
  "persona_explanation": "2-3 sentence explanation of this persona",
  "leadership_score": 85,
  "leadership_explanation": "Brief explanation of leadership assessment",
  "scope_score": 78,
  "scope_explanation": "Brief explanation of scope/impact assessment", 
  "technical_depth_score": 92,
  "technical_depth_explanation": "Brief explanation of technical depth assessment",
  "confidence_score": 0.9,
  "narratives": [
    {
      "type": "career_summary",
      "text": "A comprehensive 2-3 sentence career summary highlighting key accomplishments and trajectory",
      "confidence": 0.9
    },
    {
      "type": "key_strengths", 
      "text": "2-3 sentences highlighting the person's top professional strengths and differentiators",
      "confidence": 0.85
    },
    {
      "type": "growth_trajectory",
      "text": "2-3 sentences analyzing career progression and future potential",
      "confidence": 0.8
    }
  ]
}

Scoring Guidelines:
- Leadership Score (0-100): Rate leadership experience, team management, strategic impact
- Scope Score (0-100): Rate breadth of impact, cross-functional work, business influence  
- Technical Depth Score (0-100): Rate technical expertise, specialization, innovation

Provide realistic, evidence-based scores. Be thoughtful and specific in your analysis.
`;

  console.log('Sending enhanced prompt to OpenAI...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career analysis specialist. Analyze career profiles and provide structured insights in JSON format. Be precise, realistic, and evidence-based in your assessments. Focus on extracting meaningful patterns from the provided career data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log('Enhanced OpenAI response received:', result.choices?.[0]?.message?.content ? 'Success' : 'No content');
  
  const content = result.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  return JSON.parse(content);
}
