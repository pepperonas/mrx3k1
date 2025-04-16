// controllers/competitorController.js - Controller für Konkurrenzanalyse

const competitorService = require('../services/competitorService');
const urlValidator = require('../utils/urlValidator');

/**
 * Analysiert und vergleicht die Hauptwebsite mit Konkurrenzwebsites
 * @param {Object} req - Express Request Objekt
 * @param {Object} res - Express Response Objekt
 */
exports.analyzeCompetitors = async (req, res) => {
    try {
        const { mainUrl, competitorUrls } = req.body;

        // URL validieren
        if (!mainUrl) {
            return res.status(400).json({
                success: false,
                message: 'Haupt-URL fehlt'
            });
        }

        // Prüfen, ob mainUrl gültig ist
        if (!urlValidator.isValidUrl(mainUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige Haupt-URL. Bitte geben Sie eine vollständige URL ein (z.B. https://example.com)'
            });
        }

        // Prüfen, ob competitorUrls ein Array ist
        if (!Array.isArray(competitorUrls) || competitorUrls.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bitte geben Sie mindestens eine Konkurrenz-URL an'
            });
        }

        // Maximal 5 Konkurrenz-URLs zulassen (um Server-Überlastung zu vermeiden)
        const limitedCompetitorUrls = competitorUrls.slice(0, 5);

        // Konkurrenzanalyse durchführen
        const analysisResults = await competitorService.analyzeCompetitors(mainUrl, limitedCompetitorUrls);

        // Ergebnisse zurückgeben
        res.status(200).json({
            success: true,
            data: analysisResults
        });

    } catch (error) {
        console.error('Fehler bei der Konkurrenzanalyse:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Konkurrenzanalyse',
            error: error.message
        });
    }
};

/**
 * Gibt Vorschläge für Konkurrenz-Websites basierend auf Keywords
 * @param {Object} req - Express Request Objekt
 * @param {Object} res - Express Response Objekt
 */
exports.suggestCompetitors = async (req, res) => {
    try {
        const { url, keywords } = req.body;

        // URL validieren
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL fehlt'
            });
        }

        // Prüfen, ob URL gültig ist
        if (!urlValidator.isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                message: 'Ungültige URL. Bitte geben Sie eine vollständige URL ein (z.B. https://example.com)'
            });
        }

        // In einer echten Implementierung würden wir hier eine Suche nach
        // relevanten Konkurrenten durchführen (z.B. mit einer SEO-API)
        // Für dieses Beispiel geben wir Dummy-Daten zurück

        // URL-Domain extrahieren
        const domain = new URL(url).hostname;

        // Beispielhafte Konkurrenten (in einer echten Implementierung dynamisch)
        const suggestedCompetitors = [
            {
                url: `https://competitor1-${domain}`,
                relevance: 95,
                reason: 'Ähnliche Keywords und Nische'
            },
            {
                url: `https://competitor2-${domain}`,
                relevance: 87,
                reason: 'Top-Ranking für ähnliche Keywords'
            },
            {
                url: `https://competitor3-${domain}`,
                relevance: 82,
                reason: 'Ähnliche Inhalte und Zielgruppe'
            }
        ];

        // Ergebnisse zurückgeben
        res.status(200).json({
            success: true,
            data: {
                suggestions: suggestedCompetitors
            }
        });

    } catch (error) {
        console.error('Fehler bei der Konkurrenzsuche:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Suche nach Konkurrenten',
            error: error.message
        });
    }
};