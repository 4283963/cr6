const express = require('express');
const router = express.Router();
const deviceManager = require('../services/deviceManager');

router.get('/', (req, res) => {
  const devices = deviceManager.getAllDevices();
  res.json(devices);
});

router.get('/:id', (req, res) => {
  const device = deviceManager.getDeviceById(req.params.id);
  if (!device) {
    return res.status(404).json({ error: '设备不存在' });
  }
  res.json(device);
});

router.get('/:id/history', (req, res) => {
  const device = deviceManager.getDeviceById(req.params.id);
  if (!device) {
    return res.status(404).json({ error: '设备不存在' });
  }
  res.json(device.history || []);
});

module.exports = router;
