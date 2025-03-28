const express = require("express");
const { menudata, gethomebannerImage, getdocument } = require("../controllers/admin/admin");
const { gethtmldata, getpublicgallerydocument, getpublicvideodocument,getpublicslugdata, createfeedback ,gepublicfaqlist, sitemapdata, gepublicnewslist, gepublicnewsdata, getpublichomebannerImage, getlinkmenudata} = require("../controllers/public/public");
const router = express.Router();


// publicc

router.post('/get-public-menu-data',menudata)
router.post('/get-home-banner-image',getpublichomebannerImage)
router.post('/get-public-gallery-photos',getpublicgallerydocument)
router.post('/get-public-video-photos',getpublicvideodocument)
router.post('/get-public-slug-data',getpublicslugdata)
router.post('/get-public-news-data',gepublicnewsdata)
router.post('/get-document',getdocument)
router.post('/get-page',gethtmldata)
router.post('/create-feedback',createfeedback)
router.post('/get-public-faq-list',gepublicfaqlist)
router.post('/get-site-map-data',sitemapdata)
router.post('/get-link-menu-data',getlinkmenudata)

module.exports = router