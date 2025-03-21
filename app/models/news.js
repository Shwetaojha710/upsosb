const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log = require('./log')
const news = sequelize.define("news", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    hn_heading: {
        type: DataTypes.STRING,
        allowNull: false,
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
    },
    heading: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hn_title: {
        type: DataTypes.STRING,
        allowNull: false,
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hn_description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lang: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    document: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    size: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isarchives: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
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
    tableName: "news",
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    timestamps: true,  // Automatically handles `createdAt` & `updatedAt`
});


news.afterCreate(async (newss,options)=>{
    await log.create({
        tableName: "news",
        recordId: newss.id,
        action: "CREATE",
        oldData: newss.toJSON(),
        newData: null,
        changedBy: options.news || "System",
    });
})


news.beforeUpdate(async (newss, options) => {
    const originalData = await news.findByPk(newss.id);
    await log.create({
        tableName: "news",
        recordId: newss.id,
        action: "UPDATE",
        oldData: originalData.toJSON(),
        newData: newss.toJSON(),
        createdBy: newss.id || "System",
    });
});


news.beforeDestroy(async (newss, options) => {
    await log.create({
        tableName: "news",
        recordId: newss.id,
        action: "DELETE",
        oldData: newss.toJSON(),
        newData: null,
        createdBy: newss.id || "System",
    });
});


module.exports = news
