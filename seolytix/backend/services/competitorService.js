// services/competitorService.js - Service für die Konkurrenzanalyse

const axios = require('axios');
const cheerio = require('cheerio');
const metaService = require('./metaService');
const headingService = require('./headingService');
const contentService = require('./contentService');
const urlValidator = require('../utils/urlValidator');

/**
 * Analysiert konkurrierende Websites und vergleicht sie mit der Haupt-Website
 * @param {string} mainUrl - URL der Haupt-Website
 * @param {string[]} competitorUrls - URLs der Konkurrenz-Websites
 * @returns {Object} Vergleichende Analyse der Websites
 */
exports.analyzeCompetitors = async (mainUrl, competitorUrls) => {
    try {
        // Validiere die URLs
        if (!urlValidator.isValidUrl(mainUrl)) {
            throw new Error('Haupt-URL ist ungültig');
        }

        // Validierte Konkurrenz-URLs filtern
        const validCompetitorUrls = competitorUrls.filter(url => urlValidator.isValidUrl(url));

        if (validCompetitorUrls.length === 0) {
            throw new Error('Keine gültigen Konkurrenz-URLs gefunden');
        }

        // Haupt-Website analysieren
        const mainSiteData = await analyzeSingleSite(mainUrl);

        // Konkurrenz-Websites analysieren
        const competitorData = [];
        for (const url of validCompetitorUrls) {
            try {
                const data = await analyzeSingleSite(url);
                competitorData.push(data);
            } catch (error) {
                console.error(`Fehler bei der Analyse von ${url}:`, error);
                // Fehlerhafte Analysen überspringen und mit den nächsten fortfahren
            }
        }

        // Konkurrenzvergleich durchführen
        const comparison = compareWebsites(mainSiteData, competitorData);

        return {
            mainSite: mainSiteData,
            competitors: competitorData,
            comparison
        };
    } catch (error) {
        console.error('Fehler bei der Konkurrenzanalyse:', error);
        throw error;
    }
};

/**
 * Analysiert eine einzelne Website
 * @param {string} url - Die zu analysierende URL
 * @returns {Object} Analyseergebnisse der Website
 */
const analyzeSingleSite = async (url) => {
    console.log(`Analysiere Website: ${url}`);
    const startTime = Date.now();

    // Website abrufen
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEOComparatorBot/1.0; +http://seoanalyzer.example.com)'
        },
        timeout: 10000 // 10 Sekunden Timeout
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Zeit für das Laden der Seite berechnen
    const loadTime = (Date.now() - startTime) / 1000;

    // Meta-Informationen analysieren
    const metaAnalysis = metaService.analyzeMetaInfo($);

    // Überschriften analysieren
    const headingAnalysis = headingService.analyzeHeadings($);

    // Inhalt analysieren
    const contentAnalysis = contentService.analyzeContent($);

    // Keywords extrahieren
    const keywords = extractKeywords(contentAnalysis);

    return {
        url,
        loadTime,
        metaTitle: metaAnalysis.metaTitle,
        metaDescription: metaAnalysis.metaDescription,
        headings: headingAnalysis,
        content: contentAnalysis,
        keywords,
        overallScore: calculateOverallScore(metaAnalysis, headingAnalysis, contentAnalysis, loadTime)
    };
};

/**
 * Extrahiert die Top-Keywords aus der Inhaltsanalyse
 * @param {Object} contentAnalysis - Analyseergebnisse des Inhalts
 * @returns {Array} Array mit Top-Keywords
 */
const extractKeywords = (contentAnalysis) => {
    if (contentAnalysis.topKeywords && Array.isArray(contentAnalysis.topKeywords)) {
        return contentAnalysis.topKeywords.slice(0, 10); // Top 10 Keywords
    }
    return [];
};

/**
 * Berechnet einen Gesamt-Score für die Website
 * @param {Object} metaAnalysis - Ergebnisse der Meta-Tag-Analyse
 * @param {Object} headingAnalysis - Ergebnisse der Heading-Analyse
 * @param {Object} contentAnalysis - Ergebnisse der Content-Analyse
 * @param {number} loadTime - Ladezeit der Seite
 * @returns {number} Gesamt-Score (0-100)
 */
const calculateOverallScore = (metaAnalysis, headingAnalysis, contentAnalysis, loadTime) => {
    // Gewichtungen für verschiedene Faktoren
    const weights = {
        metaTitle: 1.5,
        metaDescription: 1.5,
        headings: 1,
        content: 2,
        loadSpeed: 1
    };

    // LoadSpeed-Score berechnen
    let loadSpeedScore = 0;
    if (loadTime < 1) loadSpeedScore = 100;
    else if (loadTime < 2) loadSpeedScore = 90;
    else if (loadTime < 3) loadSpeedScore = 80;
    else if (loadTime < 4) loadSpeedScore = 60;
    else if (loadTime < 6) loadSpeedScore = 40;
    else loadSpeedScore = 20;

    // Gewichtete Summe berechnen
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const weightedSum =
        metaAnalysis.metaTitle.score * weights.metaTitle +
        metaAnalysis.metaDescription.score * weights.metaDescription +
        headingAnalysis.score * weights.headings +
        contentAnalysis.score * weights.content +
        loadSpeedScore * weights.loadSpeed;

    // Gesamt-Score berechnen und runden
    return Math.round(weightedSum / totalWeight);
};

/**
 * Vergleicht die Haupt-Website mit Konkurrenz-Websites
 * @param {Object} mainSite - Analyseergebnisse der Haupt-Website
 * @param {Array} competitors - Analyseergebnisse der Konkurrenz-Websites
 * @returns {Object} Vergleichsergebnisse
 */
