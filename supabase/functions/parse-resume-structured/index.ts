
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESUME_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    personal_info: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin_url: { type: "string" },
        portfolio_url: { type: "string" }
      }
    },
    work_experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          job_title: { type: "string" },
          company_name: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          description: { type: "string" },
          technologies: { type: "array", items: { type: "string" } },
          achievements: { type: "array", items: { type: "string" } }
        }
      }
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          degree: { type: "string" },
          institution: { type: "string" },
          field_of_study: { type: "string" },
          graduation_date: { type: "string" },
          gpa: { type: "string" }
        }
      }
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          proficiency: { type: "string" }
        }
      }
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          technologies: { type: "array", items: { type: "string" } },
          url: { type: "string" },
          repository_url: { type: "string" }
        }
      }
    },
    certifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          issuer: { type: "string" },
          issue_date: { type: "string" },
          expiration_date: { type: "string" },
          credential_id: { type: "string" }
        }
      }
    }
  },
  required: []
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { versionId } = await req.json();

    if (!versionId) {
      throw new Error('Version ID is required');
    }

    console.log('Processing resume version:', versionId);

    // Get the resume version and file
    const { data: version, error: versionError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      throw new Error(`Version not found: ${versionError?.message}`);
    }

    // Update processing status
    await supabase
      .from('resume_versions')
      .update({ processing_status: 'processing' })
      .eq('id', versionId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-resumes')
      .download(version.file_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Extract text based on file type
    let extractedText = '';
    if (version.mime_type === 'application/pdf') {
      extractedText = await extractPDFText(fileData);
    } else if (version.mime_type.includes('text/')) {
      extractedText = await fileData.text();
    } else {
      throw new Error(`Unsupported file type: ${version.mime_type}`);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content could be extracted from the document');
    }

    // Parse with OpenAI function calling
    const structuredData = await parseResumeWithFunctionCalls(extractedText);

    // Store parsed entities with provenance
    await storeStructuredData(supabase, versionId, structuredData);

    // Update version status
    await supabase
      .from('resume_versions')
      .update({ 
        processing_status: 'completed',
        resume_metadata: {
          ...version.resume_metadata,
          structured_data_extracted: true,
          extraction_timestamp: new Date().toISOString()
        }
      })
      .eq('id', versionId);

    console.log('Resume parsing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Resume parsed successfully',
        entities_count: await countStoredEntities(supabase, versionId)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing resume:', error);

    // Update error status if we have versionId
    const requestBody = await req.clone().json().catch(() => ({}));
    if (requestBody.versionId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase
          .from('resume_versions')
          .update({ processing_status: 'failed' })
          .eq('id', requestBody.versionId);
      } catch (dbError) {
        console.error('Failed to update error status:', dbError);
      }
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

async function extractPDFText(fileData: Blob): Promise<string> {
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured');
  }

  let fileId: string | null = null;

  try {
    if (fileData.size > 20 * 1024 * 1024) {
      throw new Error('PDF file is too large. Please upload a smaller file (max 20MB).');
    }

    // Upload file to OpenAI Files API
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
      throw new Error(`OpenAI file upload error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const uploadData = await uploadResponse.json();
    fileId = uploadData.id;

    // Extract text using GPT-4o
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
            content: 'Extract ALL text content from the provided PDF document. Return only the extracted text without any commentary.'
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Please extract all text content from this resume PDF:' 
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
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    
    if (extractedText.trim().length < 10) {
      throw new Error('Unable to extract readable text from PDF.');
    }
    
    return extractedText;

  } finally {
    // Clean up uploaded file
    if (fileId) {
      try {
        await fetch(`https://api.openai.com/v1/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
          },
        });
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file from OpenAI:', cleanupError);
      }
    }
  }
}

async function parseResumeWithFunctionCalls(text: string): Promise<any> {
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
          content: 'You are a resume parsing specialist. Extract structured data from the provided resume text using the extract_resume_data function.'
        },
        {
          role: 'user',
          content: `Parse this resume text and extract structured data:\n\n${text}`
        }
      ],
      functions: [
        {
          name: 'extract_resume_data',
          description: 'Extract structured data from resume text',
          parameters: RESUME_EXTRACTION_SCHEMA
        }
      ],
      function_call: { name: 'extract_resume_data' },
      temperature: 0
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const functionCall = data.choices[0]?.message?.function_call;
  
  if (!functionCall || functionCall.name !== 'extract_resume_data') {
    throw new Error('Failed to get structured data from OpenAI function call');
  }

  try {
    return JSON.parse(functionCall.arguments);
  } catch (parseError) {
    console.error('Error parsing function call arguments:', parseError);
    throw new Error('Failed to parse structured data from resume');
  }
}

async function storeStructuredData(supabase: any, versionId: string, data: any): Promise<void> {
  const entities = [];

  // Helper function to add entities with flattened structure
  const addEntity = (fieldName: string, value: any, confidenceScore = 0.9) => {
    if (value === null || value === undefined) return;
    
    entities.push({
      resume_version_id: versionId,
      field_name: fieldName,
      raw_value: typeof value === 'string' ? value : JSON.stringify(value),
      confidence_score: confidenceScore,
      model_version: 'gpt-4o-mini',
      source_type: 'openai_function_call'
    });
  };

  // Process personal info
  if (data.personal_info) {
    Object.entries(data.personal_info).forEach(([key, value]) => {
      if (value) addEntity(`personal_info.${key}`, value);
    });
  }

  // Process work experience
  if (data.work_experience && Array.isArray(data.work_experience)) {
    data.work_experience.forEach((exp: any, index: number) => {
      Object.entries(exp).forEach(([key, value]) => {
        if (value) addEntity(`work_experience.${index}.${key}`, value);
      });
    });
  }

  // Process education
  if (data.education && Array.isArray(data.education)) {
    data.education.forEach((edu: any, index: number) => {
      Object.entries(edu).forEach(([key, value]) => {
        if (value) addEntity(`education.${index}.${key}`, value);
      });
    });
  }

  // Process skills
  if (data.skills && Array.isArray(data.skills)) {
    data.skills.forEach((skill: any, index: number) => {
      Object.entries(skill).forEach(([key, value]) => {
        if (value) addEntity(`skills.${index}.${key}`, value);
      });
    });
  }

  // Process projects
  if (data.projects && Array.isArray(data.projects)) {
    data.projects.forEach((project: any, index: number) => {
      Object.entries(project).forEach(([key, value]) => {
        if (value) addEntity(`projects.${index}.${key}`, value);
      });
    });
  }

  // Process certifications
  if (data.certifications && Array.isArray(data.certifications)) {
    data.certifications.forEach((cert: any, index: number) => {
      Object.entries(cert).forEach(([key, value]) => {
        if (value) addEntity(`certifications.${index}.${key}`, value);
      });
    });
  }

  // Batch insert entities
  if (entities.length > 0) {
    const { error } = await supabase
      .from('parsed_resume_entities')
      .insert(entities);

    if (error) {
      console.error('Error storing parsed entities:', error);
      throw new Error('Failed to store parsed resume entities');
    }

    console.log(`Stored ${entities.length} parsed entities`);
  }
}

async function countStoredEntities(supabase: any, versionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('parsed_resume_entities')
    .select('*', { count: 'exact', head: true })
    .eq('resume_version_id', versionId);

  if (error) {
    console.error('Error counting entities:', error);
    return 0;
  }

  return count || 0;
}
