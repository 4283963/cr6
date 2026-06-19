import request from '../utils/request.js';

export function getDeviceList() {
  return request.get('/devices');
}

export function getDeviceDetail(deviceId) {
  return request.get(`/devices/${deviceId}`);
}

export function getDeviceHistory(deviceId) {
  return request.get(`/devices/${deviceId}/history`);
}

export function sendDeviceCommand(deviceId, command) {
  return request.post('/commands', { deviceId, command });
}
