const deviceManager = require('./deviceManager');

const UPDATE_INTERVAL = 3000;
const unbalancedDevices = new Map();

function generateNextValue(current, min, max, changeRate) {
  const change = (Math.random() - 0.5) * changeRate;
  let next = current + change;
  next = Math.max(min, Math.min(max, next));
  return Number(next.toFixed(2));
}

function maybeTriggerUnbalance(deviceId) {
  const currentState = unbalancedDevices.get(deviceId);
  if (currentState) {
    currentState.remaining--;
    if (currentState.remaining <= 0) {
      unbalancedDevices.delete(deviceId);
      return null;
    }
    return currentState;
  }
  if (Math.random() < 0.03) {
    const duration = 4 + Math.floor(Math.random() * 6);
    const type = Math.random() < 0.5 ? 'hot_dry' : 'cold_wet';
    const state = { duration, remaining: duration, type };
    unbalancedDevices.set(deviceId, state);
    return state;
  }
  return null;
}

function simulateDeviceMetrics(device) {
  const m = device.metrics;
  const isRunning = device.status === 'running';

  const unbalanceState = maybeTriggerUnbalance(device.id);

  let baseTemp = isRunning ? 55 : 30;
  let baseHumidity = isRunning ? 65 : 45;
  let tempRange = isRunning ? { min: 45, max: 70 } : { min: 20, max: 40 };
  let humidityRange = isRunning ? { min: 50, max: 80 } : { min: 30, max: 60 };

  if (unbalanceState) {
    if (unbalanceState.type === 'hot_dry') {
      tempRange = { min: 65, max: 75 };
      humidityRange = { min: 30, max: 45 };
      baseTemp = 70;
      baseHumidity = 38;
    } else {
      tempRange = { min: 25, max: 38 };
      humidityRange = { min: 75, max: 90 };
      baseTemp = 32;
      baseHumidity = 82;
    }
  }

  if (isRunning) {
    return {
      stirringSpeed: generateNextValue(m.stirringSpeed, 20, 100, 8),
      bacteriaTemperature: generateNextValue(baseTemp, tempRange.min, tempRange.max, unbalanceState ? 4 : 2),
      humidity: generateNextValue(baseHumidity, humidityRange.min, humidityRange.max, unbalanceState ? 3 : 3),
      gasConcentration: generateNextValue(m.gasConcentration, 500, 1200, 80),
    };
  } else {
    return {
      stirringSpeed: 0,
      bacteriaTemperature: generateNextValue(baseTemp, tempRange.min, tempRange.max, unbalanceState ? 2 : 1),
      humidity: generateNextValue(baseHumidity, humidityRange.min, humidityRange.max, unbalanceState ? 2 : 2),
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
