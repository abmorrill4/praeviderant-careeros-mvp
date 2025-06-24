
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

// Simple hash generation using Web Crypto API
async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing resume upload request...');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const streamName = (formData.get('streamName') as string) || 'Default Resume';
    const tagsString = formData.get('tags') as string;
    
    let tags: string[] = [];
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString);
      } catch (e) {
        console.error('Failed to parse tags:', e);
        tags = [];
      }
    }

    if (!file) {
      console.error('No file provided');
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return new Response(JSON.stringify({ 
        error: 'Invalid file type. Please upload a PDF, Word document, or text file.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return new Response(JSON.stringify({ 
        error: 'File too large. Please upload a file smaller than 50MB.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate file hash for duplicate detection
    console.log('Generating file hash...');
    const fileHash = await generateFileHash(file);
    console.log('File hash generated:', fileHash);

    // Check for existing resume with same hash
    const { data: existingVersion, error: duplicateError } = await supabase
      .from('resume_versions')
      .select(`
        *,
        resume_streams!inner(user_id)
      `)
      .eq('file_hash', fileHash)
      .eq('resume_streams.user_id', user.id)
      .maybeSingle();

    if (duplicateError) {
      console.error('Error checking for duplicates:', duplicateError);
    }

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

    // Find or create resume stream
    console.log('Finding or creating resume stream:', streamName);
    let { data: stream, error: streamError } = await supabase
      .from('resume_streams')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', streamName)
      .maybeSingle();

    if (streamError) {
      console.error('Error finding stream:', streamError);
    }

    if (!stream) {
      console.log('Creating new resume stream');
      const { data: newStream, error: createError } = await supabase
        .from('resume_streams')
        .insert({
          user_id: user.id,
          name: streamName,
          tags: tags,
          auto_tagged: tags.length === 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating stream:', createError);
        return new Response(JSON.stringify({ 
          error: 'Failed to create resume stream',
          details: createError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      stream = newStream;
    }

    console.log('Using stream:', stream.id);

    // Get next version number
    const { data: latestVersion, error: versionError } = await supabase
      .from('resume_versions')
      .select('version_number')
      .eq('stream_id', stream.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (versionError) {
      console.error('Error getting latest version:', versionError);
    }

    const nextVersion = latestVersion ? latestVersion.version_number + 1 : 1;
    console.log('Next version number:', nextVersion);

    // Create file path for storage
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = `${user.id}/stream-${stream.id}/v${nextVersion}-${Date.now()}.${fileExtension}`;
    console.log('Upload path:', fileName);

    // Upload file to storage
    console.log('Uploading file to storage...');
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

    console.log('File uploaded successfully:', uploadData.path);

    // Create resume version record
    console.log('Creating resume version record...');
    const { data: versionData, error: versionCreateError } = await supabase
      .from('resume_versions')
      .insert({
        stream_id: stream.id,
        version_number: nextVersion,
        file_hash: fileHash,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        upload_metadata: {
          original_name: file.name,
          uploaded_at: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || 'unknown'
        },
        processing_status: 'pending',
        resume_metadata: {}
      })
      .select()
      .single();

    if (versionCreateError) {
      console.error('Error creating version record:', versionCreateError);
      
      // Clean up uploaded file on error
      await supabase.storage
        .from('user-resumes')
        .remove([fileName]);

      return new Response(JSON.stringify({ 
        error: 'Failed to create version record',
        details: versionCreateError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Resume version created successfully:', versionData.id);

    // Return success response
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
    console.error('Unexpected error in resume upload:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
