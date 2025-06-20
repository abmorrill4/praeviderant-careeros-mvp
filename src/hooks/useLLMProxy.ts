
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProxyRequest {
  complexity: 'simple' | 'complex';
  messages: LLMMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMProxyResponse {
  response: string;
  model: string;
  complexity: 'simple' | 'complex';
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  metadata: {
    processing_time_ms: number;
    model_config: {
      model: string;
      maxTokens: number;
      temperature: number;
      description: string;
    };
  };
}

export const useLLMProxy = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<LLMProxyResponse | null>(null);
  const { toast } = useToast();

  const sendRequest = async (request: LLMProxyRequest): Promise<LLMProxyResponse> => {
    setIsLoading(true);
    
    try {
      console.log('Sending LLM proxy request:', {
        complexity: request.complexity,
        messageCount: request.messages.length,
        systemPrompt: request.systemPrompt ? 'provided' : 'none'
      });

      const { data, error } = await supabase.functions.invoke('llm-proxy', {
        body: request
      });

      if (error) {
        console.error('LLM proxy error:', error);
        throw new Error(`LLM proxy error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response data received from LLM proxy');
      }

      // Handle error responses from the edge function
      if (data.error) {
        throw new Error(data.error);
      }

      const response = data as LLMProxyResponse;
      setLastResponse(response);

      console.log('LLM proxy response received:', {
        model: response.model,
        complexity: response.complexity,
        responseLength: response.response.length,
        processingTime: response.metadata.processing_time_ms
      });

      return response;

    } catch (error) {
      console.error('Error in LLM proxy hook:', error);
      toast({
        title: "LLM Request Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendSimpleRequest = async (
    userMessage: string, 
    systemPrompt?: string
  ): Promise<LLMProxyResponse> => {
    const messages: LLMMessage[] = [
      { role: 'user', content: userMessage }
    ];

    return sendRequest({
      complexity: 'simple',
      messages,
      systemPrompt
    });
  };

  const sendComplexRequest = async (
    userMessage: string, 
    systemPrompt?: string,
    conversationHistory?: LLMMessage[]
  ): Promise<LLMProxyResponse> => {
    const messages: LLMMessage[] = [
      ...(conversationHistory || []),
      { role: 'user', content: userMessage }
    ];

    return sendRequest({
      complexity: 'complex',
      messages,
      systemPrompt
    });
  };

  return {
    sendRequest,
    sendSimpleRequest,
    sendComplexRequest,
    isLoading,
    lastResponse
  };
};
