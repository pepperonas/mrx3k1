// src/components/MediaSyncTool.jsx - Fortschrittliches Mediensynchronisationstool für GlitterHue mit Spotify-Integration
import React, { useState, useEffect, useRef } from 'react';
import '../styles/mediasync.css';
import '../styles/spotify.css';
import SpotifyIntegration from './SpotifyIntegration';

// Verfügbare Medienquellen
const MEDIA_SOURCES = {
    MICROPHONE: 'microphone',   // Live-Mikrofon
    FILE: 'file',               // Lokale Audio-Datei
    SCREEN: 'screen',           // Bildschirmaufnahme
    VIDEO: 'video',             // Videokamera
    URL: 'url',                 // Online-Streaming-URL
    SPOTIFY: 'spotify'          // Spotify-Integration
};

// Voreingestellte Lichtsynchronisationsmuster
const SYNC_PATTERNS = {
    SPECTRUM: 'spectrum',       // Vollspektrum-Analyse
    BEAT: 'beat',               // Beat-Erkennung
    VOCAL: 'vocal',             // Stimmerkennung
    MOOD: 'mood',               // Stimmungsanalyse
    ADAPTIVE: 'adaptive',       // KI-basierte adaptive Synchronisation
    CUSTOM: 'custom'            // Benutzerdefinierte Einstellungen
};

// FFT-Größen für die Audiosignalverarbeitung
const FFT_SIZES = [256, 512, 1024, 2048, 4096, 8192];

// Synchronisationsqualitätsstufen (beeinflusst die Performance)
const SYNC_QUALITY = {
    LOW: 'low',         // Geringere CPU-Auslastung, schnellere Reaktion
    MEDIUM: 'medium',   // Ausgewogene Performance
    HIGH: 'high',       // Hohe Präzision, mehr CPU-Auslastung
    ULTRA: 'ultra'      // Maximale Qualität, höherer Ressourcenverbrauch
};

// Medienquellenauswahl-Komponente
const MediaSourceSelector = ({ selectedSource, onSourceChange, onFileSelect, onUrlChange, urlValue }) => {
    const fileInputRef = useRef(null);

    const handleFileButtonClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="media-source-selector">
            <h3>Medienquelle</h3>

            <div className="source-buttons">
                <button
                    className={`source-button ${selectedSource === MEDIA_SOURCES.MICROPHONE ? 'active' : ''}`}
                    onClick={() => onSourceChange(MEDIA_SOURCES.MICROPHONE)}
                    title="Mikrofon für Live-Audio"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    <span>Mikrofon</span>
                </button>

                <button
                    className={`source-button ${selectedSource === MEDIA_SOURCES.FILE ? 'active' : ''}`}
                    onClick={() => onSourceChange(MEDIA_SOURCES.FILE)}
                    title="Lokale Audiodatei auswählen"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <span>Audio-Datei</span>
                </button>

                <button
                    className={`source-button ${selectedSource === MEDIA_SOURCES.SCREEN ? 'active' : ''}`}
                    onClick={() => onSourceChange(MEDIA_SOURCES.SCREEN)}
                    title="Bildschirm für visuelle Synchronisation"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span>Bildschirm</span>
                </button>

                <button
                    className={`source-button ${selectedSource === MEDIA_SOURCES.URL ? 'active' : ''}`}
                    onClick={() => onSourceChange(MEDIA_SOURCES.URL)}
                    title="Online-Stream-URL"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span>Stream-URL</span>
                </button>

                {/* Spotify-Button */}
                <button
                    className={`source-button ${selectedSource === MEDIA_SOURCES.SPOTIFY ? 'active' : ''}`}
                    onClick={() => onSourceChange(MEDIA_SOURCES.SPOTIFY)}
                    title="Mit Spotify verbinden"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14.5c2.5 1 5 1 7.5 0"></path>
                        <path d="M7 10.5c3.5 1 6.5 1 10 0"></path>
                        <path d="M9 6.5c2 0.5 4 0.5 6 0"></path>
                    </svg>
                    <span>Spotify</span>
                </button>
            </div>

            {/* Quellenspezifische Eingabefelder */}
            {selectedSource === MEDIA_SOURCES.FILE && (
                <div className="source-detail">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="audio/*"
                        style={{ display: 'none' }}
                        onChange={onFileSelect}
                    />
                    <button
                        className="file-select-button"
                        onClick={handleFileButtonClick}
                    >
                        Audiodatei auswählen
                    </button>
                </div>
            )}

            {selectedSource === MEDIA_SOURCES.URL && (
                <div className="source-detail">
                    <input
                        type="text"
                        placeholder="Stream-URL eingeben (z.B. http://example.com/stream.mp3)"
                        value={urlValue}
                        onChange={onUrlChange}
                        className="url-input"
                    />
                </div>
            )}
        </div>
    );
};

