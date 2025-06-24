
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeStream {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  tags: string[];
  auto_tagged: boolean;
  created_at: string;
  updated_at: string;
}

interface ResumeVersion {
  id: string;
  stream_id: string;
  version_number: number;
  file_hash: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_metadata: any;
  resume_metadata: any;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Generate a simple hash for file content
async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if a resume version already exists with the same hash
async function checkDuplicateResume(
  supabase: any,
  userId: string,
  fileHash: string
): Promise<ResumeVersion | null> {
  const { data, error } = await supabase
    .from('resume_versions')
    .select(`
      *,
      resume_streams!inner(user_id)
    `)
    .eq('file_hash', fileHash)
    .eq('resume_streams.user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking for duplicate resume:', error);
    return null;
  }

  return data;
}

// Get or create a resume stream
async function getOrCreateStream(
  supabase: any,
  userId: string,
  streamName: string = 'Default Resume',
  tags: string[] = []
): Promise<ResumeStream> {
  // First try to find existing stream with the same name
  const { data: existingStream, error: findError } = await supabase
    .from('resume_streams')
    .select('*')
    .eq('user_id', userId)
    .eq('name', streamName)
    .maybeSingle();

  if (findError) {
    console.error('Error finding existing stream:', findError);
    throw new Error('Failed to check for existing resume stream');
  }

  if (existingStream) {
    return existingStream;
  }

  // Create new stream
  const { data: newStream, error: createError } = await supabase
    .from('resume_streams')
    .insert({
      user_id: userId,
      name: streamName,
      tags: tags,
      auto_tagged: tags.length === 0
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating new stream:', createError);
    throw new Error('Failed to create resume stream');
  }

  return newStream;
}

// Get the next version number for a stream
async function getNextVersionNumber(
  supabase: any,
  streamId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('resume_versions')
    .select('version_number')
    .eq('stream_id', streamId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error getting latest version:', error);
    return 1;
  }

  return data ? data.version_number + 1 : 1;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const streamName = formData.get('streamName') as string || 'Default Resume';
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? JSON.parse(tagsString) : [];

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file type. Please upload a PDF, Word document, or text file.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        error: 'File too large. Please upload a file smaller than 50MB.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file upload:', file.name);

    // Generate file hash
    const fileHash = await generateFileHash(file);
    console.log('Generated file hash:', fileHash);

    // Check for duplicate
    const existingVersion = await checkDuplicateResume(supabase, user.id, fileHash);
    if (existingVersion) {
      console.log('Duplicate resume detected');
      return new Response(JSON.stringify({
        success: true,
        isDuplicate: true,
        message: 'This resume has already been uploaded',
        existingVersion: existingVersion
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create stream
    const stream = await getOrCreateStream(supabase, user.id, streamName, tags);
    console.log('Using stream:', stream.id);

    // Get next version number
    const versionNumber = await getNextVersionNumber(supabase, stream.id);
    console.log('Version number:', versionNumber);

    // Create file path
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/stream-${stream.id}/v${versionNumber}-${Date.now()}.${fileExtension}`;
    console.log('File path:', fileName);

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-resumes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File uploaded to storage:', uploadData.path);

    // Create resume version record
    const { data: versionData, error: versionError } = await supabase
      .from('resume_versions')
      .insert({
        stream_id: stream.id,
        version_number: versionNumber,
        file_hash: fileHash,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        upload_metadata: {
          original_name: file.name,
          uploaded_at: new Date().toISOString(),
          user_agent: req.headers.get('user-agent')
        },
        processing_status: 'pending'
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error creating version record:', versionError);
      
      // Clean up uploaded file
      await supabase.storage
        .from('user-resumes')
        .remove([fileName]);

      return new Response(JSON.stringify({ 
        error: 'Failed to create version record',
        details: versionError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Resume version created:', versionData.id);

    return new Response(JSON.stringify({
      success: true,
      isDuplicate: false,
      stream: stream,
      version: versionData,
      message: 'Resume uploaded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in resume upload function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
