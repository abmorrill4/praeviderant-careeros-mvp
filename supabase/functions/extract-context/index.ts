
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript, interviewType, promptTemplate } = await req.json();
    
    if (!transcript || !interviewType) {
      throw new Error('Transcript and interview type are required');
    }

    console.log(`Extracting context for ${interviewType}:`, transcript);

    // Create a structured prompt for context extraction
    const systemPrompt = `You are an AI assistant specialized in extracting structured information from interview transcripts for resume building. Extract key information from the user's response and format it as JSON.

For ${interviewType} interviews, focus on extracting:
- Key points and achievements
- Specific details and metrics
- Relevant skills and technologies
- Important dates and durations
- Notable accomplishments

Return a JSON object with the following structure:
{
  "summary": "A concise summary of the main points",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "details": {
    "skills": ["Skill 1", "Skill 2"],
    "achievements": ["Achievement 1", "Achievement 2"],
    "metrics": ["Metric 1", "Metric 2"]
  },
  "rawTranscript": "The original transcript"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Interview Type: ${interviewType}\n\nPrompt: ${promptTemplate}\n\nTranscript: ${transcript}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const extractedContent = result.choices[0].message.content;

    console.log('Context extraction successful');

    try {
      // Try to parse as JSON
      const parsedContext = JSON.parse(extractedContent);
      return new Response(
        JSON.stringify({ extractedContext: parsedContext }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (parseError) {
      // If JSON parsing fails, return as structured text
      console.log('JSON parsing failed, returning as structured text');
      return new Response(
        JSON.stringify({ 
          extractedContext: {
            summary: extractedContent,
            keyPoints: [],
            details: {},
            rawTranscript: transcript
          }
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

  } catch (error) {
    console.error('Error in extract-context function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
