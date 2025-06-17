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
  maxReconnectionDelay: 10000, // 10 seconds
  minReconnectionDelay: 1500,  // 1.5 seconds
  reconnectionDelayGrowFactor: 1.3,
  maxRetries: 5, // Reduced from 10 to avoid infinite loops
  connectionTimeout: 8000, // 8 second timeout
};

const PING_INTERVAL_MS = 25000; // 25 seconds

export const useRealtimeInterviewSocket = (url: string | null) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Closed);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!url || (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED)) {
      console.log('Connection attempt skipped:', { url, currentState: wsRef.current?.readyState });
      return;
    }

    console.log('Attempting to connect to:', url);

    // Close any existing interval
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    const ws = new ReconnectingWebSocket(url, [], webSocketOptions);
    setStatus(ConnectionStatus.Connecting);

    ws.onopen = () => {
      console.log('WebSocket connection established successfully');
      setStatus(ConnectionStatus.Open);
      // Start sending pings to keep the connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log('Sending ping');
          ws.send('ping');
        }
      }, PING_INTERVAL_MS);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setStatus(ConnectionStatus.Closed);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      if (event.data === 'pong') {
        // Heartbeat response from server, connection is healthy
        console.log('Received pong response');
        return;
      }
      try {
        const parsedMessage = JSON.parse(event.data);
        console.log('Parsed message type:', parsedMessage.type);
        setLastMessage(parsedMessage);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };

    wsRef.current = ws;
  }, [url]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket');
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setStatus(ConnectionStatus.Closed);
  }, []);

  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      console.log('Sending message:', data.type || 'unknown', data);
      wsRef.current.send(message);
    } else {
      console.error('Cannot send message, WebSocket is not open. State:', wsRef.current?.readyState);
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, sendMessage, lastMessage, status };
};
