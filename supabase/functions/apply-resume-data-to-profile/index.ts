
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
      console.log('No parsed entities found for version:', versionId)
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

    console.log(`Found ${entities.length} parsed entities to process:`)
    entities.forEach(entity => {
      console.log(`- ${entity.field_name}: ${JSON.stringify(entity.raw_value)}`)
    })

    let entitiesCreated = 0
    let entitiesUpdated = 0
    let errors = 0
    const results = []

    // Process each entity individually
    for (const entity of entities) {
      console.log(`\n=== Processing entity: ${entity.field_name} ===`)
      console.log(`Raw value type: ${typeof entity.raw_value}`)
      console.log(`Raw value content: ${JSON.stringify(entity.raw_value)}`)
      
      try {
        const sectionName = getSectionFromFieldName(entity.field_name)
        console.log(`Entity ${entity.field_name} categorized as: ${sectionName}`)

        if (sectionName === 'skills') {
          console.log('Processing as skills...')
          const skillsProcessed = await processSkillsEntity(supabaseClient, user.id, entity)
          entitiesCreated += skillsProcessed.created
          errors += skillsProcessed.errors
          results.push(...skillsProcessed.results)
          console.log(`Skills processing result: ${skillsProcessed.created} created, ${skillsProcessed.errors} errors`)
        } else if (sectionName === 'work_experience') {
          console.log('Processing as work experience...')
          const workProcessed = await processWorkExperienceEntity(supabaseClient, user.id, entity)
          entitiesCreated += workProcessed.created
          errors += workProcessed.errors
          results.push(...workProcessed.results)
          console.log(`Work experience processing result: ${workProcessed.created} created, ${workProcessed.errors} errors`)
        } else if (sectionName === 'education') {
          console.log('Processing as education...')
          const eduProcessed = await processEducationEntity(supabaseClient, user.id, entity)
          entitiesCreated += eduProcessed.created
          errors += eduProcessed.errors
          results.push(...eduProcessed.results)
          console.log(`Education processing result: ${eduProcessed.created} created, ${eduProcessed.errors} errors`)
        } else if (sectionName === 'personal_info') {
          console.log('Processing as personal info...')
          const profileProcessed = await processPersonalInfoEntity(supabaseClient, user.id, entity)
          entitiesUpdated += profileProcessed.updated
          errors += profileProcessed.errors
          results.push(...profileProcessed.results)
          console.log(`Personal info processing result: ${profileProcessed.updated} updated, ${profileProcessed.errors} errors`)
        } else {
          console.log(`Skipping entity with unrecognized section: ${sectionName}`)
        }
      } catch (entityError) {
        console.error(`Error processing entity ${entity.id}:`, entityError)
        errors++
        results.push({
          entity_type: getSectionFromFieldName(entity.field_name),
          action: 'error',
          error: entityError instanceof Error ? entityError.message : 'Unknown error',
          field_name: entity.field_name
        })
      }
    }

    const summary = {
      entitiesCreated,
      entitiesUpdated,
      errors,
      results
    }

    console.log('\n=== PROCESSING COMPLETE ===')
    console.log('Final summary:', JSON.stringify(summary, null, 2))

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
  if (lowerField.includes('work') || lowerField.includes('job') || lowerField.includes('company') || lowerField.includes('title') || lowerField.includes('experience')) return 'work_experience'
  if (lowerField.includes('education') || lowerField.includes('degree') || lowerField.includes('school') || lowerField.includes('university') || lowerField.includes('college')) return 'education'
  if (lowerField.includes('name') || lowerField.includes('email') || lowerField.includes('phone') || lowerField.includes('address')) return 'personal_info'
  if (lowerField.includes('certification') || lowerField.includes('certificate')) return 'certifications'
  if (lowerField.includes('project')) return 'projects'
  
  return 'general'
}

