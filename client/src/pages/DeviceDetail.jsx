import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDeviceDetail } from '../services/useDeviceData.js';

const statusMap = {
  running: { label: '运行中', className: 'running' },
  idle: { label: '待机', className: 'idle' },
  maintenance: { label: '维护中', className: 'maintenance' }
};

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function MetricChart({ title, dataKey, data, color, unit, currentValue, icon }) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <span>{icon}</span>
          {title}
        </div>
        <div className="chart-value" style={{ color }}>
          {currentValue}<span className="unit">{unit}</span>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3a52" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: '#1a2234',
                border: '1px solid #2d3a52',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '12px'
              }}
              formatter={(value) => [`${value} ${unit}`, title]}
              labelFormatter={formatTime}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
              fill={`url(#gradient-${dataKey})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DeviceDetail() {
  const { id } = useParams();
  const { device, history, loading, sendCommand } = useDeviceDetail(id);
  const [executing, setExecuting] = useState(null);

  const handleCommand = async (command) => {
    setExecuting(command);
    try {
      await sendCommand(command);
    } finally {
      setTimeout(() => setExecuting(null), 500);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!device) {
    return <div className="loading">设备不存在</div>;
  }

  const chartData = history.map((h, i) => ({
    ...h,
    timestamp: h.timestamp || new Date(Date.now() - (history.length - i) * 3000).toISOString()
  }));

  return (
    <div className="detail-page">
      <Link to="/" className="back-btn">
        ← 返回设备列表
      </Link>

      <div className="device-info-header">
        <div className="device-info-left">
          <div className="device-avatar">♻️</div>
          <div className="device-info-text">
            <h2>{device.name}</h2>
            <div className="device-meta">
              <span>ID: {device.id}</span>
              <span>📍 {device.location}</span>
              <span className={`device-status ${statusMap[device.status].className}`}>
                {statusMap[device.status].label}
              </span>
            </div>
          </div>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          最后更新：{formatTime(device.lastUpdate)}
        </div>
      </div>

      <div className="charts-grid">
        <MetricChart
          title="搅拌速度"
          dataKey="stirringSpeed"
          data={chartData}
          color="#3b82f6"
          unit="rpm"
          currentValue={device.metrics.stirringSpeed}
          icon="🌀"
        />
        <MetricChart
          title="降解菌群温度"
          dataKey="bacteriaTemperature"
          data={chartData}
          color="#ef4444"
          unit="°C"
          currentValue={device.metrics.bacteriaTemperature}
          icon="🌡️"
        />
        <MetricChart
          title="环境湿度"
          dataKey="humidity"
          data={chartData}
          color="#06b6d4"
          unit="%"
          currentValue={device.metrics.humidity}
          icon="💧"
        />
        <MetricChart
          title="气体浓度"
          dataKey="gasConcentration"
          data={chartData}
          color="#f59e0b"
          unit="ppm"
          currentValue={device.metrics.gasConcentration}
          icon="💨"
        />
      </div>

      <div className="control-panel">
        <h3 className="control-panel-title">
          <span>🎛️</span>
          远程控制
        </h3>
        <div className="control-btn-group">
          <button
            className="control-btn success"
            onClick={() => handleCommand('start_stirring')}
            disabled={executing !== null}
          >
            <span className="icon">🌀</span>
            启动搅拌
          </button>
          <button
            className="control-btn"
            onClick={() => handleCommand('stop_stirring')}
            disabled={executing !== null}
          >
            <span className="icon">⏹️</span>
            停止搅拌
          </button>
          <button
            className="control-btn danger"
            onClick={() => handleCommand('start_heating')}
            disabled={executing !== null}
          >
            <span className="icon">🔥</span>
            启动加热
          </button>
          <button
            className="control-btn"
            onClick={() => handleCommand('stop_heating')}
            disabled={executing !== null}
          >
            <span className="icon">❄️</span>
            停止加热
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceDetail;
