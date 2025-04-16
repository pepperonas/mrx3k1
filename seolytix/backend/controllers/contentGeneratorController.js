// controllers/contentGeneratorController.js - Controller für Content-Generierung

const contentGeneratorService = require('../services/contentGeneratorService');

/**
 * Generiert SEO-optimierten Content
 * @param {Object} req - Express Request Objekt
 * @param {Object} res - Express Response Objekt
 */
exports.generateContent = async (req, res) => {
    try {
        const { apiKey, contentRequest } = req.body;

        // Prüfen, ob API-Key vorhanden ist
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'API-Key erforderlich'
            });
        }

        // Prüfen, ob Content-Request vorhanden ist
        if (!contentRequest || !contentRequest.topic) {
            return res.status(400).json({
                success: false,
                message: 'Thema ist erforderlich'
            });
        }

        // Begrenzung der Wortanzahl für Performance und Kosten
        const maxWordCount = 2000;
        if (contentRequest.wordCount && contentRequest.wordCount > maxWordCount) {
            contentRequest.wordCount = maxWordCount;
        }

        // Content generieren
        const generatedContent = await contentGeneratorService.generateContent(apiKey, contentRequest);

        // Erfolgreiche Antwort zurückgeben
        res.status(200).json({
            success: true,
            data: generatedContent
        });

    } catch (error) {
        console.error('Fehler bei der Content-Generierung:', error);

        // Strukturierte Fehlerantwort
        let errorMessage = 'Fehler bei der Content-Generierung';
        let errorDetails = {};

        if (error.response) {
            // OpenAI API hat mit einem Fehlercode geantwortet
            errorMessage = error.response.data.error?.message || 'API-Fehler';
            errorDetails = error.response.data;
        } else if (error.request) {
            // Keine Antwort erhalten
            errorMessage = 'Keine Antwort von der API erhalten';
        } else {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: errorDetails
        });
    }
};

/**
 * Generiert Content-Ideen basierend auf Keywords
 * @param {Object} req - Express Request Objekt
 * @param {Object} res - Express Response Objekt
 */
exports.generateContentIdeas = async (req, res) => {
    try {
        const { apiKey, keyword, relatedKeywords } = req.body;

        // Prüfen, ob API-Key vorhanden ist
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'API-Key erforderlich'
            });
        }

        // Prüfen, ob Keyword vorhanden ist
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: 'Keyword ist erforderlich'
            });
        }

        // Content-Ideen generieren
        const contentIdeas = await contentGeneratorService.generateContentIdeas(apiKey, keyword, relatedKeywords || []);

        // Erfolgreiche Antwort zurückgeben
        res.status(200).json({
            success: true,
            data: contentIdeas
        });

    } catch (error) {
        console.error('Fehler bei der Generierung von Content-Ideen:', error);

        // Strukturierte Fehlerantwort
        let errorMessage = 'Fehler bei der Generierung von Content-Ideen';
        let errorDetails = {};

        if (error.response) {
            // OpenAI API hat mit einem Fehlercode geantwortet
            errorMessage = error.response.data.error?.message || 'API-Fehler';
            errorDetails = error.response.data;
        } else if (error.request) {
            // Keine Antwort erhalten
            errorMessage = 'Keine Antwort von der API erhalten';
        } else {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: errorDetails
        });
    }
};

/**
 * Verbessert bestehenden Content mit KI
 * @param {Object} req - Express Request Objekt
 * @param {Object} res - Express Response Objekt
 */
exports.improveContent = async (req, res) => {
    try {
        const { apiKey, contentRequest } = req.body;

        // Prüfen, ob API-Key vorhanden ist
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'API-Key erforderlich'
            });
        }

        // Prüfen, ob Content-Request und existingContent vorhanden sind
        if (!contentRequest || !contentRequest.existingContent) {
            return res.status(400).json({
                success: false,
                message: 'Bestehender Content ist erforderlich'
            });
        }

        // Begrenzung der Wortanzahl für Performance und Kosten
        const maxWordCount = 2000;
        if (contentRequest.wordCount && contentRequest.wordCount > maxWordCount) {
            contentRequest.wordCount = maxWordCount;
        }

        // Content verbessern (Service-Methode aufrufen)
        const improvedContent = await contentGeneratorService.improveContent(apiKey, contentRequest);

        // Erfolgreiche Antwort zurückgeben
        res.status(200).json({
            success: true,
            data: improvedContent
        });

    } catch (error) {
        console.error('Fehler bei der Content-Verbesserung:', error);

        // Strukturierte Fehlerantwort
        let errorMessage = 'Fehler bei der Content-Verbesserung';
        let errorDetails = {};

        if (error.response) {
            // OpenAI API hat mit einem Fehlercode geantwortet
            errorMessage = error.response.data.error?.message || 'API-Fehler';
            errorDetails = error.response.data;
        } else if (error.request) {
            // Keine Antwort erhalten
            errorMessage = 'Keine Antwort von der API erhalten';
        } else {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: errorDetails
        });
    }
};