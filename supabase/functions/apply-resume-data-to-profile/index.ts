
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

    console.log(`Processing ${entities.length} parsed entities`)

    let entitiesCreated = 0
    let entitiesUpdated = 0
    let errors = 0
    const results = []

    // Process each entity individually
    for (const entity of entities) {
      console.log(`Processing entity: ${entity.field_name} = ${entity.raw_value}`)
      
      try {
        const sectionName = getSectionFromFieldName(entity.field_name)
        console.log(`Entity ${entity.field_name} belongs to section: ${sectionName}`)

        if (sectionName === 'skills') {
          const skillsProcessed = await processSkillsEntity(supabaseClient, user.id, entity)
          entitiesCreated += skillsProcessed.created
          errors += skillsProcessed.errors
          results.push(...skillsProcessed.results)
        } else if (sectionName === 'work_experience') {
          const workProcessed = await processWorkExperienceEntity(supabaseClient, user.id, entity)
          entitiesCreated += workProcessed.created
          errors += workProcessed.errors
          results.push(...workProcessed.results)
        } else if (sectionName === 'education') {
          const eduProcessed = await processEducationEntity(supabaseClient, user.id, entity)
          entitiesCreated += eduProcessed.created
          errors += eduProcessed.errors
          results.push(...eduProcessed.results)
        } else if (sectionName === 'personal_info') {
          const profileProcessed = await processPersonalInfoEntity(supabaseClient, user.id, entity)
          entitiesUpdated += profileProcessed.updated
          errors += profileProcessed.errors
          results.push(...profileProcessed.results)
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
  if (lowerField.includes('work') || lowerField.includes('job') || lowerField.includes('company') || lowerField.includes('title') || lowerField.includes('experience')) return 'work_experience'
  if (lowerField.includes('education') || lowerField.includes('degree') || lowerField.includes('school') || lowerField.includes('university') || lowerField.includes('college')) return 'education'
  if (lowerField.includes('name') || lowerField.includes('email') || lowerField.includes('phone') || lowerField.includes('address')) return 'personal_info'
  if (lowerField.includes('certification') || lowerField.includes('certificate')) return 'certifications'
  if (lowerField.includes('project')) return 'projects'
  
  return 'general'
}

async function processSkillsEntity(supabaseClient: any, userId: string, entity: any) {
  const results = []
  let created = 0
  let errors = 0

  try {
    console.log(`Processing skills entity: ${entity.raw_value}`)
    
    let skillsData
    const rawValue = entity.raw_value

    // Try to parse as JSON first
    if (typeof rawValue === 'string' && (rawValue.startsWith('[') || rawValue.startsWith('{'))) {
      try {
        skillsData = JSON.parse(rawValue)
      } catch (parseError) {
        console.log('Failed to parse as JSON, treating as plain text')
        skillsData = rawValue
      }
    } else {
      skillsData = rawValue
    }

    console.log('Parsed skills data:', skillsData)

    // Handle different skill data formats
    if (Array.isArray(skillsData)) {
      // Array of skills
      for (const skillItem of skillsData) {
        try {
          const skillName = extractSkillName(skillItem)
          if (skillName && skillName.trim()) {
            const skillData = parseSkillItem(skillItem)
            
            const { data: skillResult, error: skillError } = await supabaseClient
              .from('skill')
              .insert({
                user_id: userId,
                name: skillData.name,
                category: skillData.category,
                proficiency_level: skillData.proficiency_level,
                source: 'resume_upload',
                source_confidence: entity.confidence_score || 0.8,
                version: 1,
                is_active: true
              })
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
              created++
              results.push({
                entity_type: 'skill',
                action: 'created',
                entity_id: skillResult.logical_entity_id,
                skill_name: skillData.name
              })
            }
          }
        } catch (skillError) {
          console.error('Error processing individual skill:', skillError)
          errors++
        }
      }
    } else if (typeof skillsData === 'object' && skillsData !== null) {
      // Single skill object
      const skillData = parseSkillItem(skillsData)
      if (skillData.name && skillData.name.trim()) {
        const { data: skillResult, error: skillError } = await supabaseClient
          .from('skill')
          .insert({
            user_id: userId,
            name: skillData.name,
            category: skillData.category,
            proficiency_level: skillData.proficiency_level,
            source: 'resume_upload',
            source_confidence: entity.confidence_score || 0.8,
            version: 1,
            is_active: true
          })
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
      // String skill - could be comma-separated or single
      const skillNames = skillsData.split(',').map(s => s.trim()).filter(s => s.length > 0)
      for (const skillName of skillNames) {
        if (skillName) {
          const { data: skillResult, error: skillError } = await supabaseClient
            .from('skill')
            .insert({
              user_id: userId,
              name: skillName,
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
              error: skillError.message,
              skill_name: skillName
            })
          } else {
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
  const results = []
  let created = 0
  let errors = 0

  try {
    console.log(`Processing work experience entity: ${entity.raw_value}`)
    
    let workData
    const rawValue = entity.raw_value

    // Try to parse as JSON
    if (typeof rawValue === 'string' && (rawValue.startsWith('[') || rawValue.startsWith('{'))) {
      try {
        workData = JSON.parse(rawValue)
      } catch (parseError) {
        console.log('Failed to parse work experience as JSON, treating as plain text')
        workData = rawValue
      }
    } else {
      workData = rawValue
    }

    console.log('Parsed work experience data:', workData)

    // Handle different work experience formats
    if (Array.isArray(workData)) {
      // Array of work experiences
      for (const workItem of workData) {
        try {
          const workExperience = parseWorkExperienceItem(workItem)
          if (workExperience.company && workExperience.title) {
            const { data: workResult, error: workError } = await supabaseClient
              .from('work_experience')
              .insert({
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
              })
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
              created++
              results.push({
                entity_type: 'work_experience',
                action: 'created',
                entity_id: workResult.logical_entity_id,
                company: workExperience.company
              })
            }
          }
        } catch (workError) {
          console.error('Error processing individual work experience:', workError)
          errors++
        }
      }
    } else if (typeof workData === 'object' && workData !== null) {
      // Single work experience object
      const workExperience = parseWorkExperienceItem(workData)
      if (workExperience.company && workExperience.title) {
        const { data: workResult, error: workError } = await supabaseClient
          .from('work_experience')
          .insert({
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
          })
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
      // String work experience - create a basic entry
      const workExperience = {
        company: workData.substring(0, 100), // Truncate if too long
        title: 'Professional',
        start_date: null,
        end_date: null,
        description: null
      }

      const { data: workResult, error: workError } = await supabaseClient
        .from('work_experience')
        .insert({
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
        })
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
  const results = []
  let created = 0
  let errors = 0

  try {
    console.log(`Processing education entity: ${entity.raw_value}`)
    
    let eduData
    const rawValue = entity.raw_value

    // Try to parse as JSON
    if (typeof rawValue === 'string' && (rawValue.startsWith('[') || rawValue.startsWith('{'))) {
      try {
        eduData = JSON.parse(rawValue)
      } catch (parseError) {
        console.log('Failed to parse education as JSON, treating as plain text')
        eduData = rawValue
      }
    } else {
      eduData = rawValue
    }

    console.log('Parsed education data:', eduData)

    // Handle different education formats
    if (Array.isArray(eduData)) {
      // Array of education entries
      for (const eduItem of eduData) {
        try {
          const education = parseEducationItem(eduItem)
          if (education.institution && education.degree) {
            const { data: eduResult, error: eduError } = await supabaseClient
              .from('education')
              .insert({
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
              })
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
              created++
              results.push({
                entity_type: 'education',
                action: 'created',
                entity_id: eduResult.logical_entity_id,
                institution: education.institution
              })
            }
          }
        } catch (eduError) {
          console.error('Error processing individual education:', eduError)
          errors++
        }
      }
    } else if (typeof eduData === 'object' && eduData !== null) {
      // Single education object
      const education = parseEducationItem(eduData)
      if (education.institution && education.degree) {
        const { data: eduResult, error: eduError } = await supabaseClient
          .from('education')
          .insert({
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
          })
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
      // String education - parse as institution name
      const education = {
        institution: eduData,
        degree: 'Degree',
        field_of_study: null,
        start_date: null,
        end_date: null,
        gpa: null,
        description: null
      }

      const { data: eduResult, error: eduError } = await supabaseClient
        .from('education')
        .insert({
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
        })
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
  const results = []
  let updated = 0
  let errors = 0

  try {
    console.log(`Processing personal info entity: ${entity.field_name} = ${entity.raw_value}`)
    
    const fieldName = entity.field_name.toLowerCase()
    
    if (fieldName.includes('name') && !fieldName.includes('company') && !fieldName.includes('file')) {
      // Update profile name
      const name = String(entity.raw_value || '').trim()
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
          updated++
          results.push({
            entity_type: 'personal_info',
            action: 'updated',
            entity_id: userId,
            field_name: entity.field_name
          })
        }
      }
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

  return { updated, errors, results }
}
