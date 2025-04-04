const sequelize = require("../../connection/sequelize");
const users = require("../../models/users");
const Helper = require("../../helper/helper");
const jwt = require("jsonwebtoken");
// const LogModel=require('../../models/log')

const axios = require("axios");
const { generate } = require("generate-password");
const { SerialPort } = require("serialport");
const otp = require("../../models/otps");
const moment = require("moment");
const log = require("../../models/log");
const { Op } = require("sequelize");
const CryptoJS = require("crypto-js");
exports.login = async (req, res) => {
  try {
  
     const a = CryptoJS.AES.decrypt(req.body.zero, process.env.SECRET_KEY);
     const b = JSON.parse(a.toString(CryptoJS.enc.Utf8));
     const { email, password } = b;
     const data = b
    if (!email || !password) {
      return Helper.response(
        "failed",
        "Please provide all required fields",
        {},
        res,
        200
      );
    }

    let check = email.includes("@");
    const user = await users.findOne({
      where: {
        [Op.or]: [{ email: email }, { loginId: email }],
      },
    });

    if (!user) {
      return Helper.response("failed", "User not exists!", {}, res, 200);
    }
    if (password === Helper.decryptPassword(user.password)) {
      let token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.SECRET_KEY,
        {
          expiresIn: "7d",
        }
      );

      const userInfo = await users.findByPk(user.id);
      userInfo.jwt_token = token;
      await userInfo.save();

      const usersData = await users.findByPk(user.id);
      if (usersData) {
        await log.create({
            tableName: "login",
            recordId: user.id,
            action: "CREATE",
            oldData: JSON.stringify(data), // Convert data to JSON string safely
            newData: JSON.stringify(data),
            changedBy: req.users?.id || null, // Handle cases where req.users.id might be undefined
          });
          

          const data1 ={
            id: usersData.id,
            first_name: usersData.first_name,
            last_name: usersData.last_name,
            phone: usersData.phone,
            email: usersData.email,
            loginId: usersData.loginId,
            token: usersData.jwt_token,
            role: usersData.role,
            base_url: process.env.BASE_URL,
          }
          const responseString = JSON.stringify(data1);
                const encryptedResponse = Helper.encryptPassword(responseString);

        return Helper.response(
          "success",
          "You have logged in successfully!",
          encryptedResponse,
          res,
          200
        );
      } else {
      }
    } else {
      return Helper.response("failed", "Invalid Credential", {}, res, 200);
    }
  } catch (error) {
    console.log(error);
    return Helper.response("failed", "Internal Server Error", {}, res, 200);
  }
};

exports.AppLogin = async (req, res) => {
  try {
    const data = req.body;

    if (!data.phone) {
      return Helper.response(
        "failed",
        "Please provide all required fields",
        {},
        res,
        200
      );
    }
    let user = await users.findOne({
      where: {
        phone: data.phone,
      },
    });

    if (!user) {
      return Helper.response("failed", "User not exists!", {}, res, 200);
    } else {
      console.log(moment().add(5, "minutes").toDate());

      const otps = new otp();

      // otps.otp = Math.floor(1000 + Math.random() * 9000);
      otps.otp = 1234;
      otps.phone = data.phone;

      otps.ip = Helper.getLocalIP();
      otps.type = "App";
      otps.expiry_time = `'${moment().add(5, "minutes").toDate()}'`;
      otps.created_by = user.id;
      otps.deviceId = data.Deviceid;
      const createOTP = await otps.save();
      if (createOTP) {
        return Helper.response(
          "success",
          "OTP Send Successfully",
          {},
          res,
          200
        );
      } else {
        return Helper.response("failed", "Unable to sent OTP!", {}, res, 200);
      }
    }
  } catch (error) {
    console.log(error);
    return Helper.response("failed", "Internal Server Error", {}, res, 200);
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const data = req.body;
    if (!data.phone) {
      return Helper.response(
        "failed",
        "Please provide all required fields",
        {},
        res,
        200
      );
    }

    const user = await otp.findOne({
      where: {
        phone: data.phone, // Ensure 'data' exists before accessing 'mobile'
        otp: data.otp, // Prevent potential 'undefined' errors
        status: true,
      },
    });

    if (!user) {
      return Helper.response("failed", "OTP is expired", {}, res, 200);
    } else {
      const now = new Date(); // Current time
      const expiryTime = new Date(data.expiry_time);
      const otpValidation = new otp();
      if (now > expiryTime) {
        return Helper.response("failed", "OTP Expired", {}, res, 200);
      }

      let verifyOTP = data.otp.includes(user.otp);
      if (verifyOTP) {
        await otp.update(
          { status: false },
          {
            where: {
              phone: data.phone,
              otp: data.otp,
            },
          }
        );
        let usersData = await users.findOne({
          where: {
            phone: data.phone,
          },
        });

        let token = jwt.sign(
          { id: usersData.id, role: usersData.role },
          process.env.SECRET_KEY,
          {
            expiresIn: "7d",
          }
        );

        const userInfo = await users.findByPk(usersData.id);

        userInfo.jwt_token = token;
        await userInfo.save();

        const usersDataValue = await users.findByPk(usersData.id);
        await log.create({
            tableName: "login",
            recordId: user.id,
            action: "CREATE",
            oldData: JSON.stringify(data), // Convert data to JSON string safely
            newData: JSON.stringify(data),
            changedBy: req.users?.id || null, // Handle cases where req.users.id might be undefined
          });
        return Helper.response(
          "success",
          "OTP Verified Successfully",
          usersDataValue,
          res,
          200
        );
      } else {
        return Helper.response("failed", "Invalid OTP", {}, res, 200);
      }
    }
  } catch (error) {
    console.log(error);
    return Helper.response("failed", "Internal Server Error", {}, res, 200);
  }
};


exports.logout = async (req, res) => {

  try {
      const token = req.headers["authorization"];
      const string = token.split(" ");
      const tokenUpdate = await users.update(

          { token: "" },

          { where: { token: string[1] } }
      );
      Helper.response("success", "Logout Successfully", {}, res, 200);
  } catch (error) {
      // console.log(error);
      Helper.response("failed", "Unable to Logout ", error, res, 200);
  }
};