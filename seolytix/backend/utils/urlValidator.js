// utils/urlValidator.js - Hilfsfunktionen zur URL-Validierung

/**
 * Prüft, ob eine URL gültig ist
 * @param {string} url - Die zu prüfende URL
 * @returns {boolean} Gibt zurück, ob die URL gültig ist
 */
exports.isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
};

/**
 * Normalisiert eine URL (stellt sicher, dass sie ein Protokoll hat)
 * @param {string} url - Die zu normalisierende URL
 * @returns {string} Die normalisierte URL
 */
exports.normalizeUrl = (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};
