const { DataTypes } = require('sequelize');
const sequelize = require('../connection/sequelize');

const menu = sequelize.define("menu", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  parent_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue:0
  },
  en_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hn_name: {
    type: DataTypes.STRING,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lang: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  page_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'menus',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});


module.exports = menu;
