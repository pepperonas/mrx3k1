// services/crawlService.js - Service für tiefes Crawling und erweiterte Website-Analysen

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const seoService = require('./seoService');
const metaService = require('./metaService');
const headingService = require('./headingService');
const imageService = require('./imageService');
const contentService = require('./contentService');
const performanceService = require('./performanceService');
const urlValidator = require('../utils/urlValidator');

/**
 * Analysiert eine Website mit benutzerdefinierten Crawling-Parametern
 * @param {string} baseUrl - Basis-URL der zu analysierenden Website
 * @param {Object} options - Crawling-Optionen (Tiefe, maxUrls, etc.)
 * @returns {Object} Ergebnisse der Website-Analyse
 */
exports.crawlWebsite = async (baseUrl, options = {}) => {
    try {
        console.log(`Starte erweitertes Crawling für: ${baseUrl}`);

        // Standard-Optionen setzen
        const defaultOptions = {
            maxDepth: 2,                // Standardtiefe
            maxUrls: 20,                // Maximal zu analysierende URLs
            includeImages: true,        // Bilder in die Analyse einbeziehen
            includeExternalLinks: false, // Externe Links nicht crawlen
            followRobotsTxt: true,      // robots.txt beachten
            analyzeJavascript: false,   // JavaScript-Dateien nicht analysieren
            analyzeCss: false,          // CSS-Dateien nicht analysieren
            onlyHtmlPages: true,        // Nur HTML-Seiten analysieren
            excludeUrlPatterns: [],     // Muster für auszuschließende URLs
            inclusionPaths: [],         // Pfade, die bevorzugt gecrawlt werden sollen
        };

        // Optionen mit benutzerdefinierten Einstellungen überschreiben
        const crawlOptions = { ...defaultOptions, ...options };

        // URL validieren und normalisieren
        if (!urlValidator.isValidUrl(baseUrl)) {
            throw new Error('Ungültige URL');
        }

        const parsedBaseUrl = new URL(baseUrl);
        const baseHostname = parsedBaseUrl.hostname;

        // Startzeit für Performance-Messung
        const startTime = Date.now();

        // Initialisierung der zu crawlenden URLs und bereits besuchter URLs
        const urlQueue = [{ url: baseUrl, depth: 0 }];
        const visitedUrls = new Set();
        const pageData = [];
        const errors = [];
        let crawledUrlsCount = 0;

        // robots.txt abrufen und analysieren, wenn aktiviert
        let disallowedPaths = [];
        if (crawlOptions.followRobotsTxt) {
            try {
                const robotsTxtUrl = `${parsedBaseUrl.protocol}//${baseHostname}/robots.txt`;
                const robotsTxtResponse = await axios.get(robotsTxtUrl, { timeout: 5000 });
                disallowedPaths = parseRobotsTxt(robotsTxtResponse.data);
            } catch (error) {
                console.log('Konnte robots.txt nicht abrufen oder parsen:', error.message);
            }
        }

        // Crawling-Schleife
        while (urlQueue.length > 0 && crawledUrlsCount < crawlOptions.maxUrls) {
            const { url, depth } = urlQueue.shift();

            // Überprüfen, ob die URL bereits besucht wurde
            if (visitedUrls.has(url)) {
                continue;
            }

            // URL zur Liste der besuchten URLs hinzufügen
            visitedUrls.add(url);

            // Überprüfen, ob die maximale Tiefe erreicht wurde
            if (depth > crawlOptions.maxDepth) {
                continue;
            }

            // URL-Filterung basierend auf verschiedenen Regeln
            if (shouldSkipUrl(url, baseHostname, disallowedPaths, crawlOptions)) {
                continue;
            }

            try {
                // Seite abrufen
                console.log(`Crawling [${depth}/${crawlOptions.maxDepth}]: ${url}`);
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzerBot/1.0; +http://seoanalyzer.example.com)'
                    },
                    timeout: 10000 // 10 Sekunden Timeout
                });

                const contentType = response.headers['content-type'] || '';

                // Nur HTML-Seiten analysieren, wenn Option gesetzt
                if (crawlOptions.onlyHtmlPages && !contentType.includes('text/html')) {
                    continue;
                }

                // Seiteninhalt laden
                const html = response.data;
                const $ = cheerio.load(html);

                // Links extrahieren und zur Queue hinzufügen
                const links = extractLinks($, url, baseHostname, crawlOptions);

                for (const link of links) {
                    if (!visitedUrls.has(link) && !urlQueue.some(item => item.url === link)) {
                        urlQueue.push({ url: link, depth: depth + 1 });
                    }
                }

                // Seite analysieren und Daten speichern
                const analysisData = await analyzePage($, url, depth, crawlOptions, startTime);
                pageData.push(analysisData);
                crawledUrlsCount++;

            } catch (error) {
                // Fehler protokollieren
                console.error(`Fehler beim Crawling von ${url}:`, error.message);
                errors.push({
                    url,
                    error: error.message,
                    statusCode: error.response?.status
                });
            }
        }

        // Gesamtdauer des Crawlings berechnen
        const duration = (Date.now() - startTime) / 1000;

        // Performance-Daten und Zusammenfassung erstellen
        const summary = createCrawlSummary(pageData, errors, duration, crawlOptions);

        return {
            baseUrl,
            crawledPages: pageData,
            errors,
            summary
        };

    } catch (error) {
        console.error('Fehler beim Crawling:', error);
        throw error;
    }
};

