
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define function schemas that match our database tables
const functionSchemas = {
  extractWorkExperience: {
    name: "extract_work_experience",
    description: "Extract work experience information from interview transcript",
    parameters: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: "The company name"
        },
        title: {
          type: "string", 
          description: "The job title/position"
        },
        start_date: {
          type: "string",
          description: "Start date in a readable format (e.g., 'January 2020', '2020', 'Jan 2020')"
        },
        end_date: {
          type: "string",
          description: "End date in a readable format, or 'Present' if currently employed"
        },
        description: {
          type: "string",
          description: "Detailed description of responsibilities, achievements, and impact"
        }
      },
      required: ["company", "title"]
    }
  },
  
  extractEducation: {
    name: "extract_education",
    description: "Extract education information from interview transcript",
    parameters: {
      type: "object",
      properties: {
        institution: {
          type: "string",
          description: "The educational institution name"
        },
        degree: {
          type: "string",
          description: "The degree type (e.g., Bachelor's, Master's, PhD)"
        },
        field_of_study: {
          type: "string",
          description: "The field of study or major"
        },
        start_date: {
          type: "string",
          description: "Start date in a readable format"
        },
        end_date: {
          type: "string",
          description: "End date in a readable format"
        },
        gpa: {
          type: "string",
          description: "GPA if mentioned"
        },
        description: {
          type: "string",
          description: "Additional details about coursework, achievements, etc."
        }
      },
      required: ["institution", "degree"]
    }
  },

  extractSkills: {
    name: "extract_skills",
    description: "Extract skills information from interview transcript",
    parameters: {
      type: "object",
      properties: {
        skills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The skill name"
              },
              category: {
                type: "string",
                description: "Skill category (e.g., 'Programming Language', 'Framework', 'Tool', 'Soft Skill')"
              },
              proficiency_level: {
                type: "string",
                description: "Proficiency level (e.g., 'Beginner', 'Intermediate', 'Advanced', 'Expert')"
              },
              years_of_experience: {
                type: "number",
                description: "Years of experience with this skill"
              }
            },
            required: ["name"]
          }
        }
      },
      required: ["skills"]
    }
  },

  extractProjects: {
    name: "extract_projects",
    description: "Extract project information from interview transcript",
    parameters: {
      type: "object",
      properties: {
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The project name"
              },
              description: {
                type: "string",
                description: "Project description and what was accomplished"
              },
              technologies_used: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Technologies, frameworks, or tools used"
              },
              start_date: {
                type: "string",
                description: "Project start date"
              },
              end_date: {
                type: "string",
                description: "Project end date"
              },
              project_url: {
                type: "string",
                description: "URL to the live project if available"
              },
              repository_url: {
                type: "string",
                description: "URL to the code repository if available"
              }
            },
            required: ["name"]
          }
        }
      },
      required: ["projects"]
    }
  },

  extractCertifications: {
    name: "extract_certifications",
    description: "Extract certification information from interview transcript",
    parameters: {
      type: "object",
      properties: {
        certifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The certification name"
              },
              issuing_organization: {
                type: "string",
                description: "The organization that issued the certification"
              },
              issue_date: {
                type: "string",
                description: "Date the certification was issued"
              },
              expiration_date: {
                type: "string",
                description: "Expiration date if applicable"
              },
              credential_id: {
                type: "string",
                description: "Credential ID if provided"
              },
              credential_url: {
                type: "string",
                description: "URL to verify the credential"
              }
            },
            required: ["name", "issuing_organization"]
          }
        }
      },
      required: ["certifications"]
    }
  },

  extractGeneralContext: {
    name: "extract_general_context",
    description: "Extract general context and summary information from interview transcript",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "A concise summary of the main points discussed"
        },
        keyPoints: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Key points and important information extracted"
        },
        achievements: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Notable achievements and accomplishments mentioned"
        },
        metrics: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Quantifiable metrics and numbers mentioned"
        }
      },
      required: ["summary", "keyPoints"]
    }
  }
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

    // Determine which functions to use based on interview type
    let availableFunctions = [];
    
    switch (interviewType.toLowerCase()) {
      case 'work_experience':
      case 'work experience':
      case 'job history':
        availableFunctions = [functionSchemas.extractWorkExperience, functionSchemas.extractGeneralContext];
        break;
      case 'education':
      case 'academic':
        availableFunctions = [functionSchemas.extractEducation, functionSchemas.extractGeneralContext];
        break;
      case 'skills':
      case 'technical skills':
        availableFunctions = [functionSchemas.extractSkills, functionSchemas.extractGeneralContext];
        break;
      case 'projects':
      case 'portfolio':
        availableFunctions = [functionSchemas.extractProjects, functionSchemas.extractGeneralContext];
        break;
      case 'certifications':
      case 'credentials':
        availableFunctions = [functionSchemas.extractCertifications, functionSchemas.extractGeneralContext];
        break;
      default:
        // For general interviews, use all functions
        availableFunctions = Object.values(functionSchemas);
        break;
    }

    const systemPrompt = `You are an AI assistant specialized in extracting structured information from interview transcripts for resume building.

Your task is to analyze the user's response and extract relevant information using the provided function calls. 

Guidelines:
1. Call the appropriate extraction function(s) based on the content discussed
2. Extract specific facts, achievements, and quantifiable metrics
3. Ensure all extracted information is accurate and comes directly from the transcript
4. For dates, use readable formats (e.g., "January 2020", "2020-2023", "Present")
5. Be comprehensive but accurate - don't infer information not explicitly stated

For ${interviewType} interviews, focus on extracting relevant information and always call the extract_general_context function to provide a summary.`;

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
          { 
            role: 'user', 
            content: `Interview Type: ${interviewType}\n\nPrompt: ${promptTemplate}\n\nTranscript: ${transcript}\n\nPlease analyze this transcript and extract the structured information using the appropriate function calls.` 
          }
        ],
        functions: availableFunctions,
        function_call: "auto",
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const message = result.choices[0].message;

    console.log('OpenAI response:', JSON.stringify(message, null, 2));

    let extractedContext = {
      summary: "",
      keyPoints: [],
      details: {
        skills: [],
        achievements: [],
        metrics: []
      },
      rawTranscript: transcript
    };

    // Process function calls if present
    if (message.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments);

      console.log(`Function called: ${functionName}`, functionArgs);

      switch (functionName) {
        case 'extract_work_experience':
          extractedContext.workExperience = functionArgs;
          extractedContext.summary = `Work experience at ${functionArgs.company} as ${functionArgs.title}`;
          extractedContext.keyPoints.push(`${functionArgs.title} at ${functionArgs.company}`);
          if (functionArgs.description) {
            extractedContext.details.achievements.push(functionArgs.description);
          }
          break;

        case 'extract_education':
          extractedContext.education = functionArgs;
          extractedContext.summary = `Education: ${functionArgs.degree} from ${functionArgs.institution}`;
          extractedContext.keyPoints.push(`${functionArgs.degree} from ${functionArgs.institution}`);
          break;

        case 'extract_skills':
          extractedContext.skills = functionArgs.skills;
          extractedContext.summary = `Skills: ${functionArgs.skills.map(s => s.name).join(', ')}`;
          extractedContext.keyPoints = functionArgs.skills.map(s => `${s.name} (${s.proficiency_level || 'Not specified'})`);
          extractedContext.details.skills = functionArgs.skills.map(s => s.name);
          break;

        case 'extract_projects':
          extractedContext.projects = functionArgs.projects;
          extractedContext.summary = `Projects: ${functionArgs.projects.map(p => p.name).join(', ')}`;
          extractedContext.keyPoints = functionArgs.projects.map(p => p.name);
          break;

        case 'extract_certifications':
          extractedContext.certifications = functionArgs.certifications;
          extractedContext.summary = `Certifications: ${functionArgs.certifications.map(c => c.name).join(', ')}`;
          extractedContext.keyPoints = functionArgs.certifications.map(c => `${c.name} from ${c.issuing_organization}`);
          break;

        case 'extract_general_context':
          extractedContext.summary = functionArgs.summary;
          extractedContext.keyPoints = functionArgs.keyPoints;
          if (functionArgs.achievements) {
            extractedContext.details.achievements = functionArgs.achievements;
          }
          if (functionArgs.metrics) {
            extractedContext.details.metrics = functionArgs.metrics;
          }
          break;
      }
    } else {
      // Fallback to parsing the message content if no function call
      console.log('No function call, using message content as fallback');
      extractedContext.summary = message.content || "Information extracted from transcript";
      extractedContext.keyPoints = [message.content || ""];
    }

    console.log('Context extraction successful');

    return new Response(
      JSON.stringify({ extractedContext }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

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
