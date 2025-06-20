
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateCoverLetterRequest {
  user_id: string;
  job_description: string;
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

async function fetchUserProfile(userId: string) {
  console.log('Fetching user profile for cover letter generation:', userId);

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

  // Fetch work experience (latest versions only)
  const { data: workExperience, error: workError } = await supabase
    .from('work_experience')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (workError) {
    throw new Error(`Error fetching work experience: ${workError.message}`);
  }

  // Fetch education (latest versions only)
  const { data: education, error: educationError } = await supabase
    .from('education')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (educationError) {
    throw new Error(`Error fetching education: ${educationError.message}`);
  }

  // Fetch skills (latest versions only)
  const { data: skills, error: skillsError } = await supabase
    .from('skill')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (skillsError) {
    throw new Error(`Error fetching skills: ${skillsError.message}`);
  }

  // Fetch projects (latest versions only)
  const { data: projects, error: projectsError } = await supabase
    .from('project')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (projectsError) {
    throw new Error(`Error fetching projects: ${projectsError.message}`);
  }

  // Fetch certifications (latest versions only)
  const { data: certifications, error: certificationsError } = await supabase
    .from('certification')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (certificationsError) {
    throw new Error(`Error fetching certifications: ${certificationsError.message}`);
  }

  return {
    profile,
    careerProfile,
    workExperience,
    education,
    skills,
    projects,
    certifications
  };
}

async function generateTailoredCoverLetter(userProfile: any, jobDescription: string): Promise<string> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a professional cover letter writer. Your task is to create a compelling, personalized cover letter in markdown format based on the user's profile data and a specific job description.

Guidelines:
1. Analyze the job description to understand the company, role requirements, and key qualifications
2. Write a professional cover letter that tells a compelling story connecting the user's background to the role
3. Use specific examples from their work experience, projects, and achievements that align with the job requirements
4. Show genuine interest in the company and role based on the job description
5. Maintain a professional yet personable tone
6. Keep the cover letter concise (3-4 paragraphs) but impactful
7. Include a strong opening that captures attention
8. Highlight the most relevant skills and experiences for this specific role
9. End with a clear call to action

Structure the cover letter with:
- Professional header with contact information (if available)
- Date
- Company information (extract from job description if available)
- Salutation
- Opening paragraph that grabs attention and states the position
- 1-2 body paragraphs highlighting relevant experience and achievements
- Closing paragraph with call to action
- Professional sign-off

Return the cover letter in clean markdown format. Do not include any explanations or additional text outside the cover letter content.`;

  const userPrompt = `Job Description:
${jobDescription}

User Profile Data:
${JSON.stringify(userProfile, null, 2)}

Please generate a tailored cover letter in markdown format that creates a compelling connection between this user's background and the specific job opportunity.`;

  console.log('Sending request to OpenAI for cover letter generation');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const generatedContent = result.choices[0].message.content;

  if (!generatedContent) {
    throw new Error('No content generated from OpenAI API');
  }

  return generatedContent;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody: GenerateCoverLetterRequest = await req.json();
    
    if (!requestBody.user_id || !requestBody.job_description) {
      throw new Error('Missing required parameters: user_id and job_description');
    }

    console.log('Generating tailored cover letter for user:', requestBody.user_id);

    // Fetch user profile data
    const userProfile = await fetchUserProfile(requestBody.user_id);
    
    // Generate tailored cover letter using LLM
    const tailoredCoverLetter = await generateTailoredCoverLetter(userProfile, requestBody.job_description);

    console.log('Successfully generated tailored cover letter');

    return new Response(
      JSON.stringify({ 
        coverLetter: tailoredCoverLetter,
        format: 'markdown'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-tailored-cover-letter function:', error);

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