/**
 * Analysiert eine einzelne Seite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @param {string} url - URL der Seite
 * @param {number} depth - Aktuelle Crawling-Tiefe
 * @param {Object} options - Crawling-Optionen
 * @param {number} startTime - Startzeit des Crawlings für Ladezeit-Berechnung
 * @returns {Object} Analyseergebnisse der Seite
 */
const analyzePage = async ($, url, depth, options, startTime) => {
    try {
        // Zeit für das Laden der Seite berechnen
        const loadTime = (Date.now() - startTime) / 1000;

        // Direkt die benötigten Service-Funktionen aufrufen, statt seoService.analyzeHtml
        const metaAnalysis = metaService.analyzeMetaInfo($);
        const headingAnalysis = headingService.analyzeHeadings($);
        const imageAnalysis = imageService.analyzeImages($);
        const contentAnalysis = contentService.analyzeContent($);
        const performanceAnalysis = performanceService.analyzePerformance(loadTime);

        // Gesamt-Score berechnen (gewichteter Durchschnitt)
        const scoreFactors = [
            { score: metaAnalysis.metaTitle.score, weight: 1.5 },
            { score: metaAnalysis.metaDescription.score, weight: 1.5 },
            { score: headingAnalysis.score, weight: 1 },
            { score: imageAnalysis.score, weight: 1 },
            { score: contentAnalysis.score, weight: 2 },
            { score: performanceAnalysis.loadSpeed.score, weight: 1.5 },
            { score: performanceAnalysis.mobileOptimization.score, weight: 1.5 }
        ];

        const totalWeight = scoreFactors.reduce((sum, factor) => sum + factor.weight, 0);
        const weightedScore = scoreFactors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0) / totalWeight;
        const finalScore = Math.round(weightedScore);

        // Zusätzliche Analysen basierend auf Optionen
        const additionalData = {
            crawlDepth: depth,
            internalLinks: [],
            externalLinks: []
        };

        // Links extrahieren und klassifizieren
        const parsedUrl = new URL(url);
        const baseHostname = parsedUrl.hostname;

        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
                try {
                    const absoluteUrl = new URL(href, url).href;
                    const linkHostname = new URL(absoluteUrl).hostname;
                    const linkText = $(el).text().trim();

                    const linkData = {
                        url: absoluteUrl,
                        text: linkText,
                        nofollow: $(el).attr('rel') === 'nofollow'
                    };

                    if (linkHostname === baseHostname) {
                        additionalData.internalLinks.push(linkData);
                    } else {
                        additionalData.externalLinks.push(linkData);
                    }
                } catch (error) {
                    // Ungültige URL überspringen
                }
            }
        });

        // Strukturierte Daten extrahieren (JSON-LD)
        const structuredData = [];
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const jsonData = JSON.parse($(el).html());
                structuredData.push(jsonData);
            } catch (error) {
                // Fehlerhafte JSON-Daten überspringen
            }
        });

        // Canonical-URL extrahieren
        const canonicalUrl = $('link[rel="canonical"]').attr('href');

        // Hreflang-Tags extrahieren
        const hreflangTags = [];
        $('link[rel="alternate"][hreflang]').each((i, el) => {
            hreflangTags.push({
                hreflang: $(el).attr('hreflang'),
                href: $(el).attr('href')
            });
        });

        // Mobil-freundlichkeit überprüfen
        const hasMobileViewport = $('meta[name="viewport"]').length > 0;

        // Schema.org-Markup extrahieren
        const schemaMarkup = extractSchemaMarkup($);

        // Ergebnisse zusammenführen
        return {
            url,
            crawlDepth: depth,
            title: metaAnalysis.metaTitle.title,
            description: metaAnalysis.metaDescription.description,
            h1: headingAnalysis.h1Elements,
            score: finalScore,
            internalLinksCount: additionalData.internalLinks.length,
            externalLinksCount: additionalData.externalLinks.length,
            internalLinks: additionalData.internalLinks,
            externalLinks: additionalData.externalLinks,
            structuredData: structuredData.length > 0 ? structuredData : null,
            canonicalUrl,
            hreflangTags: hreflangTags.length > 0 ? hreflangTags : null,
            hasMobileViewport,
            schemaMarkup: schemaMarkup.length > 0 ? schemaMarkup : null,
            // Weitere Basisdaten aus der SEO-Analyse
            wordCount: contentAnalysis.wordCount,
            imagesCount: imageAnalysis.totalImages,
            imagesWithAltText: imageAnalysis.withAlt
        };
    } catch (error) {
        console.error(`Fehler bei der Analyse von ${url}:`, error);
        return {
            url,
            crawlDepth: depth,
            error: error.message
        };
    }
};

