const { DataTypes } = require('sequelize');
const sequelize = require('../connection/sequelize');
const log=require('./log')
const faq = sequelize.define("faq", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hn_question: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  hn_answer: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
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
  tableName: 'faqs',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});



faq.afterCreate(async (faqs,options)=>{
  await log.create({
      tableName: "faq",
      recordId: faqs.id,
      module:faqs.mdoule,
      action: "CREATE",
      oldData: faqs.toJSON(),
      newData: null,
      changedBy: options.user || "System",
  });
})


faq.beforeUpdate(async (faqs, options) => {
  const originalData = await faq.findByPk(faqs.id);
  await log.create({
      tableName: "faqs",
      recordId: faqs.id,
      module:faqs.mdoule,
      action: "UPDATE",
      oldData: originalData.toJSON(),
      newData: faqs.toJSON(),
      createdBy: faqs.id || "System",
  });
});


faq.beforeDestroy(async (faqs, options) => {
  await log.create({
      tableName: "faqs",
      recordId: faqs.id,
      module:faqs.mdoule,
      action: "DELETE",
      oldData: faqs.toJSON(),
      newData: null,
      createdBy: faqs.id || "System",
  });
});



module.exports = faq;
