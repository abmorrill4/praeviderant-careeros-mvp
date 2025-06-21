
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

  let uploadId: string;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    uploadId = requestBody.uploadId;

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

    // Check if already processing or completed to prevent duplicate processing
    if (upload.parsing_status === 'processing') {
      // Check if it's been processing for more than 5 minutes (stuck)
      const processingTime = new Date().getTime() - new Date(upload.updated_at).getTime();
      if (processingTime < 5 * 60 * 1000) { // Less than 5 minutes
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Upload is already being processed. Please wait.' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409 
          }
        );
      }
      console.log('Upload stuck in processing state, continuing...');
    }

    if (upload.parsing_status === 'completed') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Resume already parsed',
          structuredData: upload.structured_data 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
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

    // Check if the extracted text indicates an error from processing
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

  let fileId: string | null = null;

  try {
    // Check if file is too large (OpenAI limit is 512MB, but we'll use 20MB as practical limit)
    if (fileData.size > 20 * 1024 * 1024) {
      throw new Error('PDF file is too large. Please upload a smaller file (max 20MB).');
    }

    console.log('Uploading PDF to OpenAI Files API');

    // Step 1: Upload file to OpenAI Files API
    const formData = new FormData();
    formData.append('file', fileData, 'resume.pdf');
    formData.append('purpose', 'assistants');

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('OpenAI file upload error:', errorData);
      throw new Error(`OpenAI file upload error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const uploadData = await uploadResponse.json();
    fileId = uploadData.id;

    console.log('File uploaded to OpenAI with ID:', fileId);

    // Step 2: Use the file with chat completions to extract text
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
                text: 'Please extract all text content from this resume PDF. Return only the text content, maintaining the structure but without any analysis or commentary:' 
              },
              { 
                type: 'file_id', 
                file_id: fileId 
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
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    
    // Check for common error responses from OpenAI
    if (extractedText.includes("I cannot process") || 
        extractedText.includes("I'm sorry, but I cannot") ||
        extractedText.includes("Unable to extract text") ||
        extractedText.includes("cannot read") ||
        extractedText.trim().length < 10) {
      throw new Error('Unable to extract readable text from PDF. The document may be scanned, corrupted, or in an unsupported format. Please try converting to a Word document or text file.');
    }
    
    console.log('Successfully extracted text from PDF using OpenAI Files API');
    return extractedText;

  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  } finally {
    // Clean up: Delete the uploaded file from OpenAI
    if (fileId) {
      try {
        await fetch(`https://api.openai.com/v1/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
          },
        });
        console.log('Cleaned up uploaded file from OpenAI:', fileId);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file from OpenAI:', cleanupError);
        // Don't throw here as the main operation succeeded
      }
    }
  }
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
