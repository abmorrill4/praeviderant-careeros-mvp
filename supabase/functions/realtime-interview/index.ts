
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge function called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Not a WebSocket request, upgrade header:', upgradeHeader);
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  // Check for OpenAI API key
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    console.error('OPENAI_API_KEY not found in environment variables');
    return new Response("OpenAI API key not configured", { 
      status: 500,
      headers: corsHeaders 
    });
  }

  console.log('Upgrading to WebSocket connection');
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;

  socket.onopen = () => {
    console.log('Client WebSocket connected');
    
    try {
      // Use the correct OpenAI Realtime API endpoint with sub-protocol authentication
      const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview";
      
      console.log('Connecting to OpenAI Realtime API with sub-protocol auth...');
      
      // Create WebSocket with proper sub-protocols for authentication
      openAISocket = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${apiKey}`,
        'openai-beta.realtime-v1',
      ]);

      openAISocket.onopen = () => {
        console.log('OpenAI WebSocket connection established successfully');
      };

      openAISocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received from OpenAI:', data.type);

          // Handle session.created event by sending configuration
          if (data.type === 'session.created') {
            console.log('Session created, sending configuration...');
            const sessionUpdate = {
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: 'You are conducting a professional career interview. Ask thoughtful questions about the user\'s background, experience, and career goals. Be conversational and encouraging.',
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000
                },
                temperature: 0.8,
                max_response_output_tokens: 'inf'
              }
            };
            
            openAISocket?.send(JSON.stringify(sessionUpdate));
          }

          // Forward all messages to client
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        } catch (error) {
          console.error('Error processing OpenAI message:', error);
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
              type: 'error',
              error: 'Error processing OpenAI message' 
            }));
          }
        }
      };

      openAISocket.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ 
            type: 'error',
            error: 'OpenAI connection error - check API key and permissions' 
          }));
        }
      };

      openAISocket.onclose = (event) => {
        console.log('OpenAI WebSocket closed:', event.code, event.reason);
        
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(event.code, event.reason);
        }
      };
      
    } catch (error) {
      console.error('Error creating OpenAI WebSocket:', error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'error',
          error: 'Failed to connect to OpenAI service' 
        }));
        socket.close(1011, 'OpenAI connection failed');
      }
    }
  };

  socket.onmessage = (event) => {
    try {
      // Handle heartbeat messages
      if (event.data === 'ping') {
        console.log('Received ping, sending pong');
        if (socket.readyState === WebSocket.OPEN) {
          socket.send('pong');
        }
        return;
      }

      if (!openAISocket || openAISocket.readyState !== WebSocket.OPEN) {
        console.warn('Cannot forward message - OpenAI not connected. State:', openAISocket?.readyState);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ 
            type: 'error',
            error: 'OpenAI connection not ready' 
          }));
        }
        return;
      }

      console.log('Forwarding client message to OpenAI');
      
      // Forward client messages to OpenAI exactly as received
      openAISocket.send(event.data);
      
    } catch (error) {
      console.error('Error processing client message:', error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: 'error',
          error: 'Error processing message' 
        }));
      }
    }
  };

  socket.onclose = (event) => {
    console.log('Client WebSocket closed:', event.code, event.reason);
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.close();
    }
  };

  return response;
});
