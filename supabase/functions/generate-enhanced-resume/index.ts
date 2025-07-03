import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeGenerationRequest {
  userId: string;
  jobDescription: string;
  personalizations?: {
    tone?: 'professional' | 'conversational' | 'technical' | 'creative';
    focus?: 'experience' | 'skills' | 'education' | 'projects';
    targetRole?: string;
    industry?: string;
    companyName?: string;
    customObjective?: string;
  };
  format?: {
    type: 'pdf' | 'docx' | 'html' | 'markdown' | 'txt' | 'json';
    pageSize?: 'A4' | 'Letter';
    margins?: 'normal' | 'narrow' | 'wide';
    fontSize?: 'small' | 'medium' | 'large';
  };
  style?: {
    template: string;
    colorScheme?: 'classic' | 'modern' | 'minimal' | 'creative';
    layout?: 'single-column' | 'two-column' | 'sidebar';
    font?: 'serif' | 'sans-serif' | 'monospace';
  };
}

interface GenerationPass {
  id: string;
  name: string;
  model: 'gpt-4o' | 'o3';
  purpose: string;
  functionCalls?: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  processingTime?: number;
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function fetchUserProfile(userId: string) {
  console.log('Fetching comprehensive user profile for:', userId);

  // Fetch user basic info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error(`Error fetching profile: ${profileError.message}`);
  }

  // Fetch career profile
  const { data: careerProfile, error: careerError } = await supabase
    .from('career_profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (careerError && careerError.code !== 'PGRST116') {
    throw new Error(`Error fetching career profile: ${careerError.message}`);
  }

  // Fetch all latest active entities
  const [workExperienceResult, educationResult, skillsResult, projectsResult, certificationsResult] = await Promise.all([
    supabase.from('work_experience').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('education').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('skill').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('project').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('certification').select('*').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false })
  ]);

  // Check for errors
  if (workExperienceResult.error) throw new Error(`Error fetching work experience: ${workExperienceResult.error.message}`);
  if (educationResult.error) throw new Error(`Error fetching education: ${educationResult.error.message}`);
  if (skillsResult.error) throw new Error(`Error fetching skills: ${skillsResult.error.message}`);
  if (projectsResult.error) throw new Error(`Error fetching projects: ${projectsResult.error.message}`);
  if (certificationsResult.error) throw new Error(`Error fetching certifications: ${certificationsResult.error.message}`);

  return {
    profile,
    careerProfile,
    workExperience: workExperienceResult.data,
    education: educationResult.data,
    skills: skillsResult.data,
    projects: projectsResult.data,
    certifications: certificationsResult.data
  };
}

async function executeGenerationPass(
  pass: GenerationPass,
  userProfile: any,
  jobDescription: string,
  personalizations: any,
  previousResults: Record<string, any>
): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log(`Executing generation pass: ${pass.name} using model: ${pass.model}`);
  
  const startTime = Date.now();

  // Build system prompt based on the pass
  const systemPrompt = getSystemPromptForPass(pass, personalizations);
  
  // Build user prompt with context
  const userPrompt = buildUserPromptForPass(pass, userProfile, jobDescription, previousResults);

  // Choose model based on pass requirements
  const model = pass.model === 'o3' ? 'o3-2025-04-16' : 'gpt-4o';

  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
  };

  // Add function calls if required
  if (pass.functionCalls) {
    requestBody.functions = getPassFunctions(pass);
    requestBody.function_call = 'auto';
  }

  // Set max tokens based on model
  if (model === 'gpt-4o') {
    requestBody.max_tokens = 4000;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error in ${pass.name}: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const processingTime = Date.now() - startTime;
  
  // Extract result based on pass type
  let passResult;
  if (pass.functionCalls && result.choices[0].message.function_call) {
    try {
      passResult = JSON.parse(result.choices[0].message.function_call.arguments);
    } catch (e) {
      passResult = result.choices[0].message.function_call.arguments;
    }
  } else {
    passResult = result.choices[0].message.content;
  }

  console.log(`Pass ${pass.name} completed in ${processingTime}ms`);
  
  return {
    result: passResult,
    processingTime,
    usage: result.usage
  };
}

function getSystemPromptForPass(pass: GenerationPass, personalizations: any): string {
  const baseTone = personalizations?.tone || 'professional';
  const focus = personalizations?.focus || 'experience';
  
  switch (pass.id) {
    case 'job_analysis':
      return `You are an expert job description analyst. Your task is to deeply analyze job descriptions to extract key requirements, skills, and qualifications. Focus on understanding the role's technical requirements, soft skills, experience level, and company culture fit indicators.`;
      
    case 'content_extraction':
      return `You are a career data extraction specialist. Extract and structure relevant career information from user profiles that align with job requirements. Focus on ${focus} and maintain a ${baseTone} tone throughout.`;
      
    case 'strategic_positioning':
      return `You are a strategic career positioning expert. Your role is to determine the optimal way to present a candidate's background for maximum impact. Consider market trends, role requirements, and candidate strengths.`;
      
    case 'content_generation':
      return `You are a professional resume writer with expertise in creating compelling, ATS-optimized resumes. Generate content that is ${baseTone} in tone, focuses on ${focus}, and follows modern resume best practices. Ensure all content is truthful and based on provided data.`;
      
    case 'optimization_review':
      return `You are a resume optimization specialist. Review and refine resume content for maximum impact, keyword optimization, and ATS compatibility. Ensure consistency, clarity, and compelling presentation.`;
      
    default:
      return `You are an expert resume generation assistant with a ${baseTone} tone, focusing on ${focus}.`;
  }
}

