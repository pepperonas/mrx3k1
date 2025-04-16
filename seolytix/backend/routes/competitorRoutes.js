// routes/competitorRoutes.js - API-Routen für Konkurrenzanalyse

const express = require('express');
const competitorController = require('../controllers/competitorController');

const router = express.Router();

// Route zum Vergleichen mit Konkurrenzwebsites
router.post('/analyze', competitorController.analyzeCompetitors);

// Route zum Vorschlagen von Konkurrenzwebsites
router.post('/suggest', competitorController.suggestCompetitors);

module.exports = router;