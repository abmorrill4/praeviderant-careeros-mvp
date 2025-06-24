
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParseRequest {
  versionId: string;
}

// Extract text from PDF using OpenAI Assistant API
async function extractPDFTextWithOpenAI(fileBuffer: ArrayBuffer): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  let uploadedFileId: string | null = null;
  let assistantId: string | null = null;
  let threadId: string | null = null;

  try {
    // Check if file is too large (OpenAI limit is 512MB, but we'll use reasonable limit)
    if (fileBuffer.byteLength > 50 * 1024 * 1024) {
      throw new Error('PDF file is too large. Please upload a smaller file (max 50MB).');
    }

    console.log('Uploading PDF to OpenAI Files API');

    // Convert ArrayBuffer to File
    const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });

    // Step 1: Upload file to OpenAI Files API
    const formData = new FormData();
    formData.append('file', fileBlob, 'resume.pdf');
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
    uploadedFileId = uploadData.id;

    console.log('File uploaded to OpenAI with ID:', uploadedFileId);

    // Step 2: Create an assistant for text extraction
    const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        name: 'Resume Text Extractor',
        instructions: 'You are a resume text extraction specialist. Extract ALL text content from the provided PDF document. Include names, contact information, work experience, education, skills, projects, certifications, and any other text. Maintain the logical structure and return only the extracted text content without any commentary or analysis.',
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }],
      }),
    });

    if (!assistantResponse.ok) {
      const errorData = await assistantResponse.json();
      console.error('Assistant creation error:', errorData);
      throw new Error(`Assistant creation error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const assistantData = await assistantResponse.json();
    assistantId = assistantData.id;

    console.log('Assistant created with ID:', assistantId);

    // Step 3: Create a thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorData = await threadResponse.json();
      console.error('Thread creation error:', errorData);
      throw new Error(`Thread creation error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const threadData = await threadResponse.json();
    threadId = threadData.id;

    console.log('Thread created with ID:', threadId);

    // Step 4: Add message to thread with file attachment
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: 'Please extract all text content from this resume PDF. Return only the text content, maintaining the structure but without any analysis or commentary.',
        attachments: [
          {
            file_id: uploadedFileId,
            tools: [{ type: 'file_search' }],
          },
        ],
      }),
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json();
      console.error('Message creation error:', errorData);
      throw new Error(`Message creation error: ${errorData.error?.message || 'Unknown error'}`);
    }

    // Step 5: Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    });

    if (!runResponse.ok) {
      const errorData = await runResponse.json();
      console.error('Run creation error:', errorData);
      throw new Error(`Run creation error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    console.log('Run created with ID:', runId);

    // Step 6: Poll for completion
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log('Run status:', runStatus);
      }
      
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Run did not complete successfully. Status: ${runStatus}`);
    }

    // Step 7: Retrieve messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json();
      console.error('Messages retrieval error:', errorData);
      throw new Error(`Messages retrieval error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const messagesData = await messagesResponse.json();
    const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No response from assistant');
    }

    const extractedText = assistantMessages[0].content[0]?.text?.value || '';
    
    // Check for common error responses from OpenAI
    if (extractedText.includes("I cannot process") || 
        extractedText.includes("I'm sorry, but I cannot") ||
        extractedText.includes("Unable to extract text") ||
        extractedText.includes("cannot read") ||
        extractedText.trim().length < 10) {
      throw new Error('Unable to extract readable text from PDF. The document may be scanned, corrupted, or in an unsupported format. Please try converting to a Word document or text file.');
    }
    
    console.log('Successfully extracted text from PDF using OpenAI Assistants API');
    return extractedText;

  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  } finally {
    // Clean up: Delete the uploaded file, assistant, and thread from OpenAI
    if (uploadedFileId) {
      try {
        await fetch(`https://api.openai.com/v1/files/${uploadedFileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
          },
        });
        console.log('Cleaned up uploaded file from OpenAI:', uploadedFileId);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file from OpenAI:', cleanupError);
      }
    }

    if (assistantId) {
      try {
        await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        });
        console.log('Cleaned up assistant from OpenAI:', assistantId);
      } catch (cleanupError) {
        console.warn('Failed to cleanup assistant from OpenAI:', cleanupError);
      }
    }

    if (threadId) {
      try {
        await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        });
        console.log('Cleaned up thread from OpenAI:', threadId);
      } catch (cleanupError) {
        console.warn('Failed to cleanup thread from OpenAI:', cleanupError);
      }
    }
  }
}