async function processSkillsEntity(supabaseClient: any, userId: string, entity: any) {
  console.log(`\n--- Processing Skills Entity ---`)
  console.log(`Entity ID: ${entity.id}`)
  console.log(`Field name: ${entity.field_name}`)
  console.log(`Raw value: ${JSON.stringify(entity.raw_value)}`)
  
  const results = []
  let created = 0
  let errors = 0

  try {
    let skillsData = entity.raw_value

    // Handle string data that might be JSON
    if (typeof skillsData === 'string') {
      console.log('Raw value is string, attempting to parse as JSON...')
      try {
        skillsData = JSON.parse(skillsData)
        console.log('Successfully parsed JSON:', JSON.stringify(skillsData))
      } catch (parseError) {
        console.log('Not valid JSON, treating as comma-separated string')
        // Split by commas and clean up
        skillsData = skillsData.split(',').map(s => s.trim()).filter(s => s.length > 0)
        console.log('Converted to array:', skillsData)
      }
    }

    console.log('Final skills data to process:', JSON.stringify(skillsData))
    console.log('Skills data type:', typeof skillsData)
    console.log('Is array:', Array.isArray(skillsData))

    // Process the skills data
    if (Array.isArray(skillsData)) {
      console.log(`Processing ${skillsData.length} skills from array...`)
      for (let i = 0; i < skillsData.length; i++) {
        const skillItem = skillsData[i]
        console.log(`Processing skill ${i + 1}/${skillsData.length}: ${JSON.stringify(skillItem)}`)
        
        try {
          const skillName = extractSkillName(skillItem)
          console.log(`Extracted skill name: "${skillName}"`)
          
          if (skillName && skillName.trim()) {
            const skillData = parseSkillItem(skillItem)
            console.log(`Parsed skill data:`, JSON.stringify(skillData))
            
            const insertData = {
              user_id: userId,
              name: skillData.name,
              category: skillData.category,
              proficiency_level: skillData.proficiency_level,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8,
              version: 1,
              is_active: true
            }
            
            console.log(`Inserting skill with data:`, JSON.stringify(insertData))
            
            const { data: skillResult, error: skillError } = await supabaseClient
              .from('skill')
              .insert(insertData)
              .select()
              .single()

            if (skillError) {
              console.error(`Error creating skill "${skillData.name}":`, skillError)
              errors++
              results.push({
                entity_type: 'skill',
                action: 'error',
                error: skillError.message,
                skill_name: skillData.name
              })
            } else {
              console.log(`Successfully created skill: ${skillResult.logical_entity_id}`)
              created++
              results.push({
                entity_type: 'skill',
                action: 'created',
                entity_id: skillResult.logical_entity_id,
                skill_name: skillData.name
              })
            }
          } else {
            console.log(`Skipped empty skill name for item: ${JSON.stringify(skillItem)}`)
          }
        } catch (skillError) {
          console.error('Error processing individual skill:', skillError)
          errors++
        }
      }
    } else if (typeof skillsData === 'object' && skillsData !== null) {
      console.log('Processing single skill object...')
      const skillData = parseSkillItem(skillsData)
      console.log(`Parsed single skill:`, JSON.stringify(skillData))
      
      if (skillData.name && skillData.name.trim()) {
        const insertData = {
          user_id: userId,
          name: skillData.name,
          category: skillData.category,
          proficiency_level: skillData.proficiency_level,
          source: 'resume_upload',
          source_confidence: entity.confidence_score || 0.8,
          version: 1,
          is_active: true
        }
        
        console.log(`Inserting single skill with data:`, JSON.stringify(insertData))
        
        const { data: skillResult, error: skillError } = await supabaseClient
          .from('skill')
          .insert(insertData)
          .select()
          .single()

        if (skillError) {
          console.error(`Error creating skill "${skillData.name}":`, skillError)
          errors++
          results.push({
            entity_type: 'skill',
            action: 'error',
            error: skillError.message,
            skill_name: skillData.name
          })
        } else {
          console.log(`Successfully created skill: ${skillResult.logical_entity_id}`)
          created++
          results.push({
            entity_type: 'skill',
            action: 'created',
            entity_id: skillResult.logical_entity_id,
            skill_name: skillData.name
          })
        }
      }
    } else if (typeof skillsData === 'string') {
      console.log('Processing skills as string...')
      const skillNames = skillsData.split(',').map(s => s.trim()).filter(s => s.length > 0)
      console.log(`Split into ${skillNames.length} skills:`, skillNames)
      
      for (const skillName of skillNames) {
        if (skillName) {
          const insertData = {
            user_id: userId,
            name: skillName,
            source: 'resume_upload',
            source_confidence: entity.confidence_score || 0.8,
            version: 1,
            is_active: true
          }
          
          console.log(`Inserting string skill with data:`, JSON.stringify(insertData))
          
          const { data: skillResult, error: skillError } = await supabaseClient
            .from('skill')
            .insert(insertData)
            .select()
            .single()

          if (skillError) {
            console.error(`Error creating skill "${skillName}":`, skillError)
            errors++
            results.push({
              entity_type: 'skill',
              action: 'error',
              error: skillError.message,
              skill_name: skillName
            })
          } else {
            console.log(`Successfully created skill: ${skillResult.logical_entity_id}`)
            created++
            results.push({
              entity_type: 'skill',
              action: 'created',
              entity_id: skillResult.logical_entity_id,
              skill_name: skillName
            })
          }
        }
      }
    } else {
      console.log(`Unhandled skills data type: ${typeof skillsData}`)
    }
  } catch (error) {
    console.error('Error in processSkillsEntity:', error)
    errors++
    results.push({
      entity_type: 'skill',
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  console.log(`Skills processing complete: ${created} created, ${errors} errors`)
  return { created, errors, results }
}

function extractSkillName(skillItem: any): string {
  if (typeof skillItem === 'string') {
    return skillItem.trim()
  }
  
  if (typeof skillItem === 'object' && skillItem !== null) {
    return skillItem.name || skillItem.skill || skillItem.title || ''
  }
  
  return String(skillItem || '').trim()
}

function parseSkillItem(skillItem: any) {
  const skillName = extractSkillName(skillItem)
  
  if (typeof skillItem === 'object' && skillItem !== null) {
    return {
      name: skillName,
      category: skillItem.category || skillItem.type || null,
      proficiency_level: skillItem.proficiency_level || skillItem.proficiency || skillItem.level || null
    }
  }
  
  return {
    name: skillName,
    category: null,
    proficiency_level: null
  }
}

async function processWorkExperienceEntity(supabaseClient: any, userId: string, entity: any) {
  console.log(`\n--- Processing Work Experience Entity ---`)
  console.log(`Entity ID: ${entity.id}`)
  console.log(`Field name: ${entity.field_name}`)
  console.log(`Raw value: ${JSON.stringify(entity.raw_value)}`)
  
  const results = []
  let created = 0
  let errors = 0

  try {
    let workData = entity.raw_value

    // Handle string data that might be JSON
    if (typeof workData === 'string') {
      console.log('Raw value is string, attempting to parse as JSON...')
      try {
        workData = JSON.parse(workData)
        console.log('Successfully parsed JSON:', JSON.stringify(workData))
      } catch (parseError) {
        console.log('Not valid JSON, treating as plain text')
      }
    }

    console.log('Final work data to process:', JSON.stringify(workData))

    // Handle different work experience formats
    if (Array.isArray(workData)) {
      console.log(`Processing ${workData.length} work experiences from array...`)
      for (let i = 0; i < workData.length; i++) {
        const workItem = workData[i]
        console.log(`Processing work experience ${i + 1}/${workData.length}: ${JSON.stringify(workItem)}`)
        
        try {
          const workExperience = parseWorkExperienceItem(workItem)
          console.log(`Parsed work experience:`, JSON.stringify(workExperience))
          
          if (workExperience.company && workExperience.title) {
            const insertData = {
              user_id: userId,
              company: workExperience.company,
              title: workExperience.title,
              start_date: workExperience.start_date,
              end_date: workExperience.end_date,
              description: workExperience.description,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8,
              version: 1,
              is_active: true
            }
            
            console.log(`Inserting work experience with data:`, JSON.stringify(insertData))
            
            const { data: workResult, error: workError } = await supabaseClient
              .from('work_experience')
              .insert(insertData)
              .select()
              .single()

            if (workError) {
              console.error('Error creating work experience:', workError)
              errors++
              results.push({
                entity_type: 'work_experience',
                action: 'error',
                error: workError.message,
                company: workExperience.company
              })
            } else {
              console.log(`Successfully created work experience: ${workResult.logical_entity_id}`)
              created++
              results.push({
                entity_type: 'work_experience',
                action: 'created',
                entity_id: workResult.logical_entity_id,
                company: workExperience.company
              })
            }
          } else {
            console.log(`Skipped work experience with missing company or title: ${JSON.stringify(workExperience)}`)
          }
        } catch (workError) {
          console.error('Error processing individual work experience:', workError)
          errors++
        }
      }
    } else if (typeof workData === 'object' && workData !== null) {
      console.log('Processing single work experience object...')
      const workExperience = parseWorkExperienceItem(workData)
      console.log(`Parsed single work experience:`, JSON.stringify(workExperience))
      
      if (workExperience.company && workExperience.title) {
        const insertData = {
          user_id: userId,
          company: workExperience.company,
          title: workExperience.title,
          start_date: workExperience.start_date,
          end_date: workExperience.end_date,
          description: workExperience.description,
          source: 'resume_upload',
          source_confidence: entity.confidence_score || 0.8,
          version: 1,
          is_active: true
        }
        
        console.log(`Inserting single work experience with data:`, JSON.stringify(insertData))
        
        const { data: workResult, error: workError } = await supabaseClient
          .from('work_experience')
          .insert(insertData)
          .select()
          .single()

        if (workError) {
          console.error('Error creating work experience:', workError)
          errors++
          results.push({
            entity_type: 'work_experience',
            action: 'error',
            error: workError.message,
            company: workExperience.company
          })
        } else {
          console.log(`Successfully created work experience: ${workResult.logical_entity_id}`)
          created++
          results.push({
            entity_type: 'work_experience',
            action: 'created',
            entity_id: workResult.logical_entity_id,
            company: workExperience.company
          })
        }
      }
    } else if (typeof workData === 'string') {
      console.log('Processing work experience as string...')
      const workExperience = {
        company: workData.substring(0, 100),
        title: 'Professional',
        start_date: null,
        end_date: null,
        description: null
      }

      const insertData = {
        user_id: userId,
        company: workExperience.company,
        title: workExperience.title,
        start_date: workExperience.start_date,
        end_date: workExperience.end_date,
        description: workExperience.description,
        source: 'resume_upload',
        source_confidence: entity.confidence_score || 0.6,
        version: 1,
        is_active: true
      }
      
      console.log(`Inserting string work experience with data:`, JSON.stringify(insertData))
      
      const { data: workResult, error: workError } = await supabaseClient
        .from('work_experience')
        .insert(insertData)
        .select()
        .single()

      if (workError) {
        console.error('Error creating work experience:', workError)
        errors++
        results.push({
          entity_type: 'work_experience',
          action: 'error',
          error: workError.message,
          company: workExperience.company
        })
      } else {
        console.log(`Successfully created work experience: ${workResult.logical_entity_id}`)
        created++
        results.push({
          entity_type: 'work_experience',
          action: 'created',
          entity_id: workResult.logical_entity_id,
          company: workExperience.company
        })
      }
    }
  } catch (error) {
    console.error('Error in processWorkExperienceEntity:', error)
    errors++
    results.push({
      entity_type: 'work_experience',
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  console.log(`Work experience processing complete: ${created} created, ${errors} errors`)
  return { created, errors, results }
}

function parseWorkExperienceItem(workItem: any) {
  if (typeof workItem === 'string') {
    return {
      company: workItem,
      title: 'Professional',
      start_date: null,
      end_date: null,
      description: null
    }
  }

  if (typeof workItem === 'object' && workItem !== null) {
    return {
      company: workItem.company || workItem.employer || workItem.organization || 'Unknown Company',
      title: workItem.title || workItem.position || workItem.role || workItem.job_title || 'Professional',
      start_date: workItem.start_date || workItem.startDate || workItem.from || null,
      end_date: workItem.end_date || workItem.endDate || workItem.to || null,
      description: workItem.description || workItem.summary || workItem.responsibilities || null
    }
  }

  return {
    company: String(workItem || 'Unknown Company'),
    title: 'Professional',
    start_date: null,
    end_date: null,
    description: null
  }
}

async function processEducationEntity(supabaseClient: any, userId: string, entity: any) {
  console.log(`\n--- Processing Education Entity ---`)
  console.log(`Entity ID: ${entity.id}`)
  console.log(`Field name: ${entity.field_name}`)
  console.log(`Raw value: ${JSON.stringify(entity.raw_value)}`)
  
  const results = []
  let created = 0
  let errors = 0

  try {
    let eduData = entity.raw_value

    // Handle string data that might be JSON
    if (typeof eduData === 'string') {
      console.log('Raw value is string, attempting to parse as JSON...')
      try {
        eduData = JSON.parse(eduData)
        console.log('Successfully parsed JSON:', JSON.stringify(eduData))
      } catch (parseError) {
        console.log('Not valid JSON, treating as plain text')
      }
    }

    console.log('Final education data to process:', JSON.stringify(eduData))

    // Handle different education formats
    if (Array.isArray(eduData)) {
      console.log(`Processing ${eduData.length} education entries from array...`)
      for (let i = 0; i < eduData.length; i++) {
        const eduItem = eduData[i]
        console.log(`Processing education ${i + 1}/${eduData.length}: ${JSON.stringify(eduItem)}`)
        
        try {
          const education = parseEducationItem(eduItem)
          console.log(`Parsed education:`, JSON.stringify(education))
          
          if (education.institution && education.degree) {
            const insertData = {
              user_id: userId,
              institution: education.institution,
              degree: education.degree,
              field_of_study: education.field_of_study,
              start_date: education.start_date,
              end_date: education.end_date,
              gpa: education.gpa,
              description: education.description,
              source: 'resume_upload',
              source_confidence: entity.confidence_score || 0.8,
              version: 1,
              is_active: true
            }
            
            console.log(`Inserting education with data:`, JSON.stringify(insertData))
            
            const { data: eduResult, error: eduError } = await supabaseClient
              .from('education')
              .insert(insertData)
              .select()
              .single()

            if (eduError) {
              console.error('Error creating education:', eduError)
              errors++
              results.push({
                entity_type: 'education',
                action: 'error',
                error: eduError.message,
                institution: education.institution
              })
            } else {
              console.log(`Successfully created education: ${eduResult.logical_entity_id}`)
              created++
              results.push({
                entity_type: 'education',
                action: 'created',
                entity_id: eduResult.logical_entity_id,
                institution: education.institution
              })
            }
          } else {
            console.log(`Skipped education with missing institution or degree: ${JSON.stringify(education)}`)
          }
        } catch (eduError) {
          console.error('Error processing individual education:', eduError)
          errors++
        }
      }
    } else if (typeof eduData === 'object' && eduData !== null) {
      console.log('Processing single education object...')
      const education = parseEducationItem(eduData)
      console.log(`Parsed single education:`, JSON.stringify(education))
      
      if (education.institution && education.degree) {
        const insertData = {
          user_id: userId,
          institution: education.institution,
          degree: education.degree,
          field_of_study: education.field_of_study,
          start_date: education.start_date,
          end_date: education.end_date,
          gpa: education.gpa,
          description: education.description,
          source: 'resume_upload',
          source_confidence: entity.confidence_score || 0.8,
          version: 1,
          is_active: true
        }
        
        console.log(`Inserting single education with data:`, JSON.stringify(insertData))
        
        const { data: eduResult, error: eduError } = await supabaseClient
          .from('education')
          .insert(insertData)
          .select()
          .single()

        if (eduError) {
          console.error('Error creating education:', eduError)
          errors++
          results.push({
            entity_type: 'education',
            action: 'error',
            error: eduError.message,
            institution: education.institution
          })
        } else {
          console.log(`Successfully created education: ${eduResult.logical_entity_id}`)
          created++
          results.push({
            entity_type: 'education',
            action: 'created',
            entity_id: eduResult.logical_entity_id,
            institution: education.institution
          })
        }
      }
    } else if (typeof eduData === 'string') {
      console.log('Processing education as string...')
      const education = {
        institution: eduData,
        degree: 'Degree',
        field_of_study: null,
        start_date: null,
        end_date: null,
        gpa: null,
        description: null
      }

      const insertData = {
        user_id: userId,
        institution: education.institution,
        degree: education.degree,
        field_of_study: education.field_of_study,
        start_date: education.start_date,
        end_date: education.end_date,
        gpa: education.gpa,
        description: education.description,
        source: 'resume_upload',
        source_confidence: entity.confidence_score || 0.6,
        version: 1,
        is_active: true
      }
      
      console.log(`Inserting string education with data:`, JSON.stringify(insertData))
      
      const { data: eduResult, error: eduError } = await supabaseClient
        .from('education')
        .insert(insertData)
        .select()
        .single()

      if (eduError) {
        console.error('Error creating education:', eduError)
        errors++
        results.push({
          entity_type: 'education',
          action: 'error',
          error: eduError.message,
          institution: education.institution
        })
      } else {
        console.log(`Successfully created education: ${eduResult.logical_entity_id}`)
        created++
        results.push({
          entity_type: 'education',
          action: 'created',
          entity_id: eduResult.logical_entity_id,
          institution: education.institution
        })
      }
    }
  } catch (error) {
    console.error('Error in processEducationEntity:', error)
    errors++
    results.push({
      entity_type: 'education',
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  console.log(`Education processing complete: ${created} created, ${errors} errors`)
  return { created, errors, results }
}

function parseEducationItem(eduItem: any) {
  if (typeof eduItem === 'string') {
    return {
      institution: eduItem,
      degree: 'Degree',
      field_of_study: null,
      start_date: null,
      end_date: null,
      gpa: null,
      description: null
    }
  }

  if (typeof eduItem === 'object' && eduItem !== null) {
    return {
      institution: eduItem.institution || eduItem.school || eduItem.university || eduItem.college || 'Unknown Institution',
      degree: eduItem.degree || eduItem.qualification || eduItem.diploma || 'Degree',
      field_of_study: eduItem.field_of_study || eduItem.major || eduItem.subject || eduItem.field || null,
      start_date: eduItem.start_date || eduItem.startDate || eduItem.from || null,
      end_date: eduItem.end_date || eduItem.endDate || eduItem.to || null,
      gpa: eduItem.gpa || eduItem.grade || null,
      description: eduItem.description || eduItem.details || null
    }
  }

  return {
    institution: String(eduItem || 'Unknown Institution'),
    degree: 'Degree',
    field_of_study: null,
    start_date: null,
    end_date: null,
    gpa: null,
    description: null
  }
}

async function processPersonalInfoEntity(supabaseClient: any, userId: string, entity: any) {
  console.log(`\n--- Processing Personal Info Entity ---`)
  console.log(`Entity ID: ${entity.id}`)
  console.log(`Field name: ${entity.field_name}`)
  console.log(`Raw value: ${JSON.stringify(entity.raw_value)}`)
  
  const results = []
  let updated = 0
  let errors = 0

  try {
    const fieldName = entity.field_name.toLowerCase()
    
    if (fieldName.includes('name') && !fieldName.includes('company') && !fieldName.includes('file')) {
      const name = String(entity.raw_value || '').trim()
      console.log(`Attempting to update profile name to: "${name}"`)
      
      if (name) {
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            name: name,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (profileError) {
          console.error('Error updating profile name:', profileError)
          errors++
          results.push({
            entity_type: 'personal_info',
            action: 'error',
            error: profileError.message,
            field_name: entity.field_name
          })
        } else {
          console.log(`Successfully updated profile name`)
          updated++
          results.push({
            entity_type: 'personal_info',
            action: 'updated',
            entity_id: userId,
            field_name: entity.field_name
          })
        }
      } else {
        console.log(`Skipped empty name value`)
      }
    } else {
      console.log(`Field "${fieldName}" not recognized as updatable personal info`)
    }
  } catch (error) {
    console.error('Error in processPersonalInfoEntity:', error)
    errors++
    results.push({
      entity_type: 'personal_info',
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      field_name: entity.field_name
    })
  }

  console.log(`Personal info processing complete: ${updated} updated, ${errors} errors`)
  return { updated, errors, results }
}
