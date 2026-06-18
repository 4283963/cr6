import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceData } from '../services/useDeviceData.js';

const statusMap = {
  running: { label: '运行中', className: 'running' },
  idle: { label: '待机', className: 'idle' },
  maintenance: { label: '维护中', className: 'maintenance' }
};

function Dashboard() {
  const navigate = useNavigate();
  const { devices, loading } = useDeviceData();

  const runningCount = devices.filter(d => d.status === 'running').length;
  const idleCount = devices.filter(d => d.status === 'idle').length;
  const maintenanceCount = devices.filter(d => d.status === 'maintenance').length;
  const avgTemperature = devices.length
    ? (devices.reduce((sum, d) => sum + d.metrics.bacteriaTemperature, 0) / devices.length).toFixed(1)
    : 0;

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">设备总数</div>
          <div className="stat-value">{devices.length}<span className="stat-unit">台</span></div>
          <div className="stat-icon">📊</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">运行中</div>
          <div className="stat-value">{runningCount}<span className="stat-unit">台</span></div>
          <div className="stat-icon">▶️</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">待机</div>
          <div className="stat-value">{idleCount}<span className="stat-unit">台</span></div>
          <div className="stat-icon">⏸️</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">维护中</div>
          <div className="stat-value">{maintenanceCount}<span className="stat-unit">台</span></div>
          <div className="stat-icon">🔧</div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">设备列表</h2>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          平均温度：<span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{avgTemperature}°C</span>
        </div>
      </div>

      <div className="device-grid">
        {devices.map(device => (
          <div
            key={device.id}
            className="device-card"
            onClick={() => navigate(`/device/${device.id}`)}
          >
            <div className="device-card-header">
              <div>
                <div className="device-name">{device.name}</div>
                <div className="device-id">ID: {device.id}</div>
              </div>
              <span className={`device-status ${statusMap[device.status].className}`}>
                {statusMap[device.status].label}
              </span>
            </div>
            <div className="device-location">
              📍 {device.location}
            </div>
            <div className="device-metrics">
              <div className="metric-item">
                <div className="metric-label">搅拌速度</div>
                <div className="metric-value">
                  {device.metrics.stirringSpeed}
                  <span className="unit">rpm</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">菌群温度</div>
                <div className="metric-value">
                  {device.metrics.bacteriaTemperature}
                  <span className="unit">°C</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">湿度</div>
                <div className="metric-value">
                  {device.metrics.humidity}
                  <span className="unit">%</span>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-label">气体浓度</div>
                <div className="metric-value">
                  {device.metrics.gasConcentration}
                  <span className="unit">ppm</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
