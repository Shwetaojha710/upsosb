const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");

const document = sequelize.define("documents", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  image_title:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  hn_image_title:{
    type: DataTypes.STRING,
    allowNull: true,
      charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
  },
  image_alt:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  hn_image_alt:{
    type: DataTypes.STRING,
    allowNull: true,
        charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
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
    type: DataTypes.ENUM("true", "false"),
    allowNull: true,
    defaultValue:"false"
  },
  img_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doc_type: {
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


module.exports = document;
