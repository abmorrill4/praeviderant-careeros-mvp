
import { useEffect, useRef, useState, useCallback } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

export enum ConnectionStatus {
  Connecting = 'connecting',
  Open = 'open',
  Closing = 'closing',
  Closed = 'closed'
}

interface Message {
  type: string;
  data?: any;
  error?: string;
  delta?: string;
  [key: string]: any;
}

interface UseRealtimeInterviewSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  messages: Message[];
  lastMessage: Message | null;
  status: ConnectionStatus;
  sendMessage: (message: any) => void;
  connect: (url?: string) => void;
  disconnect: () => void;
  startInterview: () => void;
  endInterview: () => void;
}

export const useRealtimeInterviewSocket = (defaultUrl?: string): UseRealtimeInterviewSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Closed);
  const socketRef = useRef<ReconnectingWebSocket | null>(null);

  // Use the CORRECT WebSocket URL format
  const WEBSOCKET_URL = defaultUrl || "wss://deofbwuazrvpocyybjpl.functions.supabase.co/realtime-interview";

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected, cannot send message');
      setError('Cannot send message - not connected');
    }
  }, []);

  const connect = useCallback((url?: string) => {
    const wsUrl = url || WEBSOCKET_URL;
    
    if (socketRef.current) {
      console.log('WebSocket already exists, disconnecting first...');
      socketRef.current.close();
    }

    console.log('Connecting to WebSocket...');
    console.log('Attempting to connect to:', wsUrl);
    setIsConnecting(true);
    setStatus(ConnectionStatus.Connecting);
    setError(null);

    try {
      socketRef.current = new ReconnectingWebSocket(wsUrl, [], {
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
        setStatus(ConnectionStatus.Open);
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
            
            const newMessage: Message = { 
              type: data.type || 'unknown', 
              data: data,
              ...data // Spread all properties from data
            };

            setMessages(prev => [...prev, newMessage]);
            setLastMessage(newMessage);

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
            // Create a simple message for non-JSON responses
            const simpleMessage: Message = {
              type: 'text',
              data: event.data
            };
            setMessages(prev => [...prev, simpleMessage]);
            setLastMessage(simpleMessage);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to interview service. Please try again.');
        setIsConnecting(false);
        setStatus(ConnectionStatus.Closed);
      };

      socketRef.current.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);
        setStatus(ConnectionStatus.Closed);
        
        if (event.code !== 1000) {
          setError(`Connection closed unexpectedly: ${event.reason || 'Unknown reason'}`);
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
      setStatus(ConnectionStatus.Closed);
    }
  }, [sendMessage, WEBSOCKET_URL]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket...');
    
    if (socketRef.current) {
      setStatus(ConnectionStatus.Closing);
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setStatus(ConnectionStatus.Closed);
    setError(null);
    setMessages([]);
    setLastMessage(null);
  }, []);

  const startInterview = useCallback(() => {
    connect();
  }, [connect]);

  const endInterview = useCallback(() => {
    disconnect();
  }, [disconnect]);

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
    lastMessage,
    status,
    sendMessage,
    connect,
    disconnect,
    startInterview,
    endInterview
  };
};
