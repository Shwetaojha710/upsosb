const express = require("express");
const { login ,logout,AppLogin,verifyOtp} = require("../controllers/auth/login");

const router = express.Router();

router.post('/login',login)
router.post('/app-login',AppLogin)
router.post('/verify-otp',verifyOtp)
router.post('/logout',logout)
module.exports = router