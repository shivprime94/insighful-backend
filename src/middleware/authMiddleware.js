const jwt = require('jsonwebtoken');
const { Employee } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const employee = await Employee.findByPk(decoded.id);
    if (!employee) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Check if employee is active
    if (!employee.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check if employee is verified
    if (!employee.isVerified) {
      return res.status(401).json({ message: 'Email not verified' });
    }

    req.employee = employee;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = {
  authenticate
};