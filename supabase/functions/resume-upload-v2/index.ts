
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Resume Upload V2 Starting ===');
    
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

    console.log('User authenticated:', user.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const streamName = formData.get('streamName') as string || 'Default Resume';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Unsupported file type. Please upload PDF, Word, or text files only.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return new Response(JSON.stringify({ 
        error: 'File too large. Please upload files smaller than 50MB.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create file hash for deduplication
    const fileBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('File hash generated:', fileHash);

    // Check if stream exists, create if not
    let streamId: string;
    const { data: existingStream, error: streamError } = await supabase
      .from('resume_streams')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', streamName)
      .maybeSingle();

    if (streamError) {
      console.error('Error checking for existing stream:', streamError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingStream) {
      streamId = existingStream.id;
      console.log('Using existing stream:', streamId);
    } else {
      console.log('Creating new stream:', streamName);
      const { data: newStream, error: createStreamError } = await supabase
        .from('resume_streams')
        .insert({
          user_id: user.id,
          name: streamName,
          description: `Resume stream for ${streamName}`,
          tags: [],
          auto_tagged: true
        })
        .select()
        .single();

      if (createStreamError || !newStream) {
        console.error('Error creating stream:', createStreamError);
        return new Response(JSON.stringify({ error: 'Failed to create resume stream' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      streamId = newStream.id;
      console.log('Created new stream:', streamId);
    }

    // Check for duplicate files in this stream
    const { data: existingVersion, error: duplicateError } = await supabase
      .from('resume_versions')
      .select('id, version_number')
      .eq('stream_id', streamId)
      .eq('file_hash', fileHash)
      .maybeSingle();

    if (duplicateError) {
      console.error('Error checking for duplicates:', duplicateError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingVersion) {
      console.log('Duplicate file detected, returning existing version:', existingVersion.id);
      return new Response(JSON.stringify({
        success: true,
        message: 'File already exists',
        versionId: existingVersion.id,
        isDuplicate: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get next version number
    const { data: latestVersion } = await supabase
      .from('resume_versions')
      .select('version_number')
      .eq('stream_id', streamId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;
    console.log('Next version number:', nextVersionNumber);

    // Upload file to storage
    const filePath = `${user.id}/${streamId}/v${nextVersionNumber}_${file.name}`;
    console.log('Uploading to path:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('user-resumes')
      .upload(filePath, file, {
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

    console.log('File uploaded to storage successfully');

    // Create resume version record
    const { data: versionData, error: versionError } = await supabase
      .from('resume_versions')
      .insert({
        stream_id: streamId,
        version_number: nextVersionNumber,
        file_hash: fileHash,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        upload_metadata: {
          original_name: file.name,
          upload_timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || 'unknown'
        },
        processing_status: 'pending'
      })
      .select()
      .single();

    if (versionError || !versionData) {
      console.error('Error creating version record:', versionError);
      
      // Clean up uploaded file on error
      await supabase.storage
        .from('user-resumes')
        .remove([filePath]);

      return new Response(JSON.stringify({ error: 'Failed to create version record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Version record created:', versionData.id);

    // Create a job record for timeline tracking
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        title: `Resume Processing: ${file.name}`,
        company: 'System',
        description: `Processing resume file ${file.name} through the pipeline`,
        start_date: new Date().toISOString().split('T')[0],
        tools_used: ['OpenAI', 'Supabase'],
        impact: 'Resume processing and analysis'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job record:', jobError);
    } else {
      console.log('Job record created for timeline:', jobData.id);

      // Create initial job log for upload stage
      await supabase
        .from('job_logs')
        .insert({
          job_id: jobData.id,
          stage: 'upload',
          level: 'info',
          message: `Resume file "${file.name}" uploaded successfully`,
          metadata: {
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            version_id: versionData.id,
            stream_id: streamId
          }
        });
    }

    // Trigger parsing and enrichment processes immediately in background
    console.log('Triggering fast background processing pipeline...');
    
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use background task for the entire pipeline
    EdgeRuntime.waitUntil((async () => {
      try {
        console.log('Starting parse process...');
        const parseResponse = await fetch(`${supabaseUrl}/functions/v1/parse-resume-structured`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            versionId: versionData.id
          }),
        });

        if (!parseResponse.ok) {
          console.error('Parse function failed:', await parseResponse.text());
          
          // Update processing status to failed
          await supabase
            .from('resume_versions')
            .update({ processing_status: 'failed' })
            .eq('id', versionData.id);

          // Log the error
          if (jobData) {
            await supabase
              .from('job_logs')
              .insert({
                job_id: jobData.id,
                stage: 'parse',
                level: 'error',
                message: 'Failed to start parsing process',
                metadata: { error: 'Parse function invocation failed' }
              });
          }
          return;
        }

        console.log('Parse function completed, immediately triggering AI enrichment...');
        
        // Log parsing success and start enrichment immediately
        if (jobData) {
          await supabase
            .from('job_logs')
            .insert({
              job_id: jobData.id,
              stage: 'parse',
              level: 'info',
              message: 'Resume parsing completed successfully',
              metadata: { version_id: versionData.id }
            });
        }

        // Trigger enrichment immediately - no delay
        console.log('Starting AI enrichment process immediately...');
        
        const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/enrich-resume`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            versionId: versionData.id
          }),
        });

        if (!enrichResponse.ok) {
          console.error('Enrichment function failed:', await enrichResponse.text());
          
          // Log the error
          if (jobData) {
            await supabase
              .from('job_logs')
              .insert({
                job_id: jobData.id,
                stage: 'enrich',
                level: 'error',
                message: 'Failed to start AI enrichment process',
                metadata: { error: 'Enrichment function invocation failed' }
              });
          }
        } else {
          console.log('AI enrichment started successfully');
          
          // Log enrichment start
          if (jobData) {
            await supabase
              .from('job_logs')
              .insert({
                job_id: jobData.id,
                stage: 'enrich',
                level: 'info',
                message: 'AI career enrichment started',
                metadata: { version_id: versionData.id }
              });
          }
        }

      } catch (error) {
        console.error('Error in fast background processing:', error);
        
        if (jobData) {
          await supabase
            .from('job_logs')
            .insert({
              job_id: jobData.id,
              stage: 'background',
              level: 'error',
              message: 'Fast background processing failed',
              metadata: { error: error.message }
            });
        }
      }
    })());

    console.log('=== Resume Upload V2 Complete ===');

    return new Response(JSON.stringify({
      success: true,
      message: 'Resume uploaded and fast AI processing started',
      versionId: versionData.id,
      streamId: streamId,
      jobId: jobData?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in resume-upload-v2:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
