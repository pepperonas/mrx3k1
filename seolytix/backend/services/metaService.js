// services/metaService.js - Service zur Analyse von Meta-Tags

/**
 * Analysiert Meta-Informationen einer Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @returns {Object} Analyse der Meta-Informationen
 */
exports.analyzeMetaInfo = ($) => {
  // Meta-Title analysieren
  const metaTitleAnalysis = analyzeMetaTitle($);

  // Meta-Description analysieren
  const metaDescriptionAnalysis = analyzeMetaDescription($);

  return {
    metaTitle: metaTitleAnalysis,
    metaDescription: metaDescriptionAnalysis
  };
};

/**
 * Analysiert den Meta-Title einer Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @returns {Object} Analyse des Meta-Titles
 */
const analyzeMetaTitle = ($) => {
  const title = $('title').text().trim();
  const titleLength = title.length;
  const exists = titleLength > 0;

  let score = 0;
  let message = '';

  if (!exists) {
    score = 0;
    message = 'Kein Meta-Title gefunden! Dies ist ein kritischer SEO-Faktor.';
  } else if (titleLength < 10) {
    score = 30;
    message = 'Meta-Title ist zu kurz (unter 10 Zeichen).';
  } else if (titleLength < 30) {
    score = 60;
    message = 'Meta-Title könnte etwas länger sein (optimal: 50-60 Zeichen).';
  } else if (titleLength <= 60) {
    score = 100;
    message = 'Meta-Title hat optimale Länge (50-60 Zeichen).';
  } else if (titleLength <= 70) {
    score = 80;
    message = 'Meta-Title ist etwas zu lang, aber noch akzeptabel.';
  } else {
    score = 50;
    message = 'Meta-Title ist zu lang (über 70 Zeichen). Wird in Suchergebnissen abgeschnitten.';
  }

  return {
    exists,
    length: titleLength,
    title,
    score,
    message
  };
};

/**
 * Analysiert die Meta-Description einer Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @returns {Object} Analyse der Meta-Description
 */
const analyzeMetaDescription = ($) => {
  const description = $('meta[name="description"]').attr('content') || '';
  const descriptionLength = description.length;
  const exists = descriptionLength > 0;

  let score = 0;
  let message = '';

  if (!exists) {
    score = 0;
    message = 'Keine Meta-Description gefunden! Dies ist ein wichtiger SEO-Faktor.';
  } else if (descriptionLength < 50) {
    score = 40;
    message = 'Meta-Description ist zu kurz (unter 50 Zeichen).';
  } else if (descriptionLength < 120) {
    score = 70;
    message = 'Meta-Description könnte etwas länger sein (optimal: 150-160 Zeichen).';
  } else if (descriptionLength <= 160) {
    score = 100;
    message = 'Meta-Description hat optimale Länge (150-160 Zeichen).';
  } else if (descriptionLength <= 320) {
    score = 80;
    message = 'Meta-Description ist für mobile Geräte zu lang, aber für Desktop okay.';
  } else {
    score = 50;
    message = 'Meta-Description ist zu lang (über 320 Zeichen). Wird in Suchergebnissen abgeschnitten.';
  }

  return {
    exists,
    length: descriptionLength,
    description,
    score,
    message
  };
};
