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
    console.log('=== Enrich Resume Starting ===');
    const { versionId }: EnrichRequest = await req.json();

    console.log('Request received with versionId:', versionId);

    if (!versionId) {
      console.error('Version ID is missing from request');
      return new Response(JSON.stringify({ error: 'Version ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing version ID for enrichment:', versionId);

    // Initialize Supabase client with service role key for internal operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Supabase configuration:', {
      url: supabaseUrl ? 'Present' : 'Missing',
      serviceKey: supabaseServiceKey ? 'Present' : 'Missing'
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get resume version details with user info
    console.log('Fetching resume version details...');
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
      return new Response(JSON.stringify({ error: 'Resume version not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found version:', version.file_name, 'for user:', version.resume_streams.user_id);

    // Check if enrichment already exists
    console.log('Checking for existing enrichment...');
    const { data: existingEnrichment, error: existingError } = await supabase
      .from('career_enrichment')
      .select('id')
      .eq('resume_version_id', versionId)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing enrichment:', existingError);
    }

    if (existingEnrichment) {
      console.log('Enrichment already exists for this version:', existingEnrichment.id);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Enrichment already exists',
        enrichment_id: existingEnrichment.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get existing parsed entities for this version
    console.log('Fetching parsed entities...');
    const { data: entities, error: entitiesError } = await supabase
      .from('parsed_resume_entities')
      .select('*')
      .eq('resume_version_id', versionId);

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch parsed entities' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!entities || entities.length === 0) {
      console.log('No entities found for enrichment');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No entities to enrich',
        enrichment_count: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${entities.length} entities to analyze:`, entities.map(e => ({ id: e.id, field: e.field_name })));

    // Process entities to create structured career data
    const careerData = processEntitiesForEnrichment(entities);
    console.log('Processed career data structure:', {
      hasPersonalInfo: !!careerData.personal_info,
      workExperienceCount: careerData.work_experience?.length || 0,
      educationCount: careerData.education?.length || 0,
      skillsCount: careerData.skills?.length || 0,
      projectsCount: careerData.projects?.length || 0,
      certificationsCount: careerData.certifications?.length || 0,
      hasSummary: !!careerData.summary
    });

    // Generate AI enrichment using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Calling OpenAI for career enrichment...');
    const enrichmentResult = await generateCareerEnrichment(careerData, openaiApiKey);
    console.log('AI enrichment generated successfully:', {
      roleArchetype: enrichmentResult.role_archetype,
      personaType: enrichmentResult.persona_type,
      narrativesCount: enrichmentResult.narratives?.length || 0
    });

    // Store enrichment data
    console.log('Storing enrichment data...');
    const { data: enrichmentData, error: enrichmentError } = await supabase
      .from('career_enrichment')
      .upsert({
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
          career_data: careerData
        }
      }, {
        onConflict: 'user_id,resume_version_id'
      })
      .select()
      .single();

    if (enrichmentError) {
      console.error('Error storing enrichment:', enrichmentError);
      throw new Error('Failed to store enrichment data');
    }

    console.log('Enrichment data stored successfully with ID:', enrichmentData.id);

    // Store career narratives
    console.log('Storing career narratives...');
    const narrativePromises = enrichmentResult.narratives.map(narrative => {
      console.log('Storing narrative:', narrative.type);
      return supabase
        .from('career_narratives')
        .upsert({
          user_id: version.resume_streams.user_id,
          resume_version_id: versionId,
          narrative_type: narrative.type,
          narrative_text: narrative.text,
          confidence_score: narrative.confidence || 0.9,
          model_version: 'gpt-4o'
        }, {
          onConflict: 'user_id,resume_version_id,narrative_type'
        });
    });

    const narrativeResults = await Promise.all(narrativePromises);
    console.log('Career narratives stored:', narrativeResults.length);

    // Log success to job logs
    const { data: jobData } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', version.resume_streams.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (jobData) {
      await supabase
        .from('job_logs')
        .insert({
          job_id: jobData.id,
          stage: 'enrich',
          level: 'info',
          message: `AI career enrichment completed successfully. Generated ${enrichmentResult.narratives.length} narratives.`,
          metadata: {
            version_id: versionId,
            entities_analyzed: entities.length,
            enrichment_id: enrichmentData.id
          }
        });
    }

    console.log('=== Enrich Resume Complete ===');

    return new Response(JSON.stringify({
      success: true,
      message: 'Career enrichment completed successfully',
      enrichment_id: enrichmentData.id,
      narratives_count: enrichmentResult.narratives.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-resume:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
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

// AI enrichment generation function
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

  console.log('Sending prompt to OpenAI...');
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
          content: 'You are a career analysis expert. Analyze career profiles and provide structured insights in JSON format. Be precise, realistic, and evidence-based in your assessments.'
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
  console.log('OpenAI response received:', result.choices?.[0]?.message?.content ? 'Success' : 'No content');
  
  const content = result.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  return JSON.parse(content);
}
