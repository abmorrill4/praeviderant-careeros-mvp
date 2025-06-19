
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface ExtractedProfile {
  summary?: string;
  current_title?: string;
  current_company?: string;
  jobs?: Array<{
    title: string;
    company: string;
    start_date?: string;
    end_date?: string;
    description?: string;
    impact?: string;
    tools_used?: string[];
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { interviewId, userId } = await req.json();
    
    if (!interviewId || !userId) {
      throw new Error('Interview ID and User ID are required');
    }

    console.log(`Processing interview ${interviewId} for user ${userId}`);

    // 1. Get the interview transcript
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('transcript, processed')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single();

    if (interviewError || !interview) {
      throw new Error(`Interview not found: ${interviewError?.message}`);
    }

    if (interview.processed) {
      return new Response(
        JSON.stringify({ message: 'Interview already processed' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!interview.transcript) {
      throw new Error('No transcript available for processing');
    }

    console.log('Extracting career data using OpenAI...');

    // 2. Use OpenAI function calling to extract structured career data
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a career data extraction specialist. Extract structured career information from interview transcripts. 
            
            Rules:
            - Extract only factual information explicitly mentioned
            - For dates, preserve the format given (e.g., "2019", "Jan 2020", "2020-2025")
            - Include specific tools, technologies, and skills mentioned
            - Extract quantifiable impact when mentioned
            - Only include jobs with clear role and company information
            - Distinguish between current and past roles
            - Extract a professional summary if the person describes their background
            
            Be conservative - only extract what is clearly stated.`
          },
          {
            role: 'user',
            content: `Extract career information from this interview transcript:\n\n${interview.transcript}`
          }
        ],
        functions: [
          {
            name: 'extract_career_profile',
            description: 'Extract structured career profile from interview transcript',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'Professional summary or background overview'
                },
                current_title: {
                  type: 'string',
                  description: 'Current job title'
                },
                current_company: {
                  type: 'string',
                  description: 'Current company name'
                },
                jobs: {
                  type: 'array',
                  description: 'Job history including current role',
                  items: {
                    type: 'object',
                    properties: {
                      title: {
                        type: 'string',
                        description: 'Job title'
                      },
                      company: {
                        type: 'string',
                        description: 'Company name'
                      },
                      start_date: {
                        type: 'string',
                        description: 'Start date (preserve original format)'
                      },
                      end_date: {
                        type: 'string',
                        description: 'End date (preserve original format, null for current role)'
                      },
                      description: {
                        type: 'string',
                        description: 'Role description and responsibilities'
                      },
                      impact: {
                        type: 'string',
                        description: 'Quantifiable achievements and impact'
                      },
                      tools_used: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Tools, technologies, frameworks mentioned'
                      }
                    },
                    required: ['title', 'company']
                  }
                }
              }
            }
          }
        ],
        function_call: { name: 'extract_career_profile' },
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received');
    
    if (!aiResponse.choices?.[0]?.message?.function_call?.arguments) {
      throw new Error('No function call response from OpenAI');
    }

    const extractedProfile: ExtractedProfile = JSON.parse(aiResponse.choices[0].message.function_call.arguments);
    console.log('Extracted profile:', extractedProfile);

    // 3. Get existing user profile data
    const [existingProfile, existingJobs] = await Promise.all([
      supabase
        .from('career_profile')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ]);

    console.log('Existing profile found:', !!existingProfile.data);
    console.log('Existing jobs count:', existingJobs.data?.length || 0);

    // 4. Detect and store profile deltas
    const deltas = [];

    // Compare profile fields
    if (extractedProfile.summary && extractedProfile.summary !== existingProfile.data?.summary) {
      deltas.push({
        user_id: userId,
        source_interview: interviewId,
        entity_type: 'summary',
        field: null,
        original_value: existingProfile.data?.summary || null,
        new_value: extractedProfile.summary,
        status: 'unresolved'
      });
    }

    if (extractedProfile.current_title && extractedProfile.current_title !== existingProfile.data?.current_title) {
      deltas.push({
        user_id: userId,
        source_interview: interviewId,
        entity_type: 'current_title',
        field: null,
        original_value: existingProfile.data?.current_title || null,
        new_value: extractedProfile.current_title,
        status: 'unresolved'
      });
    }

    if (extractedProfile.current_company && extractedProfile.current_company !== existingProfile.data?.current_company) {
      deltas.push({
        user_id: userId,
        source_interview: interviewId,
        entity_type: 'current_company',
        field: null,
        original_value: existingProfile.data?.current_company || null,
        new_value: extractedProfile.current_company,
        status: 'unresolved'
      });
    }

    // Compare jobs - simplified approach: detect new jobs not in existing records
    if (extractedProfile.jobs && extractedProfile.jobs.length > 0) {
      const existingJobsData = existingJobs.data || [];
      
      for (const extractedJob of extractedProfile.jobs) {
        // Check if this job already exists (match by title and company)
        const existingJob = existingJobsData.find(
          job => job.title === extractedJob.title && job.company === extractedJob.company
        );

        if (!existingJob) {
          // New job detected
          deltas.push({
            user_id: userId,
            source_interview: interviewId,
            entity_type: 'job',
            field: 'new_job',
            original_value: null,
            new_value: JSON.stringify(extractedJob),
            status: 'unresolved'
          });
        } else {
          // Check for differences in existing job fields
          const jobFields = ['start_date', 'end_date', 'description', 'impact'];
          for (const field of jobFields) {
            const extractedValue = extractedJob[field as keyof typeof extractedJob];
            const existingValue = existingJob[field];
            
            if (extractedValue && extractedValue !== existingValue) {
              deltas.push({
                user_id: userId,
                source_interview: interviewId,
                entity_type: 'job',
                field: `${existingJob.id}_${field}`,
                original_value: existingValue || null,
                new_value: extractedValue,
                status: 'unresolved'
              });
            }
          }

          // Check tools_used array
          if (extractedJob.tools_used && extractedJob.tools_used.length > 0) {
            const existingTools = existingJob.tools_used || [];
            const newTools = extractedJob.tools_used.filter(tool => !existingTools.includes(tool));
            
            if (newTools.length > 0) {
              deltas.push({
                user_id: userId,
                source_interview: interviewId,
                entity_type: 'job',
                field: `${existingJob.id}_tools_used`,
                original_value: JSON.stringify(existingTools),
                new_value: JSON.stringify([...existingTools, ...newTools]),
                status: 'unresolved'
              });
            }
          }
        }
      }
    }

    console.log(`Detected ${deltas.length} profile deltas`);

    // 5. Store deltas in database
    if (deltas.length > 0) {
      const { error: deltaError } = await supabase
        .from('profile_deltas')
        .insert(deltas);

      if (deltaError) {
        console.error('Error storing deltas:', deltaError);
        throw new Error(`Failed to store profile deltas: ${deltaError.message}`);
      }
    }

    // 6. Store extracted context in interviews table
    const { error: updateError } = await supabase
      .from('interviews')
      .update({
        extracted_context: extractedProfile,
        processed: true
      })
      .eq('id', interviewId);

    if (updateError) {
      console.error('Error updating interview:', updateError);
      throw new Error(`Failed to update interview: ${updateError.message}`);
    }

    // 7. If no existing profile, create one with extracted data
    if (!existingProfile.data && (extractedProfile.summary || extractedProfile.current_title || extractedProfile.current_company)) {
      const { error: profileError } = await supabase
        .from('career_profile')
        .insert({
          user_id: userId,
          summary: extractedProfile.summary,
          current_title: extractedProfile.current_title,
          current_company: extractedProfile.current_company
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        console.log('Created new career profile for user');
      }
    }

    // 8. Store new jobs if detected
    const newJobs = deltas.filter(d => d.entity_type === 'job' && d.field === 'new_job');
    if (newJobs.length > 0) {
      const jobsToInsert = newJobs.map(delta => {
        const job = JSON.parse(delta.new_value);
        return {
          user_id: userId,
          title: job.title,
          company: job.company,
          start_date: job.start_date,
          end_date: job.end_date,
          description: job.description,
          impact: job.impact,
          tools_used: job.tools_used
        };
      });

      const { error: jobsError } = await supabase
        .from('jobs')
        .insert(jobsToInsert);

      if (jobsError) {
        console.error('Error storing new jobs:', jobsError);
      } else {
        console.log(`Stored ${jobsToInsert.length} new jobs`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Interview processed successfully',
        extractedProfile,
        deltasCount: deltas.length,
        newJobsCount: newJobs.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing interview:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
