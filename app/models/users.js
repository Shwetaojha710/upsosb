const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log = require('./log')
const users = sequelize.define("users", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    loginId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        min:{
            args:10,
            msg:'Mobile no should be 10 digits.'
        },
        max:{
            args:10,
            msg:'Mobile no should be 10 digits.'
        },
        unique: {
            args: true,
            msg: 'Mobile already in use!'
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            args: true,
            msg: "Email address already in use!",
        },
        validate: {
            notEmpty: {
                msg: "Email cannot be empty",
            },
            isEmail: {
                msg: "Invalid email format",
            },
            is: {
                args: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                msg: "Invalid email format",
            },
        },
    },
    
    gender: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    dob: {
        type: DataTypes.DATE,
        allowNull: false,

    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    pincode: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    jwt_token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM("admin", "staff"),
        allowNull: true,
        defaultValue: "admin",
    },    
    created_by: {
        type: DataTypes.BIGINT, 
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Active'
    }
});


users.afterCreate(async (users,options)=>{
    await log.create({
        tableName: "users",
        recordId: users.id,
        action: "CREATE",
        oldData: users.toJSON(),
        newData: null,
        changedBy: options.user || "System",
    });
})


users.beforeUpdate(async (user, options) => {
    const originalData = await users.findByPk(user.id);
    await log.create({
        tableName: "users",
        recordId: user.id,
        action: "UPDATE",
        oldData: originalData.toJSON(),
        newData: user.toJSON(),
        createdBy: user.id || "System",
    });
});


users.beforeDestroy(async (user, options) => {
    await log.create({
        tableName: "users",
        recordId: user.id,
        action: "DELETE",
        oldData: user.toJSON(),
        newData: null,
        createdBy: user.id || "System",
    });
});


module.exports = users
