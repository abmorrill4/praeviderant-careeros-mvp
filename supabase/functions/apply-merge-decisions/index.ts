
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { versionId, applyAll = false } = await req.json()

    if (!versionId) {
      throw new Error('Version ID is required')
    }

    console.log(`Starting merge decision application for version ${versionId}, user ${user.id}`)

    // Get all merge decisions for this version
    const { data: decisions, error: decisionsError } = await supabaseClient
      .from('merge_decisions')
      .select('*')
      .eq('resume_version_id', versionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (decisionsError) {
      console.error('Error fetching merge decisions:', decisionsError)
      throw decisionsError
    }

    if (!decisions || decisions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No merge decisions found',
          applied: 0,
          rejected: 0,
          overridden: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    let appliedCount = 0
    let rejectedCount = 0
    let overriddenCount = 0
    const results = []

    // Process each decision in a transaction-like manner
    for (const decision of decisions) {
      try {
        console.log(`Processing decision ${decision.id} for field ${decision.field_name}`)

        if (decision.decision_type === 'accept') {
          // Update user_confirmed_profile with parsed value
          const { data: confirmedData, error: confirmError } = await supabaseClient
            .from('user_confirmed_profile')
            .upsert({
              user_id: user.id,
              entity_type: decision.profile_entity_type || 'unknown',
              entity_id: decision.profile_entity_id || decision.parsed_entity_id,
              field_name: decision.field_name,
              confirmed_value: decision.parsed_value,
              confidence_score: decision.confidence_score,
              source: 'merge_review_accepted',
              last_confirmed_at: new Date().toISOString()
            })
            .select()
            .single()

          if (confirmError) {
            console.error(`Error updating confirmed profile for decision ${decision.id}:`, confirmError)
            results.push({
              decision_id: decision.id,
              field_name: decision.field_name,
              status: 'error',
              error: confirmError.message
            })
            continue
          }

          appliedCount++
          results.push({
            decision_id: decision.id,
            field_name: decision.field_name,
            status: 'accepted',
            applied_value: decision.parsed_value
          })

          console.log(`Accepted field ${decision.field_name} with value: ${decision.parsed_value}`)

        } else if (decision.decision_type === 'override') {
          // Update user_confirmed_profile with override value
          const { data: confirmedData, error: confirmError } = await supabaseClient
            .from('user_confirmed_profile')
            .upsert({
              user_id: user.id,
              entity_type: decision.profile_entity_type || 'unknown',
              entity_id: decision.profile_entity_id || decision.parsed_entity_id,
              field_name: decision.field_name,
              confirmed_value: decision.override_value || decision.parsed_value,
              confidence_score: 1.0, // User override has highest confidence
              source: 'merge_review_override',
              last_confirmed_at: new Date().toISOString()
            })
            .select()
            .single()

          if (confirmError) {
            console.error(`Error updating confirmed profile for override ${decision.id}:`, confirmError)
            results.push({
              decision_id: decision.id,
              field_name: decision.field_name,
              status: 'error',
              error: confirmError.message
            })
            continue
          }

          overriddenCount++
          results.push({
            decision_id: decision.id,
            field_name: decision.field_name,
            status: 'overridden',
            applied_value: decision.override_value || decision.parsed_value
          })

          console.log(`Override field ${decision.field_name} with value: ${decision.override_value || decision.parsed_value}`)

        } else if (decision.decision_type === 'reject') {
          // Mark as rejected - no profile update needed
          rejectedCount++
          results.push({
            decision_id: decision.id,
            field_name: decision.field_name,
            status: 'rejected',
            reason: decision.justification || 'User rejected parsed value'
          })

          console.log(`Rejected field ${decision.field_name}`)
        }

        // Mark the corresponding resume_diff as resolved
        if (decision.parsed_entity_id) {
          const { error: diffUpdateError } = await supabaseClient
            .from('resume_diffs')
            .update({
              requires_review: false,
              metadata: {
                ...(decision.parsed_entity_id ? {} : {}), // Keep existing metadata
                resolved_at: new Date().toISOString(),
                resolved_by: user.id,
                resolution_type: decision.decision_type,
                merge_decision_id: decision.id
              }
            })
            .eq('parsed_entity_id', decision.parsed_entity_id)
            .eq('resume_version_id', versionId)

          if (diffUpdateError) {
            console.error(`Error updating resume diff for decision ${decision.id}:`, diffUpdateError)
          } else {
            console.log(`Marked resume diff as resolved for entity ${decision.parsed_entity_id}`)
          }
        }

      } catch (decisionError) {
        console.error(`Error processing decision ${decision.id}:`, decisionError)
        results.push({
          decision_id: decision.id,
          field_name: decision.field_name,
          status: 'error',
          error: decisionError instanceof Error ? decisionError.message : 'Unknown error'
        })
      }
    }

    const summary = {
      total_decisions: decisions.length,
      applied: appliedCount,
      rejected: rejectedCount,
      overridden: overriddenCount,
      errors: results.filter(r => r.status === 'error').length,
      results: results
    }

    console.log('Merge decisions application completed:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in apply-merge-decisions:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