/**
 * Extrahiert Links aus einer Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @param {string} baseUrl - Basis-URL für relative Links
 * @param {string} baseHostname - Hostname der Basis-URL
 * @param {Object} options - Crawling-Optionen
 * @returns {string[]} Array der extrahierten URLs
 */
const extractLinks = ($, baseUrl, baseHostname, options) => {
    const links = new Set();

    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
            try {
                // Relative URLs in absolute URLs umwandeln
                const absoluteUrl = new URL(href, baseUrl).href;
                const parsedUrl = new URL(absoluteUrl);

                // Nur interne Links crawlen, wenn externe Links nicht erlaubt sind
                if (!options.includeExternalLinks && parsedUrl.hostname !== baseHostname) {
                    return;
                }

                // Anker-Links und JavaScript-Links überspringen
                if (absoluteUrl.startsWith('javascript:') ||
                    absoluteUrl.startsWith('#') ||
                    absoluteUrl === baseUrl ||
                    absoluteUrl === `${baseUrl}/`) {
                    return;
                }

                // Ausschlussmuster überprüfen
                if (options.excludeUrlPatterns &&
                    options.excludeUrlPatterns.some(pattern => absoluteUrl.includes(pattern))) {
                    return;
                }

                // Pfad-Inklusion überprüfen
                if (options.inclusionPaths && options.inclusionPaths.length > 0) {
                    const shouldInclude = options.inclusionPaths.some(path =>
                        parsedUrl.pathname.startsWith(path));

                    if (!shouldInclude) {
                        return;
                    }
                }

                // Dateityp-Filter
                if (options.onlyHtmlPages) {
                    const extension = parsedUrl.pathname.split('.').pop().toLowerCase();
                    const nonHtmlExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'css', 'js', 'zip', 'doc', 'docx', 'xls', 'xlsx'];

                    if (nonHtmlExtensions.includes(extension)) {
                        return;
                    }
                }

                links.add(absoluteUrl);
            } catch (error) {
                // Ungültige URL überspringen
            }
        }
    });

    return Array.from(links);
};

/**
 * Überprüft, ob eine URL übersprungen werden sollte
 * @param {string} url - Zu überprüfende URL
 * @param {string} baseHostname - Hostname der Basis-URL
 * @param {string[]} disallowedPaths - Pfade aus robots.txt
 * @param {Object} options - Crawling-Optionen
 * @returns {boolean} True, wenn die URL übersprungen werden sollte
 */
const shouldSkipUrl = (url, baseHostname, disallowedPaths, options) => {
    try {
        const parsedUrl = new URL(url);

        // Externe Links überprüfen
        if (!options.includeExternalLinks && parsedUrl.hostname !== baseHostname) {
            return true;
        }

        // robots.txt-Regeln überprüfen
        if (options.followRobotsTxt &&
            disallowedPaths.some(path => parsedUrl.pathname.startsWith(path))) {
            return true;
        }

        // Ausschlussmuster überprüfen
        if (options.excludeUrlPatterns &&
            options.excludeUrlPatterns.some(pattern => url.includes(pattern))) {
            return true;
        }

        // JavaScript- und CSS-Dateien überprüfen
        const extension = parsedUrl.pathname.split('.').pop().toLowerCase();

        if (!options.analyzeJavascript && extension === 'js') {
            return true;
        }

        if (!options.analyzeCss && extension === 'css') {
            return true;
        }

        // HTML-Seiten-Filter
        if (options.onlyHtmlPages) {
            const nonHtmlExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'doc', 'docx', 'xls', 'xlsx'];

            if (nonHtmlExtensions.includes(extension)) {
                return true;
            }
        }

        return false;
    } catch (error) {
        // Bei Fehler URL überspringen
        return true;
    }
};

