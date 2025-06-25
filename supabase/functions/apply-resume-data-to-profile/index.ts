
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
  if (fieldName.includes('work_') || fieldName.includes('job_') || fieldName.includes('employment_')) {
    return 'work_experience'
  } else if (fieldName.includes('education_') || fieldName.includes('degree_') || fieldName.includes('school_')) {
    return 'education'
  } else if (fieldName.includes('skill_') || fieldName.includes('technology_')) {
    return 'skills'
  } else if (fieldName.includes('project_')) {
    return 'projects'
  } else if (fieldName.includes('certification_') || fieldName.includes('certificate_')) {
    return 'certifications'
  }
  return 'other'
}

async function processWorkExperience(supabaseClient: any, userId: string, entities: any[]) {
  let created = 0
  let updated = 0
  let errors = 0
  const details = []

  // Group work experience entities by company/title combinations
  const workGroups = new Map()
  
  entities.forEach(entity => {
    const key = `${entity.raw_value || 'unknown'}_${entity.field_name}`
    if (!workGroups.has(key)) {
      workGroups.set(key, {})
    }
    
    if (entity.field_name.includes('company')) {
      workGroups.get(key).company = entity.raw_value
    } else if (entity.field_name.includes('title') || entity.field_name.includes('position')) {
      workGroups.get(key).title = entity.raw_value
    } else if (entity.field_name.includes('start_date')) {
      workGroups.get(key).start_date = entity.raw_value
    } else if (entity.field_name.includes('end_date')) {
      workGroups.get(key).end_date = entity.raw_value
    } else if (entity.field_name.includes('description')) {
      workGroups.get(key).description = entity.raw_value
    }
  })

  for (const [key, workData] of workGroups) {
    try {
      if (workData.company && workData.title) {
        const { data, error } = await supabaseClient
          .from('work_experience')
          .insert({
            user_id: userId,
            company: workData.company,
            title: workData.title,
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
    const key = `${entity.raw_value || 'unknown'}_${entity.field_name}`
    if (!eduGroups.has(key)) {
      eduGroups.set(key, {})
    }
    
    if (entity.field_name.includes('institution') || entity.field_name.includes('school')) {
      eduGroups.get(key).institution = entity.raw_value
    } else if (entity.field_name.includes('degree')) {
      eduGroups.get(key).degree = entity.raw_value
    } else if (entity.field_name.includes('field')) {
      eduGroups.get(key).field_of_study = entity.raw_value
    } else if (entity.field_name.includes('start_date')) {
      eduGroups.get(key).start_date = entity.raw_value
    } else if (entity.field_name.includes('end_date') || entity.field_name.includes('graduation')) {
      eduGroups.get(key).end_date = entity.raw_value
    } else if (entity.field_name.includes('gpa')) {
      eduGroups.get(key).gpa = entity.raw_value
    }
  })

  for (const [key, eduData] of eduGroups) {
    try {
      if (eduData.institution && eduData.degree) {
        const { data, error } = await supabaseClient
          .from('education')
          .insert({
            user_id: userId,
            institution: eduData.institution,
            degree: eduData.degree,
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
        const { data, error } = await supabaseClient
          .from('skill')
          .insert({
            user_id: userId,
            name: entity.raw_value.trim(),
            category: entity.field_name.includes('technical') ? 'technical' : 'general',
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
    const key = `${entity.raw_value || 'unknown'}_${entity.field_name}`
    if (!projectGroups.has(key)) {
      projectGroups.set(key, {})
    }
    
    if (entity.field_name.includes('name') || entity.field_name.includes('title')) {
      projectGroups.get(key).name = entity.raw_value
    } else if (entity.field_name.includes('description')) {
      projectGroups.get(key).description = entity.raw_value
    } else if (entity.field_name.includes('technology') || entity.field_name.includes('tech')) {
      if (!projectGroups.get(key).technologies_used) {
        projectGroups.get(key).technologies_used = []
      }
      projectGroups.get(key).technologies_used.push(entity.raw_value)
    } else if (entity.field_name.includes('url')) {
      projectGroups.get(key).project_url = entity.raw_value
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
    const key = `${entity.raw_value || 'unknown'}_${entity.field_name}`
    if (!certGroups.has(key)) {
      certGroups.set(key, {})
    }
    
    if (entity.field_name.includes('name') || entity.field_name.includes('title')) {
      certGroups.get(key).name = entity.raw_value
    } else if (entity.field_name.includes('issuer') || entity.field_name.includes('organization')) {
      certGroups.get(key).issuing_organization = entity.raw_value
    } else if (entity.field_name.includes('issue_date')) {
      certGroups.get(key).issue_date = entity.raw_value
    } else if (entity.field_name.includes('expiration')) {
      certGroups.get(key).expiration_date = entity.raw_value
    } else if (entity.field_name.includes('credential_id')) {
      certGroups.get(key).credential_id = entity.raw_value
    }
  })

  for (const [key, certData] of certGroups) {
    try {
      if (certData.name && certData.issuing_organization) {
        const { data, error } = await supabaseClient
          .from('certification')
          .insert({
            user_id: userId,
            name: certData.name,
            issuing_organization: certData.issuing_organization,
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
