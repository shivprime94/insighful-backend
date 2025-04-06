const { Task, Project, Employee, EmployeeTask } = require('../models');

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: Project,
          attributes: ['id', 'name']
        },
        {
          model: Employee,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name']
        },
        {
          model: Employee,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create task
const createTask = async (req, res) => {
  try {
    const { name, description, projectId, employeeIds = [], isDefault = false } = req.body;
    
    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const task = await Task.create({
      name,
      description,
      projectId,
      isDefault
    });
    
    // Assign employees to task if specified
    if (employeeIds.length > 0) {
      const taskAssignments = employeeIds.map(employeeId => ({
        EmployeeId: employeeId,
        TaskId: task.id
      }));
      
      await EmployeeTask.bulkCreate(taskAssignments);
    }
    
    // Return the created task with assigned employees
    const taskWithEmployees = await Task.findByPk(task.id, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name']
        },
        {
          model: Employee,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    });
    
    res.status(201).json(taskWithEmployees);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, employeeIds } = req.body;
    
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update task details
    if (name) task.name = name;
    if (description !== undefined) task.description = description;
    if (isActive !== undefined) task.isActive = isActive;
    
    await task.save();
    
    // Update employee assignments if specified
    if (employeeIds !== undefined) {
      // Remove current employee assignments
      await EmployeeTask.destroy({
        where: { TaskId: task.id }
      });
      
      // Add new employee assignments
      if (employeeIds.length > 0) {
        const taskAssignments = employeeIds.map(employeeId => ({
          EmployeeId: employeeId,
          TaskId: task.id
        }));
        
        await EmployeeTask.bulkCreate(taskAssignments);
      }
    }
    
    // Return the updated task with assigned employees
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: Project,
          attributes: ['id', 'name']
        },
        {
          model: Employee,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    });
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Don't allow deletion of default tasks
    if (task.isDefault) {
      return res.status(400).json({ message: 'Default tasks cannot be deleted' });
    }
    
    // Instead of hard delete, deactivate the task
    task.isActive = false;
    await task.save();
    
    res.json({ message: 'Task deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks for a specific project
const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const tasks = await Task.findAll({
      where: { 
        projectId,
        isActive: true
      },
      include: [
        {
          model: Employee,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Error getting project tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks assigned to the authenticated employee
const getMyTasks = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    
    const employee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: Task,
          where: { isActive: true },
          through: { attributes: [] },
          include: [
            {
              model: Project,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    res.json(employee.Tasks || []);
  } catch (error) {
    console.error('Error getting employee tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getMyTasks
};