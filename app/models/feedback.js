const { DataTypes } = require("sequelize");
const sequelize = require("../connection/sequelize");
const log = require("./log");
const feedback = sequelize.define("feedback", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    min: {
      args: 10,
      msg: "Mobile no should be 10 digits.",
    },
    max: {
      args: 10,
      msg: "Mobile no should be 10 digits.",
    },
    // unique: {
    //   args: true,
    //   msg: "Mobile already in use!",
    // },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    // unique: {
    //   args: true,
    //   msg: "Email address already in use!",
    // },
    validate: {
      notEmpty: {
        msg: "Email cannot be empty",
      },
      isEmail: {
        msg: "Invalid email format",
      },
      is: {
        args: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        msg: "Invalid email format",
      },
    },
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  feedback: {
    type: DataTypes.STRING,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
}, {
  tableName: 'feedback',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

feedback.afterCreate(async (feedbacks, options) => {
  await log.create({
    tableName: "feedbacks",
    recordId: feedbacks.id,
    action: "CREATE",
    oldData: feedbacks.toJSON(),
    newData: null,
    changedBy: options.feedbacks || "System",
  });
});

feedback.beforeUpdate(async (feedbacks, options) => {
  const originalData = await feedback.findByPk(user.id);
  await log.create({
    tableName: "feedbacks",
    recordId: feedbacks.id,
    action: "UPDATE",
    oldData: originalData.toJSON(),
    newData: feedbacks.toJSON(),
    createdBy: feedbacks.id || "System",
  });
});

module.exports = feedback;