// Visualisierungsbereich für Audiospektrum
const SpectrumVisualizer = ({ analyserNode, fftSize, analyzerData, syncActive }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    // Setup für die Visualisierung
    useEffect(() => {
        if (!analyserNode || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Canvas auf Container-Größe anpassen
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // FFT-Größe setzen
        analyserNode.fftSize = fftSize;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Visualisierungsschleife
        const draw = () => {
            if (!syncActive) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            analyserNode.getByteFrequencyData(dataArray);

            // Clear Canvas mit Fade-Effekt
            ctx.fillStyle = 'rgba(26, 27, 46, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Spektrumvisualisierung
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            // Gradientenfarben basierend auf Frequenzen
            const gradientColors = (i, value) => {
                const percent = i / bufferLength;
                if (percent < 0.2) { // Bass (rot)
                    return `rgb(${255 - (value * 0.3)}, ${50 + (value * 0.2)}, ${80 + (value * 0.1)})`;
                } else if (percent < 0.5) { // Mitteltöne (grün)
                    return `rgb(${50 + (value * 0.2)}, ${220 - (value * 0.3)}, ${100 + (value * 0.1)})`;
                } else { // Höhen (blau)
                    return `rgb(${80 + (value * 0.1)}, ${100 + (value * 0.1)}, ${255 - (value * 0.2)})`;
                }
            };

            // Zeichne die Frequenzbalken
            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i];
                const percent = value / 255;
                const barHeight = percent * canvas.height * 0.8;

                // Abgerundete Rechtecke für schönere Visualisierung
                ctx.beginPath();
                const cornerRadius = Math.min(barWidth / 2, 4);

                if (barHeight > cornerRadius * 2) {
                    ctx.moveTo(x + cornerRadius, canvas.height);
                    ctx.lineTo(x + cornerRadius, canvas.height - barHeight + cornerRadius);
                    ctx.quadraticCurveTo(x, canvas.height - barHeight, x + cornerRadius, canvas.height - barHeight);
                    ctx.lineTo(x + barWidth - cornerRadius, canvas.height - barHeight);
                    ctx.quadraticCurveTo(x + barWidth, canvas.height - barHeight, x + barWidth - cornerRadius, canvas.height - barHeight + cornerRadius);
                    ctx.lineTo(x + barWidth - cornerRadius, canvas.height);
                } else if (barHeight > 0) {
                    // Für sehr kleine Balken ein einfaches Rechteck
                    ctx.rect(x, canvas.height - barHeight, barWidth, barHeight);
                }

                ctx.closePath();

                // Farbverlauf für jeden Balken
                const gradient = ctx.createLinearGradient(
                    x, canvas.height - barHeight,
                    x, canvas.height
                );
                gradient.addColorStop(0, gradientColors(i, value));
                gradient.addColorStop(1, 'rgba(26, 27, 46, 0.5)');

                ctx.fillStyle = gradient;
                ctx.fill();

                // Glanzeffekt für den oberen Teil des Balkens
                if (barHeight > 5) {
                    ctx.beginPath();
                    ctx.rect(x, canvas.height - barHeight, barWidth, 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.fill();
                }

                x += barWidth + 1;
            }

            // Wellenlinie über das Spektrum zeichnen
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            // Zeichne eine weichere Kurve basierend auf Durchschnittswerten
            const pointCount = 30; // Anzahl der Kontrollpunkte für die Kurve
            const sectionSize = Math.floor(bufferLength / pointCount);

            for (let i = 0; i < pointCount; i++) {
                // Durchschnitt für diesen Abschnitt berechnen
                let sum = 0;
                const start = i * sectionSize;
                const end = Math.min(start + sectionSize, bufferLength);

                for (let j = start; j < end; j++) {
                    sum += dataArray[j];
                }

                const avgValue = sum / (end - start) / 255;
                const xPos = (canvas.width / pointCount) * i;
                const yPos = canvas.height - (avgValue * canvas.height * 0.8);

                if (i === 0) {
                    ctx.moveTo(xPos, yPos);
                } else {
                    // Verwende quadratische Kurven für weichere Übergänge
                    const prevX = (canvas.width / pointCount) * (i - 1);
                    const controlX = (prevX + xPos) / 2;
                    ctx.quadraticCurveTo(controlX, yPos, xPos, yPos);
                }
            }

            // Schließe den Pfad zum unteren Rand
            ctx.lineTo(canvas.width, canvas.height);

            // Farbverlauf für die Wellenlinie
            const waveGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            waveGradient.addColorStop(0, 'rgba(108, 99, 255, 0.2)');
            waveGradient.addColorStop(1, 'rgba(26, 27, 46, 0.0)');

            ctx.fillStyle = waveGradient;
            ctx.fill();

            // Linien-Kontur mit Glow
            ctx.strokeStyle = 'rgba(108, 99, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Übertrage Analyzer-Daten für die Lichtsteuerung
            if (analyzerData) {
                // Berechne Durchschnittswerte für verschiedene Frequenzbereiche
                const bassAvg = calculateAverage(dataArray, 0, Math.floor(bufferLength * 0.15)) / 255;
                const midAvg = calculateAverage(dataArray, Math.floor(bufferLength * 0.15), Math.floor(bufferLength * 0.6)) / 255;
                const trebleAvg = calculateAverage(dataArray, Math.floor(bufferLength * 0.6), bufferLength) / 255;

                // Berechne Rhythmus-Informationen
                const beatDetected = detectBeat(dataArray, {
                    threshold: 0.15,
                    decay: 0.02,
                    timeout: 200
                });

                // Aktualisiere die Analyzer-Daten
                analyzerData.current = {
                    bass: bassAvg,
                    mid: midAvg,
                    treble: trebleAvg,
                    volume: calculateAverage(dataArray, 0, bufferLength) / 255,
                    beat: beatDetected,
                    peak: Math.max(...Array.from(dataArray)) / 255,
                    spectrum: Array.from(dataArray),
                    timestamp: Date.now()
                };
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationRef.current);
        };
    }, [analyserNode, fftSize, syncActive, analyzerData]);

    return (
        <div className="spectrum-visualizer">
            <canvas ref={canvasRef} className="visualizer-canvas"></canvas>
        </div>
    );
};

// Hilfsfunktion zur Durchschnittsberechnung eines Frequenzbereichs
const calculateAverage = (dataArray, start, end) => {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += dataArray[i];
    }
    return sum / (end - start);
};

