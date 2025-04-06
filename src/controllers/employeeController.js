const { v4: uuidv4 } = require('uuid');
const { Employee, Project, Task, EmployeeProject, EmployeeTask } = require('../models');
const { sendVerificationEmail } = require('../utils/emailUtil');

// Get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive', 'isVerified', 'createdAt', 'updatedAt']
    });
    
    res.json(employees);
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findByPk(id, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive', 'isVerified', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Project,
          through: { attributes: [] } // Don't include join table attributes
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create employee (admin function)
const createEmployee = async (req, res) => {
  try {
    const { email, firstName, lastName, projects } = req.body;
    
    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ where: { email } });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Generate temporary password and verification token
    const tempPassword = Math.random().toString(36).slice(-8);
    const verificationToken = uuidv4();
    
    // Create new employee
    const employee = await Employee.create({
      email,
      password: tempPassword,
      firstName,
      lastName,
      verificationToken
    });
    
    // Assign employee to projects if specified
    if (projects && projects.length > 0) {
      const projectIds = projects.map(projectId => ({
        EmployeeId: employee.id,
        ProjectId: projectId
      }));
      
      await EmployeeProject.bulkCreate(projectIds);
      
      // Assign employee to default tasks of projects
      for (const projectId of projects) {
        const defaultTasks = await Task.findAll({
          where: { 
            projectId,
            isDefault: true
          }
        });
        
        if (defaultTasks.length > 0) {
          const taskAssignments = defaultTasks.map(task => ({
            EmployeeId: employee.id,
            TaskId: task.id
          }));
          
          await EmployeeTask.bulkCreate(taskAssignments);
        }
      }
    }
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken, firstName);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }
    
    res.status(201).json({
      message: 'Employee created successfully and verification email sent',
      employee: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        isActive: employee.isActive
      }
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, isActive, projects } = req.body;
    
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Update employee details
    if (firstName) employee.firstName = firstName;
    if (lastName) employee.lastName = lastName;
    if (isActive !== undefined) employee.isActive = isActive;
    
    await employee.save();
    
    // Update project assignments if specified
    if (projects) {
      // Remove current project assignments
      await EmployeeProject.destroy({
        where: { EmployeeId: employee.id }
      });
      
      // Remove current task assignments
      await EmployeeTask.destroy({
        where: { EmployeeId: employee.id }
      });
      
      // Add new project assignments
      if (projects.length > 0) {
        const projectIds = projects.map(projectId => ({
          EmployeeId: employee.id,
          ProjectId: projectId
        }));
        
        await EmployeeProject.bulkCreate(projectIds);
        
        // Assign employee to default tasks of projects
        for (const projectId of projects) {
          const defaultTasks = await Task.findAll({
            where: { 
              projectId,
              isDefault: true
            }
          });
          
          if (defaultTasks.length > 0) {
            const taskAssignments = defaultTasks.map(task => ({
              EmployeeId: employee.id,
              TaskId: task.id
            }));
            
            await EmployeeTask.bulkCreate(taskAssignments);
          }
        }
      }
    }
    
    res.json({ 
      message: 'Employee updated successfully',
      employee: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        isActive: employee.isActive
      }
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Instead of hard delete, deactivate the employee
    employee.isActive = false;
    await employee.save();
    
    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get employee profile (for authenticated employees)
const getProfile = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    
    const employee = await Employee.findByPk(employeeId, {
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive', 'isVerified', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Project,
          through: { attributes: [] }
        },
        {
          model: Task,
          through: { attributes: [] }
        }
      ]
    });
    
    res.json(employee);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update employee's own profile
const updateProfile = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    const { firstName, lastName } = req.body;
    
    const employee = await Employee.findByPk(employeeId);
    
    // Update employee details
    if (firstName) employee.firstName = firstName;
    if (lastName) employee.lastName = lastName;
    
    await employee.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      employee: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getProfile,
  updateProfile
};