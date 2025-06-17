
import { useState, useEffect, useRef, useCallback } from 'react';
import ReconnectingWebSocket, { Options } from 'reconnecting-websocket';

// Define connection statuses for clear state management in the UI
export enum ConnectionStatus {
  Connecting = 'connecting',
  Open = 'open',
  Closing = 'closing',
  Closed = 'closed',
}

// Define message type interface
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Configuration for the websocket
const webSocketOptions: Options = {
  maxReconnectionDelay: 10000,
  minReconnectionDelay: 2000,
  reconnectionDelayGrowFactor: 1.3,
  maxRetries: 2, // Reduce retries to avoid infinite loops
  connectionTimeout: 10000,
  debug: false, // Disable debug to reduce console spam
};

const PING_INTERVAL_MS = 30000; // 30 seconds

export const useRealtimeInterviewSocket = (url: string | null) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Closed);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  const connect = useCallback(() => {
    if (!url) {
      console.log('No URL provided for WebSocket connection');
      setError('No connection URL provided');
      return;
    }

    if (!mountedRef.current) {
      console.log('Component unmounted, skipping connection');
      return;
    }

    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED)) {
      console.log('Connection attempt skipped - already connecting or connected');
      return;
    }

    console.log('Attempting to connect to:', url);
    isConnectingRef.current = true;
    setError(null);
    setStatus(ConnectionStatus.Connecting);

    // Clear any existing interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    try {
      const ws = new ReconnectingWebSocket(url, [], webSocketOptions);

      ws.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket connection established successfully');
        isConnectingRef.current = false;
        setStatus(ConnectionStatus.Open);
        setError(null);
        
        // Start sending pings to keep the connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN && mountedRef.current) {
            console.log('Sending ping');
            ws.send('ping');
          }
        }, PING_INTERVAL_MS);
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket connection closed:', event.code, event.reason);
        isConnectingRef.current = false;
        setStatus(ConnectionStatus.Closed);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Set error message for unexpected closures
        if (event.code !== 1000 && event.code !== 1001) {
          setError(`Connection closed unexpectedly (${event.code})`);
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
        setError('Failed to connect to interview service. Please try again.');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket message received:', event.data);
        if (event.data === 'pong') {
          console.log('Received pong response');
          return;
        }
        
        try {
          const parsedMessage = JSON.parse(event.data);
          console.log('Parsed message type:', parsedMessage.type);
          setLastMessage(parsedMessage);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
          setError('Error processing message from server');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      isConnectingRef.current = false;
      setError('Failed to create WebSocket connection');
      setStatus(ConnectionStatus.Closed);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket');
    isConnectingRef.current = false;
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus(ConnectionStatus.Closed);
    setError(null);
  }, []);

  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      console.log('Sending message:', data.type || 'unknown', data);
      wsRef.current.send(message);
    } else {
      console.error('Cannot send message, WebSocket is not open. State:', wsRef.current?.readyState);
      setError('Connection not available. Please try reconnecting.');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, sendMessage, lastMessage, status, error };
};
