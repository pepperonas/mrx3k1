// controllers/seoController.js - Controller für SEO-Analysen

const seoService = require('../services/seoService');
const urlValidator = require('../utils/urlValidator');

// Controller für die SEO-Analyse
exports.analyzeSite = async (req, res) => {
  try {
    const { url } = req.body;

    // URL validieren
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL fehlt' });
    }

    // Prüfen, ob URL gültig ist
    if (!urlValidator.isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige URL. Bitte geben Sie eine vollständige URL ein (z.B. https://example.com)'
      });
    }

    // Website analysieren
    const analysisResults = await seoService.analyzeWebsite(url);

    // Ergebnisse zurückgeben
    res.status(200).json({
      success: true,
      data: analysisResults
    });

  } catch (error) {
    console.error('Fehler bei der Analyse:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Analyse der Website',
      error: error.message
    });
  }
};
