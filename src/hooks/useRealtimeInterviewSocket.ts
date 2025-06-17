
import { useEffect, useRef, useState, useCallback } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

interface Message {
  type: string;
  data?: any;
}

interface UseRealtimeInterviewSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  messages: Message[];
  sendMessage: (message: any) => void;
  startInterview: () => void;
  endInterview: () => void;
}

export const useRealtimeInterviewSocket = (): UseRealtimeInterviewSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<ReconnectingWebSocket | null>(null);

  // Using the CORRECT WebSocket URL format
  const WEBSOCKET_URL = "wss://deofbwuazrvpocyybjpl.functions.supabase.co/realtime-interview";

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected, cannot send message');
      setError('Cannot send message - not connected');
    }
  }, []);

  const startInterview = useCallback(() => {
    if (socketRef.current) {
      console.log('Interview already started');
      return;
    }

    console.log('Starting interview...');
    console.log('Attempting to connect to:', WEBSOCKET_URL);
    setIsConnecting(true);
    setError(null);

    try {
      socketRef.current = new ReconnectingWebSocket(WEBSOCKET_URL, [], {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        maxRetries: 5,
        connectionTimeout: 10000,
        debug: true
      });

      socketRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        
        // Send initial ping to test connection
        sendMessage('ping');
      };

      socketRef.current.onmessage = (event) => {
        try {
          console.log('Raw message received:', event.data);
          
          // Handle heartbeat responses
          if (event.data === 'pong') {
            console.log('Received pong response');
            return;
          }

          // Try to parse JSON messages
          try {
            const data = JSON.parse(event.data);
            console.log('Parsed message:', data);
            
            setMessages(prev => [...prev, { 
              type: data.type || 'unknown', 
              data: data 
            }]);

            // Handle specific message types
            if (data.type === 'session.created') {
              console.log('OpenAI session created, sending configuration...');
              
              // Send session update after receiving session.created
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
              
              sendMessage(sessionUpdate);
            } else if (data.type === 'error') {
              console.error('Server error:', data.error);
              setError(`Server error: ${data.error}`);
            }
          } catch (parseError) {
            console.log('Non-JSON message received:', event.data);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to interview service. Please try again.');
        setIsConnecting(false);
      };

      socketRef.current.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);
        
        if (event.code !== 1000) {
          setError(`Connection closed unexpectedly: ${event.reason || 'Unknown reason'}`);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [sendMessage, WEBSOCKET_URL]);

  const endInterview = useCallback(() => {
    console.log('Ending interview...');
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User ended interview');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    messages,
    sendMessage,
    startInterview,
    endInterview
  };
};