// Einfache Beat-Erkennungslogik
const detectBeat = (dataArray, options = {}) => {
    // Standardwerte für die Beat-Erkennung
    const threshold = options.threshold || 0.15;
    const decay = options.decay || 0.02;
    const timeout = options.timeout || 200;

    // In einer realen Implementierung würden wir hier einen gleitenden Durchschnitt
    // und mehr Logik zur Erkennung von Beats verwenden

    // Für diese Demo verwenden wir eine vereinfachte Logik
    const bassRange = Math.floor(dataArray.length * 0.15);
    const bassAvg = calculateAverage(dataArray, 0, bassRange) / 255;

    // Statische Variable für den letzten Durchschnitt
    if (typeof detectBeat.lastAverage === 'undefined') {
        detectBeat.lastAverage = 0;
        detectBeat.lastBeatTime = 0;
    }

    // Beat-Erkennung auf Basis von plötzlichen Änderungen im Bass
    const delta = bassAvg - detectBeat.lastAverage;
    detectBeat.lastAverage = detectBeat.lastAverage * (1 - decay) + bassAvg * decay;

    const now = Date.now();
    if (delta > threshold && now - detectBeat.lastBeatTime > timeout) {
        detectBeat.lastBeatTime = now;
        return true;
    }

    return false;
};

