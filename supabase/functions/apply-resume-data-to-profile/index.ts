
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

    const { versionId } = await req.json()

    if (!versionId) {
      throw new Error('Version ID is required')
    }

    console.log(`Starting resume data application for version ${versionId}, user ${user.id}`)

    // Get all parsed resume entities for this version
    const { data: parsedEntities, error: entitiesError } = await supabaseClient
      .from('parsed_resume_entities')
      .select('*')
      .eq('resume_version_id', versionId)
      .order('created_at', { ascending: true })

    if (entitiesError) {
      console.error('Error fetching parsed entities:', entitiesError)
      throw entitiesError
    }

    if (!parsedEntities || parsedEntities.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No parsed entities found',
          entitiesCreated: 0,
          entitiesUpdated: 0,
          errors: 0,
          results: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    let entitiesCreated = 0
    let entitiesUpdated = 0
    let errors = 0
    const results = []

    // Helper function to safely parse JSON
    const safeJsonParse = (value: string) => {
      try {
        return JSON.parse(value)
      } catch {
        return { value: value, type: 'text' }
      }
    }

    // Helper function to extract string value safely
    const extractStringValue = (data: any, fallback: string = '') => {
      if (typeof data === 'string') return data
      if (data && typeof data.value === 'string') return data.value
      if (data && typeof data === 'object') {
        // Try common field names
        for (const key of ['name', 'title', 'value', 'text']) {
          if (data[key] && typeof data[key] === 'string') return data[key]
        }
      }
      return fallback
    }

    // Process each parsed entity
    for (const entity of parsedEntities) {
      try {
        console.log(`Processing entity ${entity.id} - ${entity.field_name}`)

        const parsedData = safeJsonParse(entity.raw_value)
        const fieldName = entity.field_name.toLowerCase()

        if (fieldName.includes('work') || fieldName.includes('experience') || fieldName.includes('job')) {
          // Handle work experience
          const entityData = {
            user_id: user.id,
            company: extractStringValue(parsedData?.value?.company || parsedData?.value?.employer, 'Unknown Company'),
            title: extractStringValue(parsedData?.value?.title || parsedData?.value?.position || parsedData?.value?.role, 'Unknown Title'),
            start_date: extractStringValue(parsedData?.value?.start_date),
            end_date: extractStringValue(parsedData?.value?.end_date),
            description: extractStringValue(parsedData?.value?.description || 
              (Array.isArray(parsedData?.value?.responsibilities) ? parsedData.value.responsibilities.join('\n') : '')),
            source: 'resume_upload',
            source_confidence: entity.confidence_score || 0.8
          }

          const { data: insertResult, error: insertError } = await supabaseClient
            .from('work_experience')
            .insert([entityData])
            .select()
            .single()

          if (insertError) {
            console.error(`Error inserting work experience:`, insertError)
            errors++
            results.push({
              entity_type: 'work_experience',
              action: 'error',
              error: insertError.message
            })
          } else {
            entitiesCreated++
            results.push({
              entity_type: 'work_experience',
              action: 'created',
              entity_id: insertResult.logical_entity_id
            })
            console.log(`Created work experience: ${insertResult.logical_entity_id}`)
          }

        } else if (fieldName.includes('education') || fieldName.includes('degree')) {
          // Handle education
          const entityData = {
            user_id: user.id,
            institution: extractStringValue(parsedData?.value?.institution || parsedData?.value?.school || parsedData?.value?.university, 'Unknown Institution'),
            degree: extractStringValue(parsedData?.value?.degree || parsedData?.value?.program || parsedData?.value?.field_of_study, 'Unknown Degree'),
            field_of_study: extractStringValue(parsedData?.value?.field_of_study || parsedData?.value?.major),
            start_date: extractStringValue(parsedData?.value?.start_date),
            end_date: extractStringValue(parsedData?.value?.end_date || parsedData?.value?.graduation_date),
            gpa: extractStringValue(parsedData?.value?.gpa),
            description: extractStringValue(parsedData?.value?.description),
            source: 'resume_upload',
            source_confidence: entity.confidence_score || 0.8
          }

          const { data: insertResult, error: insertError } = await supabaseClient
            .from('education')
            .insert([entityData])
            .select()
            .single()

          if (insertError) {
            console.error(`Error inserting education:`, insertError)
            errors++
            results.push({
              entity_type: 'education',
              action: 'error',
              error: insertError.message
            })
          } else {
            entitiesCreated++
            results.push({
              entity_type: 'education',
              action: 'created',
              entity_id: insertResult.logical_entity_id
            })
            console.log(`Created education: ${insertResult.logical_entity_id}`)
          }

        } else if (fieldName.includes('skill')) {
          // Handle skills (can be array or single)
          if (parsedData.type === 'array' && Array.isArray(parsedData.value)) {
            // Handle multiple skills
            for (const skillItem of parsedData.value) {
              const skillData = {
                user_id: user.id,
                name: extractStringValue(skillItem, 'Unknown Skill'),
                category: typeof skillItem === 'object' ? extractStringValue(skillItem.category) : null,
                proficiency_level: typeof skillItem === 'object' ? extractStringValue(skillItem.level || skillItem.proficiency) : null,
                years_of_experience: typeof skillItem === 'object' && skillItem.years_experience ? parseInt(skillItem.years_experience) || null : null,
                source: 'resume_upload',
                source_confidence: entity.confidence_score || 0.8
              }

              const { data: skillResult, error: skillError } = await supabaseClient
                .from('skill')
                .insert([skillData])
                .select()
                .single()

              if (skillError) {
                console.error(`Error inserting skill:`, skillError)
                errors++
                results.push({
                  entity_type: 'skill',
                  action: 'error',
                  error: skillError.message
                })
              } else {
                entitiesCreated++
                results.push({
                  entity_type: 'skill',
                  action: 'created',
                  entity_id: skillResult.logical_entity_id
                })
              }
            }
          } else {
            // Handle single skill
            const skillData = {
              user_id: user.id,
              name: extractStringValue(parsedData?.value?.name || parsedData?.value?.skill || parsedData?.value, 'Unknown Skill'),
              category: extractStringValue(parsedData?.value?.category),
              proficiency_level: extractStringValue(parsedData?.value?.level || parsedData?.value?.proficiency),
              years_of_experience: parsedData?.value?.years_experience ? parseInt(parsedData.value.years_experience) || null : null,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8
            }

            const { data: insertResult, error: insertError } = await supabaseClient
              .from('skill')
              .insert([skillData])
              .select()
              .single()

            if (insertError) {
              console.error(`Error inserting skill:`, insertError)
              errors++
              results.push({
                entity_type: 'skill',
                action: 'error',
                error: insertError.message
              })
            } else {
              entitiesCreated++
              results.push({
                entity_type: 'skill',
                action: 'created',
                entity_id: insertResult.logical_entity_id
              })
            }
          }

        } else if (fieldName.includes('project')) {
          // Handle projects
          const entityData = {
            user_id: user.id,
            name: extractStringValue(parsedData?.value?.name || parsedData?.value?.title || parsedData?.value?.project_name, 'Unknown Project'),
            description: extractStringValue(parsedData?.value?.description),
            technologies_used: Array.isArray(parsedData?.value?.technologies_used) ? parsedData.value.technologies_used : 
              (parsedData?.value?.technologies ? [parsedData.value.technologies] : null),
            start_date: extractStringValue(parsedData?.value?.start_date),
            end_date: extractStringValue(parsedData?.value?.end_date),
            project_url: extractStringValue(parsedData?.value?.project_url || parsedData?.value?.demo_url),
            repository_url: extractStringValue(parsedData?.value?.repository_url || parsedData?.value?.github_url || parsedData?.value?.repo_url),
            source: 'resume_upload',
            source_confidence: entity.confidence_score || 0.8
          }

          const { data: insertResult, error: insertError } = await supabaseClient
            .from('project')
            .insert([entityData])
            .select()
            .single()

          if (insertError) {
            console.error(`Error inserting project:`, insertError)
            errors++
            results.push({
              entity_type: 'project',
              action: 'error',
              error: insertError.message
            })
          } else {
            entitiesCreated++
            results.push({
              entity_type: 'project',
              action: 'created',
              entity_id: insertResult.logical_entity_id
            })
          }

        } else if (fieldName.includes('cert')) {
          // Handle certifications
          const entityData = {
            user_id: user.id,
            name: extractStringValue(parsedData?.value?.name || parsedData?.value?.certification || parsedData?.value?.title, 'Unknown Certification'),
            issuing_organization: extractStringValue(parsedData?.value?.issuer || parsedData?.value?.organization || parsedData?.value?.provider, 'Unknown Issuer'),
            issue_date: extractStringValue(parsedData?.value?.issue_date || parsedData?.value?.date),
            expiration_date: extractStringValue(parsedData?.value?.expiry_date || parsedData?.value?.expiration_date),
            credential_id: extractStringValue(parsedData?.value?.credential_id),
            credential_url: extractStringValue(parsedData?.value?.credential_url),
            source: 'resume_upload',
            source_confidence: entity.confidence_score || 0.8
          }

          const { data: insertResult, error: insertError } = await supabaseClient
            .from('certification')
            .insert([entityData])
            .select()
            .single()

          if (insertError) {
            console.error(`Error inserting certification:`, insertError)
            errors++
            results.push({
              entity_type: 'certification',
              action: 'error',
              error: insertError.message
            })
          } else {
            entitiesCreated++
            results.push({
              entity_type: 'certification',
              action: 'created',
              entity_id: insertResult.logical_entity_id
            })
          }

        } else {
          console.log(`Skipped entity ${entity.id} - field: ${entity.field_name} (no matching table)`)
          results.push({
            entity_type: 'unknown',
            action: 'skipped',
            reason: `No matching table for field: ${entity.field_name}`
          })
        }

      } catch (entityError) {
        console.error(`Error processing entity ${entity.id}:`, entityError)
        errors++
        results.push({
          entity_type: 'unknown',
          action: 'error',
          error: entityError instanceof Error ? entityError.message : 'Unknown error'
        })
      }
    }

    const summary = {
      entitiesCreated,
      entitiesUpdated,
      errors,
      results
    }

    console.log('Resume data application completed:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in apply-resume-data-to-profile:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
