
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { operation, ...params } = await req.json()
    console.log('Operation:', operation, 'User:', user.id)

    switch (operation) {
      case 'get_user_resume_streams': {
        const { data: streams, error } = await supabase
          .from('resume_streams')
          .select(`
            *,
            resume_versions (
              id,
              version_number,
              file_name,
              file_size,
              processing_status,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching streams:', error)
          throw error
        }

        return new Response(
          JSON.stringify(streams || []),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_stream_versions': {
        const { stream_id } = params
        
        const { data: versions, error } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('stream_id', stream_id)
          .order('version_number', { ascending: false })

        if (error) {
          console.error('Error fetching versions:', error)
          throw error
        }

        return new Response(
          JSON.stringify(versions || []),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_resume_stream': {
        const { name, description, tags } = params
        
        const { data: stream, error } = await supabase
          .from('resume_streams')
          .insert({
            user_id: user.id,
            name,
            description,
            tags: tags || [],
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating stream:', error)
          throw error
        }

        return new Response(
          JSON.stringify(stream),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_resume_stream': {
        const { stream_id, name, description, tags } = params
        
        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (description !== undefined) updates.description = description
        if (tags !== undefined) updates.tags = tags

        const { data: stream, error } = await supabase
          .from('resume_streams')
          .update(updates)
          .eq('id', stream_id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating stream:', error)
          throw error
        }

        return new Response(
          JSON.stringify(stream),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'delete_all_user_streams': {
        console.log('Deleting all streams for user:', user.id)
        
        // Get all streams for the user
        const { data: streams, error: streamsError } = await supabase
          .from('resume_streams')
          .select('id')
          .eq('user_id', user.id)

        if (streamsError) {
          console.error('Error fetching streams for deletion:', streamsError)
          throw streamsError
        }

        if (!streams || streams.length === 0) {
          return new Response(
            JSON.stringify({ message: 'No streams to delete', deleted_count: 0 }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const streamIds = streams.map(s => s.id)
        console.log('Deleting streams:', streamIds)

        // Delete all resume versions first (due to foreign key constraints)
        const { error: versionsError } = await supabase
          .from('resume_versions')
          .delete()
          .in('stream_id', streamIds)

        if (versionsError) {
          console.error('Error deleting resume versions:', versionsError)
          throw versionsError
        }

        // Delete all parsed resume entities for these versions
        const { error: entitiesError } = await supabase
          .from('parsed_resume_entities')
          .delete()
          .in('resume_version_id', (
            await supabase
              .from('resume_versions')
              .select('id')
              .in('stream_id', streamIds)
          ).data?.map(v => v.id) || [])

        // Note: We don't throw on entities error as the versions might already be deleted

        // Delete all streams
        const { error: streamsDeleteError } = await supabase
          .from('resume_streams')
          .delete()
          .eq('user_id', user.id)

        if (streamsDeleteError) {
          console.error('Error deleting streams:', streamsDeleteError)
          throw streamsDeleteError
        }

        return new Response(
          JSON.stringify({ 
            message: 'All resume data deleted successfully', 
            deleted_streams: streams.length 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
