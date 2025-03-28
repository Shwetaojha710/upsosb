const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log = require("./log");
const uploadpagedoc = sequelize.define(
  "uploadpagedoc",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    image_alt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hn_image_alt: {
      type: DataTypes.TEXT,
      allowNull: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hn_title: {
      type: DataTypes.TEXT,
      allowNull: true,
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    document: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    size: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    doc_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1,
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "uploadpagedoc",
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  }
);

uploadpagedoc.afterCreate(async (uploadpagedocs, options) => {
  await log.create({
    tableName: "uploadpagedoc",
    recordId: uploadpagedocs.id,
    module: uploadpagedocs.mdoule,
    action: "CREATE",
    oldData: uploadpagedocs.toJSON(),
    newData: null,
    changedBy: options.user || "System",
  });
});

// document.beforeUpdate(async (documents, options) => {
//   const originalData = await document.findByPk(documents.id);
//   await log.create({
//       tableName: "documents",
//       recordId: documents.id,
//       module:documents.mdoule,
//       action: "UPDATE",
//       oldData: originalData.toJSON(),
//       newData: documents.toJSON(),
//       createdBy: documents.id || "System",
//   });
// });

uploadpagedoc.beforeDestroy(async (uploadpagedocs, options) => {
  await log.create({
      tableName: "uploadpagedocs",
      recordId: uploadpagedocs.id,
      module:uploadpagedocs.mdoule,
      action: "DELETE",
      oldData: uploadpagedocs.toJSON(),
      newData: null,
      createdBy: uploadpagedocs.id || "System",
  });
});

module.exports = uploadpagedoc;
