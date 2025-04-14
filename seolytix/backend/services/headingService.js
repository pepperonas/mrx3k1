// services/headingService.js - Service zur Analyse von Überschriften

/**
 * Analysiert die Überschriftenstruktur einer Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @returns {Object} Analyse der Überschriften
 */
exports.analyzeHeadings = ($) => {
  // Alle Überschriften zählen
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  const h5Count = $('h5').length;
  const h6Count = $('h6').length;

  // Überschriften für Analyse sammeln
  const h1Elements = [];
  $('h1').each((i, el) => {
    h1Elements.push($(el).text().trim());
  });

  // Überschriftenstruktur bewerten
  let structureScore = 0;
  let message = '';

  // Prüfen, ob H1 vorhanden ist
  if (h1Count === 0) {
    structureScore = 30;
    message = 'Keine H1-Überschrift gefunden! Dies ist ein wichtiger SEO-Faktor.';
  } else if (h1Count > 1) {
    structureScore = 50;
    message = 'Mehrere H1-Überschriften gefunden. Idealerweise sollte nur eine H1 pro Seite verwendet werden.';
  } else if (h2Count === 0) {
    structureScore = 70;
    message = 'Eine H1-Überschrift gefunden, aber keine H2-Überschriften. Überschriftenstruktur könnte verbessert werden.';
  } else {
    // Hierarchie-Check: Wir erwarten mehr H2 als H1, mehr H3 als H2, usw.
    const hasGoodHierarchy = (h1Count <= h2Count) && (h2Count >= h3Count) && (h3Count >= h4Count);

    if (hasGoodHierarchy) {
      structureScore = 100;
      message = 'Gute Überschriftenstruktur mit korrekter Hierarchie.';
    } else {
      structureScore = 80;
      message = 'Überschriftenstruktur vorhanden, aber die Hierarchie könnte optimiert werden.';
    }
  }

  // Inhalt der Überschriften prüfen
  let contentScore = 0;
  let contentMessage = '';

  if (h1Elements.length > 0) {
    const h1Length = h1Elements[0].length;

    if (h1Length < 20) {
      contentScore = 70;
      contentMessage = 'H1-Überschrift ist etwas kurz. Idealerweise sollte sie beschreibend sein.';
    } else if (h1Length > 70) {
      contentScore = 70;
      contentMessage = 'H1-Überschrift ist sehr lang. Eine kürzere, präzisere Überschrift könnte besser sein.';
    } else {
      contentScore = 100;
      contentMessage = 'H1-Überschrift hat eine gute Länge.';
    }
  } else {
    contentScore = 0;
    contentMessage = 'Keine H1-Überschrift gefunden für Inhaltsanalyse.';
  }

  // Gesamtbewertung berechnen
  const overallScore = Math.round((structureScore * 0.7) + (contentScore * 0.3));

  return {
    h1Count,
    h2Count,
    h3Count,
    h4Count,
    h5Count,
    h6Count,
    headingStructure: structureScore,
    headingContent: contentScore,
    h1Elements,
    score: overallScore,
    message: message
  };
};
