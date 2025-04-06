const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getMyProjects
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/authMiddleware');

// Admin/manager routes
router.get('/', authenticate, getAllProjects);
router.get('/:id', authenticate, getProjectById);
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);

// Employee routes
router.get('/employee/me', authenticate, getMyProjects);

module.exports = router;