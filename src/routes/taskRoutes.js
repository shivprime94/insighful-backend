const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getMyTasks
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/authMiddleware');

// Admin/manager routes
router.get('/', authenticate, getAllTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, createTask);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);
router.get('/project/:projectId', authenticate, getTasksByProject);

// Employee routes
router.get('/employee/me', authenticate, getMyTasks);

module.exports = router;