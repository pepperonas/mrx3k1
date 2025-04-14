// services/contentService.js - Service zur Analyse des Inhalts

/**
 * Analysiert den Inhalt einer Webseite
 * @param {Object} $ - Cheerio-Instanz mit geladenem HTML
 * @returns {Object} Analyse des Inhalts
 */
exports.analyzeContent = ($) => {
  // Text aus relevanten Elementen extrahieren, Navigation und Footer ausschließen
  const mainContent = $('body')
    .clone()
    .find('nav, footer, script, style, noscript, iframe, header')
    .remove()
    .end()
    .text();

  // Text bereinigen (Whitespace entfernen)
  const cleanText = mainContent.replace(/\s+/g, ' ').trim();

  // Wörter zählen
  const words = cleanText.split(' ');
  const wordCount = words.filter(word => word.length > 0).length;

  // Länge des Inhalts bewerten
  let contentLengthScore = 0;
  let contentLengthMessage = '';

  if (wordCount < 300) {
    contentLengthScore = 30;
    contentLengthMessage = 'Zu wenig Inhalt (unter 300 Wörter). Suchmaschinen bevorzugen längere, qualitativ hochwertige Inhalte.';
  } else if (wordCount < 600) {
    contentLengthScore = 60;
    contentLengthMessage = 'Ausreichender Inhalt, aber könnte umfangreicher sein (600+ Wörter wären ideal).';
  } else if (wordCount < 1200) {
    contentLengthScore = 90;
    contentLengthMessage = 'Gute Inhaltslänge (600-1200 Wörter).';
  } else {
    contentLengthScore = 100;
    contentLengthMessage = 'Ausgezeichnete Inhaltslänge (über 1200 Wörter).';
  }

  // Lesbarkeit analysieren (vereinfachter Flesch-Reading-Ease)
  // Anzahl der Sätze schätzen
  const sentences = cleanText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  const sentenceCount = sentences.length;

  // Durchschnittliche Satzlänge
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Durchschnittliche Wortlänge
  const totalChars = words.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = wordCount > 0 ? totalChars / wordCount : 0;

  // Lesbarkeits-Score berechnen (vereinfacht)
  let readabilityScore = 0;
  if (avgSentenceLength > 0 && avgWordLength > 0) {
    // Sehr vereinfachte Version von Flesch-Reading-Ease
    readabilityScore = 100 - (0.39 * avgSentenceLength + 11.8 * avgWordLength - 15.59);
    readabilityScore = Math.max(0, Math.min(100, readabilityScore));
  }

  // Lesbarkeit interpretieren
  let readabilityMessage = '';
  if (readabilityScore >= 80) {
    readabilityMessage = 'Sehr gut lesbar - für die meisten Leser leicht verständlich.';
  } else if (readabilityScore >= 60) {
    readabilityMessage = 'Gut lesbar - für die meisten Leser verständlich.';
  } else if (readabilityScore >= 40) {
    readabilityMessage = 'Mittelmäßig lesbar - könnte für manche Leser schwierig sein.';
  } else {
    readabilityMessage = 'Schwer zu lesen - sollte vereinfacht werden.';
  }

  // Schlüsselwörter-Analyse (sehr vereinfacht)
  // Stoppwörter definieren (stark vereinfachte Liste)
  const stopWords = ['der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'wenn', 'weil',
                    'von', 'mit', 'ohne', 'für', 'gegen', 'um', 'durch', 'auf', 'in', 'aus',
                    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'because', 'from', 'with',
                    'without', 'for', 'against', 'by', 'on', 'in', 'out'];

  // Wörter zählen (ohne Stoppwörter)
  const wordFreq = {};
  words.forEach(word => {
    const lowerWord = word.toLowerCase().replace(/[,.;:!?()]/g, '');
    if (lowerWord.length > 3 && !stopWords.includes(lowerWord)) {
      wordFreq[lowerWord] = (wordFreq[lowerWord] || 0) + 1;
    }
  });

  // Top Keywords finden
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Keyword-Dichte für Top-Keywords
  const topKeywordDensity = sortedWords.length > 0 ? (sortedWords[0][1] / wordCount) * 100 : 0;

  let keywordMessage = '';
  if (topKeywordDensity > 5) {
    keywordMessage = 'Mögliches Keyword-Stuffing festgestellt. Die Keyword-Dichte sollte unter 5% liegen.';
  } else if (topKeywordDensity > 0) {
    keywordMessage = 'Gute Keyword-Verteilung.';
  } else {
    keywordMessage = 'Keine klaren Keywords identifiziert.';
  }

  // Gesamtscore berechnen
  const overallScore = Math.round((contentLengthScore * 0.5) + (readabilityScore * 0.3) + (topKeywordDensity > 5 ? 0 : 100) * 0.2);

  // Gesamtbewertung und Nachricht
  let overallMessage = contentLengthMessage;
  if (readabilityScore < 60) {
    overallMessage += ' ' + readabilityMessage;
  }
  if (topKeywordDensity > 5) {
    overallMessage += ' ' + keywordMessage;
  }

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    readabilityScore: Math.round(readabilityScore),
    topKeywords: sortedWords.map(([word, count]) => ({ word, count })),
    keywordDensity: Math.round(topKeywordDensity * 100) / 100,
    score: overallScore,
    message: overallMessage
  };
};
