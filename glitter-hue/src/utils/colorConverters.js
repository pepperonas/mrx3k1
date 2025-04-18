// src/utils/colorConverters.js - Hilfsfunktionen zur Farbkonvertierung

/**
 * Konvertiert eine Hex-Farbe zu HSV-Werten für die Hue API
 * @param {string} hex - Farbe im Hex-Format (z.B. "#FF0000")
 * @returns {Object} - Objekt mit hue und sat für die Hue API
 */
export const hexToHsv = (hex) => {
    // Hex zu RGB
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;

    if (diff === 0) {
        h = 0;
    } else if (max === r) {
        h = ((g - b) / diff) % 6;
    } else if (max === g) {
        h = (b - r) / diff + 2;
    } else {
        h = (r - g) / diff + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    // Für Hue API: hue von 0-65535
    const hueForApi = Math.round((h / 360) * 65535);

    // Sättigung von 0-254
    const s = (max === 0) ? 0 : diff / max;
    const satForApi = Math.round(s * 254);

    return {
        hue: hueForApi,
        sat: satForApi
    };
};

/**
 * Konvertiert HSV-Werte der Hue API zu einer Hex-Farbe
 * @param {Object} state - Lichtzustand mit hue und sat Werten
 * @returns {string} - Farbe im Hex-Format
 */
export const hsvToHex = (state) => {
    // Falls keine Farbwerte vorhanden sind, weißes Licht zurückgeben
    if (state.hue === undefined || state.sat === undefined) {
        return '#FFFFFF';
    }

    // Konvertieren der Hue-API-Werte zu HSV
    const h = (state.hue / 65535) * 360;
    const s = state.sat / 254;
    const v = 1; // Helligkeit maximal für Farbauswahlzwecke

    // HSV zu RGB
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r, g, b;

    if (h >= 0 && h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }

    // RGB zu Hex
    r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    b = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
};