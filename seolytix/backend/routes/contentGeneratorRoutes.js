// routes/contentGeneratorRoutes.js - API-Routen für Content-Generierung

const express = require('express');
const contentGeneratorController = require('../controllers/contentGeneratorController');

const router = express.Router();

// Route zum Generieren von SEO-optimiertem Content
router.post('/generate', contentGeneratorController.generateContent);

// Route zum Verbessern von bestehendem Content
router.post('/improve', contentGeneratorController.improveContent);

// Route zum Generieren von Content-Ideen
router.post('/ideas', contentGeneratorController.generateContentIdeas);

module.exports = router;