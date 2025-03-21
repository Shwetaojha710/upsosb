const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log = require('./log')
const page = sequelize.define("page", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true, 
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON, 
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.BIGINT, 
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});


page.afterCreate(async (pages,options)=>{
  await log.create({
      tableName: "page",
      recordId: pages.id,
      action: "CREATE",
      oldData: pages.toJSON(),
      newData: null,
      changedBy: options.user || "System",
  });
})


page.beforeUpdate(async (pages, options) => {
  const originalData = await page.findByPk(pages.id);
  await log.create({
      tableName: "pages",
      recordId: pages.id,
      action: "UPDATE",
      oldData: originalData.toJSON(),
      newData: pages.toJSON(),
      createdBy: pages.id || "System",
  });
});


page.beforeDestroy(async (pages, options) => {
  await log.create({
      tableName: "pages",
      recordId: pages.id,
      action: "DELETE",
      oldData: pages.toJSON(),
      newData: null,
      createdBy: pages.id || "System",
  });
});


module.exports = page;
