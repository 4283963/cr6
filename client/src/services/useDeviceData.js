import { useState, useEffect, useRef, useCallback } from 'react';

export function useDeviceData() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      setDevices(data);
      setLoading(false);
    } catch (e) {
      console.error('Failed to fetch devices:', e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();

    const ws = new WebSocket('/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'metrics_update') {
          setDevices(msg.data);
        } else if (msg.type === 'devices_list') {
          setDevices(msg.data);
        }
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [fetchDevices]);

  return { devices, loading, connected };
}

export function useDeviceDetail(deviceId) {
  const [device, setDevice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  const fetchDetail = useCallback(async () => {
    try {
      const [deviceRes, historyRes] = await Promise.all([
        fetch(`/api/devices/${deviceId}`),
        fetch(`/api/devices/${deviceId}/history`)
      ]);
      const deviceData = await deviceRes.json();
      const historyData = await historyRes.json();
      setDevice(deviceData);
      setHistory(historyData);
      setLoading(false);
    } catch (e) {
      console.error('Failed to fetch device detail:', e);
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchDetail();

    const ws = new WebSocket('/ws');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'metrics_update') {
          const target = msg.data.find(d => d.id === deviceId);
          if (target) {
            setDevice(prev => ({ ...prev, ...target }));
            setHistory(prev => {
              const newPoint = { ...target.metrics };
              const updated = [...prev, newPoint];
              if (updated.length > 60) updated.shift();
              return updated;
            });
          }
        }
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [deviceId, fetchDetail]);

  const sendCommand = useCallback(async (command) => {
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, command })
      });
      const data = await res.json();
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [deviceId]);

  return { device, history, loading, sendCommand };
}
