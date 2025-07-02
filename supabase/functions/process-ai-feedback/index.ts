import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { feedbackId } = await req.json()

    if (!feedbackId) {
      return new Response(
        JSON.stringify({ error: 'Feedback ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the feedback record
    const { data: feedback, error: fetchError } = await supabaseClient
      .from('ai_insights_feedback')
      .select('*')
      .eq('id', feedbackId)
      .single()

    if (fetchError || !feedback) {
      return new Response(
        JSON.stringify({ error: 'Feedback not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Update status to processing
    await supabaseClient
      .from('ai_insights_feedback')
      .update({ status: 'processing' })
      .eq('id', feedbackId)

    // Here you would implement the actual AI processing logic
    // For now, we'll simulate processing and mark as processed
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In a real implementation, you would:
    // 1. Get the original insight data
    // 2. Combine it with the user feedback
    // 3. Call OpenAI/LLM to regenerate improved insight
    // 4. Update the original insight record with improved version
    // 5. Mark feedback as processed

    // For now, just mark as processed
    const { error: updateError } = await supabaseClient
      .from('ai_insights_feedback')
      .update({ 
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', feedbackId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Feedback processed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing feedback:', error)
    
    // Update status to failed if we have the feedbackId
    try {
      const { feedbackId } = await req.json()
      if (feedbackId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        await supabaseClient
          .from('ai_insights_feedback')
          .update({ status: 'failed' })
          .eq('id', feedbackId)
      }
    } catch (e) {
      console.error('Error updating failed status:', e)
    }

    return new Response(
      JSON.stringify({ error: 'Failed to process feedback' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})