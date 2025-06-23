
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage - maps user ID to request timestamps
const rateLimitStore = new Map<string, number[]>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  
  // Remove timestamps older than the window
  const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
  
  // Check if user has exceeded the rate limit
  if (validRequests.length >= MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  // Add current request timestamp
  validRequests.push(now);
  rateLimitStore.set(userId, validRequests);
  
  return true; // Request allowed
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      console.log(`Rate limit exceeded for user: ${user.id}`);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Maximum 5 requests per minute allowed.',
        retryAfter: 60
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        },
      });
    }

    console.log('Creating interview session for user:', user.id);

    // Fetch the active system prompt from the database
    const { data: systemPrompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('prompt')
      .eq('is_active', true)
      .single();

    if (promptError) {
      console.error('Error fetching system prompt:', promptError);
      // Fallback to default prompt if no active prompt is found
    }

    const instructions = systemPrompt?.prompt || 'You are a friendly, professional career interviewer. Ask thoughtful questions about the user\'s background, experience, and career goals. Keep questions conversational and ask one at a time. Be encouraging and show genuine interest in their responses.';

    console.log('Using system prompt:', instructions.substring(0, 100) + '...');

    // Create session with OpenAI Realtime API
    const openAIResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: instructions,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to create OpenAI session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAISession = await openAIResponse.json();
    console.log('OpenAI session created:', openAISession.id);

    // Create interview session in Supabase
    const { data: sessionData, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        session_id: openAISession.id,
        status: 'created',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Database error:', sessionError);
      return new Response(JSON.stringify({ error: 'Failed to create session record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Interview session created in database:', sessionData.id);

    return new Response(JSON.stringify({
      sessionId: sessionData.id,
      openAISessionId: openAISession.id,
      clientSecret: openAISession.client_secret.value,
      systemPrompt: instructions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-interview-session function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
