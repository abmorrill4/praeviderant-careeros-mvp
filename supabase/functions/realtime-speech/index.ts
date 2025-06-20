
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

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      socket.close(1008, "OpenAI API key not configured");
      return response;
    }

    console.log('Setting up WebSocket connection to OpenAI Realtime API');
    
    let openAISocket: WebSocket | null = null;
    let isConnected = false;

    socket.onopen = async () => {
      console.log('Client WebSocket connected');
      
      try {
        // Connect to OpenAI Realtime API
        openAISocket = new WebSocket(
          "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
          {
            headers: {
              "Authorization": `Bearer ${openAIApiKey}`,
              "OpenAI-Beta": "realtime=v1"
            }
          }
        );

        openAISocket.onopen = () => {
          console.log('Connected to OpenAI Realtime API');
          isConnected = true;
          
          // Send initial configuration after connection
          const sessionConfig = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: `You are Praeviderant, a professional career assistant conducting a structured interview to understand a user's work history, career goals, skills, education, and relevant accomplishments.

Always begin the interview proactively. Ask one question at a time, and wait for the user's response before proceeding. Be friendly, efficient, and conversational—aim to put the user at ease.

Start with a warm introduction and then ask the user to tell you about their current or most recent role. As the interview progresses, dynamically adapt questions based on what the user shares. Ask follow-up questions to clarify timeline, impact, scope, and technologies used.

You are helping build a comprehensive profile for tailored resumes, so focus on extracting facts and context, not judgment. Do not answer questions; this is a structured interview, not a coaching session.

If the user pauses or gets stuck, gently re-prompt or offer clarification.`,
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
              max_response_output_tokens: 4096
            }
          };
          
          openAISocket?.send(JSON.stringify(sessionConfig));
          console.log('Sent session configuration to OpenAI');
          
          // Send ready signal to client
          socket.send(JSON.stringify({ type: 'connection.ready' }));
        };

        openAISocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received from OpenAI:', data.type);
            
            // Forward all OpenAI messages to client
            socket.send(event.data);
          } catch (error) {
            console.error('Error parsing OpenAI message:', error);
          }
        };

        openAISocket.onclose = () => {
          console.log('OpenAI WebSocket disconnected');
          isConnected = false;
          socket.close(1000, "OpenAI connection closed");
        };

        openAISocket.onerror = (error) => {
          console.error('OpenAI WebSocket error:', error);
          socket.close(1011, "OpenAI connection error");
        };

      } catch (error) {
        console.error('Error connecting to OpenAI:', error);
        socket.close(1011, "Failed to connect to OpenAI");
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received from client:', data.type);
        
        if (isConnected && openAISocket?.readyState === WebSocket.OPEN) {
          // Forward client messages to OpenAI
          openAISocket.send(event.data);
        } else {
          console.warn('OpenAI not connected, cannot forward message');
        }
      } catch (error) {
        console.error('Error handling client message:', error);
      }
    };

    socket.onclose = () => {
      console.log('Client WebSocket disconnected');
      if (openAISocket?.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
    };

    socket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
      if (openAISocket?.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error('WebSocket setup error:', error);
    return new Response("WebSocket setup failed", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
