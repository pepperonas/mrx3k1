// controllers/crawlController.js - Controller für erweitertes Crawling und Analyse

const crawlService = require('../services/crawlService');
const urlValidator = require('../utils/urlValidator');

/**
 * Führt ein erweitertes Crawling einer Website durch
 * @param {Object} req - Express Request Objekt
 * @param {Object} res - Express Response Objekt
 */
exports.crawlWebsite = async (req, res) => {
    try {
        const { url, options } = req.body;

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

        // Crawling-Optionen validieren und begrenzen
        const validatedOptions = validateAndLimitOptions(options || {});

        // Website crawlen
        const crawlResults = await crawlService.crawlWebsite(url, validatedOptions);

        // Ergebnisse zurückgeben
        res.status(200).json({
            success: true,
            data: crawlResults
        });

    } catch (error) {
        console.error('Fehler beim Crawling:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Crawling der Website',
            error: error.message
        });
    }
};

/**
 * Validiert und begrenzt die Crawling-Optionen
 * @param {Object} options - Die vom Benutzer angegebenen Optionen
 * @returns {Object} Validierte und begrenzte Optionen
 */
const validateAndLimitOptions = (options) => {
    const validatedOptions = { ...options };

    // Maximale Tiefe auf 5 begrenzen
    if (validatedOptions.maxDepth) {
        validatedOptions.maxDepth = Math.min(Math.max(1, validatedOptions.maxDepth), 5);
    }

    // Maximale URLs auf 100 begrenzen
    if (validatedOptions.maxUrls) {
        validatedOptions.maxUrls = Math.min(Math.max(1, validatedOptions.maxUrls), 100);
    }

    // Sicherstellen, dass true/false-Optionen korrekt sind
    const booleanOptions = [
        'includeImages',
        'includeExternalLinks',
        'followRobotsTxt',
        'analyzeJavascript',
        'analyzeCss',
        'onlyHtmlPages'
    ];

    for (const option of booleanOptions) {
        if (option in validatedOptions) {
            validatedOptions[option] = Boolean(validatedOptions[option]);
        }
    }

    // Sicherstellen, dass Array-Optionen korrekt sind
    const arrayOptions = ['excludeUrlPatterns', 'inclusionPaths'];

    for (const option of arrayOptions) {
        if (option in validatedOptions && !Array.isArray(validatedOptions[option])) {
            validatedOptions[option] = [];
        }
    }

    return validatedOptions;
};

/**
 * Generiert eine Sitemap basierend auf den Crawling-Ergebnissen
 * @param {Object} req - Express Request Objekt
 * @param {Object} res - Express Response Objekt
 */
exports.generateSitemap = async (req, res) => {
    try {
        const { url, options } = req.body;

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

        // Crawling-Optionen festlegen (spezifisch für Sitemap-Generierung)
        const sitemapOptions = {
            maxDepth: Math.min(options?.maxDepth || 3, 5),
            maxUrls: Math.min(options?.maxUrls || 100, 500),
            includeImages: false,
            includeExternalLinks: false,
            followRobotsTxt: true,
            onlyHtmlPages: true,
            ...options
        };

        // Website crawlen
        const crawlResults = await crawlService.crawlWebsite(url, sitemapOptions);

        // Sitemap generieren
        const sitemap = generateSitemapXml(crawlResults.crawledPages);

        // Ergebnisse zurückgeben
        res.status(200).json({
            success: true,
            data: {
                sitemap,
                stats: {
                    totalUrls: crawlResults.crawledPages.length,
                    errors: crawlResults.errors.length
                }
            }
        });

    } catch (error) {
        console.error('Fehler bei der Sitemap-Generierung:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Sitemap-Generierung',
            error: error.message
        });
    }
};

/**
 * Generiert eine XML-Sitemap aus den gecrawlten Seiten
 * @param {Object[]} pages - Array der gecrawlten Seiten
 * @returns {string} XML-Sitemap
 */
const generateSitemapXml = (pages) => {
    // XML-Header
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // URLs hinzufügen
    for (const page of pages) {
        // Nur Seiten ohne Fehler einbeziehen
        if (!page.error) {
            xml += '  <url>\n';
            xml += `    <loc>${page.url}</loc>\n`;

            // Priorität basierend auf Tiefe setzen
            const priority = Math.max(0.1, 1.0 - (page.crawlDepth * 0.2)).toFixed(1);
            xml += `    <priority>${priority}</priority>\n`;

            // Aktuelle Änderungshäufigkeit basierend auf Inhalt
            const changefreq = getChangeFrequency(page);
            xml += `    <changefreq>${changefreq}</changefreq>\n`;

            // Aktuelles Datum für lastmod
            const today = new Date().toISOString().split('T')[0];
            xml += `    <lastmod>${today}</lastmod>\n`;

            xml += '  </url>\n';
        }
    }

    xml += '</urlset>';
    return xml;
};

/**
 * Bestimmt die Änderungshäufigkeit einer Seite
 * @param {Object} page - Seitendaten
 * @returns {string} Änderungshäufigkeit
 */
const getChangeFrequency = (page) => {
    // Basierend auf Crawl-Tiefe und Content-Typ Änderungshäufigkeit schätzen
    if (page.crawlDepth === 0) {
        return 'daily'; // Startseite
    } else if (page.url.includes('/blog/') || page.url.includes('/news/')) {
        return 'weekly'; // Blog oder News
    } else if (page.url.includes('/product/') || page.url.includes('/products/')) {
        return 'weekly'; // Produkte
    } else if (page.crawlDepth === 1) {
        return 'monthly'; // Wichtige Unterseiten
    } else {
        return 'yearly'; // Tief verschachtelte Seiten
    }
};