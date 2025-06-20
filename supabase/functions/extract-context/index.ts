
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

    // Create a sophisticated Chain-of-Thought prompt with Few-Shot examples
    const systemPrompt = `You are an AI assistant specialized in extracting structured information from interview transcripts for resume building. Your task is to analyze the user's response and extract key information in a structured JSON format.

REASONING PROCESS (Chain-of-Thought):
1. First, identify the main topic being discussed
2. Extract specific facts, achievements, and quantifiable metrics
3. Categorize information into relevant sections
4. Structure the output according to the required JSON format
5. Ensure all extracted information is accurate and relevant

Here are two complete examples to guide your analysis:

EXAMPLE 1 - Work Experience:
Transcript: "I worked at Google as a Senior Software Engineer from January 2020 to March 2023. I led a team of 5 engineers developing machine learning algorithms for the search ranking system. We improved search relevance by 15% and reduced query latency by 200ms. I used Python, TensorFlow, and Go extensively. One of my biggest achievements was designing a new caching layer that handled 50 million requests per day."

Chain-of-Thought Analysis:
1. Topic: Work experience at Google
2. Key facts: Company (Google), Title (Senior Software Engineer), Duration (Jan 2020 - Mar 2023)
3. Achievements: Led team of 5, improved search relevance 15%, reduced latency 200ms, designed caching layer for 50M requests/day
4. Skills: Python, TensorFlow, Go, machine learning, team leadership
5. Structure: Map to WorkExperience format

JSON Output:
{
  "summary": "Senior Software Engineer at Google leading ML search improvements",
  "keyPoints": [
    "Led team of 5 engineers developing ML algorithms for search ranking",
    "Improved search relevance by 15% and reduced query latency by 200ms",
    "Designed caching layer handling 50 million requests per day"
  ],
  "details": {
    "skills": ["Python", "TensorFlow", "Go", "Machine Learning", "Team Leadership"],
    "achievements": [
      "Improved search relevance by 15%",
      "Reduced query latency by 200ms",
      "Led team of 5 engineers",
      "Designed caching layer for 50M daily requests"
    ],
    "metrics": ["15% improvement", "200ms latency reduction", "5 team members", "50 million requests/day"]
  },
  "workExperience": {
    "company": "Google",
    "title": "Senior Software Engineer",
    "startDate": "January 2020",
    "endDate": "March 2023",
    "description": "Led a team of 5 engineers developing machine learning algorithms for the search ranking system. Improved search relevance by 15% and reduced query latency by 200ms. Designed a new caching layer that handled 50 million requests per day."
  },
  "rawTranscript": "I worked at Google as a Senior Software Engineer from January 2020 to March 2023. I led a team of 5 engineers developing machine learning algorithms for the search ranking system. We improved search relevance by 15% and reduced query latency by 200ms. I used Python, TensorFlow, and Go extensively. One of my biggest achievements was designing a new caching layer that handled 50 million requests per day."
}

EXAMPLE 2 - Skills:
Transcript: "I'm really proficient in React and have been using it for about 4 years now. I also know Node.js quite well, been working with it for 3 years. I'm comfortable with TypeScript, PostgreSQL, and AWS. I'd say I'm an expert in React, advanced in Node.js and TypeScript, and intermediate in PostgreSQL and AWS. I've built several full-stack applications and deployed them to production."

Chain-of-Thought Analysis:
1. Topic: Technical skills and proficiency levels
2. Key facts: React (4 years, expert), Node.js (3 years, advanced), TypeScript (advanced), PostgreSQL (intermediate), AWS (intermediate)
3. Experience indicators: Years of experience, self-assessed proficiency levels
4. Context: Full-stack development, production deployments
5. Structure: Map to Skills format with categories and proficiency levels

JSON Output:
{
  "summary": "Full-stack developer with 4+ years React experience and strong backend skills",
  "keyPoints": [
    "Expert in React with 4 years of experience",
    "Advanced in Node.js and TypeScript with 3+ years experience",
    "Intermediate proficiency in PostgreSQL and AWS",
    "Built and deployed full-stack applications to production"
  ],
  "details": {
    "skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Full-stack Development"],
    "achievements": [
      "Built several full-stack applications",
      "Deployed applications to production",
      "4 years of React development experience"
    ],
    "metrics": ["4 years React experience", "3 years Node.js experience"]
  },
  "skills": [
    {
      "name": "React",
      "category": "Frontend",
      "proficiencyLevel": "Expert",
      "yearsOfExperience": 4
    },
    {
      "name": "Node.js",
      "category": "Backend",
      "proficiencyLevel": "Advanced",
      "yearsOfExperience": 3
    },
    {
      "name": "TypeScript",
      "category": "Programming Language",
      "proficiencyLevel": "Advanced",
      "yearsOfExperience": 3
    },
    {
      "name": "PostgreSQL",
      "category": "Database",
      "proficiencyLevel": "Intermediate",
      "yearsOfExperience": 2
    },
    {
      "name": "AWS",
      "category": "Cloud Platform",
      "proficiencyLevel": "Intermediate",
      "yearsOfExperience": 2
    }
  ],
  "rawTranscript": "I'm really proficient in React and have been using it for about 4 years now. I also know Node.js quite well, been working with it for 3 years. I'm comfortable with TypeScript, PostgreSQL, and AWS. I'd say I'm an expert in React, advanced in Node.js and TypeScript, and intermediate in PostgreSQL and AWS. I've built several full-stack applications and deployed them to production."
}

Now analyze the following transcript using the same Chain-of-Thought reasoning approach:

For ${interviewType} interviews, focus on extracting:
- Key points and achievements
- Specific details and quantifiable metrics
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
}

If the transcript contains work experience information, include a "workExperience" object.
If the transcript contains skills information, include a "skills" array with detailed skill objects.
If the transcript contains education information, include an "education" object.
If the transcript contains project information, include a "projects" array.

Think step by step and provide detailed, accurate extraction.`;

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
          { role: 'user', content: `Interview Type: ${interviewType}\n\nPrompt: ${promptTemplate}\n\nTranscript: ${transcript}\n\nPlease analyze this transcript step by step and extract the structured information.` }
        ],
        temperature: 0.2,
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
