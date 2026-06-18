const express = require('express');
const router = express.Router();
const deviceManager = require('../services/deviceManager');

router.post('/', (req, res) => {
  const { deviceId, command } = req.body;

  if (!deviceId || !command) {
    return res.status(400).json({
      success: false,
      error: '缺少 deviceId 或 command 参数'
    });
  }

  const result = deviceManager.executeCommand(deviceId, command);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

module.exports = router;
