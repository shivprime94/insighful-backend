const { Screenshot, TimeLog, Employee } = require('../models');
const { Op } = require('sequelize');

// Store a new screenshot from desktop app
const storeScreenshot = async (req, res) => {
  try {
    const { timeLogId, imageUrl, timestamp, hasPermission } = req.body;
    const employeeId = req.employee.id;
    
    // Check if the time log exists and belongs to the employee
    const timeLog = await TimeLog.findOne({
      where: { 
        id: timeLogId,
        employeeId
      }
    });
    
    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found or unauthorized' });
    }
    
    // Create new screenshot
    const screenshot = await Screenshot.create({
      timeLogId,
      employeeId,
      imageUrl,
      timestamp: new Date(timestamp || Date.now()),
      hasPermission: hasPermission !== undefined ? hasPermission : true
    });
    
    res.status(201).json({
      message: 'Screenshot stored successfully',
      screenshot: {
        id: screenshot.id,
        timeLogId: screenshot.timeLogId,
        imageUrl: screenshot.imageUrl,
        timestamp: screenshot.timestamp,
        hasPermission: screenshot.hasPermission
      }
    });
  } catch (error) {
    console.error('Error storing screenshot:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get screenshots for a specific time log
const getScreenshotsByTimeLog = async (req, res) => {
  try {
    const { timeLogId } = req.params;
    const employeeId = req.employee.id;
    
    // Get the time log
    const timeLog = await TimeLog.findByPk(timeLogId);
    
    // Check if the time log exists
    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }
    
    // Check if the employee is authorized to access these screenshots
    // (either it's their own screenshots or they are an admin)
    if (timeLog.employeeId !== employeeId) {
      // For simplicity, we're not implementing admin check here
      // In a real app, you would check if the user has admin permissions
      return res.status(403).json({ message: 'Unauthorized access to screenshots' });
    }
    
    // Get screenshots
    const screenshots = await Screenshot.findAll({
      where: { timeLogId },
      order: [['timestamp', 'ASC']]
    });
    
    res.json(screenshots);
  } catch (error) {
    console.error('Error getting screenshots:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get screenshots for a date range for authenticated employee
const getMyScreenshots = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const employeeId = req.employee.id;
    
    // Set default dates if not provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));
    
    // Get screenshots
    const screenshots = await Screenshot.findAll({
      where: {
        employeeId,
        timestamp: {
          [Op.between]: [start, end]
        }
      },
      include: [
        {
          model: TimeLog,
          attributes: ['id', 'startTime', 'endTime', 'duration', 'taskId', 'projectId']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
    
    res.json({
      screenshots,
      startDate: start,
      endDate: end
    });
  } catch (error) {
    console.error('Error getting employee screenshots:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get screenshots for a specific employee (admin function)
const getEmployeeScreenshots = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check if employee exists
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Set default dates if not provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999));
    
    // Get screenshots
    const screenshots = await Screenshot.findAll({
      where: {
        employeeId,
        timestamp: {
          [Op.between]: [start, end]
        }
      },
      include: [
        {
          model: TimeLog,
          attributes: ['id', 'startTime', 'endTime', 'duration', 'taskId', 'projectId']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
    
    res.json({
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email
      },
      screenshots,
      startDate: start,
      endDate: end
    });
  } catch (error) {
    console.error('Error getting employee screenshots:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a screenshot (admin function)
const deleteScreenshot = async (req, res) => {
  try {
    const { id } = req.params;
    
    const screenshot = await Screenshot.findByPk(id);
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }
    
    await screenshot.destroy();
    
    res.json({ message: 'Screenshot deleted successfully' });
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  storeScreenshot,
  getScreenshotsByTimeLog,
  getMyScreenshots,
  getEmployeeScreenshots,
  deleteScreenshot
};