const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");

const otp = sequelize.define('otp', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    otp: {
        type: DataTypes.BIGINT,
        allowNull: false,

    },
    expiry_time: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false,

    },
    ip: {
        type: DataTypes.STRING(50),
        allowNull: false,

    },
    created_by: {
        type: DataTypes.BIGINT, 
        allowNull: true,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
      },
})

module.exports = otp;