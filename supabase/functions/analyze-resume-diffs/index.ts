
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { versionId } = await req.json();

    if (!versionId) {
      return new Response(JSON.stringify({ error: 'Missing versionId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting semantic diff analysis for version:', versionId);

    // Get parsed resume entities
    const { data: entities, error: entitiesError } = await supabase
      .from('parsed_resume_entities')
      .select('*')
      .eq('resume_version_id', versionId);

    if (entitiesError) {
      console.error('Error fetching parsed entities:', entitiesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch parsed entities' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's confirmed profile data
    const { data: confirmedProfile, error: profileError } = await supabase
      .from('user_confirmed_profile')
      .select('*')
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error fetching confirmed profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to fetch profile data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analyze each entity and create diffs
    const diffs = [];
    
    for (const entity of entities) {
      // Find matching profile entities by semantic similarity
      const matchingProfileEntities = confirmedProfile.filter(p => 
        p.entity_type === entity.field_name.split('.')[0] ||
        p.field_name.toLowerCase().includes(entity.field_name.toLowerCase())
      );

      let diffType: 'identical' | 'equivalent' | 'conflicting' | 'new' = 'new';
      let similarityScore = 0;
      let confidenceScore = entity.confidence_score || 0;
      let justification = 'New entity from resume not found in confirmed profile';
      let requiresReview = false;
      let profileEntityId = null;
      let profileEntityType = null;

      if (matchingProfileEntities.length > 0) {
        // Use OpenAI to compare semantic similarity
        const bestMatch = matchingProfileEntities[0]; // Simplified - in reality, you'd compare all
        
        try {
          const comparisonPrompt = `
            Compare these two pieces of career information and determine their semantic similarity:
            
            Resume Entity: "${entity.raw_value}"
            Profile Entity: "${bestMatch.confirmed_value}"
            
            Respond with a JSON object containing:
            - similarity_score: number between 0 and 1
            - diff_type: one of "identical", "equivalent", "conflicting", "new"
            - justification: brief explanation of the comparison
            - requires_review: boolean indicating if human review is needed
          `;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { 
                  role: 'system', 
                  content: 'You are an AI assistant that compares career information for semantic similarity. Always respond with valid JSON.' 
                },
                { role: 'user', content: comparisonPrompt }
              ],
              temperature: 0.1,
            }),
          });

          if (response.ok) {
            const aiResult = await response.json();
            const analysis = JSON.parse(aiResult.choices[0].message.content);
            
            diffType = analysis.diff_type;
            similarityScore = analysis.similarity_score;
            justification = analysis.justification;
            requiresReview = analysis.requires_review;
            profileEntityId = bestMatch.entity_id;
            profileEntityType = bestMatch.entity_type;
          }
        } catch (aiError) {
          console.error('Error with AI comparison:', aiError);
          // Fallback to simple string comparison
          const entityLower = entity.raw_value.toLowerCase();
          const profileLower = bestMatch.confirmed_value.toLowerCase();
          
          if (entityLower === profileLower) {
            diffType = 'identical';
            similarityScore = 1.0;
            justification = 'Exact text match found';
          } else if (entityLower.includes(profileLower) || profileLower.includes(entityLower)) {
            diffType = 'equivalent';
            similarityScore = 0.8;
            justification = 'Partial text match found - likely equivalent';
          } else {
            diffType = 'conflicting';
            similarityScore = 0.3;
            justification = 'Different values found - requires review';
            requiresReview = true;
          }
          
          profileEntityId = bestMatch.entity_id;
          profileEntityType = bestMatch.entity_type;
        }
      }

      // Create or update the diff record
      const { error: diffError } = await supabase
        .from('resume_diffs')
        .upsert({
          resume_version_id: versionId,
          parsed_entity_id: entity.id,
          profile_entity_id: profileEntityId,
          profile_entity_type: profileEntityType,
          diff_type: diffType,
          similarity_score: similarityScore,
          confidence_score: confidenceScore,
          justification,
          requires_review: requiresReview,
          metadata: {
            entity_field: entity.field_name,
            analysis_timestamp: new Date().toISOString()
          }
        });

      if (diffError) {
        console.error('Error creating diff:', diffError);
      } else {
        diffs.push({
          diff_type: diffType,
          similarity_score: similarityScore,
          requires_review: requiresReview
        });
      }
    }

    // Calculate summary statistics
    const summary = {
      total: diffs.length,
      identical: diffs.filter(d => d.diff_type === 'identical').length,
      equivalent: diffs.filter(d => d.diff_type === 'equivalent').length,
      conflicting: diffs.filter(d => d.diff_type === 'conflicting').length,
      new: diffs.filter(d => d.diff_type === 'new').length,
      requiresReview: diffs.filter(d => d.requires_review).length,
    };

    console.log('Semantic diff analysis completed:', summary);

    return new Response(JSON.stringify({
      diffs,
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-resume-diffs function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
