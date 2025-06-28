
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

    // Improved helper function to extract values from parsed data
    const extractValue = (parsedData: any, fieldNames: string[] = [], fallback: string = '') => {
      console.log('Extracting value from:', JSON.stringify(parsedData, null, 2))
      
      // If it's already a simple string, return it
      if (typeof parsedData === 'string' && parsedData.trim() && parsedData !== 'null') {
        return parsedData.trim()
      }
      
      // Handle nested value structure
      if (parsedData && typeof parsedData === 'object') {
        // Try to get the value property first
        if (parsedData.value) {
          // If value is a string, return it
          if (typeof parsedData.value === 'string' && parsedData.value.trim() && parsedData.value !== 'null') {
            return parsedData.value.trim()
          }
          
          // If value is an object, look for specific field names
          if (typeof parsedData.value === 'object' && parsedData.value) {
            for (const fieldName of fieldNames) {
              if (parsedData.value[fieldName] && 
                  typeof parsedData.value[fieldName] === 'string' && 
                  parsedData.value[fieldName].trim() &&
                  parsedData.value[fieldName] !== 'null') {
                return parsedData.value[fieldName].trim()
              }
            }
            
            // Try common field names if specific ones don't work
            const commonFields = ['name', 'title', 'company', 'employer', 'organization', 'institution', 'school', 'degree', 'skill']
            for (const field of commonFields) {
              if (parsedData.value[field] && 
                  typeof parsedData.value[field] === 'string' && 
                  parsedData.value[field].trim() &&
                  parsedData.value[field] !== 'null') {
                return parsedData.value[field].trim()
              }
            }
          }
        }
        
        // Try looking in the root object for field names
        for (const fieldName of fieldNames) {
          if (parsedData[fieldName] && 
              typeof parsedData[fieldName] === 'string' && 
              parsedData[fieldName].trim() &&
              parsedData[fieldName] !== 'null') {
            return parsedData[fieldName].trim()
          }
        }
      }
      
      return fallback
    }

    // Process each parsed entity
    for (const entity of parsedEntities) {
      try {
        console.log(`Processing entity ${entity.id} - ${entity.field_name}`)
        console.log(`Raw value: ${entity.raw_value}`)

        const parsedData = safeJsonParse(entity.raw_value)
        const fieldName = entity.field_name.toLowerCase()

        if (fieldName.includes('work') || fieldName.includes('experience') || fieldName.includes('job')) {
          // Handle work experience
          const company = extractValue(parsedData, ['company', 'employer', 'organization'], 'Company Name Not Available')
          const title = extractValue(parsedData, ['title', 'position', 'role', 'job_title'], 'Job Title Not Available')
          const startDate = extractValue(parsedData, ['start_date', 'startDate', 'from'], '')
          const endDate = extractValue(parsedData, ['end_date', 'endDate', 'to'], '')
          const description = extractValue(parsedData, ['description', 'summary', 'details'], '')

          console.log(`Work experience extracted - Company: ${company}, Title: ${title}`)

          const entityData = {
            user_id: user.id,
            company: company,
            title: title,
            start_date: startDate,
            end_date: endDate,
            description: description,
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
          const institution = extractValue(parsedData, ['institution', 'school', 'university', 'college'], 'Institution Not Available')
          const degree = extractValue(parsedData, ['degree', 'program', 'field_of_study', 'major'], 'Degree Not Available')
          const fieldOfStudy = extractValue(parsedData, ['field_of_study', 'major', 'subject'], '')
          const startDate = extractValue(parsedData, ['start_date', 'startDate', 'from'], '')
          const endDate = extractValue(parsedData, ['end_date', 'endDate', 'graduation_date', 'to'], '')
          const gpa = extractValue(parsedData, ['gpa', 'grade'], '')
          const description = extractValue(parsedData, ['description', 'details'], '')

          console.log(`Education extracted - Institution: ${institution}, Degree: ${degree}`)

          const entityData = {
            user_id: user.id,
            institution: institution,
            degree: degree,
            field_of_study: fieldOfStudy,
            start_date: startDate,
            end_date: endDate,
            gpa: gpa,
            description: description,
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
              const skillName = extractValue(skillItem, ['name', 'skill', 'technology'], 'Skill Name Not Available')
              const category = extractValue(skillItem, ['category', 'type'], '')
              const proficiency = extractValue(skillItem, ['level', 'proficiency', 'rating'], '')
              
              console.log(`Skill extracted: ${skillName}`)

              const skillData = {
                user_id: user.id,
                name: skillName,
                category: category || null,
                proficiency_level: proficiency || null,
                years_of_experience: null,
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
            const skillName = extractValue(parsedData, ['name', 'skill', 'technology'], 'Skill Name Not Available')
            const category = extractValue(parsedData, ['category', 'type'], '')
            const proficiency = extractValue(parsedData, ['level', 'proficiency', 'rating'], '')
            
            console.log(`Single skill extracted: ${skillName}`)

            const skillData = {
              user_id: user.id,
              name: skillName,
              category: category || null,
              proficiency_level: proficiency || null,
              years_of_experience: null,
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
          const projectName = extractValue(parsedData, ['name', 'title', 'project_name'], 'Project Name Not Available')
          const description = extractValue(parsedData, ['description', 'summary'], '')
          const startDate = extractValue(parsedData, ['start_date', 'startDate'], '')
          const endDate = extractValue(parsedData, ['end_date', 'endDate'], '')
          const projectUrl = extractValue(parsedData, ['project_url', 'demo_url', 'url'], '')
          const repoUrl = extractValue(parsedData, ['repository_url', 'github_url', 'repo_url'], '')

          console.log(`Project extracted: ${projectName}`)

          const entityData = {
            user_id: user.id,
            name: projectName,
            description: description || null,
            technologies_used: null,
            start_date: startDate || null,
            end_date: endDate || null,
            project_url: projectUrl || null,
            repository_url: repoUrl || null,
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
          const certName = extractValue(parsedData, ['name', 'certification', 'title'], 'Certification Name Not Available')
          const issuer = extractValue(parsedData, ['issuer', 'organization', 'provider'], 'Issuer Not Available')
          const issueDate = extractValue(parsedData, ['issue_date', 'date'], '')
          const expiryDate = extractValue(parsedData, ['expiry_date', 'expiration_date'], '')
          const credentialId = extractValue(parsedData, ['credential_id'], '')
          const credentialUrl = extractValue(parsedData, ['credential_url'], '')

          console.log(`Certification extracted: ${certName}`)

          const entityData = {
            user_id: user.id,
            name: certName,
            issuing_organization: issuer,
            issue_date: issueDate || null,
            expiration_date: expiryDate || null,
            credential_id: credentialId || null,
            credential_url: credentialUrl || null,
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