const compareWebsites = (mainSite, competitors) => {
    // Durchschnittsscore der Konkurrenten berechnen
    const avgCompetitorScore = competitors.length > 0
        ? competitors.reduce((sum, site) => sum + site.overallScore, 0) / competitors.length
        : 0;

    // Überlappende Keywords finden
    const mainKeywords = new Set(mainSite.keywords.map(k => k.word.toLowerCase()));
    const sharedKeywords = {};

    competitors.forEach(competitor => {
        const competitorUrl = new URL(competitor.url).hostname;
        sharedKeywords[competitorUrl] = [];

        competitor.keywords.forEach(keywordObj => {
            const keyword = keywordObj.word.toLowerCase();
            if (mainKeywords.has(keyword)) {
                sharedKeywords[competitorUrl].push({
                    keyword,
                    mainSiteCount: mainSite.keywords.find(k => k.word.toLowerCase() === keyword)?.count || 0,
                    competitorCount: keywordObj.count
                });
            }
        });
    });

    // Vergleich von verschiedenen Metriken
    const scoreComparison = {
        overall: compareScore(mainSite.overallScore, avgCompetitorScore),
        metaTitle: compareScore(mainSite.metaTitle.score, getAvgScore(competitors, 'metaTitle.score')),
        metaDescription: compareScore(mainSite.metaDescription.score, getAvgScore(competitors, 'metaDescription.score')),
        headings: compareScore(mainSite.headings.score, getAvgScore(competitors, 'headings.score')),
        content: compareScore(mainSite.content.score, getAvgScore(competitors, 'content.score')),
        loadTime: compareLoadTime(mainSite.loadTime, getAvgValue(competitors, 'loadTime'))
    };

    // Stärken und Schwächen identifizieren
    const strengths = [];
    const weaknesses = [];

    Object.entries(scoreComparison).forEach(([key, value]) => {
        if (value.difference >= 15) {
            strengths.push({ factor: key, difference: value.difference });
        } else if (value.difference <= -15) {
            weaknesses.push({ factor: key, difference: value.difference });
        }
    });

    // Top-Keywords der Konkurrenten, die auf der Haupt-Website fehlen
    const missingKeywords = [];

    competitors.forEach(competitor => {
        competitor.keywords.slice(0, 5).forEach(keywordObj => {
            const keyword = keywordObj.word.toLowerCase();
            if (!mainKeywords.has(keyword) &&
                !missingKeywords.some(k => k.keyword === keyword)) {
                missingKeywords.push({
                    keyword,
                    frequency: keywordObj.count,
                    source: new URL(competitor.url).hostname
                });
            }
        });
    });

    // Sortieren nach Häufigkeit
    missingKeywords.sort((a, b) => b.frequency - a.frequency);

    return {
        scoreComparison,
        strengths: strengths.slice(0, 3), // Top 3 Stärken
        weaknesses: weaknesses.slice(0, 3), // Top 3 Schwächen
        sharedKeywords,
        missingKeywords: missingKeywords.slice(0, 10), // Top 10 fehlende Keywords
        averageCompetitorScore: avgCompetitorScore
    };
};

/**
 * Vergleicht zwei Scores und gibt die Differenz zurück
 * @param {number} mainScore - Score der Haupt-Website
 * @param {number} competitorScore - Score der Konkurrenz-Website
 * @returns {Object} Vergleichsergebnis
 */
const compareScore = (mainScore, competitorScore) => {
    const difference = mainScore - competitorScore;
    let status = 'neutral';

    if (difference >= 10) status = 'better';
    else if (difference <= -10) status = 'worse';

    return {
        main: mainScore,
        competitor: competitorScore,
        difference,
        status
    };
};

/**
 * Vergleicht die Ladezeiten
 * @param {number} mainTime - Ladezeit der Haupt-Website
 * @param {number} competitorTime - Ladezeit der Konkurrenz-Website
 * @returns {Object} Vergleichsergebnis
 */
const compareLoadTime = (mainTime, competitorTime) => {
    // Bei Ladezeiten ist niedriger besser, daher Differenz umkehren
    const difference = (competitorTime - mainTime) / competitorTime * 100;
    let status = 'neutral';

    if (difference >= 10) status = 'better';
    else if (difference <= -10) status = 'worse';

    return {
        main: mainTime,
        competitor: competitorTime,
        difference: Math.round(difference),
        status
    };
};

/**
 * Berechnet den durchschnittlichen Score für ein bestimmtes Feld
 * @param {Array} sites - Array von Website-Analyseobjekten
 * @param {string} field - Zu berechnendes Feld (Pfad mit Punktnotation)
 * @returns {number} Durchschnittsscore
 */
const getAvgScore = (sites, field) => {
    if (sites.length === 0) return 0;

    const sum = sites.reduce((total, site) => {
        // Ermöglicht Zugriff auf verschachtelte Felder wie 'metaTitle.score'
        const value = field.split('.').reduce((obj, path) => obj?.[path], site);
        return total + (value || 0);
    }, 0);

    return Math.round(sum / sites.length);
};

/**
 * Berechnet den durchschnittlichen Wert für ein bestimmtes Feld
 * @param {Array} sites - Array von Website-Analyseobjekten
 * @param {string} field - Zu berechnendes Feld
 * @returns {number} Durchschnittswert
 */
const getAvgValue = (sites, field) => {
    if (sites.length === 0) return 0;

    const sum = sites.reduce((total, site) => total + (site[field] || 0), 0);
    return sum / sites.length;
};