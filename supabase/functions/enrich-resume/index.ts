
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

    // Enhanced data preparation for AI analysis
    const resumeData = {
      personal_info: [],
      work_experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      other: []
    };

    // Organize entities by category for better analysis
    entities.forEach(entity => {
      try {
        const parsedValue = JSON.parse(entity.raw_value);
        const fieldName = entity.field_name.toLowerCase();
        
        if (fieldName.includes('work') || fieldName.includes('experience') || fieldName.includes('job')) {
          resumeData.work_experience.push({
            field: entity.field_name,
            data: parsedValue,
            confidence: entity.confidence_score
          });
        } else if (fieldName.includes('education') || fieldName.includes('degree')) {
          resumeData.education.push({
            field: entity.field_name,
            data: parsedValue,
            confidence: entity.confidence_score
          });
        } else if (fieldName.includes('skill')) {
          resumeData.skills.push({
            field: entity.field_name,
            data: parsedValue,
            confidence: entity.confidence_score
          });
        } else if (fieldName.includes('project')) {
          resumeData.projects.push({
            field: entity.field_name,
            data: parsedValue,
            confidence: entity.confidence_score
          });
        } else if (fieldName.includes('cert')) {
          resumeData.certifications.push({
            field: entity.field_name,
            data: parsedValue,
            confidence: entity.confidence_score
          });
        } else if (fieldName.includes('name') || fieldName.includes('contact') || fieldName.includes('email') || fieldName.includes('phone')) {
          resumeData.personal_info.push({
            field: entity.field_name,
            data: parsedValue,
            confidence: entity.confidence_score
          });
        } else {
          resumeData.other.push({
            field: entity.field_name,
            data: parsedValue,
            confidence: entity.confidence_score
          });
        }
      } catch (error) {
        console.warn('Failed to parse entity:', entity.field_name, error);
        resumeData.other.push({
          field: entity.field_name,
          data: entity.raw_value,
          confidence: entity.confidence_score
        });
      }
    });

    // Enhanced AI prompt for better career analysis
    const enrichmentPrompt = `
You are an expert career coach and professional development analyst. Analyze this resume data and provide comprehensive, accurate career insights based on the actual content provided.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Please analyze this resume thoroughly and provide insights in the following JSON format:

{
  "role_archetype": "string (Choose from: Individual Contributor, Team Lead, Senior Manager, Director, VP/Executive, Technical Specialist, Consultant, Entrepreneur, or create a specific relevant archetype based on the actual experience)",
  "role_archetype_explanation": "Brief 2-3 sentence explanation of why this archetype fits based on specific evidence from the resume",
  "persona_type": "string (Choose from: Builder/Creator, Optimizer/Improver, Strategist/Planner, Problem Solver, Leader/Mentor, Innovator, Analyst, or create a specific relevant persona based on actual skills and experience)",
  "persona_explanation": "Brief 2-3 sentence explanation of this persona based on specific projects, skills, or achievements mentioned",
  "leadership_score": number (0-100, based on actual evidence of team management, project leadership, mentoring, or organizational impact),
  "leadership_explanation": "Specific explanation citing actual leadership examples from the resume, or explain why score is lower if no leadership evidence exists",
  "scope_score": number (0-100, based on actual project sizes, budgets managed, teams led, or organizational impact mentioned),
  "scope_explanation": "Specific explanation based on actual scope indicators from work experience, projects, or achievements",
  "technical_depth_score": number (0-100, based on actual technical skills, certifications, and technical project complexity),
  "technical_depth_explanation": "Specific explanation based on actual technical competencies, tools, languages, or technical achievements mentioned",
  "career_summary": "A compelling 3-4 sentence professional summary that captures the person's actual career trajectory, key strengths, and unique value proposition based on their specific experience",
  "key_strengths": "A 3-4 sentence summary of the person's top 3-5 strengths based on actual evidence from their work experience, skills, and achievements",
  "growth_trajectory": "A 2-3 sentence analysis of their career progression pattern and potential next steps based on their actual career path and skill development"
}

IMPORTANT GUIDELINES:
- Base ALL scores and assessments on concrete evidence from the actual resume data provided
- If there's insufficient evidence for high scores, give realistic lower scores with honest explanations
- Be specific - reference actual job titles, companies, projects, or skills when possible
- Avoid generic language - make insights personal and relevant to this specific individual
- Consider both the quantity and quality of experience when scoring
- Look for progression patterns, skill evolution, and increasing responsibility over time
- If the resume shows early career or limited experience, reflect that accurately in scores and narratives

Provide actionable, evidence-based insights that would genuinely help this person understand their professional profile.
`;

    console.log('Sending request to OpenAI for career analysis...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career analyst and professional development coach. You provide accurate, evidence-based career insights by carefully analyzing resume data. You avoid generic responses and focus on specific, actionable insights based on the actual career history provided.'
          },
          {
            role: 'user',
            content: enrichmentPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await openAIResponse.json();
    
    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', aiData);
      throw new Error(`OpenAI API error: ${aiData.error?.message || 'Unknown error'}`);
    }

    const analysis = JSON.parse(aiData.choices[0].message.content);
    console.log('AI analysis completed:', {
      role_archetype: analysis.role_archetype,
      persona_type: analysis.persona_type,
      scores: {
        leadership: analysis.leadership_score,
        scope: analysis.scope_score,
        technical: analysis.technical_depth_score
      }
    });

    // Store career enrichment with higher confidence for real AI analysis
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
        model_version: 'gpt-4o',
        confidence_score: 0.9
      })
      .select()
      .single();

    if (enrichmentError) {
      console.error('Error storing enrichment:', enrichmentError);
      throw enrichmentError;
    }

    // Store AI-generated narratives
    const narratives = [
      {
        user_id: user.id,
        resume_version_id: versionId,
        narrative_type: 'career_summary',
        narrative_text: analysis.career_summary,
        model_version: 'gpt-4o',
        confidence_score: 0.9
      },
      {
        user_id: user.id,
        resume_version_id: versionId,
        narrative_type: 'key_strengths',
        narrative_text: analysis.key_strengths,
        model_version: 'gpt-4o',
        confidence_score: 0.9
      },
      {
        user_id: user.id,
        resume_version_id: versionId,
        narrative_type: 'growth_trajectory',
        narrative_text: analysis.growth_trajectory,
        model_version: 'gpt-4o',
        confidence_score: 0.9
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

    // Update job status to completed
    await supabase
      .from('enrichment_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log('Career enrichment completed successfully');

    return new Response(JSON.stringify({
      success: true,
      job: { ...job, status: 'completed' },
      enrichment,
      narratives: narrativeData,
      analysis_summary: {
        role_archetype: analysis.role_archetype,
        persona_type: analysis.persona_type,
        scores: {
          leadership: analysis.leadership_score,
          scope: analysis.scope_score,
          technical: analysis.technical_depth_score
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-resume function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
