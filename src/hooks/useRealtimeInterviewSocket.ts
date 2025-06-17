
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

  // Use the CORRECT WebSocket URL format for Supabase Edge Functions
  const WEBSOCKET_URL = defaultUrl || "wss://deofbwuazrvpocyybjpl.functions.supabase.co/realtime-interview";

  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected, cannot send message. ReadyState:', socketRef.current?.readyState);
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
    console.log('WebSocket URL:', wsUrl);
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
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setStatus(ConnectionStatus.Open);
        setError(null);
        
        // Send initial ping to test connection
        console.log('Sending initial ping...');
        sendMessage('ping');
      };

      socketRef.current.onmessage = (event) => {
        try {
          console.log('📨 Raw message received:', event.data);
          
          // Handle heartbeat responses
          if (event.data === 'pong') {
            console.log('🏓 Received pong response - connection alive');
            return;
          }

          // Try to parse JSON messages
          try {
            const data = JSON.parse(event.data);
            console.log('📋 Parsed message type:', data.type);
            
            const newMessage: Message = { 
              type: data.type || 'unknown', 
              data: data,
              ...data // Spread all properties from data
            };

            setMessages(prev => [...prev, newMessage]);
            setLastMessage(newMessage);

            // Handle specific message types
            if (data.type === 'session.created') {
              console.log('🎉 OpenAI session created, ready for configuration');
            } else if (data.type === 'session.updated') {
              console.log('🔧 Session configuration updated successfully');
            } else if (data.type === 'error') {
              console.error('❌ Server error:', data.error);
              setError(`Server error: ${data.error}`);
            }
          } catch (parseError) {
            console.log('📝 Non-JSON message received:', event.data);
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
        console.error('❌ WebSocket error:', error);
        setError('Failed to connect to interview service. Please check the connection.');
        setIsConnecting(false);
        setStatus(ConnectionStatus.Closed);
      };

      socketRef.current.onclose = (event) => {
        console.log(`🔒 WebSocket connection closed - Code: ${event.code}, Reason: "${event.reason}"`);
        setIsConnected(false);
        setIsConnecting(false);
        setStatus(ConnectionStatus.Closed);
        
        // Log specific close codes for debugging
        switch(event.code) {
          case 1000:
            console.log('Normal closure');
            break;
          case 1001:
            console.log('Going away (page reload/navigation)');
            break;
          case 1006:
            console.log('⚠️ Abnormal closure - connection lost or failed to establish');
            setError('Connection lost unexpectedly. Please try again.');
            break;
          default:
            console.log(`Unexpected close code: ${event.code}`);
            setError(`Connection closed unexpectedly: ${event.reason || 'Unknown reason'}`);
        }
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
      setStatus(ConnectionStatus.Closed);
    }
  }, [sendMessage, WEBSOCKET_URL]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');
    
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
    console.log('🎙️ Starting interview...');
    connect();
  }, [connect]);

  const endInterview = useCallback(() => {
    console.log('🛑 Ending interview...');
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
