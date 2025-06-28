
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

    // Get all parsed entities for this version
    const { data: entities, error: entitiesError } = await supabaseClient
      .from('parsed_resume_entities')
      .select('*')
      .eq('resume_version_id', versionId)
      .order('field_name')

    if (entitiesError) {
      console.error('Error fetching parsed entities:', entitiesError)
      throw entitiesError
    }

    if (!entities || entities.length === 0) {
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

    // Group entities by section
    const entityGroups: Record<string, any[]> = {}
    entities.forEach(entity => {
      const sectionName = getSectionFromFieldName(entity.field_name)
      if (!entityGroups[sectionName]) {
        entityGroups[sectionName] = []
      }
      entityGroups[sectionName].push(entity)
    })

    console.log('Entity groups found:', Object.keys(entityGroups))

    let entitiesCreated = 0
    let entitiesUpdated = 0
    let errors = 0
    const results = []

    // Process each section
    for (const [sectionName, sectionEntities] of Object.entries(entityGroups)) {
      console.log(`Processing ${sectionName} section with ${sectionEntities.length} entities`)

      try {
        if (sectionName === 'skills') {
          // Create individual skill entities
          for (const entity of sectionEntities) {
            if (entity.field_name === 'skills') {
              try {
                // Parse the skills array
                const skillsArray = JSON.parse(entity.raw_value || '[]')
                
                for (const skillName of skillsArray) {
                  if (typeof skillName === 'string' && skillName.trim()) {
                    const { data: skillData, error: skillError } = await supabaseClient
                      .from('skill')
                      .insert({
                        user_id: user.id,
                        name: skillName.trim(),
                        source: 'resume_upload',
                        source_confidence: entity.confidence_score || 0.8,
                        version: 1,
                        is_active: true
                      })
                      .select()
                      .single()

                    if (skillError) {
                      console.error(`Error creating skill "${skillName}":`, skillError)
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
                        entity_id: skillData.logical_entity_id
                      })
                    }
                  }
                }
              } catch (parseError) {
                console.error('Error parsing skills:', parseError)
                errors++
                results.push({
                  entity_type: 'skill',
                  action: 'error',
                  error: 'Failed to parse skills data'
                })
              }
            }
          }
        } else if (sectionName === 'work_experience') {
          // Group work experience fields by job
          const jobGroups = groupWorkExperienceEntities(sectionEntities)
          
          for (const jobData of jobGroups) {
            try {
              const { data: workData, error: workError } = await supabaseClient
                .from('work_experience')
                .insert({
                  user_id: user.id,
                  company: jobData.company || 'Unknown Company',
                  title: jobData.title || 'Unknown Title',
                  start_date: jobData.start_date,
                  end_date: jobData.end_date,
                  description: jobData.description,
                  source: 'resume_upload',
                  source_confidence: 0.8,
                  version: 1,
                  is_active: true
                })
                .select()
                .single()

              if (workError) {
                console.error('Error creating work experience:', workError)
                errors++
                results.push({
                  entity_type: 'work_experience',
                  action: 'error',
                  error: workError.message
                })
              } else {
                entitiesCreated++
                results.push({
                  entity_type: 'work_experience',
                  action: 'created',
                  entity_id: workData.logical_entity_id
                })
              }
            } catch (error) {
              console.error('Error processing work experience:', error)
              errors++
              results.push({
                entity_type: 'work_experience',
                action: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }
        } else if (sectionName === 'education') {
          // Group education fields
          const educationGroups = groupEducationEntities(sectionEntities)
          
          for (const eduData of educationGroups) {
            try {
              const { data: eduResult, error: eduError } = await supabaseClient
                .from('education')
                .insert({
                  user_id: user.id,
                  institution: eduData.institution || 'Unknown Institution',
                  degree: eduData.degree || 'Unknown Degree',
                  field_of_study: eduData.field_of_study,
                  start_date: eduData.start_date,
                  end_date: eduData.end_date,
                  gpa: eduData.gpa,
                  description: eduData.description,
                  source: 'resume_upload',
                  source_confidence: 0.8,
                  version: 1,
                  is_active: true
                })
                .select()
                .single()

              if (eduError) {
                console.error('Error creating education:', eduError)
                errors++
                results.push({
                  entity_type: 'education',
                  action: 'error',
                  error: eduError.message
                })
              } else {
                entitiesCreated++
                results.push({
                  entity_type: 'education',
                  action: 'created',
                  entity_id: eduResult.logical_entity_id
                })
              }
            } catch (error) {
              console.error('Error processing education:', error)
              errors++
              results.push({
                entity_type: 'education',
                action: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }
        } else if (sectionName === 'personal_info') {
          // Update user profile instead of creating entities
          try {
            const profileData = extractProfileData(sectionEntities)
            
            const { error: profileError } = await supabaseClient
              .from('profiles')
              .update({
                name: profileData.name,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)

            if (profileError) {
              console.error('Error updating profile:', profileError)
              errors++
              results.push({
                entity_type: 'personal_info',
                action: 'error',
                error: profileError.message
              })
            } else {
              entitiesUpdated++
              results.push({
                entity_type: 'personal_info',
                action: 'updated',
                entity_id: user.id
              })
            }
          } catch (error) {
            console.error('Error updating profile:', error)
            errors++
            results.push({
              entity_type: 'personal_info',
              action: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      } catch (sectionError) {
        console.error(`Error processing section ${sectionName}:`, sectionError)
        errors++
        results.push({
          entity_type: sectionName,
          action: 'error',
          error: sectionError instanceof Error ? sectionError.message : 'Unknown section error'
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

// Helper functions
function getSectionFromFieldName(fieldName: string): string {
  const lowerField = fieldName.toLowerCase()
  
  if (lowerField.includes('skill')) return 'skills'
  if (lowerField.includes('work') || lowerField.includes('job') || lowerField.includes('company') || lowerField.includes('title')) return 'work_experience'
  if (lowerField.includes('education') || lowerField.includes('degree') || lowerField.includes('school') || lowerField.includes('university')) return 'education'
  if (lowerField.includes('name') || lowerField.includes('email') || lowerField.includes('phone') || lowerField.includes('address')) return 'personal_info'
  if (lowerField.includes('certification') || lowerField.includes('certificate')) return 'certifications'
  if (lowerField.includes('project')) return 'projects'
  
  return 'general'
}

function groupWorkExperienceEntities(entities: any[]): any[] {
  // For now, create a simple grouped structure
  // This could be enhanced to better group related fields
  const jobs = []
  
  for (const entity of entities) {
    const fieldName = entity.field_name.toLowerCase()
    
    if (fieldName.includes('company') || fieldName.includes('job') || fieldName.includes('work')) {
      try {
        const value = entity.raw_value
        if (typeof value === 'string' && value.trim()) {
          jobs.push({
            company: value.trim(),
            title: 'Professional', // Default title
            start_date: null,
            end_date: null,
            description: null
          })
        }
      } catch (error) {
        console.error('Error parsing work experience entity:', error)
      }
    }
  }
  
  return jobs.length > 0 ? jobs : []
}

function groupEducationEntities(entities: any[]): any[] {
  const educations = []
  
  for (const entity of entities) {
    const fieldName = entity.field_name.toLowerCase()
    
    if (fieldName.includes('education') || fieldName.includes('degree') || fieldName.includes('school')) {
      try {
        const value = entity.raw_value
        if (typeof value === 'string' && value.trim()) {
          educations.push({
            institution: value.includes('University') || value.includes('College') ? value.trim() : 'Unknown Institution',
            degree: value.includes('University') || value.includes('College') ? 'Degree' : value.trim(),
            field_of_study: null,
            start_date: null,
            end_date: null,
            gpa: null,
            description: null
          })
        }
      } catch (error) {
        console.error('Error parsing education entity:', error)
      }
    }
  }
  
  return educations.length > 0 ? educations : []
}

function extractProfileData(entities: any[]): any {
  let name = null
  
  for (const entity of entities) {
    const fieldName = entity.field_name.toLowerCase()
    
    if (fieldName.includes('name') && !fieldName.includes('company')) {
      try {
        const value = entity.raw_value
        if (typeof value === 'string' && value.trim()) {
          name = value.trim()
          break
        }
      } catch (error) {
        console.error('Error parsing name entity:', error)
      }
    }
  }
  
  return { name }
}