/**
 * Parst robots.txt und extrahiert Disallow-Pfade
 * @param {string} robotsTxtContent - Inhalt der robots.txt
 * @returns {string[]} Array der disallowed Pfade
 */
const parseRobotsTxt = (robotsTxtContent) => {
    const disallowedPaths = [];
    const lines = robotsTxtContent.split('\n');

    let relevantUserAgent = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Leerzeilen und Kommentare überspringen
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
            continue;
        }

        // User-Agent-Abschnitte überprüfen
        if (trimmedLine.toLowerCase().startsWith('user-agent:')) {
            const userAgent = trimmedLine.split(':')[1].trim();
            relevantUserAgent = userAgent === '*';
        }

        // Disallow-Regeln erfassen
        if (relevantUserAgent && trimmedLine.toLowerCase().startsWith('disallow:')) {
            const path = trimmedLine.split(':')[1].trim();

            if (path && path !== '/') {
                disallowedPaths.push(path);
            }
        }
    }

    return disallowedPaths;
};

/**
 * Extrahiert Schema.org-Markup aus der Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @returns {Object[]} Array von Schema.org-Markups
 */
const extractSchemaMarkup = ($) => {
    const schemas = [];

    // JSON-LD Schema
    $('script[type="application/ld+json"]').each((i, el) => {
        try {
            const jsonData = JSON.parse($(el).html());
            schemas.push({
                type: 'JSON-LD',
                data: jsonData
            });
        } catch (error) {
            // Fehlerhafte JSON-Daten überspringen
        }
    });

    // Microdata Schema
    $('[itemscope]').each((i, el) => {
        const itemtype = $(el).attr('itemtype');

        if (itemtype) {
            const itemProps = {};

            $(el).find('[itemprop]').each((i, prop) => {
                const propName = $(prop).attr('itemprop');
                const propValue = $(prop).attr('content') || $(prop).text();

                itemProps[propName] = propValue;
            });

            schemas.push({
                type: 'Microdata',
                itemType: itemtype,
                properties: itemProps
            });
        }
    });

    return schemas;
};

/**
 * Erstellt eine Zusammenfassung der Crawling-Ergebnisse
 * @param {Object[]} pageData - Analysedaten aller Seiten
 * @param {Object[]} errors - Aufgetretene Fehler
 * @param {number} duration - Dauer des Crawlings in Sekunden
 * @param {Object} options - Verwendete Crawling-Optionen
 * @returns {Object} Zusammenfassung der Crawling-Ergebnisse
 */
