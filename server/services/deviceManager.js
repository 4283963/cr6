let devices = [];
const historyData = new Map();
const MAX_HISTORY_POINTS = 60;

function generateRandomMetric(base, variance) {
  return Number((base + (Math.random() - 0.5) * variance).toFixed(2));
}

function createInitialState() {
  return {
    stirringSpeed: generateRandomMetric(60, 20),
    bacteriaTemperature: generateRandomMetric(55, 5),
    humidity: generateRandomMetric(65, 10),
    gasConcentration: generateRandomMetric(800, 200),
    timestamp: new Date().toISOString()
  };
}

function initDevices() {
  const deviceConfigs = [
    { id: 'DW-001', name: '1号降解机', location: 'A区-1号点位', status: 'running' },
    { id: 'DW-002', name: '2号降解机', location: 'A区-2号点位', status: 'running' },
    { id: 'DW-003', name: '3号降解机', location: 'B区-1号点位', status: 'idle' },
    { id: 'DW-004', name: '4号降解机', location: 'B区-2号点位', status: 'running' },
    { id: 'DW-005', name: '5号降解机', location: 'C区-1号点位', status: 'maintenance' },
    { id: 'DW-006', name: '6号降解机', location: 'C区-2号点位', status: 'running' },
  ];

  devices = deviceConfigs.map(config => ({
    ...config,
    metrics: createInitialState(),
    lastUpdate: new Date().toISOString()
  }));

  devices.forEach(device => {
    historyData.set(device.id, []);
    const history = historyData.get(device.id);
    for (let i = MAX_HISTORY_POINTS; i > 0; i--) {
      const timestamp = new Date(Date.now() - i * 5000).toISOString();
      history.push({
        ...createInitialState(),
        timestamp
      });
    }
  });
}

function getAllDevices() {
  return devices.map(d => ({
    id: d.id,
    name: d.name,
    location: d.location,
    status: d.status,
    metrics: d.metrics,
    lastUpdate: d.lastUpdate
  }));
}

function getDeviceById(id) {
  const device = devices.find(d => d.id === id);
  if (!device) return null;
  return {
    ...device,
    history: historyData.get(id) || []
  };
}

function updateDeviceMetrics(deviceId, metrics) {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return null;

  device.metrics = { ...metrics, timestamp: new Date().toISOString() };
  device.lastUpdate = new Date().toISOString();

  const history = historyData.get(deviceId);
  if (history) {
    history.push(device.metrics);
    if (history.length > MAX_HISTORY_POINTS) {
      history.shift();
    }
  }

  return device;
}

function updateDeviceStatus(deviceId, status) {
  const device = devices.find(d => d.id === deviceId);
  if (!device) return null;
  device.status = status;
  device.lastUpdate = new Date().toISOString();
  return device;
}

function executeCommand(deviceId, command) {
  const device = devices.find(d => d.id === deviceId);
  if (!device) {
    return { success: false, error: '设备不存在' };
  }

  let newMetrics = { ...device.metrics };

  switch (command) {
    case 'start_stirring':
      newMetrics.stirringSpeed = Math.min(120, newMetrics.stirringSpeed + 30);
      break;
    case 'stop_stirring':
      newMetrics.stirringSpeed = 0;
      break;
    case 'start_heating':
      newMetrics.bacteriaTemperature = Math.min(80, newMetrics.bacteriaTemperature + 5);
      break;
    case 'stop_heating':
      break;
    default:
      return { success: false, error: '未知指令' };
  }

  updateDeviceMetrics(deviceId, newMetrics);

  return {
    success: true,
    command,
    deviceId,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  initDevices,
  getAllDevices,
  getDeviceById,
  updateDeviceMetrics,
  updateDeviceStatus,
  executeCommand
};
