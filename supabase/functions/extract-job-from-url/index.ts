import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobExtractionRequest {
  url: string;
  userId: string;
}

interface ExtractedJobData {
  title: string;
  company: string;
  location?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: 'hourly' | 'monthly' | 'yearly';
  };
  benefits?: string[];
  workType?: 'remote' | 'hybrid' | 'onsite';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  industry?: string;
  extractedAt: string;
}

async function extractJobFromUrl(url: string): Promise<ExtractedJobData> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Fetch the webpage content
  console.log('Fetching webpage:', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch webpage: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  
  // Extract text content from HTML (basic text extraction)
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Limit content length to avoid token limits
  const limitedContent = textContent.length > 8000 
    ? textContent.substring(0, 8000) + '...' 
    : textContent;

  const systemPrompt = `You are a job posting analyzer. Extract structured information from job postings and return it in the specified JSON format.

IMPORTANT: You must return ONLY a valid JSON object with the exact structure specified. Do not include any explanation or additional text.

Extract the following information:
- title: Job title
- company: Company name
- location: Location (if specified)
- description: Full job description
- requirements: Array of job requirements
- responsibilities: Array of job responsibilities
- qualifications: Array of qualifications needed
- skills: Array of skills mentioned
- salary: Object with min, max, currency, period (if mentioned)
- benefits: Array of benefits mentioned
- workType: "remote", "hybrid", or "onsite" (if specified)
- experienceLevel: "entry", "mid", "senior", or "executive" (if determinable)
- industry: Industry sector (if determinable)
- extractedAt: Current timestamp in ISO format

If any field cannot be determined, use appropriate defaults (empty arrays for arrays, null for optional fields).`;

  const userPrompt = `Please extract job information from this webpage content:

URL: ${url}

Content:
${limitedContent}

Return the extracted information as a JSON object with the structure specified in the system prompt.`;

  console.log('Sending request to OpenAI for job extraction');

  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    throw new Error(`OpenAI API error: ${aiResponse.status} - ${errorText}`);
  }

  const result = await aiResponse.json();
  const extractedContent = result.choices[0].message.content;

  try {
    const jobData = JSON.parse(extractedContent);
    
    // Ensure extractedAt is set
    jobData.extractedAt = new Date().toISOString();
    
    // Validate required fields
    if (!jobData.title || !jobData.company || !jobData.description) {
      throw new Error('Missing required job information');
    }

    return jobData;
  } catch (parseError) {
    console.error('Failed to parse extracted job JSON:', extractedContent);
    throw new Error('Failed to extract valid job information from the webpage');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody: JobExtractionRequest = await req.json();
    
    if (!requestBody.url || !requestBody.userId) {
      throw new Error('Missing required parameters: url and userId');
    }

    // Validate URL format
    try {
      new URL(requestBody.url);
    } catch {
      throw new Error('Invalid URL format');
    }

    console.log('Extracting job from URL:', requestBody.url, 'for user:', requestBody.userId);

    const extractedJob = await extractJobFromUrl(requestBody.url);

    const response = {
      success: true,
      data: extractedJob,
      confidence: 0.85, // Default confidence score
    };

    console.log('Successfully extracted job information');

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in extract-job-from-url function:', error);

    const response = {
      success: false,
      error: error.message || 'An unexpected error occurred',
      confidence: 0,
    };

    return new Response(
      JSON.stringify(response),
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