const express = require("express");
const router = express.Router();
const { createmenu,menudata ,uploaddocument,getdocument, updatedocumentdata, updatedocumentstatus, addmangedirectory, gethomebannerImage, updatemangedirectory, getmangementdirdata, getgallerydocument, getvediodocument, getvediodata, addvedio, updatevediodata} = require("../controllers/admin/admin");
const { employeeregistration} = require("../controllers/admin/registration");
const { Admin} = require("../middleware/auth");
const { createhtmldata ,gethtmldata} = require("../controllers/public/public");
const { addtender, getenderlist } = require("../controllers/admin/tender");
router.post('/employee-reg',employeeregistration)
router.post('/create-menu',Admin,createmenu)

router.post('/upload-document',Admin,uploaddocument)
router.post('/edit-document',Admin,updatedocumentdata)
router.post('/edit-document-status',Admin,updatedocumentstatus)
router.post('/create-page',Admin,createhtmldata)
router.post('/add-mange-directory',Admin,addmangedirectory)
router.post('/update-mange-directory',Admin,updatemangedirectory)
router.post('/get-mange-directory-data',Admin,getmangementdirdata)
router.post('/get-gallery-photos',Admin,getgallerydocument)
router.post('/get-video-list',Admin,getvediodata)
router.post('/add-video',Admin,addvedio)
router.post('/update-video',Admin,updatevediodata)
router.post('/add-tender',Admin,addtender)
router.post('/get-tender',Admin,getenderlist)
// publicc
router.post('/get-menu-data',menudata)
router.post('/get-home-banner-image',gethomebannerImage)
router.post('/get-document',getdocument)
router.post('/get-page',gethtmldata)
module.exports = router