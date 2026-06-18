const deviceManager = require('./deviceManager');

const UPDATE_INTERVAL = 3000;

function generateNextValue(current, min, max, changeRate) {
  const change = (Math.random() - 0.5) * changeRate;
  let next = current + change;
  next = Math.max(min, Math.min(max, next));
  return Number(next.toFixed(2));
}

function simulateDeviceMetrics(device) {
  const m = device.metrics;
  const isRunning = device.status === 'running';

  if (isRunning) {
    return {
      stirringSpeed: generateNextValue(m.stirringSpeed, 20, 100, 8),
      bacteriaTemperature: generateNextValue(m.bacteriaTemperature, 45, 70, 2),
      humidity: generateNextValue(m.humidity, 50, 80, 3),
      gasConcentration: generateNextValue(m.gasConcentration, 500, 1200, 80),
    };
  } else {
    return {
      stirringSpeed: 0,
      bacteriaTemperature: generateNextValue(m.bacteriaTemperature, 20, 40, 1),
      humidity: generateNextValue(m.humidity, 30, 60, 2),
      gasConcentration: generateNextValue(m.gasConcentration, 300, 600, 30),
    };
  }
}

function broadcast(wss, data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function startSimulation(wss) {
  setInterval(() => {
    const devices = deviceManager.getAllDevices();

    devices.forEach((deviceInfo) => {
      const fullDevice = deviceManager.getDeviceById(deviceInfo.id);
      if (!fullDevice) return;

      const newMetrics = simulateDeviceMetrics(fullDevice);
      deviceManager.updateDeviceMetrics(deviceInfo.id, newMetrics);
    });

    const updatedDevices = deviceManager.getAllDevices();
    broadcast(wss, {
      type: 'metrics_update',
      data: updatedDevices
    });
  }, UPDATE_INTERVAL);

  console.log(`Device simulator started, updating every ${UPDATE_INTERVAL}ms`);
}

module.exports = {
  startSimulation
};
