const express = require('express');
const router = express.Router();
const { 
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getProfile,
  updateProfile
} = require('../controllers/employeeController');
const { authenticate } = require('../middleware/authMiddleware');

// API endpoints for admin operations
router.get('/', authenticate, getAllEmployees);
router.get('/:id', authenticate, getEmployeeById);
router.post('/', authenticate, createEmployee);
router.put('/:id', authenticate, updateEmployee);
router.delete('/:id', authenticate, deleteEmployee);

// API endpoints for employee's own profile
router.get('/profile/me', authenticate, getProfile);
router.put('/profile/me', authenticate, updateProfile);

module.exports = router;