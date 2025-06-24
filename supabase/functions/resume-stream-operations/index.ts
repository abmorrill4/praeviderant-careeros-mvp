
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

    const { method, operation, ...params } = await req.json();

    let result;
    let error;

    switch (operation) {
      case 'get_user_resume_streams':
        ({ data: result, error } = await supabase
          .from('resume_streams')
          .select(`
            *,
            resume_versions (
              id,
              version_number,
              file_name,
              file_size,
              mime_type,
              processing_status,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }));
        break;

      case 'get_stream_versions':
        ({ data: result, error } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('stream_id', params.stream_id)
          .order('version_number', { ascending: false }));
        break;

      case 'create_resume_stream':
        ({ data: result, error } = await supabase
          .from('resume_streams')
          .insert({
            user_id: user.id,
            name: params.name,
            description: params.description,
            tags: params.tags || [],
            auto_tagged: (params.tags || []).length === 0
          })
          .select()
          .single());
        break;

      case 'update_resume_stream':
        const updates: any = {};
        if (params.name !== undefined) updates.name = params.name;
        if (params.description !== undefined) updates.description = params.description;
        if (params.tags !== undefined) updates.tags = params.tags;

        ({ data: result, error } = await supabase
          .from('resume_streams')
          .update(updates)
          .eq('id', params.stream_id)
          .select()
          .single());
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (error) {
      console.error('Database operation error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in resume stream operations function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
