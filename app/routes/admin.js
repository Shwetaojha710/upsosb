const express = require("express");
const router = express.Router();
const { createmenu,menudata ,uploaddocument} = require("../controllers/admin/admin");
const { employeeregistration} = require("../controllers/admin/registration");
const { Admin} = require("../middleware/auth");
router.post('/employee-reg',employeeregistration)
router.post('/create-menu',Admin,createmenu)
router.post('/get-menu-data',Admin,menudata)
router.post('/upload-doc',Admin,uploaddocument)
module.exports = router