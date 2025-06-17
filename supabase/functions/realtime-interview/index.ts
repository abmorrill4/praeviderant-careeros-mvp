
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  console.log("📥 Request received:", req.method, req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.warn("❌ Not a WebSocket upgrade request");
    return new Response("Expected WebSocket connection", {
      status: 400,
      headers: corsHeaders
    });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY not configured");
    return new Response("Missing OpenAI API Key", {
      status: 500,
      headers: corsHeaders
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let openAISocket: WebSocket | null = null;

  socket.onopen = () => {
    console.log("✅ Client WebSocket connected");

    const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview";

    try {
      openAISocket = new WebSocket(url, [
        "realtime",
        `openai-insecure-api-key.${apiKey}`,
        "openai-beta.realtime-v1"
      ]);
      console.log("🔌 Connecting to OpenAI Realtime API...");
    } catch (err) {
      console.error("❌ Failed to create OpenAI socket:", err);
      socket.send(JSON.stringify({ type: "error", error: "Failed to create OpenAI socket" }));
      socket.close(1011, "OpenAI WebSocket creation error");
      return;
    }

    openAISocket.onopen = () => {
      console.log("✅ OpenAI WebSocket connection established");
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 OpenAI message:", data.type);

        if (data.type === "session.created") {
          console.log("⚙️ Sending session.update...");
          const sessionUpdate = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions:
                "You are conducting a professional career interview. Ask thoughtful questions about the user's background, experience, and goals. Be conversational and encouraging.",
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              temperature: 0.8
            }
          };
          openAISocket?.send(JSON.stringify(sessionUpdate));
        }

        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      } catch (err) {
        console.error("❌ Failed to process OpenAI message:", err);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "error", error: "Failed to process OpenAI message" }));
        }
      }
    };

    openAISocket.onerror = (e) => {
      console.error("❌ OpenAI socket error:", e);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "error", error: "OpenAI WebSocket error" }));
      }
    };

    openAISocket.onclose = (e) => {
      console.warn("🔒 OpenAI socket closed:", e.code, e.reason);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close(e.code, e.reason);
      }
    };
  };

  socket.onmessage = (event) => {
    if (event.data === "ping") {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("pong");
      }
      return;
    }

    if (!openAISocket || openAISocket.readyState !== WebSocket.OPEN) {
      console.warn("⏳ OpenAI not ready to receive messages");
      socket.send(JSON.stringify({ type: "error", error: "OpenAI not connected yet" }));
      return;
    }

    try {
      openAISocket.send(event.data);
    } catch (err) {
      console.error("❌ Failed to forward client message:", err);
      socket.send(JSON.stringify({ type: "error", error: "Message forwarding error" }));
    }
  };

  socket.onerror = (err) => {
    console.error("❌ Client WebSocket error:", err);
    if (openAISocket?.readyState === WebSocket.OPEN) {
      openAISocket.close();
    }
  };

  socket.onclose = (event) => {
    console.log("🔌 Client WebSocket closed:", event.code, event.reason);
    if (openAISocket?.readyState === WebSocket.OPEN) {
      openAISocket.close();
    }
  };

  return response;
});
