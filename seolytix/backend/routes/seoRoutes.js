// routes/seoRoutes.js - API-Routen für SEO-Analyse

const express = require('express');
const seoController = require('../controllers/seoController');

const router = express.Router();

// Route zum Analysieren einer Website
router.post('/analyze', seoController.analyzeSite);

module.exports = router;
