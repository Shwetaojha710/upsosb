const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log = require('./log')
const managedirectory = sequelize.define("managedirectory", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    en_first_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hn_first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    },
    en_last_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hn_last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        // min:{
        //     args:10,
        //     msg:'Mobile no should be 10 digits.'
        // },
        // max:{
        //     args:10,
        //     msg:'Mobile no should be 10 digits.'
        // },
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
        // validate: {
        //     notEmpty: {
        //         msg: "Email cannot be empty",
        //     },
        //     isEmail: {
        //         msg: "Invalid email format",
        //     },
        //     is: {
        //         args: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        //         msg: "Invalid email format",
        //     },
        // },
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    en_designation: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hn_designation: {
        type: DataTypes.STRING,
        allowNull: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    },
  
    img: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    size: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    intercome: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lang: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    order: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    created_by: {
        type: DataTypes.BIGINT, 
        allowNull: false,
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
      },
}, {
    tableName: 'managedirectory',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });



managedirectory.afterCreate(async (managedirectorys,options)=>{
    await log.create({
        tableName: "managedirectory",
        recordId: managedirectorys.id,
        module:managedirectorys?.module,
        action: "CREATE",
        oldData: managedirectorys.toJSON(),
        newData: null,
        changedBy: options.managedirectory || "System",
    });
})


managedirectory.beforeUpdate(async (user, options) => {
    const originalData = await managedirectory.findByPk(user.id);
    await log.create({
        tableName: "managedirectory",
        recordId: user.id,
        module:user?.module,
        action: "UPDATE",
        oldData: originalData.toJSON(),
        newData: user.toJSON(),
        createdBy: user.id || "System",
    });
});


managedirectory.beforeDestroy(async (user, options) => {
    await log.create({
        tableName: "managedirectory",
        recordId: user.id,
        module:user?.module,
        action: "DELETE",
        oldData: user.toJSON(),
        newData: null,
        createdBy: user.id || "System",
    });
});


module.exports = managedirectory
