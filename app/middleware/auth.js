const Helper = require("../helper/helper");
// const UserModel=require('../models/Usermodel')
const users = require("../models/users.js");
const jwt = require("jsonwebtoken");

const Admin = async (req, res, next) => {
  const token = req.headers["authorization"];

  try {
    const string = token.split(" ");
    const user = await users.findOne({
      where: { jwt_token: string[1] },
    });
    if (user) {
      try {
        const tokens = jwt.verify(string[1], process.env.SECRET_KEY);
        user.lang=req.headers.lang
        req.users = user;
        next();
      } catch (error) {
        Helper.response("expired", "Your Token is expired", {}, res, 200);
      }
    } else {
      Helper.response(
        "expired",
        "Token Expired due to another login,Login Again!!",
        {},
        res,
        200
      );
    }
  } catch (error) {
    Helper.response("expired", "Unauthorized Access", {}, res, 200);
  }
};

module.exports = { Admin: Admin };
