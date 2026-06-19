import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext.jsx';

function Header() {
  const [time, setTime] = useState(new Date());
  const { connected } = useWebSocket();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d) => {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString('zh-CN', { hour12: false });
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="header-logo">♻️</div>
        </Link>
        <div>
          <div className="header-title">厨余垃圾降解机监控系统</div>
          <div className="header-subtitle">Kitchen Waste Degradation Monitor</div>
        </div>
      </div>
      <div className="header-right">
        <div className={`connection-status ${connected ? '' : 'disconnected'}`}>
          <span className="dot"></span>
          {connected ? '实时连接' : '连接断开'}
        </div>
        <div className="header-time">
          <div className="time">{formatTime(time)}</div>
          <div className="date">{formatDate(time)}</div>
        </div>
      </div>
    </header>
  );
}

export default Header;
