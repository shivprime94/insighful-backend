const express = require('express');
const router = express.Router();
const {
  storeScreenshot,
  getScreenshotsByTimeLog,
  getMyScreenshots,
  getEmployeeScreenshots,
  deleteScreenshot
} = require('../controllers/screenshotController');
const { authenticate } = require('../middleware/authMiddleware');

// Employee routes
router.post('/', authenticate, storeScreenshot);
router.get('/me', authenticate, getMyScreenshots);
router.get('/timelog/:timeLogId', authenticate, getScreenshotsByTimeLog);

// Admin/manager routes
router.get('/employee/:employeeId', authenticate, getEmployeeScreenshots);
router.delete('/:id', authenticate, deleteScreenshot);

module.exports = router;