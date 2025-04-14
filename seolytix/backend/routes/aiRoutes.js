// routes/aiRoutes.js - API-Routen für KI-Anfragen

const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Route zum Generieren von SEO-Vorschlägen
router.post('/seo-suggestions', aiController.generateSeoSuggestions);

module.exports = router;