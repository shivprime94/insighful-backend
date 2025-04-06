const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Employee } = require('../models');
const { sendVerificationEmail } = require('../utils/emailUtil');

// Register new employee
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ where: { email } });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Generate verification token
    const verificationToken = uuidv4();

    // Create new employee
    const employee = await Employee.create({
      email,
      password,
      firstName,
      lastName,
      verificationToken
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken, firstName);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.status(201).json({
      message: 'Employee registered successfully. Please verify your email to activate your account.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    const employee = await Employee.findOne({ where: { verificationToken: token } });
    if (!employee) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update employee as verified
    employee.isVerified = true;
    employee.verificationToken = null;
    await employee.save();

    res.json({ 
      message: 'Email verified successfully',
      downloadUrl: process.env.DESKTOP_APP_DOWNLOAD_URL
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login employee
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find employee by email
    const employee = await Employee.findOne({ where: { email } });
    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!employee.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check if email is verified
    if (!employee.isVerified) {
      return res.status(401).json({ message: 'Email not verified' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: employee.id, email: employee.email },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      message: 'Login successful',
      token,
      employee: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update employee password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const employeeId = req.employee.id;

    const employee = await Employee.findByPk(employeeId);

    // Validate current password
    const isPasswordValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    employee.password = newPassword;
    await employee.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  updatePassword
};