const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log = require('./log')
    const organizational = sequelize.define("organizational", {
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
        tableName: "organizational",
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        timestamps: true,  // Automatically handles `createdAt` & `updatedAt`
    });


organizational.afterCreate(async (organizationals,options)=>{
    await log.create({
        tableName: "organizational",
        recordId: organizationals.id,
        action: "CREATE",
        oldData: organizationals.toJSON(),
        newData: null,
        changedBy: options.organizational || "System",
    });
})


organizational.beforeUpdate(async (organizationals, options) => {
    const originalData = await organizational.findByPk(organizationals.id);
    await log.create({
        tableName: "organizational",
        recordId: organizationals.id,
        action: "UPDATE",
        oldData: originalData.toJSON(),
        newData: organizationals.toJSON(),
        createdBy: organizationals.id || "System",
    });
});


organizational.beforeDestroy(async (organizationals, options) => {
    await log.create({
        tableName: "organizational",
        recordId: organizationals.id,
        action: "DELETE",
        oldData: organizationals.toJSON(),
        newData: null,
        createdBy: organizationals.id || "System",
    });
});


module.exports = organizational