// Fortschrittsanzeige-Komponente für Analysequalität/Performance
const PerformanceIndicator = ({ quality, fftSize, fps }) => {
    // Berechne die CPU-Last basierend auf Qualität und FFT-Größe
    const getCpuLoad = () => {
        const qualityFactor = {
            [SYNC_QUALITY.LOW]: 1,
            [SYNC_QUALITY.MEDIUM]: 2,
            [SYNC_QUALITY.HIGH]: 3,
            [SYNC_QUALITY.ULTRA]: 4
        }[quality] || 2;

        const fftFactor = Math.log2(fftSize / 256) + 1;

        // Simulate CPU load between 10% and 90%
        return Math.min(90, Math.max(10, qualityFactor * fftFactor * 10));
    };

    const cpuLoad = getCpuLoad();

    return (
        <div className="performance-indicator">
            <div className="performance-metrics">
                <div className="metric">
                    <span className="metric-label">CPU</span>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${cpuLoad}%`,
                                backgroundColor: cpuLoad > 70 ? '#ff5252' : cpuLoad > 40 ? '#ffac33' : '#4caf50'
                            }}
                        ></div>
                    </div>
                    <span className="metric-value">{cpuLoad}%</span>
                </div>

                <div className="metric">
                    <span className="metric-label">FPS</span>
                    <span className="metric-value">{fps}</span>
                </div>

                <div className="metric">
                    <span className="metric-label">Qualität</span>
                    <span className="metric-value">{quality.charAt(0).toUpperCase() + quality.slice(1)}</span>
                </div>
            </div>
        </div>
    );
};

// Komponente für Synchronisationseinstellungen
const SyncSettings = ({
                          pattern,
                          onPatternChange,
                          quality,
                          onQualityChange,
                          fftSize,
                          onFftSizeChange,
                          customSettings,
                          onCustomSettingChange
                      }) => {
    return (
        <div className="sync-settings">
            <h3>Synchronisationseinstellungen</h3>

            <div className="setting-group">
                <label>Synchronisationsmuster</label>
                <div className="pattern-buttons">
                    <button
                        className={`pattern-button ${pattern === SYNC_PATTERNS.SPECTRUM ? 'active' : ''}`}
                        onClick={() => onPatternChange(SYNC_PATTERNS.SPECTRUM)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19h16"></path>
                            <path d="M4 15h16"></path>
                            <path d="M4 11h16"></path>
                            <path d="M4 7h16"></path>
                        </svg>
                        Spektrum
                    </button>

                    <button
                        className={`pattern-button ${pattern === SYNC_PATTERNS.BEAT ? 'active' : ''}`}
                        onClick={() => onPatternChange(SYNC_PATTERNS.BEAT)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12h6"></path>
                            <path d="M10 12h6"></path>
                            <path d="M18 12h4"></path>
                        </svg>
                        Beat
                    </button>

                    <button
                        className={`pattern-button ${pattern === SYNC_PATTERNS.VOCAL ? 'active' : ''}`}
                        onClick={() => onPatternChange(SYNC_PATTERNS.VOCAL)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                        Stimme
                    </button>

                    <button
                        className={`pattern-button ${pattern === SYNC_PATTERNS.MOOD ? 'active' : ''}`}
                        onClick={() => onPatternChange(SYNC_PATTERNS.MOOD)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                            <line x1="9" y1="9" x2="9.01" y2="9"></line>
                            <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                        Stimmung
                    </button>

                    <button
                        className={`pattern-button ${pattern === SYNC_PATTERNS.ADAPTIVE ? 'active' : ''}`}
                        onClick={() => onPatternChange(SYNC_PATTERNS.ADAPTIVE)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6"></path>
                            <path d="M10 14l2.5-2.5 7.5 7.5-2.5 2.5-7.5-7.5z"></path>
                            <path d="M13.5 8.5l2 2"></path>
                            <path d="M8 9l-6 6v-4l6-6 2 2 6-6h-4l-6 6z"></path>
                        </svg>
                        Adaptiv
                    </button>

                    <button
                        className={`pattern-button ${pattern === SYNC_PATTERNS.CUSTOM ? 'active' : ''}`}
                        onClick={() => onPatternChange(SYNC_PATTERNS.CUSTOM)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Individuell
                    </button>
                </div>
            </div>

            <div className="setting-group">
                <label>Analysequalität</label>
                <div className="quality-buttons">
                    <button
                        className={`quality-button ${quality === SYNC_QUALITY.LOW ? 'active' : ''}`}
                        onClick={() => onQualityChange(SYNC_QUALITY.LOW)}
                    >
                        Niedrig
                    </button>
                    <button
                        className={`quality-button ${quality === SYNC_QUALITY.MEDIUM ? 'active' : ''}`}
                        onClick={() => onQualityChange(SYNC_QUALITY.MEDIUM)}
                    >
                        Mittel
                    </button>
                    <button
                        className={`quality-button ${quality === SYNC_QUALITY.HIGH ? 'active' : ''}`}
                        onClick={() => onQualityChange(SYNC_QUALITY.HIGH)}
                    >
                        Hoch
                    </button>
                    <button
                        className={`quality-button ${quality === SYNC_QUALITY.ULTRA ? 'active' : ''}`}
                        onClick={() => onQualityChange(SYNC_QUALITY.ULTRA)}
                    >
                        Ultra
                    </button>
                </div>
            </div>

            <div className="setting-group">
                <label>FFT-Größe: {fftSize}</label>
                <input
                    type="range"
                    min="0"
                    max={FFT_SIZES.length - 1}
                    value={FFT_SIZES.indexOf(fftSize)}
                    onChange={(e) => onFftSizeChange(FFT_SIZES[e.target.value])}
                    className="fft-slider"
                />
                <div className="setting-description">
                    Größere FFT-Werte bieten mehr Details, benötigen aber mehr Rechenleistung.
                </div>
            </div>

            {/* Erweiterte Einstellungen für den benutzerdefinierten Modus */}
            {pattern === SYNC_PATTERNS.CUSTOM && (
                <div className="custom-settings">
                    <h4>Benutzerdefinierte Einstellungen</h4>

                    <div className="custom-setting">
                        <label>Bass-Empfindlichkeit</label>
                        <div className="setting-control">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={customSettings.bassSensitivity}
                                onChange={(e) => onCustomSettingChange('bassSensitivity', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{customSettings.bassSensitivity}%</span>
                        </div>
                    </div>

                    <div className="custom-setting">
                        <label>Mitten-Empfindlichkeit</label>
                        <div className="setting-control">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={customSettings.midSensitivity}
                                onChange={(e) => onCustomSettingChange('midSensitivity', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{customSettings.midSensitivity}%</span>
                        </div>
                    </div>

                    <div className="custom-setting">
                        <label>Höhen-Empfindlichkeit</label>
                        <div className="setting-control">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={customSettings.trebleSensitivity}
                                onChange={(e) => onCustomSettingChange('trebleSensitivity', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{customSettings.trebleSensitivity}%</span>
                        </div>
                    </div>

                    <div className="custom-setting">
                        <label>Beat-Erkennungsschwelle</label>
                        <div className="setting-control">
                            <input
                                type="range"
                                min="5"
                                max="50"
                                value={customSettings.beatThreshold}
                                onChange={(e) => onCustomSettingChange('beatThreshold', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{customSettings.beatThreshold}%</span>
                        </div>
                    </div>

                    <div className="custom-setting">
                        <label>Reaktionsgeschwindigkeit</label>
                        <div className="setting-control">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={customSettings.responseSpeed}
                                onChange={(e) => onCustomSettingChange('responseSpeed', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{customSettings.responseSpeed}%</span>
                        </div>
                    </div>

                    <div className="custom-setting">
                        <label>Farbwechselgeschwindigkeit</label>
                        <div className="setting-control">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={customSettings.colorChangeSpeed}
                                onChange={(e) => onCustomSettingChange('colorChangeSpeed', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{customSettings.colorChangeSpeed}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Lichter-Konfigurationskomponente für das Media-Sync-Tool
const LightConfiguration = ({ lights, selectedLights, onLightToggle, onSelectAll, onSelectNone }) => {
    // Gruppiere Lichter nach Raum (falls Rauminfo verfügbar)
    const groupedLights = Object.entries(lights).reduce((groups, [id, light]) => {
        const roomName = light.roomName || "Andere";
        if (!groups[roomName]) {
            groups[roomName] = [];
        }
        groups[roomName].push({ id, light });
        return groups;
    }, {});

    return (
        <div className="light-configuration">
            <h3>Lichter für Mediensynchronisation</h3>

            <div className="light-selection-controls">
                <button onClick={onSelectAll}>Alle auswählen</button>
                <button onClick={onSelectNone}>Keine auswählen</button>
            </div>

            <div className="lights-container">
                {Object.keys(groupedLights).map(roomName => (
                    <div key={roomName} className="light-group">
                        <h4 className="room-name">{roomName}</h4>
                        <div className="room-lights">
                            {groupedLights[roomName].map(({ id, light }) => (
                                <div key={id} className="light-select-item">
                                    <label className="light-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedLights.includes(id)}
                                            onChange={() => onLightToggle(id)}
                                        />
                                        <span className="light-name">{light.name}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Haupt-MediaSyncTool-Komponente
const MediaSyncTool = ({ lights = {}, username, bridgeIP }) => {
    // Media-Quelle und Audiokontext
    const [mediaSource, setMediaSource] = useState(MEDIA_SOURCES.MICROPHONE);
    const [audioContext, setAudioContext] = useState(null);
    const [analyserNode, setAnalyserNode] = useState(null);
    const [mediaStream, setMediaStream] = useState(null);
    const [audioElement, setAudioElement] = useState(null);
    const [urlValue, setUrlValue] = useState('');
    const [fileName, setFileName] = useState('');

    // Synchronisationseinstellungen
    const [syncPattern, setSyncPattern] = useState(SYNC_PATTERNS.SPECTRUM);
    const [syncQuality, setSyncQuality] = useState(SYNC_QUALITY.MEDIUM);
    const [fftSize, setFftSize] = useState(2048);
    const [customSettings, setCustomSettings] = useState({
        bassSensitivity: 70,
        midSensitivity: 50,
        trebleSensitivity: 30,
        beatThreshold: 15,
        responseSpeed: 60,
        colorChangeSpeed: 40
    });

    // Synchronisationsstatus
    const [syncActive, setSyncActive] = useState(false);
    const [selectedLights, setSelectedLights] = useState([]);
    const [fps, setFps] = useState(0);
    const analyzerData = useRef(null);

    // FPS-Zähler
    const fpsRef = useRef({
        frames: 0,
        lastTime: performance.now()
    });

    // Animation-Loop
    const animationRef = useRef(null);

    // Initialisiere die Lichtauswahl beim ersten Rendern
    useEffect(() => {
        if (Object.keys(lights).length > 0 && selectedLights.length === 0) {
            // Standardmäßig alle Lichter auswählen
            setSelectedLights(Object.keys(lights));
        }
    }, [lights]);

    // Medienquelle ändern
    const changeMediaSource = async (source) => {
        // Stoppe die aktuelle Synchronisation und Medienquellen
        if (syncActive) {
            toggleSync();
        }
        cleanupMediaStream();

        setMediaSource(source);

        // Initialisiere sofort die neue Quelle, wenn es ein Mikrofon ist
        if (source === MEDIA_SOURCES.MICROPHONE) {
            setupAudioContext();
        }
    };

    // Dateiauswahl-Handler
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);

        // AudioElement für die Datei erstellen
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.controls = true;
        setAudioElement(audio);

        // Synchronisation mit der Audiodatei einrichten
        setupAudioContext(null, audio);
    };

    // Handler für URL-Eingabeänderungen
    const handleUrlChange = (e) => {
        setUrlValue(e.target.value);
    };

    // Handler für URL-Stream
    const setupUrlStream = () => {
        if (!urlValue) return;

        // AudioElement für die URL erstellen
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = urlValue;
        audio.controls = true;
        setAudioElement(audio);

        // Synchronisation mit dem Stream einrichten
        setupAudioContext(null, audio);
    };

    // Custom Setting ändern
    const handleCustomSettingChange = (setting, value) => {
        setCustomSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    // AudioContext und Analyzer einrichten
    const setupAudioContext = async (stream = null, audio = null) => {
        try {
            // Mikrofon-Zugriff anfordern, wenn noch kein Stream vorhanden ist
            let audioStream = stream;
            if (!audioStream && mediaSource === MEDIA_SOURCES.MICROPHONE) {
                audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                setMediaStream(audioStream);
            } else if (mediaSource === MEDIA_SOURCES.SCREEN) {
                // Bildschirmfreigabe mit Audio anfordern
                audioStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                setMediaStream(audioStream);
            }

            // AudioContext erstellen oder wiederverwenden
            const context = audioContext || new (window.AudioContext || window.webkitAudioContext)();
            setAudioContext(context);

            // AnalyserNode erstellen
            const analyser = context.createAnalyser();
            analyser.fftSize = fftSize;
            analyser.smoothingTimeConstant = 0.8;
            setAnalyserNode(analyser);

            // Medienquelle mit dem Analyser verbinden
            if (audioStream) {
                const source = context.createMediaStreamSource(audioStream);
                source.connect(analyser);
            } else if (audio) {
                // Für Audio-Elemente (Datei oder URL)
                audio.addEventListener('canplay', () => {
                    const source = context.createMediaElementSource(audio);
                    source.connect(analyser);
                    analyser.connect(context.destination);
                    audio.play().catch(err => console.error("Fehler beim Abspielen:", err));
                });
            }
        } catch (error) {
            console.error("Fehler beim Einrichten des Audio-Kontexts:", error);
            // Fehlerbehandlung
        }
    };

    // Medienstream bereinigen
    const cleanupMediaStream = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
        }

        if (audioElement) {
            audioElement.pause();
            audioElement.src = '';
            setAudioElement(null);
        }

        if (audioContext) {
            // AudioContext nicht schließen, sondern suspendieren
            audioContext.suspend().catch(err => console.error("Fehler beim Suspendieren des AudioContext:", err));
        }
    };

    // Synchronisation starten/stoppen
    const toggleSync = async () => {
        if (syncActive) {
            // Synchronisation stoppen
            setSyncActive(false);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }

            if (audioContext) {
                await audioContext.suspend();
            }
        } else {
            // Wenn Spotify-Quelle ausgewählt ist, keine AudioContext-Initialisierung notwendig
            if (mediaSource === MEDIA_SOURCES.SPOTIFY) {
                setSyncActive(true);
                // FPS-Zähler zurücksetzen
                fpsRef.current = {
                    frames: 0,
                    lastTime: performance.now()
                };
                updateFPS();
                startLightSync();
                return;
            }

            // Synchronisation starten
            if (!analyserNode) {
                // Falls noch kein Analyser vorhanden ist, neu einrichten
                if (mediaSource === MEDIA_SOURCES.MICROPHONE || mediaSource === MEDIA_SOURCES.SCREEN) {
                    await setupAudioContext();
                } else if (mediaSource === MEDIA_SOURCES.FILE && audioElement) {
                    await setupAudioContext(null, audioElement);
                } else if (mediaSource === MEDIA_SOURCES.URL && urlValue) {
                    setupUrlStream();
                } else {
                    console.error("Keine gültige Medienquelle ausgewählt");
                    return;
                }
            }

            if (audioContext) {
                await audioContext.resume();
            }

            setSyncActive(true);

            // FPS-Zähler zurücksetzen
            fpsRef.current = {
                frames: 0,
                lastTime: performance.now()
            };

            // Animation Loop starten
            updateFPS();
            startLightSync();
        }
    };

    // Spotify Audiodaten-Handler
    const handleSpotifyAnalyze = (audioData) => {
        // Hier die Audiodaten von Spotify verarbeiten
        if (analyzerData && syncActive) {
            analyzerData.current = audioData;
        }
    };

    // FPS aktualisieren
    const updateFPS = () => {
        fpsRef.current.frames++;
        const now = performance.now();
        const elapsed = now - fpsRef.current.lastTime;

        if (elapsed >= 1000) {
            setFps(Math.round((fpsRef.current.frames * 1000) / elapsed));
            fpsRef.current.frames = 0;
            fpsRef.current.lastTime = now;
        }

        if (syncActive) {
            requestAnimationFrame(updateFPS);
        }
    };

    // Lichtsynchronisation starten
    const startLightSync = () => {
        if (!syncActive || !analyzerData || selectedLights.length === 0) return;

        const updateLights = async () => {
            if (!syncActive) return;

            const data = analyzerData.current;
            if (!data) {
                animationRef.current = requestAnimationFrame(updateLights);
                return;
            }

            // Lichter basierend auf dem gewählten Muster aktualisieren
            try {
                await updateLightsBasedOnPattern(data);
            } catch (error) {
                console.error("Fehler bei der Lichtsynchronisation:", error);
            }

            animationRef.current = requestAnimationFrame(updateLights);
        };

        updateLights();
    };

    // Lichter basierend auf dem Muster aktualisieren
    const updateLightsBasedOnPattern = async (data) => {
        // Berechne die Lichtänderungen basierend auf dem Synchronisationsmuster
        // und den Audiodaten
        switch (syncPattern) {
            case SYNC_PATTERNS.SPECTRUM:
                await updateLightsSpectrum(data);
                break;
            case SYNC_PATTERNS.BEAT:
                await updateLightsBeat(data);
                break;
            case SYNC_PATTERNS.VOCAL:
                await updateLightsVocal(data);
                break;
            case SYNC_PATTERNS.MOOD:
                await updateLightsMood(data);
                break;
            case SYNC_PATTERNS.ADAPTIVE:
                await updateLightsAdaptive(data);
                break;
            case SYNC_PATTERNS.CUSTOM:
                await updateLightsCustom(data);
                break;
            default:
                await updateLightsSpectrum(data);
        }
    };

    // Spektrum-basierte Lichtsynchronisation
    const updateLightsSpectrum = async (data) => {
        // Teile die Lichter in drei Gruppen (Bass, Mitten, Höhen) auf
        const lightGroups = groupLightsByFrequency(selectedLights, 3);

        // Basisfarben für jede Frequenzgruppe
        const bassColor = { hue: mapRange(data.bass, 0, 1, 0, 10000), sat: 254, bri: 254 };
        const midColor = { hue: mapRange(data.mid, 0, 1, 20000, 30000), sat: 254, bri: 254 };
        const trebleColor = { hue: mapRange(data.treble, 0, 1, 40000, 50000), sat: 254, bri: 254 };

        // Sende Farben an die Lichtergruppen
        await Promise.all([
            updateLightGroup(lightGroups[0], bassColor, data.bass),    // Bass-Lichter
            updateLightGroup(lightGroups[1], midColor, data.mid),      // Mitten-Lichter
            updateLightGroup(lightGroups[2], trebleColor, data.treble) // Höhen-Lichter
        ]);
    };

    // Beat-basierte Lichtsynchronisation
    const updateLightsBeat = async (data) => {
        if (!data.beat) {
            // Keine Lichtänderung, wenn kein Beat erkannt wurde
            return;
        }

        // Wähle zufällige Lichter aus, die auf den Beat reagieren sollen
        const beatLights = getRandomSubset(selectedLights, Math.ceil(selectedLights.length * 0.6));

        // Berechne Farbe basierend auf dem Bass
        const beatColor = {
            hue: Math.floor(Math.random() * 65535),
            sat: 254,
            bri: 254,
            transitiontime: 1 // Schnelle Übergänge für Beat-Visualisierung
        };

        // Andere Lichter dimmen
        const nonBeatLights = selectedLights.filter(id => !beatLights.includes(id));

        // Sende Farben an die Lichtergruppen
        await Promise.all([
            updateLightGroup(beatLights, beatColor, 1), // Beat-Lichter hell machen
            updateLightGroup(nonBeatLights, { bri: 50, transitiontime: 3 }, 0.2) // Andere Lichter dimmen
        ]);
    };

    // Stimmen-basierte Lichtsynchronisation
    const updateLightsVocal = async (data) => {
        // Einfach den Mitteltonbereich für Stimmen verwenden
        // In einer echten Implementierung würde hier eine detailliertere Stimmenerkennung stattfinden
        const vocalEnergy = data.mid;

        // Warme Farbtöne für Stimmen
        const vocalColor = {
            hue: mapRange(vocalEnergy, 0, 1, 1000, 6000), // Orange-Gelb Bereich
            sat: Math.min(254, Math.round(200 + (vocalEnergy * 54))),
            bri: Math.min(254, Math.round(150 + (vocalEnergy * 104))),
            transitiontime: 2
        };

        // Alle Lichter auf die gleiche Farbe setzen
        await updateLightGroup(selectedLights, vocalColor, vocalEnergy);
    };

    // Stimmungs-basierte Lichtsynchronisation
    const updateLightsMood = async (data) => {
        // Stimmung basierend auf Frequenzverteilung und Volumen bestimmen
        const bassRatio = data.bass / (data.bass + data.mid + data.treble);
        const trebleRatio = data.treble / (data.bass + data.mid + data.treble);

        let mood;
        if (data.volume < 0.1) {
            mood = 'silent'; // Stille - Dunkelblau
        } else if (bassRatio > 0.5) {
            mood = 'energetic'; // Energiegeladen - Rot/Orange
        } else if (trebleRatio > 0.4) {
            mood = 'bright'; // Hell - Grün/Cyan
        } else {
            mood = 'balanced'; // Ausgewogen - Lila/Magenta
        }

        // Farben basierend auf Stimmung
        let moodColor;
        switch (mood) {
            case 'silent':
                moodColor = { hue: 46000, sat: 254, bri: 100, transitiontime: 10 };
                break;
            case 'energetic':
                moodColor = { hue: 5000, sat: 254, bri: 254, transitiontime: 5 };
                break;
            case 'bright':
                moodColor = { hue: 25000, sat: 254, bri: 254, transitiontime: 5 };
                break;
            case 'balanced':
                moodColor = { hue: 50000, sat: 200, bri: 200, transitiontime: 8 };
                break;
            default:
                moodColor = { hue: 0, sat: 0, bri: 254, transitiontime: 5 };
        }

        // Alle Lichter auf die gleiche Farbe setzen
        await updateLightGroup(selectedLights, moodColor, data.volume);
    };

    // Adaptive Lichtsynchronisation
    const updateLightsAdaptive = async (data) => {
        // Komplexere Logik, die das Musikmuster analysiert und
        // dynamisch das beste Synchronisationsmuster bestimmt

        // Für dieses Beispiel verwenden wir eine vereinfachte Logik:
        // - Bei Beats verwenden wir Beat-Synchronisation
        // - Bei hohem Gesangsanteil (Mid-Frequenzen) verwenden wir Vocal-Synchronisation
        // - Ansonsten verwenden wir Spektrum-Synchronisation

        const bassRatio = data.bass / (data.bass + data.mid + data.treble);
        const midRatio = data.mid / (data.bass + data.mid + data.treble);

        if (data.beat) {
            await updateLightsBeat(data);
        } else if (midRatio > 0.5 && data.volume > 0.2) {
            await updateLightsVocal(data);
        } else if (data.volume < 0.1) {
            await updateLightsMood({...data, volume: 0.05});
        } else {
            await updateLightsSpectrum(data);
        }
    };

    // Benutzerdefinierte Lichtsynchronisation
    const updateLightsCustom = async (data) => {
        // Verwende die benutzerdefinierten Einstellungen für die Synchronisation
        const {
            bassSensitivity,
            midSensitivity,
            trebleSensitivity,
            beatThreshold,
            responseSpeed,
            colorChangeSpeed
        } = customSettings;

        // Skalierte Werte basierend auf Empfindlichkeitseinstellungen
        const bassValue = data.bass * (bassSensitivity / 100);
        const midValue = data.mid * (midSensitivity / 100);
        const trebleValue = data.treble * (trebleSensitivity / 100);

        // Benutzerdefinierte Beat-Erkennung
        const customBeat = data.bass > (beatThreshold / 100);

        // Berechne Übergangszeit basierend auf Reaktionsgeschwindigkeit
        // Höhere Werte = langsamere Übergänge
        const transitiontime = Math.max(1, Math.round(10 - (responseSpeed / 10)));

        // Farbwechselgeschwindigkeit beeinflusst die Farbrotation
        const hueShift = Date.now() * (colorChangeSpeed / 5000);

        // Lichter in verschiedene Gruppen aufteilen
        const lightGroups = groupLightsByFrequency(selectedLights, 3);

        // Farben basierend auf den skalierten Werten und Benutzereinstellungen
        const bassColor = {
            hue: Math.round((bassValue * 20000 + hueShift) % 65535),
            sat: 254,
            bri: Math.min(254, Math.round(100 + (bassValue * 154))),
            transitiontime
        };

        const midColor = {
            hue: Math.round((midValue * 30000 + hueShift + 21845) % 65535),
            sat: 254,
            bri: Math.min(254, Math.round(100 + (midValue * 154))),
            transitiontime
        };

        const trebleColor = {
            hue: Math.round((trebleValue * 40000 + hueShift + 43690) % 65535),
            sat: 254,
            bri: Math.min(254, Math.round(100 + (trebleValue * 154))),
            transitiontime
        };

        // Bei Custom Beat zusätzlich Lichtblitz auslösen
        if (customBeat) {
            // Zufällige Lichter für Beat-Effekt auswählen
            const beatLights = getRandomSubset(selectedLights, Math.ceil(selectedLights.length * 0.3));

            // Beat-Effekt durch kurzen weißen Blitz
            await updateLightGroup(beatLights, {
                hue: 0,
                sat: 0,
                bri: 254,
                transitiontime: 1
            }, 1);

            // Nach dem Blitz auf normale Farbe zurücksetzen
            setTimeout(async () => {
                if (!syncActive) return;

                await Promise.all(
                    beatLights.map(async lightId => {
                        // Bestimme, zu welcher Gruppe dieses Licht gehört
                        const groupIndex = lightGroups.findIndex(group => group.includes(lightId));
                        const color = [bassColor, midColor, trebleColor][groupIndex] || bassColor;

                        await updateLight(lightId, color);
                    })
                );
            }, 100);
        }

        // Sende Farben an die Lichtergruppen
        await Promise.all([
            updateLightGroup(lightGroups[0], bassColor, bassValue),
            updateLightGroup(lightGroups[1], midColor, midValue),
            updateLightGroup(lightGroups[2], trebleColor, trebleValue)
        ]);
    };

    // Hilfsfunktion zum Gruppieren von Lichtern nach Frequenzbereichen
    const groupLightsByFrequency = (lights, numGroups) => {
        const groups = Array(numGroups).fill().map(() => []);

        lights.forEach((lightId, index) => {
            const groupIndex = index % numGroups;
            groups[groupIndex].push(lightId);
        });

        return groups;
    };

    // Hilfsfunktion zur Aktualisierung einer Gruppe von Lichtern
    const updateLightGroup = async (lightIds, colorState, intensity = 1) => {
        if (!lightIds || lightIds.length === 0) return;

        // Helligkeitsmodulation basierend auf Intensität anwenden
        const state = {...colorState};
        if (state.bri) {
            state.bri = Math.max(1, Math.min(254, Math.round(state.bri * intensity)));
        }

        // Alle Lichter gleichzeitig aktualisieren
        await Promise.all(
            lightIds.map(lightId => updateLight(lightId, state))
        );
    };

    // Einzelnes Licht aktualisieren
    const updateLight = async (lightId, state) => {
        try {
            const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    on: true, // Lichter immer einschalten
                    ...state
                })
            });

            return await response.json();
        } catch (error) {
            console.error(`Fehler beim Setzen des Lichtzustands für ${lightId}:`, error);
        }
    };

    // Hilfsfunktion zum Umwandeln eines Wertebereichs in einen anderen
    const mapRange = (value, inMin, inMax, outMin, outMax) => {
        return Math.floor((value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin);
    };

    // Hilfsfunktion zum Auswählen einer zufälligen Teilmenge
    const getRandomSubset = (array, count) => {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, array.length));
    };

    // Lampe zur Auswahl hinzufügen/entfernen
    const toggleLight = (lightId) => {
        setSelectedLights(prev =>
            prev.includes(lightId)
                ? prev.filter(id => id !== lightId)
                : [...prev, lightId]
        );
    };

    // Alle Lampen auswählen
    const selectAllLights = () => {
        setSelectedLights(Object.keys(lights));
    };

    // Keine Lampen auswählen
    const selectNoLights = () => {
        setSelectedLights([]);
    };

    // Rendere Visualizer basierend auf der Medienquelle
    const renderVisualizer = () => {
        if (mediaSource === MEDIA_SOURCES.SPOTIFY) {
            return (
                <SpotifyIntegration
                    onAnalyzeAudio={handleSpotifyAnalyze}
                    isActive={syncActive}
                />
            );
        }

        // Original-Visualizer-Code für andere Quellen
        return (
            <>
                {/* Audio Player für Datei oder URL */}
                {(mediaSource === MEDIA_SOURCES.FILE || mediaSource === MEDIA_SOURCES.URL) && audioElement && (
                    <div className="audio-player-container">
                        <div className="audio-info">
                          <span className="audio-source">
                            {mediaSource === MEDIA_SOURCES.FILE
                                ? `Datei: ${fileName || 'Audiofile'}`
                                : `Stream: ${urlValue}`}
                          </span>
                        </div>
                        <div className="audio-controls">
                            {audioElement}
                        </div>
                    </div>
                )}

                {/* Screen Capture Display */}
                {mediaSource === MEDIA_SOURCES.SCREEN && mediaStream && (
                    <div className="screen-capture-container">
                        <video
                            autoPlay
                            muted
                            ref={video => {
                                if (video && mediaStream) {
                                    video.srcObject = mediaStream;
                                }
                            }}
                        />
                    </div>
                )}

                {/* Audio Visualizer */}
                {analyserNode && (
                    <SpectrumVisualizer
                        analyserNode={analyserNode}
                        fftSize={fftSize}
                        analyzerData={analyzerData}
                        syncActive={syncActive}
                    />
                )}

                {/* Wenn kein Analyzer aktiv ist, zeige Hinweis */}
                {!analyserNode && (
                    <div className="start-message">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="10 2 2 9 10 16 10 2"></polygon>
                            <path d="M2 16l10 7V16"></path>
                            <path d="M16 1l6 6-6 6"></path>
                            <path d="M10 16l11 0"></path>
                        </svg>
                        <h3>Media Sync starten</h3>
                        <p>Wähle eine Medienquelle und klicke auf "Synchronisation starten", um deine Lichter mit Musik zu synchronisieren.</p>
                    </div>
                )}
            </>
        );
    };

    // Bereinige beim Unmounten
    useEffect(() => {
        return () => {
            cleanupMediaStream();

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            if (audioContext) {
                audioContext.close();
            }
        };
    }, []);

    return (
        <div className="media-sync-tool">
            <div className="tool-header">
                <h2 className="section-title">Media Sync Pro</h2>

                <button
                    className={`sync-toggle-button ${syncActive ? 'active' : ''}`}
                    onClick={toggleSync}
                >
                    {syncActive ? 'Synchronisation stoppen' : 'Synchronisation starten'}
                </button>
            </div>

            <div className="tool-container">
                <div className="config-panel">
                    <MediaSourceSelector
                        selectedSource={mediaSource}
                        onSourceChange={changeMediaSource}
                        onFileSelect={handleFileSelect}
                        onUrlChange={handleUrlChange}
                        urlValue={urlValue}
                    />

                    {/* Nur anzeigen, wenn nicht Spotify ausgewählt ist */}
                    {mediaSource !== MEDIA_SOURCES.SPOTIFY && (
                        <SyncSettings
                            pattern={syncPattern}
                            onPatternChange={setSyncPattern}
                            quality={syncQuality}
                            onQualityChange={setSyncQuality}
                            fftSize={fftSize}
                            onFftSizeChange={setFftSize}
                            customSettings={customSettings}
                            onCustomSettingChange={handleCustomSettingChange}
                        />
                    )}

                    <LightConfiguration
                        lights={lights}
                        selectedLights={selectedLights}
                        onLightToggle={toggleLight}
                        onSelectAll={selectAllLights}
                        onSelectNone={selectNoLights}
                    />
                </div>

                <div className="visualizer-panel">
                    <div className="main-visualizer-container">
                        {renderVisualizer()}
                    </div>

                    {/* Performance-Indikatoren */}
                    {syncActive && mediaSource !== MEDIA_SOURCES.SPOTIFY && (
                        <PerformanceIndicator
                            quality={syncQuality}
                            fftSize={fftSize}
                            fps={fps}
                        />
                    )}

                    {/* Aktive Synchronisationsinformationen */}
                    {syncActive && (
                        <div className="sync-info">
                            <div className="sync-status">
                                <span className="status-indicator"></span>
                                <span className="status-text">Synchronisation aktiv</span>
                            </div>
                            <div className="sync-details">
                                {mediaSource !== MEDIA_SOURCES.SPOTIFY ? (
                                    <>
                                        <span className="detail-item">Muster: {syncPattern.charAt(0).toUpperCase() + syncPattern.slice(1)}</span>
                                        <span className="detail-item">Qualität: {syncQuality.charAt(0).toUpperCase() + syncQuality.slice(1)}</span>
                                    </>
                                ) : (
                                    <span className="detail-item">Quelle: Spotify</span>
                                )}
                                <span className="detail-item">Lichter: {selectedLights.length}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaSyncTool;