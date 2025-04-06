const { TimeLog, Task, Project, Employee } = require('../models');
const { Op } = require('sequelize');

// Start time tracking session
const startTimeTracking = async (req, res) => {
  try {
    const { taskId, notes } = req.body;
    const employeeId = req.employee.id;
    
    // Check if there's already an active time log for this employee
    const activeTimeLog = await TimeLog.findOne({
      where: {
        employeeId,
        endTime: null
      }
    });
    
    if (activeTimeLog) {
      return res.status(400).json({ 
        message: 'You already have an active time tracking session',
        activeTimeLog
      });
    }
    
    // Check if task exists and employee is assigned to it
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: Employee,
          where: { id: employeeId },
          through: { attributes: [] }
        },
        {
          model: Project
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found or you are not assigned to it' });
    }
    
    // Get client IP address
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Create new time log
    const timeLog = await TimeLog.create({
      employeeId,
      taskId,
      projectId: task.projectId,
      startTime: new Date(),
      notes,
      ipAddress,
      // MAC address would be collected by the desktop app
    });
    
    res.status(201).json({
      message: 'Time tracking started',
      timeLog: {
        id: timeLog.id,
        startTime: timeLog.startTime,
        task: {
          id: task.id,
          name: task.name
        },
        project: {
          id: task.Project.id,
          name: task.Project.name
        }
      }
    });
  } catch (error) {
    console.error('Error starting time tracking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Stop time tracking session
const stopTimeTracking = async (req, res) => {
  try {
    const { timeLogId } = req.params;
    const { notes } = req.body;
    const employeeId = req.employee.id;
    
    // Find the active time log
    const timeLog = await TimeLog.findOne({
      where: {
        id: timeLogId,
        employeeId,
        endTime: null
      },
      include: [
        {
          model: Task
        },
        {
          model: Project
        }
      ]
    });
    
    if (!timeLog) {
      return res.status(404).json({ message: 'Active time log not found' });
    }
    
    // Update end time and calculate duration
    const endTime = new Date();
    const startTime = new Date(timeLog.startTime);
    const durationInSeconds = Math.floor((endTime - startTime) / 1000);
    
    // Update time log
    timeLog.endTime = endTime;
    timeLog.duration = durationInSeconds;
    if (notes) {
      timeLog.notes = timeLog.notes ? `${timeLog.notes}\n${notes}` : notes;
    }
    
    await timeLog.save();
    
    res.json({
      message: 'Time tracking stopped',
      timeLog: {
        id: timeLog.id,
        startTime: timeLog.startTime,
        endTime: timeLog.endTime,
        duration: durationInSeconds,
        task: {
          id: timeLog.Task.id,
          name: timeLog.Task.name
        },
        project: {
          id: timeLog.Project.id,
          name: timeLog.Project.name
        }
      }
    });
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current active time log for employee
const getCurrentTimeLog = async (req, res) => {
  try {
    const employeeId = req.employee.id;
    
    // Find active time log
    const activeTimeLog = await TimeLog.findOne({
      where: {
        employeeId,
        endTime: null
      },
      include: [
        {
          model: Task
        },
        {
          model: Project
        }
      ]
    });
    
    if (!activeTimeLog) {
      return res.json({ active: false });
    }
    
    // Calculate current duration
    const startTime = new Date(activeTimeLog.startTime);
    const currentTime = new Date();
    const currentDuration = Math.floor((currentTime - startTime) / 1000);
    
    res.json({
      active: true,
      timeLog: {
        id: activeTimeLog.id,
        startTime: activeTimeLog.startTime,
        currentDuration,
        task: {
          id: activeTimeLog.Task.id,
          name: activeTimeLog.Task.name
        },
        project: {
          id: activeTimeLog.Project.id,
          name: activeTimeLog.Project.name
        }
      }
    });
  } catch (error) {
    console.error('Error getting current time log:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get time logs for an employee within a date range
const getTimeLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const employeeId = req.employee.id;
    
    // Set default dates if not provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));
    
    const timeLogs = await TimeLog.findAll({
      where: {
        employeeId,
        startTime: {
          [Op.between]: [start, end]
        }
      },
      include: [
        {
          model: Task,
          attributes: ['id', 'name']
        },
        {
          model: Project,
          attributes: ['id', 'name']
        }
      ],
      order: [['startTime', 'DESC']]
    });
    
    // Calculate total duration
    const totalDuration = timeLogs.reduce((sum, log) => {
      return sum + (log.duration || 0);
    }, 0);
    
    res.json({
      timeLogs,
      totalDuration,
      startDate: start,
      endDate: end
    });
  } catch (error) {
    console.error('Error getting time logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all time logs for admin/manager with filtering options
const getAllTimeLogs = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, projectId } = req.query;
    
    // Set default dates if not provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));
    
    // Build query conditions
    const whereCondition = {
      startTime: {
        [Op.between]: [start, end]
      }
    };
    
    if (employeeId) {
      whereCondition.employeeId = employeeId;
    }
    
    if (projectId) {
      whereCondition.projectId = projectId;
    }
    
    const timeLogs = await TimeLog.findAll({
      where: whereCondition,
      include: [
        {
          model: Employee,
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Task,
          attributes: ['id', 'name']
        },
        {
          model: Project,
          attributes: ['id', 'name']
        }
      ],
      order: [['startTime', 'DESC']]
    });
    
    // Calculate total duration
    const totalDuration = timeLogs.reduce((sum, log) => {
      return sum + (log.duration || 0);
    }, 0);
    
    res.json({
      timeLogs,
      totalDuration,
      startDate: start,
      endDate: end
    });
  } catch (error) {
    console.error('Error getting all time logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update time log (admin function)
const updateTimeLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, notes } = req.body;
    
    const timeLog = await TimeLog.findByPk(id);
    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }
    
    // Update time log fields
    if (startTime) timeLog.startTime = new Date(startTime);
    if (endTime) timeLog.endTime = new Date(endTime);
    if (notes !== undefined) timeLog.notes = notes;
    
    // Recalculate duration if both start and end times are present
    if (timeLog.startTime && timeLog.endTime) {
      const start = new Date(timeLog.startTime);
      const end = new Date(timeLog.endTime);
      timeLog.duration = Math.floor((end - start) / 1000);
    }
    
    await timeLog.save();
    
    res.json({
      message: 'Time log updated successfully',
      timeLog
    });
  } catch (error) {
    console.error('Error updating time log:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete time log (admin function)
const deleteTimeLog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const timeLog = await TimeLog.findByPk(id);
    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }
    
    await timeLog.destroy();
    
    res.json({ message: 'Time log deleted successfully' });
  } catch (error) {
    console.error('Error deleting time log:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  startTimeTracking,
  stopTimeTracking,
  getCurrentTimeLog,
  getTimeLogs,
  getAllTimeLogs,
  updateTimeLog,
  deleteTimeLog
};