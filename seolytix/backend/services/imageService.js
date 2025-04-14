// services/imageService.js - Service zur Analyse von Bildern

/**
 * Analysiert Bilder einer Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @returns {Object} Analyse der Bilder
 */
exports.analyzeImages = ($) => {
  // Alle Bilder auf der Seite finden
  const images = $('img');
  const totalImages = images.length;

  // Bilder mit und ohne Alt-Text zählen
  let withAlt = 0;
  let withoutAlt = 0;
  let emptyAlt = 0;

  // Bilder mit und ohne Dimensionen zählen
  let withDimensions = 0;
  let withoutDimensions = 0;

  // Problematische Bilder sammeln
  const imagesWithoutAlt = [];
  const largeImages = [];

  images.each((i, img) => {
    const element = $(img);
    const src = element.attr('src') || '';
    const alt = element.attr('alt');
    const width = element.attr('width');
    const height = element.attr('height');

    // Alt-Text prüfen
    if (alt === undefined) {
      withoutAlt++;
      imagesWithoutAlt.push(src);
    } else if (alt.trim() === '') {
      emptyAlt++;
      imagesWithoutAlt.push(src);
    } else {
      withAlt++;
    }

    // Dimensionen prüfen
    if (width && height) {
      withDimensions++;

      // Große Bilder identifizieren
      if (parseInt(width) > 1000 || parseInt(height) > 1000) {
        largeImages.push({
          src,
          width,
          height
        });
      }
    } else {
      withoutDimensions++;
    }
  });

  // Score berechnen
  let score = 0;
  let message = '';

  if (totalImages === 0) {
    score = 50;
    message = 'Keine Bilder auf der Seite gefunden. Bilder können die Nutzerinteraktion verbessern.';
  } else {
    // Prozentsatz der Bilder mit Alt-Text
    const altPercentage = totalImages > 0 ? (withAlt / totalImages) * 100 : 0;

    if (altPercentage === 100) {
      score = 100;
      message = 'Alle Bilder haben Alt-Texte. Ausgezeichnet!';
    } else if (altPercentage >= 80) {
      score = 90;
      message = `${Math.round(altPercentage)}% der Bilder haben Alt-Texte. Gut, aber verbesserungsfähig.`;
    } else if (altPercentage >= 50) {
      score = 70;
      message = `Nur ${Math.round(altPercentage)}% der Bilder haben Alt-Texte. Dies sollte verbessert werden.`;
    } else {
      score = 40;
      message = `Nur ${Math.round(altPercentage)}% der Bilder haben Alt-Texte. Dies ist ein kritischer Punkt für SEO und Barrierefreiheit.`;
    }

    // Dimensionen in die Bewertung einbeziehen
    const dimensionsPercentage = totalImages > 0 ? (withDimensions / totalImages) * 100 : 0;
    if (dimensionsPercentage < 50) {
      score -= 10;
      message += ' Viele Bilder haben keine definierten Dimensionen, was die Ladezeit beeinträchtigen kann.';
    }

    // Große Bilder in die Bewertung einbeziehen
    if (largeImages.length > 3) {
      score -= 10;
      message += ' Mehrere große Bilder gefunden, die die Seitenladezeit verlangsamen könnten.';
    }
  }

  return {
    totalImages,
    withAlt,
    withoutAlt: withoutAlt + emptyAlt,
    withDimensions,
    withoutDimensions,
    score,
    message,
    details: {
      imagesWithoutAlt,
      largeImages
    }
  };
};
