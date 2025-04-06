const express = require('express');
const router = express.Router();
const {
  startTimeTracking,
  stopTimeTracking,
  getCurrentTimeLog,
  getTimeLogs,
  getAllTimeLogs,
  updateTimeLog,
  deleteTimeLog
} = require('../controllers/timeTrackingController');
const { authenticate } = require('../middleware/authMiddleware');

// Employee routes
router.post('/start', authenticate, startTimeTracking);
router.put('/stop/:timeLogId', authenticate, stopTimeTracking);
router.get('/current', authenticate, getCurrentTimeLog);
router.get('/logs', authenticate, getTimeLogs);

// Admin/manager routes
router.get('/all', authenticate, getAllTimeLogs);
router.put('/:id', authenticate, updateTimeLog);
router.delete('/:id', authenticate, deleteTimeLog);

module.exports = router;