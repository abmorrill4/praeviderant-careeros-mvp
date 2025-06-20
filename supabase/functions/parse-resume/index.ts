
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

    // Convert file to text for processing
    const extractedText = await extractTextFromFile(fileData, upload.mime_type);
    
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
    try {
      const { uploadId } = await req.json();
      if (uploadId) {
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
          .eq('id', uploadId);
      }
    } catch (dbError) {
      console.error('Failed to update error status:', dbError);
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

async function extractTextFromFile(fileData: Blob, mimeType: string): Promise<string> {
  console.log('Extracting text from file, MIME type:', mimeType);
  
  // For PDFs and Word documents, we'll use a simple text extraction approach
  // Since Deno doesn't have built-in PDF parsing, we'll rely on OpenAI to extract
  // and structure the content directly from the raw text we can extract
  
  if (mimeType === 'application/pdf') {
    // For PDFs, we'll convert to base64 and let OpenAI handle the extraction
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Use OpenAI to extract text from PDF
    return await extractTextWithOpenAI(base64, mimeType);
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    // For Word documents, try to extract what we can
    const text = await fileData.text();
    return text;
  } else {
    // Fallback to text extraction
    const text = await fileData.text();
    return text;
  }
}

async function extractTextWithOpenAI(base64Content: string, mimeType: string): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Use OpenAI's text completion API to extract content from the document
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
          content: `You are a document text extraction specialist. I will provide you with a base64-encoded ${mimeType} document. Please extract all the text content from this document and return it as plain text, maintaining the logical structure and spacing. Focus on extracting all readable text including names, contact information, work experience, education, skills, and any other relevant information.`
        },
        {
          role: 'user',
          content: `Please extract all text from this ${mimeType} document (base64 encoded): ${base64Content.substring(0, 100000)}` // Limit size to avoid token limits
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
