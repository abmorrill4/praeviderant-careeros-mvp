
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

    // Process each parsed entity
    for (const entity of parsedEntities) {
      try {
        console.log(`Processing entity ${entity.id} - ${entity.field_name}`)

        // Parse the raw value to determine entity type and data
        let parsedData
        try {
          parsedData = JSON.parse(entity.raw_value)
        } catch (parseError) {
          // If it's not JSON, treat as simple text
          parsedData = { value: entity.raw_value, type: 'text' }
        }

        // Determine which table to insert into based on field name
        const fieldName = entity.field_name.toLowerCase()
        let tableName = null
        let entityData = null

        if (fieldName.includes('work') || fieldName.includes('experience') || fieldName.includes('job')) {
          tableName = 'work_experience'
          if (parsedData.type === 'object' && parsedData.value) {
            entityData = {
              user_id: user.id,
              company: parsedData.value.company || parsedData.value.employer || 'Unknown Company',
              title: parsedData.value.title || parsedData.value.position || parsedData.value.role || 'Unknown Title',
              start_date: parsedData.value.start_date || null,
              end_date: parsedData.value.end_date || null,
              description: parsedData.value.description || parsedData.value.responsibilities?.join('\n') || null,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8
            }
          }
        } else if (fieldName.includes('education') || fieldName.includes('degree')) {
          tableName = 'education'
          if (parsedData.type === 'object' && parsedData.value) {
            entityData = {
              user_id: user.id,
              institution: parsedData.value.institution || parsedData.value.school || parsedData.value.university || 'Unknown Institution',
              degree: parsedData.value.degree || parsedData.value.program || parsedData.value.field_of_study || 'Unknown Degree',
              field_of_study: parsedData.value.field_of_study || parsedData.value.major || null,
              start_date: parsedData.value.start_date || null,
              end_date: parsedData.value.end_date || parsedData.value.graduation_date || null,
              gpa: parsedData.value.gpa || null,
              description: parsedData.value.description || null,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8
            }
          }
        } else if (fieldName.includes('skill')) {
          tableName = 'skill'
          if (parsedData.type === 'array' && Array.isArray(parsedData.value)) {
            // Handle multiple skills
            for (const skillItem of parsedData.value) {
              const skillData = {
                user_id: user.id,
                name: typeof skillItem === 'string' ? skillItem : skillItem.name || skillItem.skill || 'Unknown Skill',
                category: typeof skillItem === 'object' ? skillItem.category : null,
                proficiency_level: typeof skillItem === 'object' ? skillItem.level || skillItem.proficiency : null,
                years_of_experience: typeof skillItem === 'object' ? skillItem.years_experience : null,
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
            continue // Skip the normal processing for this entity
          } else if (parsedData.type === 'object' && parsedData.value) {
            entityData = {
              user_id: user.id,
              name: parsedData.value.name || parsedData.value.skill || 'Unknown Skill',
              category: parsedData.value.category || null,
              proficiency_level: parsedData.value.level || parsedData.value.proficiency || null,
              years_of_experience: parsedData.value.years_experience || null,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8
            }
          }
        } else if (fieldName.includes('project')) {
          tableName = 'project'
          if (parsedData.type === 'object' && parsedData.value) {
            entityData = {
              user_id: user.id,
              name: parsedData.value.name || parsedData.value.title || parsedData.value.project_name || 'Unknown Project',
              description: parsedData.value.description || null,
              technologies_used: parsedData.value.technologies_used || parsedData.value.technologies || parsedData.value.tech_stack || null,
              start_date: parsedData.value.start_date || null,
              end_date: parsedData.value.end_date || null,
              project_url: parsedData.value.project_url || parsedData.value.demo_url || null,
              repository_url: parsedData.value.repository_url || parsedData.value.github_url || parsedData.value.repo_url || null,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8
            }
          }
        } else if (fieldName.includes('cert')) {
          tableName = 'certification'
          if (parsedData.type === 'object' && parsedData.value) {
            entityData = {
              user_id: user.id,
              name: parsedData.value.name || parsedData.value.certification || parsedData.value.title || 'Unknown Certification',
              issuing_organization: parsedData.value.issuer || parsedData.value.organization || parsedData.value.provider || 'Unknown Issuer',
              issue_date: parsedData.value.issue_date || parsedData.value.date || null,
              expiration_date: parsedData.value.expiry_date || parsedData.value.expiration_date || null,
              credential_id: parsedData.value.credential_id || null,
              credential_url: parsedData.value.credential_url || null,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8
            }
          }
        }

        // Insert the entity if we have valid data and table
        if (tableName && entityData) {
          const { data: insertResult, error: insertError } = await supabaseClient
            .from(tableName)
            .insert([entityData])
            .select()
            .single()

          if (insertError) {
            console.error(`Error inserting ${tableName}:`, insertError)
            errors++
            results.push({
              entity_type: tableName,
              action: 'error',
              error: insertError.message
            })
          } else {
            entitiesCreated++
            results.push({
              entity_type: tableName,
              action: 'created',
              entity_id: insertResult.logical_entity_id || insertResult.id
            })
            console.log(`Created ${tableName} entity: ${insertResult.logical_entity_id || insertResult.id}`)
          }
        } else {
          console.log(`Skipped entity ${entity.id} - field: ${entity.field_name} (no matching table or invalid data)`)
          results.push({
            entity_type: 'unknown',
            action: 'error',
            error: `No matching table for field: ${entity.field_name}`
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