function buildUserPromptForPass(
  pass: GenerationPass,
  userProfile: any,
  jobDescription: string,
  previousResults: Record<string, any>
): string {
  switch (pass.id) {
    case 'job_analysis':
      return `Analyze this job description thoroughly:

JOB DESCRIPTION:
${jobDescription}

Extract and structure:
1. Key technical skills required
2. Soft skills and competencies
3. Experience level and requirements
4. Industry-specific knowledge needed
5. Company culture indicators
6. Critical keywords for ATS optimization
7. Nice-to-have vs must-have qualifications

Return a comprehensive analysis in JSON format.`;

    case 'content_extraction':
      return `Based on this job analysis: ${JSON.stringify(previousResults.job_analysis?.result || {})}

Extract and organize relevant information from this user profile:

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

Focus on information that directly aligns with the job requirements. Structure the data for optimal resume presentation.`;

    case 'strategic_positioning':
      return `Based on the job analysis and extracted content:

JOB ANALYSIS: ${JSON.stringify(previousResults.job_analysis?.result || {})}
EXTRACTED CONTENT: ${JSON.stringify(previousResults.content_extraction?.result || {})}

Determine the optimal strategic positioning for this candidate:
1. Primary value proposition
2. Key differentiators
3. Story arc and narrative flow
4. Areas to emphasize vs de-emphasize
5. Gap mitigation strategies
6. Competitive positioning

Provide strategic recommendations in JSON format.`;

    case 'content_generation':
      return `Generate a complete resume based on all previous analysis:

JOB ANALYSIS: ${JSON.stringify(previousResults.job_analysis?.result || {})}
EXTRACTED CONTENT: ${JSON.stringify(previousResults.content_extraction?.result || {})}
STRATEGIC POSITIONING: ${JSON.stringify(previousResults.strategic_positioning?.result || {})}

Create a comprehensive resume in JSON Resume format that:
1. Optimally positions the candidate
2. Includes all relevant information
3. Uses strategic keyword placement
4. Follows the strategic narrative
5. Is ATS-optimized
6. Maintains consistency and impact

Return the complete resume in valid JSON Resume format.`;

    case 'optimization_review':
      return `Review and optimize this generated resume:

GENERATED RESUME: ${JSON.stringify(previousResults.content_generation?.result || {})}
ORIGINAL JOB REQUIREMENTS: ${JSON.stringify(previousResults.job_analysis?.result || {})}

Perform final optimization:
1. Keyword density optimization
2. ATS compatibility check
3. Impact statement enhancement
4. Consistency verification
5. Gap identification and mitigation
6. Final polish and refinement

Return the optimized resume in JSON Resume format with improvement notes.`;

    default:
      return `Process the following data: ${JSON.stringify(userProfile, null, 2)}`;
  }
}

