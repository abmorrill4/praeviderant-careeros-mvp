
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
    const { data: entities, error: entitiesError } = await supabaseClient
      .from('parsed_resume_entities')
      .select('*')
      .eq('resume_version_id', versionId)
      .order('created_at', { ascending: true })

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

    let entitiesCreated = 0
    let entitiesUpdated = 0
    let errors = 0
    const results = []

    // Group entities by type and logical groupings
    const entityGroups = new Map()
    
    entities.forEach(entity => {
      const section = getEntitySection(entity.field_name)
      if (!entityGroups.has(section)) {
        entityGroups.set(section, [])
      }
      entityGroups.get(section).push(entity)
    })

    console.log('Entity groups found:', Array.from(entityGroups.keys()))

    // Process each entity group
    for (const [section, sectionEntities] of entityGroups) {
      try {
        console.log(`Processing ${section} section with ${sectionEntities.length} entities`)
        
        if (section === 'work_experience') {
          const result = await processWorkExperience(supabaseClient, user.id, sectionEntities)
          entitiesCreated += result.created
          entitiesUpdated += result.updated
          errors += result.errors
          results.push(...result.details)
        } else if (section === 'education') {
          const result = await processEducation(supabaseClient, user.id, sectionEntities)
          entitiesCreated += result.created
          entitiesUpdated += result.updated
          errors += result.errors
          results.push(...result.details)
        } else if (section === 'skills') {
          const result = await processSkills(supabaseClient, user.id, sectionEntities)
          entitiesCreated += result.created
          entitiesUpdated += result.updated
          errors += result.errors
          results.push(...result.details)
        } else if (section === 'projects') {
          const result = await processProjects(supabaseClient, user.id, sectionEntities)
          entitiesCreated += result.created
          entitiesUpdated += result.updated
          errors += result.errors
          results.push(...result.details)
        } else if (section === 'certifications') {
          const result = await processCertifications(supabaseClient, user.id, sectionEntities)
          entitiesCreated += result.created
          entitiesUpdated += result.updated
          errors += result.errors
          results.push(...result.details)
        } else if (section === 'personal_info') {
          const result = await processPersonalInfo(supabaseClient, user.id, sectionEntities)
          entitiesCreated += result.created
          entitiesUpdated += result.updated
          errors += result.errors
          results.push(...result.details)
        }
      } catch (sectionError) {
        console.error(`Error processing ${section}:`, sectionError)
        errors++
        results.push({
          entity_type: section,
          action: 'error',
          error: sectionError instanceof Error ? sectionError.message : 'Unknown error'
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

function getEntitySection(fieldName: string): string {
  const field = fieldName.toLowerCase()
  
  // Work experience patterns
  if (field.includes('work_') || field.includes('job_') || field.includes('employment_') || 
      field.includes('company') || field.includes('title') || field.includes('position') ||
      field.includes('employer') || field.includes('role')) {
    return 'work_experience'
  }
  
  // Education patterns
  if (field.includes('education_') || field.includes('degree_') || field.includes('school_') ||
      field.includes('university') || field.includes('college') || field.includes('institution') ||
      field.includes('gpa') || field.includes('graduation')) {
    return 'education'
  }
  
  // Skills patterns
  if (field.includes('skill_') || field.includes('technology_') || field.includes('technical_') ||
      field.includes('programming') || field.includes('software') || field.includes('tools')) {
    return 'skills'
  }
  
  // Projects patterns
  if (field.includes('project_') || field.includes('portfolio')) {
    return 'projects'
  }
  
  // Certifications patterns
  if (field.includes('certification_') || field.includes('certificate_') || field.includes('license')) {
    return 'certifications'
  }
  
  // Personal info patterns
  if (field.includes('name') || field.includes('email') || field.includes('phone') || 
      field.includes('address') || field.includes('location') || field.includes('summary') ||
      field.includes('objective')) {
    return 'personal_info'
  }
  
  return 'other'
}

async function processWorkExperience(supabaseClient: any, userId: string, entities: any[]) {
  let created = 0
  let updated = 0
  let errors = 0
  const details = []

  // Group work experience entities by potential jobs
  const workGroups = new Map()
  
  entities.forEach(entity => {
    // Try to group by company name or job title
    let groupKey = 'unknown'
    
    if (entity.field_name.toLowerCase().includes('company')) {
      groupKey = `company_${entity.raw_value || 'unknown'}`
    } else if (entity.field_name.toLowerCase().includes('title') || entity.field_name.toLowerCase().includes('position')) {
      groupKey = `title_${entity.raw_value || 'unknown'}`
    } else {
      // Use a generic grouping for other fields
      groupKey = `general_${Math.floor(Math.random() * 1000)}`
    }
    
    if (!workGroups.has(groupKey)) {
      workGroups.set(groupKey, {})
    }
    
    const group = workGroups.get(groupKey)
    
    if (entity.field_name.toLowerCase().includes('company')) {
      group.company = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('title') || entity.field_name.toLowerCase().includes('position')) {
      group.title = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('start')) {
      group.start_date = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('end')) {
      group.end_date = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('description')) {
      group.description = entity.raw_value
    }
  })

  for (const [key, workData] of workGroups) {
    try {
      if (workData.company || workData.title) {
        const { data, error } = await supabaseClient
          .from('work_experience')
          .insert({
            user_id: userId,
            company: workData.company || 'Unknown Company',
            title: workData.title || 'Unknown Title',
            start_date: workData.start_date || null,
            end_date: workData.end_date || null,
            description: workData.description || null,
            source: 'resume_upload',  
            source_confidence: 0.8
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating work experience:', error)
          errors++
          details.push({
            entity_type: 'work_experience',
            action: 'error',
            error: error.message
          })
        } else {
          created++
          details.push({
            entity_type: 'work_experience',
            action: 'created',
            entity_id: data.logical_entity_id
          })
        }
      }
    } catch (err) {
      errors++
      details.push({
        entity_type: 'work_experience',
        action: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  return { created, updated, errors, details }
}

async function processEducation(supabaseClient: any, userId: string, entities: any[]) {
  let created = 0
  let updated = 0
  let errors = 0
  const details = []

  // Group education entities
  const eduGroups = new Map()
  
  entities.forEach(entity => {
    let groupKey = 'unknown'
    
    if (entity.field_name.toLowerCase().includes('institution') || entity.field_name.toLowerCase().includes('school')) {
      groupKey = `institution_${entity.raw_value || 'unknown'}`
    } else if (entity.field_name.toLowerCase().includes('degree')) {
      groupKey = `degree_${entity.raw_value || 'unknown'}`
    } else {
      groupKey = `general_${Math.floor(Math.random() * 1000)}`
    }
    
    if (!eduGroups.has(groupKey)) {
      eduGroups.set(groupKey, {})
    }
    
    const group = eduGroups.get(groupKey)
    
    if (entity.field_name.toLowerCase().includes('institution') || entity.field_name.toLowerCase().includes('school')) {
      group.institution = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('degree')) {
      group.degree = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('field')) {
      group.field_of_study = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('start')) {
      group.start_date = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('end') || entity.field_name.toLowerCase().includes('graduation')) {
      group.end_date = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('gpa')) {
      group.gpa = entity.raw_value
    }
  })

  for (const [key, eduData] of eduGroups) {
    try {
      if (eduData.institution || eduData.degree) {
        const { data, error } = await supabaseClient
          .from('education')
          .insert({
            user_id: userId,
            institution: eduData.institution || 'Unknown Institution',
            degree: eduData.degree || 'Unknown Degree',
            field_of_study: eduData.field_of_study || null,
            start_date: eduData.start_date || null,
            end_date: eduData.end_date || null,
            gpa: eduData.gpa || null,
            source: 'resume_upload',
            source_confidence: 0.8
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating education:', error)
          errors++
          details.push({
            entity_type: 'education',
            action: 'error',
            error: error.message
          })
        } else {
          created++
          details.push({
            entity_type: 'education',
            action: 'created',
            entity_id: data.logical_entity_id
          })
        }
      }
    } catch (err) {
      errors++
      details.push({
        entity_type: 'education',
        action: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  return { created, updated, errors, details }
}

async function processSkills(supabaseClient: any, userId: string, entities: any[]) {
  let created = 0
  let updated = 0
  let errors = 0
  const details = []

  for (const entity of entities) {
    try {
      if (entity.raw_value && entity.raw_value.trim()) {
        // Parse JSON if it looks like an array
        let skillNames = []
        try {
          const parsed = JSON.parse(entity.raw_value)
          if (Array.isArray(parsed)) {
            skillNames = parsed.filter(skill => skill && typeof skill === 'string')
          } else {
            skillNames = [String(parsed)]
          }
        } catch {
          skillNames = [entity.raw_value.trim()]
        }

        for (const skillName of skillNames) {
          if (skillName && skillName.trim()) {
            const { data, error } = await supabaseClient
              .from('skill')
              .insert({
                user_id: userId,
                name: skillName.trim(),
                category: entity.field_name.toLowerCase().includes('technical') ? 'technical' : 'general',
                source: 'resume_upload',
                source_confidence: entity.confidence_score || 0.8
              })
              .select()
              .single()

            if (error) {
              console.error('Error creating skill:', error)
              errors++
              details.push({
                entity_type: 'skill',
                action: 'error',
                error: error.message
              })
            } else {
              created++
              details.push({
                entity_type: 'skill',
                action: 'created',
                entity_id: data.logical_entity_id
              })
            }
          }
        }
      }
    } catch (err) {
      errors++
      details.push({
        entity_type: 'skill',
        action: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  return { created, updated, errors, details }
}

async function processProjects(supabaseClient: any, userId: string, entities: any[]) {
  let created = 0
  let updated = 0
  let errors = 0
  const details = []

  // Group project entities
  const projectGroups = new Map()
  
  entities.forEach(entity => {
    let groupKey = 'unknown'
    
    if (entity.field_name.toLowerCase().includes('name') || entity.field_name.toLowerCase().includes('title')) {
      groupKey = `project_${entity.raw_value || 'unknown'}`
    } else {
      groupKey = `general_${Math.floor(Math.random() * 1000)}`
    }
    
    if (!projectGroups.has(groupKey)) {
      projectGroups.set(groupKey, {})
    }
    
    const group = projectGroups.get(groupKey)
    
    if (entity.field_name.toLowerCase().includes('name') || entity.field_name.toLowerCase().includes('title')) {
      group.name = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('description')) {
      group.description = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('technology') || entity.field_name.toLowerCase().includes('tech')) {
      if (!group.technologies_used) {
        group.technologies_used = []
      }
      group.technologies_used.push(entity.raw_value)
    } else if (entity.field_name.toLowerCase().includes('url')) {
      group.project_url = entity.raw_value
    }
  })

  for (const [key, projectData] of projectGroups) {
    try {
      if (projectData.name) {
        const { data, error } = await supabaseClient
          .from('project')
          .insert({
            user_id: userId,
            name: projectData.name,
            description: projectData.description || null,
            technologies_used: projectData.technologies_used || null,
            project_url: projectData.project_url || null,
            source: 'resume_upload',
            source_confidence: 0.8
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating project:', error)
          errors++
          details.push({
            entity_type: 'project',
            action: 'error',
            error: error.message
          })
        } else {
          created++
          details.push({
            entity_type: 'project',
            action: 'created',
            entity_id: data.logical_entity_id
          })
        }
      }
    } catch (err) {
      errors++
      details.push({
        entity_type: 'project',
        action: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  return { created, updated, errors, details }
}

async function processCertifications(supabaseClient: any, userId: string, entities: any[]) {
  let created = 0
  let updated = 0
  let errors = 0
  const details = []

  // Group certification entities
  const certGroups = new Map()
  
  entities.forEach(entity => {
    let groupKey = 'unknown'
    
    if (entity.field_name.toLowerCase().includes('name') || entity.field_name.toLowerCase().includes('title')) {
      groupKey = `cert_${entity.raw_value || 'unknown'}`
    } else {
      groupKey = `general_${Math.floor(Math.random() * 1000)}`
    }
    
    if (!certGroups.has(groupKey)) {
      certGroups.set(groupKey, {})
    }
    
    const group = certGroups.get(groupKey)
    
    if (entity.field_name.toLowerCase().includes('name') || entity.field_name.toLowerCase().includes('title')) {
      group.name = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('issuer') || entity.field_name.toLowerCase().includes('organization')) {
      group.issuing_organization = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('issue_date')) {
      group.issue_date = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('expiration')) {
      group.expiration_date = entity.raw_value
    } else if (entity.field_name.toLowerCase().includes('credential_id')) {
      group.credential_id = entity.raw_value
    }
  })

  for (const [key, certData] of certGroups) {
    try {
      if (certData.name) {
        const { data, error } = await supabaseClient
          .from('certification')
          .insert({
            user_id: userId,
            name: certData.name,
            issuing_organization: certData.issuing_organization || 'Unknown Organization',
            issue_date: certData.issue_date || null,
            expiration_date: certData.expiration_date || null,
            credential_id: certData.credential_id || null,
            source: 'resume_upload',
            source_confidence: 0.8
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating certification:', error)
          errors++
          details.push({
            entity_type: 'certification',
            action: 'error',
            error: error.message
          })
        } else {
          created++
          details.push({
            entity_type: 'certification',
            action: 'created',
            entity_id: data.logical_entity_id
          })
        }
      }
    } catch (err) {
      errors++
      details.push({
        entity_type: 'certification',
        action: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  return { created, updated, errors, details }
}

async function processPersonalInfo(supabaseClient: any, userId: string, entities: any[]) {
  let created = 0
  let updated = 0
  let errors = 0
  const details = []

  // Process personal info by updating the user's profile
  const profileData = {}
  
  entities.forEach(entity => {
    const field = entity.field_name.toLowerCase()
    if (field.includes('name') && !field.includes('company')) {
      profileData.name = entity.raw_value
    } else if (field.includes('email')) {
      profileData.email = entity.raw_value
    }
  })

  if (Object.keys(profileData).length > 0) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        errors++
        details.push({
          entity_type: 'personal_info',
          action: 'error',
          error: error.message
        })
      } else {
        updated++
        details.push({
          entity_type: 'personal_info',
          action: 'updated',
          entity_id: data.id
        })
      }
    } catch (err) {
      errors++
      details.push({
        entity_type: 'personal_info',
        action: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  return { created, updated, errors, details }
}
