// routes/crawlRoutes.js - API-Routen für erweitertes Crawling

const express = require('express');
const crawlController = require('../controllers/crawlController');

const router = express.Router();

// Route zum Crawlen einer Website mit benutzerdefinierten Optionen
router.post('/analyze', crawlController.crawlWebsite);

// Route zum Generieren einer Sitemap
router.post('/sitemap', crawlController.generateSitemap);

module.exports = router;