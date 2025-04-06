const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Screenshot = sequelize.define('Screenshot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  timeLogId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  hasPermission: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Screenshot;