import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';
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

function getUnbalancedRanges(data) {
  const ranges = [];
  let inRange = false;
  let start = null;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.environmentStatus === 'unbalanced') {
      if (!inRange) {
        inRange = true;
        start = i;
      }
    } else {
      if (inRange) {
        ranges.push({ start: data[start].timestamp, end: data[i - 1].timestamp });
        inRange = false;
      }
    }
  }
  if (inRange && start !== null) {
    ranges.push({ start: data[start].timestamp, end: data[data.length - 1].timestamp });
  }
  return ranges;
}

function MetricChart({ title, dataKey, data, color, unit, currentValue, icon, unbalancedRanges }) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <span>{icon}</span>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="unbalanced-legend">
            <span className="swatch"></span>
            <span>环境失衡</span>
          </div>
          <div className="chart-value" style={{ color }}>
            {currentValue}<span className="unit">{unit}</span>
          </div>
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
              <linearGradient id={`warning-gradient-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                <stop offset="10%" stopColor="#ef4444" stopOpacity="0.12" />
                <stop offset="90%" stopColor="#ef4444" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
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
            {unbalancedRanges.map((range, idx) => (
              <ReferenceArea
                key={idx}
                x1={range.start}
                x2={range.end}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                fill={`url(#warning-gradient-${dataKey})`}
              />
            ))}
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

  const chartData = useMemo(() => history.map((h, i) => ({
    ...h,
    timestamp: h.timestamp || new Date(Date.now() - (history.length - i) * 3000).toISOString()
  })), [history]);

  const unbalancedRanges = useMemo(() => getUnbalancedRanges(chartData), [chartData]);
  const isUnbalanced = device.metrics?.environmentStatus === 'unbalanced';

  return (
    <div className="detail-page">
      <Link to="/" className="back-btn">
        ← 返回设备列表
      </Link>

      <div className="device-info-header">
        <div className="device-info-left">
          <div className="device-avatar">♻️</div>
          <div className="device-info-text">
            <h2>
              {device.name}
              {isUnbalanced && (
                <span className="device-condition-warning" style={{ marginLeft: '12px', fontSize: '13px', padding: '4px 10px' }}>
                  ⚠️ 菌群环境调理中
                </span>
              )}
            </h2>
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
          unbalancedRanges={unbalancedRanges}
        />
        <MetricChart
          title="降解菌群温度"
          dataKey="bacteriaTemperature"
          data={chartData}
          color="#ef4444"
          unit="°C"
          currentValue={device.metrics.bacteriaTemperature}
          icon="🌡️"
          unbalancedRanges={unbalancedRanges}
        />
        <MetricChart
          title="环境湿度"
          dataKey="humidity"
          data={chartData}
          color="#06b6d4"
          unit="%"
          currentValue={device.metrics.humidity}
          icon="💧"
          unbalancedRanges={unbalancedRanges}
        />
        <MetricChart
          title="气体浓度"
          dataKey="gasConcentration"
          data={chartData}
          color="#f59e0b"
          unit="ppm"
          currentValue={device.metrics.gasConcentration}
          icon="💨"
          unbalancedRanges={unbalancedRanges}
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
