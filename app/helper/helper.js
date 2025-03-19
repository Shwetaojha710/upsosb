const Helper = {};
const CryptoJS = require("crypto-js");
const os = require('os');
require('dotenv').config();
Helper.response = (status, message, data = [], res, statusCode) => {
    res.status(statusCode).json({
        status: status,
        message: message,
        data: data,
    });
};

Helper.encryptPassword = (password) => {
    var pass = CryptoJS.AES.encrypt(password, process.env.SECRET_KEY).toString();
    return pass;
};

Helper.decryptPassword = (password) => {
    var bytes = CryptoJS.AES.decrypt(password, process.env.SECRET_KEY);
    var originalPassword = bytes.toString(CryptoJS.enc.Utf8);
    return originalPassword;
};

Helper.dateFormat = async (date) => {
    const istDate = new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true, // Use 12-hour format
        timeZone: "Asia/Kolkata",
    });

    return istDate
}

Helper.trimValue = async (values) => {
    return typeof values === "string" ? values.replace(/\s+/g, " ").trim() : values;
}


const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;  // Use a secure key from your .env file

Helper.generateToken = (user) =>{
  const payload = {
    id: user.id,
    name: user.first_name ,
    email: user.email,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  console.log("Generated Token:", token);
  return token;
}



Helper.getLocalIP =()=>{ 
    const interfaces = os.networkInterfaces();
    for (let interfaceName in interfaces) {
        for (let iface of interfaces[interfaceName]) {
            // Check for IPv4 and non-internal (not a loopback address)
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
}




module.exports = Helper
