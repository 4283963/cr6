import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const listenersRef = useRef(new Map());
  const wsRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'metrics_update') {
          setDevices(msg.data);
          listenersRef.current.forEach((listener) => {
            listener(msg.data);
          });
        } else if (msg.type === 'devices_list') {
          setDevices(msg.data);
        }
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const subscribe = useCallback((id, callback) => {
    listenersRef.current.set(id, callback);
    return () => listenersRef.current.delete(id);
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, devices, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
