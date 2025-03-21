const Helper = require("../../helper/helper");
const sequelize = require("../../connection/sequelize");
const users= require("../../models/users")
const log = require("../../models/log")


exports.employeeregistration = async (req, res) => {
    const transaction = await sequelize.transaction(); // Start transaction
    try {
      let message = "Employee Registration Successfully";
  
      let data = req.body;
      data.email = data.email.toLowerCase();
  
      if (
        !data?.email ||
        !/^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]{1,64}\.[a-zA-Z]{2,10}$/.test(data.email)
      ) {
        return Helper.response("failed", "Invalid email format", null, res, 200);
      }
      
  
      const validateFields = (data) => {
        for (const key in data) {
          if (typeof data[key] === "string") {
            data[key] = data[key].trim(); // Trim spaces before validation
          }
  
          if (data[key] === "" || data[key] === null || data[key] === undefined) {
            return `Error: ${key} cannot be empty!`;
          }
        }
        return null; // No errors
      };
      // **Apply Validation**
      const validationError = validateFields(data);
      if (validationError) {
        await transaction.rollback();
        return Helper.response("failed", validationError, null, res, 200);
      }
      let login_user_data = req.users;
      data.created_by = 1;
      data.jwt_token = await Helper.generateToken(req.body);
      // data.jwt_token = login_user_data.token;
      // data.created_by = login_user_data.id;
      // data.jwt_token = login_user_data.token;
   
      data.loginId = `${data.role}000111`;
  
      // Validate email, phone, and aadhaar
      const [emailExists, phoneExists] = await Promise.all([
        users.count({ where: { email: data.email } }),
        users.count({ where: { phone: data.phone } }),
      ]);
      if (emailExists)
        return Helper.response("failed", "Email already exists", {}, res, 200);
      if (phoneExists)
        return Helper.response(
          "failed",
          "Mobile number already exists",
          {},
          res,
          200
        );
  
      data = Object.keys(data).reduce((acc, key) => {
        if (typeof data[key] === "string") {
          acc[key] = data[key].trim(); // Trim only if it's a string
        } else {
          acc[key] = data[key]; // Keep other types unchanged
        }
        return acc;
      }, {});
  
      let createuserward;
      data.password=Helper.encryptPassword(data.password)
      const newUser = await users.create(data, { transaction });
  
  
      if (newUser) {
        await transaction.commit(); // Commit transaction
        await log.create({
          tableName: "users",
          recordId: newUser.id,
          action: "CREATE",
          oldData: JSON.stringify(data),
          newData: JSON.stringify(data),
          changedBy: 1,
        });
  
        return Helper.response("success", message, newUser, res, 200);
      }
    } catch (error) {
      console.error("Registration error:", error);
      await transaction.rollback(); // Rollback transaction on error
      return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
    }
  };