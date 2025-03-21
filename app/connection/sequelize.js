const express = require("express");
const app = express();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_DATABASE || 'upsos',
    process.env.DB_USERNAME || 'root',
    process.env.DB_PASSWORD || 'root',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      port: process.env.DB_PORT || 3306,
      logging: true, // Disable logging for clean console output
    }
  );
  
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('Sequelize connected to MySQL!');
    } catch (error) {
      console.error('Sequelize connection error:', error);
    }
  })();
module.exports = sequelize;