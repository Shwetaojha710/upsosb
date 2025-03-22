const express = require("express");
const { menudata, gethomebannerImage, getdocument } = require("../controllers/admin/admin");
const { gethtmldata, getpublicgallerydocument, getpublicvideodocument } = require("../controllers/public/public");
const router = express.Router();


// publicc

router.post('/get-menu-data',menudata)
router.post('/get-home-banner-image',gethomebannerImage)
router.post('/get-public-gallery-photos',getpublicgallerydocument)
router.post('/get-public-video-photos',getpublicvideodocument)
router.post('/get-document',getdocument)
router.post('/get-page',gethtmldata)
module.exports = router