const createCrawlSummary = (pageData, errors, duration, options) => {
    // Anzahl der gecrawlten Seiten
    const totalPages = pageData.length;

    // Anzahl der Fehler
    const totalErrors = errors.length;

    // Durchschnittlicher SEO-Score
    const avgScore = totalPages > 0
        ? Math.round(pageData.reduce((sum, page) => sum + (page.score || 0), 0) / totalPages)
        : 0;

    // Maximale erreichte Tiefe
    const maxDepth = totalPages > 0
        ? Math.max(...pageData.map(page => page.crawlDepth))
        : 0;

    // Titel-Länge und Duplikate
    const titles = pageData.map(page => page.title);
    const uniqueTitles = new Set(titles);
    const duplicateTitlesCount = titles.length - uniqueTitles.size;

    // Beschreibungs-Länge und Duplikate
    const descriptions = pageData.map(page => page.description);
    const uniqueDescriptions = new Set(descriptions);
    const duplicateDescriptionsCount = descriptions.length - uniqueDescriptions.size;

    // H1-Analyse
    const pagesWithoutH1 = pageData.filter(page => !page.h1 || page.h1.length === 0).length;
    const pagesWithMultipleH1 = pageData.filter(page => page.h1 && page.h1.length > 1).length;

    // Canonical-URLs
    const pagesWithCanonical = pageData.filter(page => page.canonicalUrl).length;

    // Mobile-Optimierung
    const mobileOptimizedPages = pageData.filter(page => page.hasMobileViewport).length;

    // Link-Analyse
    const totalInternalLinks = pageData.reduce((sum, page) => sum + (page.internalLinksCount || 0), 0);
    const totalExternalLinks = pageData.reduce((sum, page) => sum + (page.externalLinksCount || 0), 0);
    const avgInternalLinksPerPage = totalPages > 0 ? Math.round(totalInternalLinks / totalPages) : 0;
    const avgExternalLinksPerPage = totalPages > 0 ? Math.round(totalExternalLinks / totalPages) : 0;

    // Image-Analyse
    const totalImages = pageData.reduce((sum, page) => sum + (page.imagesCount || 0), 0);
    const imagesWithAlt = pageData.reduce((sum, page) => sum + (page.imagesWithAltText || 0), 0);
    const missingAltTextPercentage = totalImages > 0
        ? Math.round(((totalImages - imagesWithAlt) / totalImages) * 100)
        : 0;

    // Strukturierte Daten
    const pagesWithStructuredData = pageData.filter(page => page.structuredData).length;

    // Hreflang-Tags
    const pagesWithHreflang = pageData.filter(page => page.hreflangTags).length;

    // Probleme nach Priorität
    const criticalIssues = [];
    const majorIssues = [];
    const minorIssues = [];

    // Title-Probleme
    if (duplicateTitlesCount > 0) {
        majorIssues.push({
            type: 'duplicate_titles',
            count: duplicateTitlesCount,
            message: `${duplicateTitlesCount} Seiten haben doppelte Title-Tags`
        });
    }

    // Description-Probleme
    if (duplicateDescriptionsCount > 0) {
        majorIssues.push({
            type: 'duplicate_descriptions',
            count: duplicateDescriptionsCount,
            message: `${duplicateDescriptionsCount} Seiten haben doppelte Meta-Descriptions`
        });
    }

    // H1-Probleme
    if (pagesWithoutH1 > 0) {
        majorIssues.push({
            type: 'missing_h1',
            count: pagesWithoutH1,
            message: `${pagesWithoutH1} Seiten haben keine H1-Überschrift`
        });
    }

    if (pagesWithMultipleH1 > 0) {
        minorIssues.push({
            type: 'multiple_h1',
            count: pagesWithMultipleH1,
            message: `${pagesWithMultipleH1} Seiten haben mehrere H1-Überschriften`
        });
    }

    // Canonical-Probleme
    if (pagesWithCanonical < totalPages) {
        minorIssues.push({
            type: 'missing_canonical',
            count: totalPages - pagesWithCanonical,
            message: `${totalPages - pagesWithCanonical} Seiten haben keinen Canonical-Tag`
        });
    }

    // Mobile-Optimierung
    if (mobileOptimizedPages < totalPages) {
        majorIssues.push({
            type: 'not_mobile_friendly',
            count: totalPages - mobileOptimizedPages,
            message: `${totalPages - mobileOptimizedPages} Seiten sind nicht für mobile Geräte optimiert`
        });
    }

    // Alt-Text-Probleme
    if (missingAltTextPercentage > 20) {
        majorIssues.push({
            type: 'missing_alt_text',
            count: totalImages - imagesWithAlt,
            message: `${missingAltTextPercentage}% der Bilder haben keinen Alt-Text`
        });
    }

    // Seiten mit Fehlern
    if (totalErrors > 0) {
        criticalIssues.push({
            type: 'crawl_errors',
            count: totalErrors,
            message: `${totalErrors} Seiten konnten nicht gecrawlt werden`
        });
    }

    return {
        duration,
        options,
        totalPages,
        totalErrors,
        avgScore,
        maxDepth,
        duplicateTitlesCount,
        duplicateDescriptionsCount,
        pagesWithoutH1,
        pagesWithMultipleH1,
        pagesWithCanonical,
        mobileOptimizedPages,
        totalInternalLinks,
        totalExternalLinks,
        avgInternalLinksPerPage,
        avgExternalLinksPerPage,
        totalImages,
        imagesWithAlt,
        missingAltTextPercentage,
        pagesWithStructuredData,
        pagesWithHreflang,
        issues: {
            critical: criticalIssues,
            major: majorIssues,
            minor: minorIssues
        }
    };
};