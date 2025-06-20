
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

    // Extract text from file
    const extractedText = await extractTextFromFile(fileData, upload.mime_type);
    
    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content could be extracted from the document');
    }

    // Check if the extracted text indicates an error from OpenAI
    if (extractedText.includes("I cannot process") || 
        extractedText.includes("I'm sorry, but I cannot") ||
        extractedText.includes("Please provide the document in a different format")) {
      throw new Error('Document format not supported for text extraction. Please try converting to a different format or uploading a text-based document.');
    }
    
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
  
  if (mimeType === 'application/pdf') {
    return await extractPDFTextWithOpenAI(fileData);
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    // For Word documents, try basic text extraction
    try {
      const text = await fileData.text();
      if (text && text.trim().length > 0) {
        return text;
      } else {
        throw new Error('No readable text found in Word document');
      }
    } catch (error) {
      throw new Error('Unable to extract text from Word document: ' + error.message);
    }
  } else if (mimeType.includes('text/')) {
    // Handle plain text files
    const text = await fileData.text();
    return text;
  } else {
    throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF, Word document, or text file.`);
  }
}

async function extractPDFTextWithOpenAI(fileData: Blob): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Convert to base64 for OpenAI
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check if file is too large (limit to ~16MB for API)
    if (uint8Array.length > 16 * 1024 * 1024) {
      throw new Error('PDF file is too large. Please upload a smaller file (max 16MB).');
    }
    
    const base64 = btoa(String.fromCharCode(...uint8Array));

    // Use OpenAI's new file input API for PDFs
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
            content: 'You are a resume text extraction specialist. Extract ALL text content from the provided PDF document. Include names, contact information, work experience, education, skills, projects, certifications, and any other text. Maintain the logical structure and return only the extracted text content without any commentary or analysis.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all text content from this resume PDF:'
              },
              {
                type: 'file',
                file: {
                  data: base64,
                  filename: 'resume.pdf'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      // If the file input method fails, fall back to a text-only approach
      if (errorData.error?.code === 'invalid_request_error') {
        console.log('Falling back to text-only PDF processing...');
        return await fallbackPDFExtraction();
      }
      
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    
    // Check for common error responses from OpenAI
    if (extractedText.includes("I cannot process") || 
        extractedText.includes("I'm sorry, but I cannot") ||
        extractedText.includes("Please provide the document in a different format") ||
        extractedText.includes("I cannot read") ||
        extractedText.trim().length < 10) {
      throw new Error('Unable to extract readable text from PDF. The document may be scanned, corrupted, or in an unsupported format.');
    }
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

async function fallbackPDFExtraction(): Promise<string> {
  throw new Error('PDF text extraction is not available. Please convert your PDF to a Word document or text file, or ensure your PDF contains selectable text rather than scanned images.');
}

async function parseResumeText(text: string): Promise<ResumeData> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
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
            Return a valid JSON object with the following structure:
            {
              "personalInfo": {
                "name": "string or null",
                "email": "string or null", 
                "phone": "string or null",
                "location": "string or null",
                "linkedin": "string or null"
              },
              "workExperience": [
                {
                  "title": "string",
                  "company": "string", 
                  "startDate": "string or null",
                  "endDate": "string or null",
                  "description": "string or null",
                  "technologies": ["string"] or null
                }
              ],
              "education": [
                {
                  "degree": "string",
                  "institution": "string",
                  "startDate": "string or null", 
                  "endDate": "string or null",
                  "gpa": "string or null",
                  "fieldOfStudy": "string or null"
                }
              ],
              "skills": [
                {
                  "name": "string",
                  "category": "string or null"
                }
              ],
              "projects": [
                {
                  "name": "string",
                  "description": "string or null",
                  "technologies": ["string"] or null,
                  "url": "string or null"
                }
              ],
              "certifications": [
                {
                  "name": "string", 
                  "issuer": "string",
                  "issueDate": "string or null",
                  "expirationDate": "string or null"
                }
              ]
            }
            
            Extract as much information as possible. Use null for missing fields. For dates, standardize format as YYYY-MM or YYYY-MM-DD. Return ONLY valid JSON, no other text.`
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
      const parsed = JSON.parse(content);
      
      // Validate the parsed structure
      if (!parsed.personalInfo) parsed.personalInfo = {};
      if (!Array.isArray(parsed.workExperience)) parsed.workExperience = [];
      if (!Array.isArray(parsed.education)) parsed.education = [];
      if (!Array.isArray(parsed.skills)) parsed.skills = [];
      if (!Array.isArray(parsed.projects)) parsed.projects = [];
      if (!Array.isArray(parsed.certifications)) parsed.certifications = [];
      
      return parsed;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse structured data from resume. The AI response was not valid JSON.');
    }
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw new Error(`Failed to parse resume content: ${error.message}`);
  }
}
