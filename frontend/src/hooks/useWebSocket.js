/**
 * WebSocket hook — manages real-time connection to backend.
 */
import { useEffect, useRef, useCallback, useState } from 'react';

export function useWebSocket(onMessage) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (e) {
          console.warn('WS parse error:', e);
        }
      };

      ws.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setConnected(false);
        // Auto-reconnect after 3s
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        setConnected(false);
      };
    } catch (e) {
      console.warn('WS connection failed:', e);
    }
  }, [onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { connected, send };
}
