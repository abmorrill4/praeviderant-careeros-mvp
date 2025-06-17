
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let sessionStarted = false;

  // Connect to OpenAI Realtime API
  const connectToOpenAI = () => {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found');
      socket.send(JSON.stringify({ error: 'OpenAI API key not configured' }));
      return;
    }

    const url = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
    openAISocket = new WebSocket(url, [], {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    openAISocket.onopen = () => {
      console.log('Connected to OpenAI Realtime API');
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('OpenAI message:', data.type);

        // Handle session created event
        if (data.type === 'session.created' && !sessionStarted) {
          sessionStarted = true;
          
          // Send session configuration
          const sessionUpdate = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: 'You are conducting a professional career interview. Ask thoughtful questions about the user\'s background, experience, and goals. Be conversational and encouraging.',
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
        socket.send(event.data);
      } catch (error) {
        console.error('Error processing OpenAI message:', error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
      socket.send(JSON.stringify({ error: 'OpenAI connection error' }));
    };

    openAISocket.onclose = () => {
      console.log('OpenAI WebSocket closed');
      socket.close();
    };
  };

  socket.onopen = () => {
    console.log('Client WebSocket connected');
    connectToOpenAI();
  };

  socket.onmessage = (event) => {
    try {
      // Handle heartbeat messages
      if (event.data === 'ping') {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send('pong');
        }
        return;
      }

      const data = JSON.parse(event.data);
      console.log('Client message:', data.type);
      
      // Forward client messages to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      } else {
        console.warn('Received client message but OpenAI socket is not open.');
      }
    } catch (error) {
      console.error('Error processing client message:', error);
    }
  };

  socket.onclose = () => {
    console.log('Client WebSocket closed');
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
