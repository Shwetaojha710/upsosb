const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log = require('./log')
const tender = sequelize.define("tender", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    tender_no: {
        type: DataTypes.STRING,
        allowNull: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    },
    en_description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hn_description: {
        type: DataTypes.STRING,
        allowNull: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    },
    bid_sub_start_date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    bid_sub_end_date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    
    document: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    document_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    document_kb: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    work_nature: {
        type: DataTypes.STRING,
        allowNull: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    },
    lang:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    isarchives:{
        type: DataTypes.ENUM(0,1),
        allowNull: true,
        defaultValue: 0
    },
    created_by: {
        type: DataTypes.ENUM(0,1),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('ACTIVE','INACTIVE'),
        allowNull: false,
        defaultValue: 'Active'
    }
}, {
    tableName: 'tender',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });


tender.afterCreate(async (tenders,options)=>{
    await log.create({
        tableName: "tender",
        recordId: tenders.id,
        action: "CREATE",
        oldData: tenders.toJSON(),
        newData: null,
        changedBy: options.tender || "System",
    });
})


tender.beforeUpdate(async (tenders, options) => {
    const originalData = await tender.findByPk(tenders.id);
    await log.create({
        tableName: "tender",
        recordId: tenders.id,
        action: "UPDATE",
        oldData: originalData.toJSON(),
        newData: tenders.toJSON(),
        createdBy: tenders.id || "System",
    });
});


tender.beforeDestroy(async (tenders, options) => {
    await log.create({
        tableName: "tender",
        recordId: tenders.id,
        action: "DELETE",
        oldData: tenders.toJSON(),
        newData: null,
        createdBy: tenders.id || "System",
    });
});


module.exports = tender