function getPassFunctions(pass: GenerationPass): any[] {
  // Define function schemas for structured output
  switch (pass.id) {
    case 'job_analysis':
      return [{
        name: 'analyze_job_description',
        description: 'Analyze job description and extract structured requirements',
        parameters: {
          type: 'object',
          properties: {
            technical_skills: { type: 'array', items: { type: 'string' } },
            soft_skills: { type: 'array', items: { type: 'string' } },
            experience_level: { type: 'string' },
            industry: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            requirements: {
              type: 'object',
              properties: {
                must_have: { type: 'array', items: { type: 'string' } },
                nice_to_have: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }];
    default:
      return [];
  }
}

async function executeMultiPassGeneration(
  userProfile: any,
  jobDescription: string,
  personalizations: any
): Promise<any> {
  // Define the generation pipeline
  const passes: GenerationPass[] = [
    {
      id: 'job_analysis',
      name: 'Job Requirements Analysis',
      model: 'gpt-4o',
      purpose: 'Deep analysis of job requirements and qualifications',
      functionCalls: true,
      status: 'pending'
    },
    {
      id: 'content_extraction',
      name: 'Relevant Content Extraction',
      model: 'gpt-4o',
      purpose: 'Extract and organize relevant user profile information',
      status: 'pending'
    },
    {
      id: 'strategic_positioning',
      name: 'Strategic Candidate Positioning',
      model: 'o3',
      purpose: 'Determine optimal positioning and narrative strategy',
      status: 'pending'
    },
    {
      id: 'content_generation',
      name: 'Resume Content Generation',
      model: 'gpt-4o',
      purpose: 'Generate complete resume content with optimization',
      status: 'pending'
    },
    {
      id: 'optimization_review',
      name: 'Final Optimization Review',
      model: 'gpt-4o',
      purpose: 'Final review and optimization for maximum impact',
      status: 'pending'
    }
  ];

  const results: Record<string, any> = {};
  let totalProcessingTime = 0;

  // Execute passes sequentially
  for (const pass of passes) {
    try {
      pass.status = 'running';
      console.log(`Starting pass: ${pass.name}`);
      
      const passResult = await executeGenerationPass(
        pass,
        userProfile,
        jobDescription,
        personalizations,
        results
      );
      
      pass.status = 'completed';
      pass.processingTime = passResult.processingTime;
      results[pass.id] = passResult;
      totalProcessingTime += passResult.processingTime;
      
      console.log(`Completed pass: ${pass.name} in ${passResult.processingTime}ms`);
      
    } catch (error) {
      pass.status = 'failed';
      console.error(`Pass ${pass.name} failed:`, error);
      throw new Error(`Generation failed at ${pass.name}: ${error.message}`);
    }
  }

  // Extract final resume from the last successful pass
  const finalResume = results.optimization_review?.result || results.content_generation?.result;
  
  if (!finalResume) {
    throw new Error('No final resume generated from pipeline');
  }

  // Calculate analytics
  const analytics = calculateResumeAnalytics(
    finalResume,
    results.job_analysis?.result,
    userProfile
  );

  return {
    resume: finalResume,
    metadata: {
      generation: {
        model: 'multi-pass-pipeline',
        version: '1.0',
        processingTime: totalProcessingTime,
        passes: passes.length
      },
      personalization: personalizations,
      analytics,
      pipeline: {
        passes,
        results: Object.keys(results)
      }
    }
  };
}

function calculateResumeAnalytics(
  resume: any,
  jobAnalysis: any,
  userProfile: any
): any {
  // Calculate match scores
  const requiredSkills = jobAnalysis?.technical_skills || [];
  const userSkills = userProfile?.skills?.map((s: any) => s.name) || [];
  
  const skillsMatch = requiredSkills.length > 0 
    ? (requiredSkills.filter((skill: string) => 
        userSkills.some((userSkill: string) => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      ).length / requiredSkills.length) * 100
    : 0;

  const keywordDensity = calculateKeywordDensity(resume, jobAnalysis?.keywords || []);
  
  return {
    matchScore: Math.round((skillsMatch + keywordDensity) / 2),
    keywordAlignment: Math.round(keywordDensity),
    completeness: calculateCompleteness(resume),
    skillsMatch: Math.round(skillsMatch)
  };
}

function calculateKeywordDensity(resume: any, keywords: string[]): number {
  const resumeText = JSON.stringify(resume).toLowerCase();
  const foundKeywords = keywords.filter(keyword => 
    resumeText.includes(keyword.toLowerCase())
  );
  
  return keywords.length > 0 ? (foundKeywords.length / keywords.length) * 100 : 0;
}

function calculateCompleteness(resume: any): number {
  const requiredSections = ['basics', 'work', 'education', 'skills'];
  const presentSections = requiredSections.filter(section => 
    resume[section] && (Array.isArray(resume[section]) ? resume[section].length > 0 : resume[section])
  );
  
  return (presentSections.length / requiredSections.length) * 100;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody: ResumeGenerationRequest = await req.json();
    
    if (!requestBody.userId || !requestBody.jobDescription) {
      throw new Error('Missing required parameters: userId and jobDescription');
    }

    console.log('Starting enhanced resume generation for user:', requestBody.userId);

    // Fetch comprehensive user profile
    const userProfile = await fetchUserProfile(requestBody.userId);
    
    // Execute multi-pass generation pipeline
    const generationResult = await executeMultiPassGeneration(
      userProfile,
      requestBody.jobDescription,
      requestBody.personalizations || {}
    );

    // Store generated resume in database
    const { data: storedResume, error: storeError } = await supabase
      .from('generated_resumes')
      .insert({
        user_id: requestBody.userId,
        job_description: requestBody.jobDescription,
        content: generationResult.resume,
        metadata: generationResult.metadata,
        personalization: requestBody.personalizations,
        format_settings: requestBody.format,
        style_settings: requestBody.style
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error storing generated resume:', storeError);
      // Continue anyway, return the generated resume
    }

    const response = {
      id: storedResume?.id || crypto.randomUUID(),
      userId: requestBody.userId,
      jobDescription: requestBody.jobDescription,
      content: generationResult.resume,
      metadata: generationResult.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Successfully generated enhanced resume');

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-enhanced-resume function:', error);

    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.stack
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});