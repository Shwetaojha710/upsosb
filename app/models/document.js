const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log=require('./log')
const document = sequelize.define("documents", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  image_title:{
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hn_image_title:{
    type: DataTypes.TEXT,
    allowNull: true,
      charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
  },
  image_alt:{
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hn_image_alt:{
    type: DataTypes.TEXT,
    allowNull: true,
   charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
  },
  document:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  order:{
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  banner_image: {
    type: DataTypes.STRING,
    field: "banner_image",
    allowNull: true,
  },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: 1,
  },
  img_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doc_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },

}, {
  tableName: 'documents',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});


document.afterCreate(async (documents,options)=>{
  await log.create({
      tableName: "document",
      recordId: documents.id,
      module:documents.mdoule,
      action: "CREATE",
      oldData: documents.toJSON(),
      newData: null,
      changedBy: options.user || "System",
  });
})


document.beforeUpdate(async (documents, options) => {
  const originalData = await document.findByPk(documents.id);
  await log.create({
      tableName: "documents",
      recordId: documents.id,
      module:documents.mdoule,
      action: "UPDATE",
      oldData: originalData.toJSON(),
      newData: documents.toJSON(),
      createdBy: documents.id || "System",
  });
});


document.beforeDestroy(async (documents, options) => {
  await log.create({
      tableName: "documents",
      recordId: documents.id,
      module:documents.mdoule,
      action: "DELETE",
      oldData: documents.toJSON(),
      newData: null,
      createdBy: documents.id || "System",
  });
});



module.exports = document;
