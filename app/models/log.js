const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");

const log = sequelize.define("log", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true, 
  },
  tableName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  module: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  recordId: {
    type: DataTypes.STRING(36), 
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM("UPDATE", "DELETE", "CREATE"),
    allowNull: false,
  },
  oldData: {
    type: DataTypes.JSON, 
    allowNull: true,
  },
  newData: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.BIGINT, 
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = log;
