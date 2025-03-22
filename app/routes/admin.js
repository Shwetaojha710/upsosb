const express = require("express");
const router = express.Router();
const { createmenu ,uploaddocument, updatedocumentdata, updatedocumentstatus, addmangedirectory, updatemangedirectory, getmangementdirdata, getgallerydocument, getvediodocument, getvediodata, addvedio, updatevediodata, getmenulist, updatevediostatus, getmenudata, updatemenu,updatemenustatus} = require("../controllers/admin/admin");
const { employeeregistration} = require("../controllers/admin/registration");
const { Admin} = require("../middleware/auth");
const { createhtmldata } = require("../controllers/public/public");
const { addtender, getenderlist } = require("../controllers/admin/tender");
const { addorganizational, georganizationallist, updateorganizational } = require("../controllers/admin/organizational");
const { addnews, genewslist, updatenews } = require("../controllers/admin/news");
router.post('/employee-reg',employeeregistration)
router.post('/create-menu',Admin,createmenu)
router.post('/get-menu-data',Admin,getmenudata)
router.post('/update-menu-status',Admin,updatemenustatus)
router.post('/update-menu',Admin,updatemenu)
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
router.post('/update-video-status',Admin,updatevediostatus)
router.post('/add-tender',Admin,addtender)
router.post('/get-tender',Admin,getenderlist)
router.post('/get-menu-list',Admin,getmenulist)
router.post('/add-organizational',Admin,addorganizational)
router.post('/get-organizational',Admin,georganizationallist)
router.post('/update-organizational',Admin,updateorganizational)

router.post('/add-news',Admin,addnews)
router.post('/get-news',Admin,genewslist)
router.post('/update-news',Admin,updatenews)


// publicc
// router.post('/get-menu-data',menudata)
// router.post('/get-home-banner-image',gethomebannerImage)
// router.post('/get-document',getdocument)
// router.post('/get-page',gethtmldata)
module.exports = router