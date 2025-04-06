const sequelize = require('../config/database');
const Employee = require('./Employee');
const Project = require('./Project');
const Task = require('./Task');
const TimeLog = require('./TimeLog');
const Screenshot = require('./Screenshot');

// Define associations between models
// Employee-Project: Many-to-Many
const EmployeeProject = sequelize.define('EmployeeProject', {}, { timestamps: true });
Employee.belongsToMany(Project, { through: EmployeeProject });
Project.belongsToMany(Employee, { through: EmployeeProject });

// Employee-Task: Many-to-Many
const EmployeeTask = sequelize.define('EmployeeTask', {}, { timestamps: true });
Employee.belongsToMany(Task, { through: EmployeeTask });
Task.belongsToMany(Employee, { through: EmployeeTask });

// Project-Task: One-to-Many
Project.hasMany(Task, { foreignKey: 'projectId' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

// Employee-TimeLog: One-to-Many
Employee.hasMany(TimeLog, { foreignKey: 'employeeId' });
TimeLog.belongsTo(Employee, { foreignKey: 'employeeId' });

// Task-TimeLog: One-to-Many
Task.hasMany(TimeLog, { foreignKey: 'taskId' });
TimeLog.belongsTo(Task, { foreignKey: 'taskId' });

// Project-TimeLog: One-to-Many
Project.hasMany(TimeLog, { foreignKey: 'projectId' });
TimeLog.belongsTo(Project, { foreignKey: 'projectId' });

// TimeLog-Screenshot: One-to-Many
TimeLog.hasMany(Screenshot, { foreignKey: 'timeLogId' });
Screenshot.belongsTo(TimeLog, { foreignKey: 'timeLogId' });

// Employee-Screenshot: One-to-Many
Employee.hasMany(Screenshot, { foreignKey: 'employeeId' });
Screenshot.belongsTo(Employee, { foreignKey: 'employeeId' });

module.exports = {
  sequelize,
  Employee,
  Project,
  Task,
  TimeLog,
  Screenshot,
  EmployeeProject,
  EmployeeTask
};