// Extract text from different file types
async function extractTextFromFile(fileBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'text/plain':
        return new TextDecoder().decode(fileBuffer);
      
      case 'application/pdf':
        return await extractPDFTextWithOpenAI(fileBuffer);
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // For Word docs, we'll do basic text extraction
        const docText = new TextDecoder().decode(fileBuffer);
        const readableText = docText.match(/[a-zA-Z\s\.\,\;\:\!\?]+/g);
        return readableText ? readableText.join(' ').substring(0, 10000) : '';
      
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text from ${mimeType} file: ${error.message}`);
  }
}

// Parse resume using OpenAI
async function parseResumeWithOpenAI(extractedText: string): Promise<any> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
Parse the following resume text and extract structured information. Return a JSON object with the following structure:

{
  "personal_info": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, state/country"
  },
  "summary": "Professional summary or objective",
  "work_experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY or Present",
      "description": "Job description and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree Type",
      "institution": "Institution Name",
      "field_of_study": "Field of Study",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "gpa": "GPA if mentioned"
    }
  ],
  "skills": [
    {
      "name": "Skill Name",
      "category": "Technical/Soft/Language/etc",
      "proficiency_level": "Beginner/Intermediate/Advanced/Expert"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies_used": ["tech1", "tech2"],
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuing_organization": "Organization",
      "issue_date": "YYYY-MM",
      "expiration_date": "YYYY-MM or null"
    }
  ]
}

Only include sections that have actual data. If a section is empty or not found, omit it from the response.

Resume text:
${extractedText}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a resume parsing expert. Extract structured information from resume text and return valid JSON only. Do not include any explanatory text, just the JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Store parsed entities
async function storeParsedEntities(supabase: any, versionId: string, parsedData: any, userId: string): Promise<number> {
  let entityCount = 0;
  const entities = [];

  // Process personal info
  if (parsedData.personal_info) {
    const personalInfo = parsedData.personal_info;
    if (personalInfo.name) {
      entities.push({
        resume_version_id: versionId,
        field_name: 'name',
        raw_value: personalInfo.name,
        confidence_score: 0.9,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    }
    if (personalInfo.email) {
      entities.push({
        resume_version_id: versionId,
        field_name: 'email',
        raw_value: personalInfo.email,
        confidence_score: 0.95,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    }
    if (personalInfo.phone) {
      entities.push({
        resume_version_id: versionId,
        field_name: 'phone',
        raw_value: personalInfo.phone,
        confidence_score: 0.9,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    }
    if (personalInfo.location) {
      entities.push({
        resume_version_id: versionId,
        field_name: 'location',
        raw_value: personalInfo.location,
        confidence_score: 0.85,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    }
  }

  // Process summary
  if (parsedData.summary) {
    entities.push({
      resume_version_id: versionId,
      field_name: 'summary',
      raw_value: parsedData.summary,
      confidence_score: 0.8,
      model_version: 'gpt-4o-mini',
      source_type: 'ai_extraction'
    });
  }

  // Process work experience
  if (parsedData.work_experience && Array.isArray(parsedData.work_experience)) {
    parsedData.work_experience.forEach((job: any, index: number) => {
      entities.push({
        resume_version_id: versionId,
        field_name: `work_experience_${index}`,
        raw_value: JSON.stringify(job),
        confidence_score: 0.85,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    });
  }

  // Process education
  if (parsedData.education && Array.isArray(parsedData.education)) {
    parsedData.education.forEach((edu: any, index: number) => {
      entities.push({
        resume_version_id: versionId,
        field_name: `education_${index}`,
        raw_value: JSON.stringify(edu),
        confidence_score: 0.85,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    });
  }

  // Process skills
  if (parsedData.skills && Array.isArray(parsedData.skills)) {
    parsedData.skills.forEach((skill: any, index: number) => {
      entities.push({
        resume_version_id: versionId,
        field_name: `skill_${index}`,
        raw_value: JSON.stringify(skill),
        confidence_score: 0.8,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    });
  }

  // Process projects
  if (parsedData.projects && Array.isArray(parsedData.projects)) {
    parsedData.projects.forEach((project: any, index: number) => {
      entities.push({
        resume_version_id: versionId,
        field_name: `project_${index}`,
        raw_value: JSON.stringify(project),
        confidence_score: 0.8,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    });
  }

  // Process certifications
  if (parsedData.certifications && Array.isArray(parsedData.certifications)) {
    parsedData.certifications.forEach((cert: any, index: number) => {
      entities.push({
        resume_version_id: versionId,
        field_name: `certification_${index}`,
        raw_value: JSON.stringify(cert),
        confidence_score: 0.85,
        model_version: 'gpt-4o-mini',
        source_type: 'ai_extraction'
      });
    });
  }

  // Insert all entities
  if (entities.length > 0) {
    const { error } = await supabase
      .from('parsed_resume_entities')
      .insert(entities);

    if (error) {
      console.error('Error inserting parsed entities:', error);
      throw error;
    }

    entityCount = entities.length;
  }

  return entityCount;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Parse Resume Structured Starting ===');
    const { versionId }: ParseRequest = await req.json();

    if (!versionId) {
      return new Response(JSON.stringify({ error: 'Version ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing version ID:', versionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get resume version details
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select(`
        *,
        resume_streams!inner(user_id)
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

    console.log('Found version:', version.file_name, 'Type:', version.mime_type);

    // Update processing status to processing
    await supabase
      .from('resume_versions')
      .update({ processing_status: 'processing' })
      .eq('id', versionId);

    try {
      // Download file from storage
      console.log('Downloading file from storage:', version.file_path);
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-resumes')
        .download(version.file_path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`);
      }

      console.log('File downloaded, size:', fileData.size);

      // Convert to ArrayBuffer
      const fileBuffer = await fileData.arrayBuffer();

      // Extract text from file
      console.log('Extracting text from file...');
      const extractedText = await extractTextFromFile(fileBuffer, version.mime_type);

      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the file');
      }

      console.log('Extracted text length:', extractedText.length);

      // Parse with OpenAI
      console.log('Parsing with OpenAI...');
      const parsedData = await parseResumeWithOpenAI(extractedText);

      // Store parsed entities
      console.log('Storing parsed entities...');
      const entityCount = await storeParsedEntities(
        supabase, 
        versionId, 
        parsedData, 
        version.resume_streams.user_id
      );

      // Update resume version with parsed data and status
      await supabase
        .from('resume_versions')
        .update({
          processing_status: 'completed',
          resume_metadata: {
            ...version.resume_metadata,
            parsed_data: parsedData,
            processing_completed_at: new Date().toISOString(),
            entities_extracted: entityCount
          }
        })
        .eq('id', versionId);

      console.log('Processing completed successfully');

      return new Response(JSON.stringify({
        success: true,
        message: 'Resume parsed successfully',
        entities_count: entityCount,
        parsed_data: parsedData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      // Update status to failed
      await supabase
        .from('resume_versions')
        .update({ 
          processing_status: 'failed',
          resume_metadata: {
            ...version.resume_metadata,
            error_message: processingError.message,
            processing_failed_at: new Date().toISOString()
          }
        })
        .eq('id', versionId);

      throw processingError;
    }

  } catch (error) {
    console.error('Error in parse-resume-structured:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
