// services/seoService.js - Hauptservice für die SEO-Analyse

const axios = require('axios');
const cheerio = require('cheerio');
const metaService = require('./metaService');
const headingService = require('./headingService');
const imageService = require('./imageService');
const contentService = require('./contentService');
const performanceService = require('./performanceService');

/**
 * Analysiert eine Website für SEO
 * @param {string} url - Die zu analysierende URL
 * @returns {Object} Ergebnisse der SEO-Analyse
 */
exports.analyzeWebsite = async (url) => {
  try {
    console.log(`Analysiere Website: ${url}`);
    const startTime = Date.now();

    // Website abrufen
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOAnalyzerBot/1.0; +http://seoanalyzer.example.com)'
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

    // Bilder analysieren
    const imageAnalysis = imageService.analyzeImages($);

    // Inhalt analysieren
    const contentAnalysis = contentService.analyzeContent($);

    // Mobile-Optimierung und Ladezeit analysieren
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

    // Ergebnisse zusammenführen und zurückgeben
    return {
      score: finalScore,
      url,
      metaTitle: metaAnalysis.metaTitle,
      metaDescription: metaAnalysis.metaDescription,
      headings: headingAnalysis,
      images: imageAnalysis,
      contentAnalysis: contentAnalysis,
      loadSpeed: performanceAnalysis.loadSpeed,
      mobileOptimization: performanceAnalysis.mobileOptimization
    };

  } catch (error) {
    console.error(`Fehler beim Analysieren von ${url}:`, error);
    throw new Error(`Konnte die Website nicht analysieren: ${error.message}`);
  }
};
