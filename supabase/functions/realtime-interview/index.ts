
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Received request:', req.method, req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";
  const connectionHeader = headers.get("connection") || "";

  console.log('Upgrade header:', upgradeHeader);
  console.log('Connection header:', connectionHeader);

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Not a WebSocket request');
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  console.log('Upgrading to WebSocket');
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let sessionStarted = false;

  // Connect to OpenAI Realtime API
  const connectToOpenAI = () => {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in environment');
      socket.send(JSON.stringify({ error: 'OpenAI API key not configured' }));
      return;
    }

    console.log('Connecting to OpenAI Realtime API...');
    const url = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
    
    try {
      openAISocket = new WebSocket(url, [], {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      openAISocket.onopen = () => {
        console.log('Successfully connected to OpenAI Realtime API');
      };

      openAISocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('OpenAI message received:', data.type);

          // Handle session created event
          if (data.type === 'session.created' && !sessionStarted) {
            sessionStarted = true;
            console.log('Session created, sending configuration...');
            
            // Send session configuration
            const sessionUpdate = {
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: 'You are conducting a professional career interview. Ask thoughtful questions about the user\'s background, experience, and career goals. Be conversational and encouraging. Keep responses concise but engaging.',
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
            console.log('Session configuration sent');
          }

          // Forward all messages to client
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        } catch (error) {
          console.error('Error processing OpenAI message:', error);
        }
      };

      openAISocket.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ error: 'OpenAI connection error' }));
        }
      };

      openAISocket.onclose = (event) => {
        console.log('OpenAI WebSocket closed:', event.code, event.reason);
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (error) {
      console.error('Error creating OpenAI WebSocket:', error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ error: 'Failed to connect to OpenAI' }));
      }
    }
  };

  socket.onopen = () => {
    console.log('Client WebSocket connected successfully');
    connectToOpenAI();
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

      const data = JSON.parse(event.data);
      console.log('Client message received:', data.type);
      
      // Forward client messages to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
        console.log('Message forwarded to OpenAI');
      } else {
        console.warn('Received client message but OpenAI socket is not open. State:', openAISocket?.readyState);
      }
    } catch (error) {
      console.error('Error processing client message:', error);
    }
  };

  socket.onclose = (event) => {
    console.log('Client WebSocket closed:', event.code, event.reason);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});
