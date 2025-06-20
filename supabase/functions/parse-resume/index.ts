
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeData {
  personalInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  workExperience: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    technologies?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
    fieldOfStudy?: string;
  }>;
  skills: Array<{
    name: string;
    category?: string;
  }>;
  projects: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate?: string;
    expirationDate?: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { uploadId } = await req.json();

    if (!uploadId) {
      throw new Error('Upload ID is required');
    }

    console.log('Processing resume upload:', uploadId);

    // Get upload record
    const { data: upload, error: fetchError } = await supabase
      .from('resume_uploads')
      .select('*')
      .eq('id', uploadId)
      .single();

    if (fetchError || !upload) {
      throw new Error(`Upload not found: ${fetchError?.message}`);
    }

    // Update status to processing
    await supabase
      .from('resume_uploads')
      .update({ parsing_status: 'processing' })
      .eq('id', uploadId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(upload.file_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to base64 for OpenAI API
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Extract text using OpenAI API
    const extractedText = await extractTextWithOpenAI(base64, upload.mime_type);
    
    // Parse the extracted text into structured data
    const structuredData = await parseResumeText(extractedText);

    // Update database with results
    await supabase
      .from('resume_uploads')
      .update({
        parsing_status: 'completed',
        extracted_text: extractedText,
        structured_data: structuredData
      })
      .eq('id', uploadId);

    console.log('Resume parsing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Resume parsed successfully',
        structuredData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error parsing resume:', error);

    // Update database with error
    if (req.body && req.body.uploadId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('resume_uploads')
        .update({
          parsing_status: 'failed',
          error_message: error.message
        })
        .eq('id', req.body.uploadId);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function extractTextWithOpenAI(base64Content: string, mimeType: string): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  // For now, we'll use a simple text extraction prompt
  // In a production environment, you might want to use a specialized PDF parsing service
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a document text extraction specialist. Extract all text content from the provided document. 
          Return only the plain text content without any formatting, maintaining the logical structure and spacing.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please extract all text from this ${mimeType} document:`
            },
            ...(mimeType === 'application/pdf' ? [{
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Content}`
              }
            }] : [])
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function parseResumeText(text: string): Promise<ResumeData> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a resume parsing specialist. Parse the provided resume text and extract structured data.
          Return a JSON object with the following structure:
          {
            "personalInfo": {
              "name": "string",
              "email": "string", 
              "phone": "string",
              "location": "string",
              "linkedin": "string"
            },
            "workExperience": [
              {
                "title": "string",
                "company": "string", 
                "startDate": "string",
                "endDate": "string",
                "description": "string",
                "technologies": ["string"]
              }
            ],
            "education": [
              {
                "degree": "string",
                "institution": "string",
                "startDate": "string", 
                "endDate": "string",
                "gpa": "string",
                "fieldOfStudy": "string"
              }
            ],
            "skills": [
              {
                "name": "string",
                "category": "string"
              }
            ],
            "projects": [
              {
                "name": "string",
                "description": "string",
                "technologies": ["string"],
                "url": "string"
              }
            ],
            "certifications": [
              {
                "name": "string", 
                "issuer": "string",
                "issueDate": "string",
                "expirationDate": "string"
              }
            ]
          }
          
          Extract as much information as possible. Use null for missing fields. For dates, try to standardize format as YYYY-MM or YYYY-MM-DD.`
        },
        {
          role: 'user',
          content: `Parse this resume text and return structured JSON data:\n\n${text}`
        }
      ],
      max_tokens: 4000,
      temperature: 0
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Error parsing JSON response:', parseError);
    console.log('Raw content:', content);
    throw new Error('Failed to parse structured data from resume');
  }
}
