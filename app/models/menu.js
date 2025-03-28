const { DataTypes } = require('sequelize');
const sequelize = require('../connection/sequelize');
const log=require('./log')
const menu = sequelize.define("menu", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  parent_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue:0
  },
  menu: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hn_menu: {
    type: DataTypes.STRING,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  page_title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hn_page_title: {
    type: DataTypes.STRING,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hn_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  page_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lang: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  page_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: 1,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'menus',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});



menu.afterCreate(async (menus,options)=>{
  await log.create({
      tableName: "menu",
      recordId: menus.id,
      module:menus.mdoule,
      action: "CREATE",
      oldData: menus.toJSON(),
      newData: null,
      changedBy: options.user || "System",
  });
})


menu.beforeUpdate(async (menus, options) => {
  const originalData = await menu.findByPk(menus.id);
  await log.create({
      tableName: "menus",
      recordId: menus.id,
      module:menus.mdoule,
      action: "UPDATE",
      oldData: originalData.toJSON(),
      newData: menus.toJSON(),
      createdBy: menus.id || "System",
  });
});


menu.beforeDestroy(async (menus, options) => {
  await log.create({
      tableName: "menus",
      recordId: menus.id,
      module:menus.mdoule,
      action: "DELETE",
      oldData: menus.toJSON(),
      newData: null,
      createdBy: menus.id || "System",
  });
});



module.exports = menu;
