const express = require("express");
const { menudata, gethomebannerImage, getdocument } = require("../controllers/admin/admin");
const { gethtmldata, getpublicgallerydocument, getpublicvideodocument,getpublicslugdata, createfeedback ,gepublicfaqlist, sitemapdata} = require("../controllers/public/public");
const router = express.Router();


// publicc

router.post('/get-public-menu-data',menudata)
router.post('/get-home-banner-image',gethomebannerImage)
router.post('/get-public-gallery-photos',getpublicgallerydocument)
router.post('/get-public-video-photos',getpublicvideodocument)
router.post('/get-public-slug-data',getpublicslugdata)
router.post('/get-document',getdocument)
router.post('/get-page',gethtmldata)
router.post('/create-feedback',createfeedback)
router.post('/get-public-faq-list',gepublicfaqlist)
router.post('/get-site-map-data',sitemapdata)
module.exports = router