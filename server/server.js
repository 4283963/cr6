const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const deviceManager = require('./services/deviceManager');
const deviceSimulator = require('./services/deviceSimulator');
const devicesRouter = require('./routes/devices');
const commandsRouter = require('./routes/commands');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

deviceManager.initDevices();
deviceSimulator.startSimulation(wss);

app.use('/api/devices', devicesRouter);
app.use('/api/commands', commandsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  const devices = deviceManager.getAllDevices();
  ws.send(JSON.stringify({ type: 'devices_list', data: devices }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      console.log('Received WS message:', parsed.type);
    } catch (e) {
      console.error('Invalid WS message:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket on ws://localhost:${PORT}/ws`);
});
