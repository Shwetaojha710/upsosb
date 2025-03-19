const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");

const document = sequelize.define("documents", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  doc_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doc_name: {
    type: DataTypes.STRING,
    field: "doc_name",
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
});
// sequelize.sync()
//     .then(() => {
//         console.log('Database & tables created!');
//     })
//     .catch(error => {
//         console.error('Error creating database & tables:', error);
//     });

module.exports = document;
