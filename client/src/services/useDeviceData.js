import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext.jsx';
import {
  getDeviceList,
  getDeviceDetail,
  getDeviceHistory,
  sendDeviceCommand
} from '../api/device.js';

export function useDeviceData() {
  const { devices, connected } = useWebSocket();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getDeviceList();
        if (data && data.length > 0) {
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to fetch devices:', e);
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      setLoading(false);
    }
  }, [devices]);

  return { devices, loading, connected };
}

export function useDeviceDetail(deviceId) {
  const { subscribe } = useWebSocket();
  const [device, setDevice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      const [deviceData, historyData] = await Promise.all([
        getDeviceDetail(deviceId),
        getDeviceHistory(deviceId)
      ]);
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

    const unsubscribe = subscribe(`detail-${deviceId}`, (allDevices) => {
      const target = allDevices.find(d => d.id === deviceId);
      if (target) {
        setDevice(prev => ({ ...prev, ...target }));
        setHistory(prev => {
          const newPoint = { ...target.metrics, timestamp: target.lastUpdate };
          const lastTs = prev.length > 0 ? prev[prev.length - 1].timestamp : null;
          if (lastTs === target.lastUpdate) return prev;
          const updated = [...prev, newPoint];
          if (updated.length > 60) updated.shift();
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, [deviceId, fetchDetail, subscribe]);

  const sendCommand = useCallback(async (command) => {
    try {
      const data = await sendDeviceCommand(deviceId, command);
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, [deviceId]);

  return { device, history, loading, sendCommand };
}
