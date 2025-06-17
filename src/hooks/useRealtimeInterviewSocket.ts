import { useState, useEffect, useRef, useCallback } from 'react';
import ReconnectingWebSocket, { Options } from 'reconnecting-websocket';

// Define connection statuses for clear state management in the UI
export enum ConnectionStatus {
  Connecting = 'connecting',
  Open = 'open',
  Closing = 'closing',
  Closed = 'closed',
}

// Configuration for the websocket
const webSocketOptions: Options = {
  maxReconnectionDelay: 10000, // 10 seconds
  minReconnectionDelay: 1500,  // 1.5 seconds
  reconnectionDelayGrowFactor: 1.3,
  maxRetries: 10,
};

const PING_INTERVAL_MS = 25000; // 25 seconds

export const useRealtimeInterviewSocket = (url: string | null) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Closed);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!url || (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED)) {
      return;
    }

    // Close any existing interval
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    const ws = new ReconnectingWebSocket(url, [], webSocketOptions);
    setStatus(ConnectionStatus.Connecting);

    ws.onopen = () => {
      console.log('WebSocket connection established.');
      setStatus(ConnectionStatus.Open);
      // Start sending pings to keep the connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, PING_INTERVAL_MS);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
      setStatus(ConnectionStatus.Closed);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      if (event.data === 'pong') {
        // Heartbeat response from server, connection is healthy
        return;
      }
      try {
        setLastMessage(JSON.parse(event.data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current = ws;
  }, [url]);

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setStatus(ConnectionStatus.Closed);
  }, []);

  const sendMessage = useCallback((data: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message, WebSocket is not open.');
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
