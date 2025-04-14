// services/performanceService.js - Service zur Analyse der Performance

/**
 * Analysiert die Performance einer Webseite
 * @param {number} loadTime - Die Ladezeit der Seite in Sekunden
 * @returns {Object} Analyse der Performance
 */
exports.analyzePerformance = (loadTime) => {
  // Ladezeit bewerten
  const loadSpeedAnalysis = analyzeLoadSpeed(loadTime);

  // Mobile-Optimierung simulieren (in einem echten System würde man hier
  // User-Agent-Simulation oder DeviceEmulation verwenden)
  const mobileOptimizationAnalysis = analyzeMobileOptimization();

  return {
    loadSpeed: loadSpeedAnalysis,
    mobileOptimization: mobileOptimizationAnalysis
  };
};

/**
 * Analysiert die Ladezeit einer Webseite
 * @param {number} loadTime - Die Ladezeit der Seite in Sekunden
 * @returns {Object} Analyse der Ladezeit
 */
const analyzeLoadSpeed = (loadTime) => {
  let score = 0;
  let message = '';

  if (loadTime < 1) {
    score = 100;
    message = 'Ausgezeichnete Ladezeit (unter 1 Sekunde).';
  } else if (loadTime < 2) {
    score = 90;
    message = 'Sehr gute Ladezeit (unter 2 Sekunden).';
  } else if (loadTime < 3) {
    score = 80;
    message = 'Gute Ladezeit (unter 3 Sekunden).';
  } else if (loadTime < 4) {
    score = 60;
    message = 'Akzeptable Ladezeit (unter 4 Sekunden), könnte verbessert werden.';
  } else if (loadTime < 6) {
    score = 40;
    message = 'Langsame Ladezeit (über 4 Sekunden). Optimierung empfohlen.';
  } else {
    score = 20;
    message = 'Sehr langsame Ladezeit (über 6 Sekunden). Dringend Optimierung empfohlen.';
  }

  return {
    time: Math.round(loadTime * 10) / 10,
    score,
    message
  };
};

/**
 * Simuliert eine Analyse der Mobile-Optimierung
 * In einer echten Implementierung würde man hier beispielsweise
 * den Viewport-Meta-Tag prüfen, CSS-Media-Queries analysieren
 * oder Lighthouse/PageSpeed Insights API nutzen
 * @returns {Object} Analyse der Mobile-Optimierung
 */
const analyzeMobileOptimization = () => {
  // Dies ist eine simulierte Analyse
  // In einer echten Implementierung würden Sie verschiedene
  // Mobile-Optimierungs-Faktoren prüfen

  // Für diese Demo erzeugen wir ein zufälliges Ergebnis
  // zwischen 50 und 100 mit einer Tendenz zu höheren Werten
  const score = Math.floor(Math.random() * 31) + 70; // Zufallswert zwischen 70-100

  let message = '';

  if (score >= 90) {
    message = 'Ausgezeichnete Mobile-Optimierung. Die Seite ist für mobile Geräte sehr gut geeignet.';
  } else if (score >= 80) {
    message = 'Gute Mobile-Optimierung. Die Seite funktioniert gut auf mobilen Geräten.';
  } else if (score >= 70) {
    message = 'Ausreichende Mobile-Optimierung, aber es gibt Verbesserungspotenzial.';
  } else {
    message = 'Mangelhafte Mobile-Optimierung. Die Seite sollte für mobile Geräte optimiert werden.';
  }

  return {
    score,
    message,
    details: {
      viewport: true,              // Viewport meta-tag vorhanden
      responsiveDesign: score > 75, // Responsives Design vorhanden
      touchElements: score > 60,    // Touch-freundliche Elemente
      fontSizes: score > 70         // Angemessene Schriftgrößen für mobile Geräte
    }
  };
};
