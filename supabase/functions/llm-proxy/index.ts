
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model configuration based on complexity
const MODEL_CONFIG = {
  simple: {
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.3,
    description: 'Fast and efficient model for simple tasks'
  },
  complex: {
    model: 'gpt-4o',
    maxTokens: 4000,
    temperature: 0.7,
    description: 'Powerful model for complex reasoning tasks'
  }
} as const;

type ComplexityLevel = keyof typeof MODEL_CONFIG;

interface LLMRequest {
  complexity: ComplexityLevel;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface LLMResponse {
  response: string;
  model: string;
  complexity: ComplexityLevel;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metadata: {
    processing_time_ms: number;
    model_config: typeof MODEL_CONFIG[ComplexityLevel];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const requestBody: LLMRequest = await req.json();
    
    // Validate required parameters
    if (!requestBody.complexity || !requestBody.messages) {
      throw new Error('Missing required parameters: complexity and messages');
    }

    // Validate complexity level
    if (!MODEL_CONFIG[requestBody.complexity]) {
      throw new Error(`Invalid complexity level. Must be one of: ${Object.keys(MODEL_CONFIG).join(', ')}`);
    }

    const complexity = requestBody.complexity;
    const config = MODEL_CONFIG[complexity];

    console.log(`Routing ${complexity} request to model: ${config.model}`);

    // Prepare messages array
    let messages = [...requestBody.messages];
    
    // Add system prompt if provided
    if (requestBody.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: requestBody.systemPrompt
      });
    }

    // Prepare OpenAI request
    const openAIRequest = {
      model: config.model,
      messages: messages,
      temperature: requestBody.temperature ?? config.temperature,
      max_tokens: requestBody.maxTokens ?? config.maxTokens,
      stream: requestBody.stream ?? false
    };

    console.log('Sending request to OpenAI:', {
      model: openAIRequest.model,
      messageCount: messages.length,
      temperature: openAIRequest.temperature,
      maxTokens: openAIRequest.max_tokens
    });

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;

    // Extract response content
    const responseContent = result.choices?.[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response content received from OpenAI');
    }

    // Prepare response
    const llmResponse: LLMResponse = {
      response: responseContent,
      model: config.model,
      complexity: complexity,
      usage: result.usage ? {
        prompt_tokens: result.usage.prompt_tokens,
        completion_tokens: result.usage.completion_tokens,
        total_tokens: result.usage.total_tokens
      } : undefined,
      metadata: {
        processing_time_ms: processingTime,
        model_config: config
      }
    };

    console.log('LLM proxy response completed:', {
      complexity,
      model: config.model,
      processingTimeMs: processingTime,
      responseLength: responseContent.length,
      usage: result.usage
    });

    return new Response(
      JSON.stringify(llmResponse),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error in LLM proxy service:', {
      error: error.message,
      processingTimeMs: processingTime
    });

    return new Response(
      JSON.stringify({ 
        error: error.message,
        metadata: {
          processing_time_ms: processingTime
        }
      }),
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
