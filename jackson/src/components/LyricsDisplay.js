import React, { useEffect, useRef, useState } from 'react';
import '../Player.css';

const LyricsDisplay = ({ lyrics, currentLyricIndex, currentTime, debugMode, lyricsDisplayRef }) => {
    // Konfigurationswerte
    const VISIBLE_RANGE = {
        past: 1,     // Zeige mehr vergangene Lyrics an
        future: 3    // Zeige weniger zukünftige Lyrics für besseren Fokus
    };

    // States
    const [visibleLyrics, setVisibleLyrics] = useState([]);
    const [showPastIndicator, setShowPastIndicator] = useState(false);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const [manualScrollDetected, setManualScrollDetected] = useState(false);
    const [stableCurrentIndex, setStableCurrentIndex] = useState(-1);
    const [animatingLyrics, setAnimatingLyrics] = useState(false);
    const [currentAnimation, setCurrentAnimation] = useState(null);

    // Refs
    const internalLyricsContainerRef = useRef(null);
    const userScrollTimerRef = useRef(null);
    const lastScrollTimeRef = useRef(0);
    const lastScrollPositionRef = useRef(0);
    const scrollTimeoutRef = useRef(null);
    const lastStableIndexRef = useRef(-1);
    const indexStabilizationRef = useRef(null);
    const lastActivelyricRef = useRef(null);
    const animationTimerRef = useRef(null);

    // Debug-Logger mit eigener Farbe
    const logDebug = (message, data) => {
        if (debugMode) {
            console.log(
                `%c[LyricsDisplay] ${message}`,
                'background: #2C2E3B; color: #8b5cf6; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
                data || ''
            );
        }
    };

    // Berechne den Fortschritt des aktuellen Lyrics in Prozent
    const calculateProgress = (lyric, index) => {
        if (!currentTime || !lyric) return 0;

        if (lyric.hasOwnProperty('endTime')) {
            const total = lyric.endTime - lyric.startTime;
            if (total <= 0) return 0;

            const elapsed = currentTime - lyric.startTime;
            return Math.min(Math.max((elapsed / total) * 100, 0), 100);
        }

        // Fallback für Lyrics ohne endTime
        const nextLyric = lyrics[index + 1];
        if (nextLyric) {
            const total = nextLyric.startTime - lyric.startTime;
            if (total <= 0) return 0;

            const elapsed = currentTime - lyric.startTime;
            return Math.min(Math.max((elapsed / total) * 100, 0), 100);
        }

        // Fallback für letzten Lyric
        const total = 5;
        const elapsed = currentTime - lyric.startTime;
        return Math.min(Math.max((elapsed / total) * 100, 0), 100);
    };

    // Aktuellen Lyric-Index berechnen
    const calculateCurrentLyricIndex = (time) => {
        if (!lyrics || lyrics.length === 0) return -1;

        for (let i = 0; i < lyrics.length; i++) {
            const lyric = lyrics[i];
            if (!lyric || !lyric.hasOwnProperty('startTime')) continue;

            const startTime = parseFloat(lyric.startTime);
            if (isNaN(startTime)) continue;

            const endTime = lyric.hasOwnProperty('endTime') ? parseFloat(lyric.endTime) : null;

            // Fall 1: Mit endTime
            if (endTime !== null && !isNaN(endTime)) {
                if (time >= startTime && time < endTime) {
                    return i;
                }
            }
            // Fall 2: Bis zum nächsten Lyric
            else if (i < lyrics.length - 1) {
                const nextLyric = lyrics[i + 1];
                if (nextLyric && nextLyric.hasOwnProperty('startTime')) {
                    const nextStartTime = parseFloat(nextLyric.startTime);
                    if (!isNaN(nextStartTime) && time >= startTime && time < nextStartTime) {
                        return i;
                    }
                }
            }
            // Fall 3: Letzter Lyric
            else if (i === lyrics.length - 1 && time >= startTime) {
                return i;
            }
        }

        // Spezialfälle - vor erstem oder nach letztem Lyric
        if (lyrics.length > 0) {
            const firstStartTime = parseFloat(lyrics[0].startTime);
            if (!isNaN(firstStartTime) && time < firstStartTime) {
                return -1;
            }

            const lastLyric = lyrics[lyrics.length - 1];
            if (lastLyric && lastLyric.hasOwnProperty('endTime')) {
                const lastEndTime = parseFloat(lastLyric.endTime);
                if (!isNaN(lastEndTime) && time >= lastEndTime) {
                    return -1;
                }
            }
        }

        return -1;
    };

    // Manuelles Scrolling erkennen
    const handleUserScroll = (e) => {
        const container = lyricsDisplayRef?.current || internalLyricsContainerRef.current;
        if (!container) return;

        const currentScrollPosition = container.scrollTop;
        const scrollDifference = Math.abs(currentScrollPosition - lastScrollPositionRef.current);
        const now = Date.now();

        if (scrollDifference > 20 && now - lastScrollTimeRef.current > 300) {
            logDebug(`Manuelles Scrollen erkannt: Differenz ${scrollDifference}px`);
            setManualScrollDetected(true);
            setAutoScrollEnabled(false);

            if (userScrollTimerRef.current) {
                clearTimeout(userScrollTimerRef.current);
            }

            userScrollTimerRef.current = setTimeout(() => {
                logDebug("Auto-Scroll nach Inaktivität wieder aktiviert");
                setManualScrollDetected(false);
                setAutoScrollEnabled(true);
            }, 5000);
        }

        lastScrollTimeRef.current = now;
        lastScrollPositionRef.current = currentScrollPosition;
    };

    // Stabilisierung des currentLyricIndex
    useEffect(() => {
        if (!lyrics || lyrics.length === 0) {
            setStableCurrentIndex(-1);
            return;
        }

        const calculatedIndex = calculateCurrentLyricIndex(currentTime);

        // Prüfen auf Änderungen und Index-Stabilität
        if (calculatedIndex === currentLyricIndex) {
            setStableCurrentIndex(calculatedIndex);
            lastStableIndexRef.current = calculatedIndex;
            return;
        }

        if (currentLyricIndex === lastStableIndexRef.current) {
            return;
        }

        if (calculatedIndex >= 0 && calculatedIndex < lyrics.length) {
            if (indexStabilizationRef.current) {
                clearTimeout(indexStabilizationRef.current);
            }

            indexStabilizationRef.current = setTimeout(() => {
                // Lyric-Wechsel Animation auslösen
                if (lastStableIndexRef.current !== calculatedIndex && lastStableIndexRef.current !== -1) {
                    triggerLyricChangeAnimation();
                }

                setStableCurrentIndex(calculatedIndex);
                lastStableIndexRef.current = calculatedIndex;
                logDebug(`Index stabilisiert: ${calculatedIndex}`);
            }, 100);
        }
        else if (currentLyricIndex >= 0 && currentLyricIndex < lyrics.length) {
            setStableCurrentIndex(currentLyricIndex);
            lastStableIndexRef.current = currentLyricIndex;
        }
        else {
            setStableCurrentIndex(-1);
            lastStableIndexRef.current = -1;
        }
    }, [currentTime, currentLyricIndex, lyrics]);

    // Cleanup für Timer
    useEffect(() => {
        return () => {
            if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            if (indexStabilizationRef.current) clearTimeout(indexStabilizationRef.current);
            if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        };
    }, []);

    // Scroll-Event-Listener
    useEffect(() => {
        const lyricsContainer = lyricsDisplayRef?.current || internalLyricsContainerRef.current;
        if (lyricsContainer) {
            lyricsContainer.addEventListener('scroll', handleUserScroll, { passive: true });
            lyricsContainer.addEventListener('wheel', handleUserScroll, { passive: true });
            lyricsContainer.addEventListener('touchmove', handleUserScroll, { passive: true });

            return () => {
                lyricsContainer.removeEventListener('scroll', handleUserScroll);
                lyricsContainer.removeEventListener('wheel', handleUserScroll);
                lyricsContainer.removeEventListener('touchmove', handleUserScroll);
            };
        }
    }, []);

    // Sichtbare Lyrics aktualisieren
    useEffect(() => {
        if (!lyrics || lyrics.length === 0) return;

        const effectiveIndex = stableCurrentIndex;

        if (effectiveIndex < 0) {
            const initialLyrics = lyrics.slice(0, VISIBLE_RANGE.future + 1).map((lyric, idx) => ({
                ...lyric,
                actualIndex: idx
            }));
            setVisibleLyrics(initialLyrics);
            setShowPastIndicator(false);
            return;
        }

        const startIndex = Math.max(0, effectiveIndex - VISIBLE_RANGE.past);
        const endIndex = Math.min(lyrics.length, effectiveIndex + VISIBLE_RANGE.future + 1);

        const newVisibleLyrics = lyrics.slice(startIndex, endIndex).map((lyric, idx) => ({
            ...lyric,
            actualIndex: startIndex + idx
        }));

        setVisibleLyrics(newVisibleLyrics);
        setShowPastIndicator(startIndex > 0);
    }, [lyrics, stableCurrentIndex, VISIBLE_RANGE.future, VISIBLE_RANGE.past]);

    // Smooth Scrolling zu aktiven Lyrics
    useEffect(() => {
        if (stableCurrentIndex < 0 || !autoScrollEnabled || manualScrollDetected || animatingLyrics) return;

        const container = lyricsDisplayRef?.current || internalLyricsContainerRef.current;
        if (!container) return;

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            const activeLyric = container.querySelector('.lyric-line.active');
            if (!activeLyric) return;

            if (lastActivelyricRef.current === activeLyric) {
                return;
            }

            lastActivelyricRef.current = activeLyric;

            const containerRect = container.getBoundingClientRect();
            const lyricRect = activeLyric.getBoundingClientRect();

            const isFullyVisible = (
                lyricRect.top >= containerRect.top &&
                lyricRect.bottom <= containerRect.bottom
            );

            const isPartiallyVisible = (
                (lyricRect.top < containerRect.top && lyricRect.bottom > containerRect.top) ||
                (lyricRect.bottom > containerRect.bottom && lyricRect.top < containerRect.bottom)
            );

            if (!isFullyVisible) {
                const containerHeight = container.clientHeight;
                const targetPosition = activeLyric.offsetTop - (containerHeight * 0.4);

                container.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 150);
    }, [stableCurrentIndex, autoScrollEnabled, manualScrollDetected, animatingLyrics]);

    // Funktion zum Auslösen von Animationen beim Wechsel der Lyrics
    const triggerLyricChangeAnimation = () => {
        // Verhindern von überlappenden Animationen
        if (animatingLyrics) return;

        // Zufälligen Animationstyp auswählen für Abwechslung
        const animations = ['pulse', 'wave', 'sparkle', 'bounce'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];

        setAnimatingLyrics(true);
        setCurrentAnimation(randomAnimation);

        // Animation nach Abschluss zurücksetzen
        animationTimerRef.current = setTimeout(() => {
            setAnimatingLyrics(false);
            setCurrentAnimation(null);
        }, 1500); // Länger als die Animation dauert
    };

    // Zufällige Partikel für Effekte generieren
    const generateParticles = (count = 20) => {
        return Array.from({ length: count }).map((_, i) => {
            const size = Math.random() * 5 + 2;
            const xPos = Math.random() * 100;
            const yPos = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = Math.random() * 1 + 1;
            return { id: i, size, xPos, yPos, delay, duration };
        });
    };

    // Partikel für die aktive Zeile
    const activeParticles = useRef(generateParticles()).current;

    // Hauptrendering-Funktion
    return (
        <div
            className={`lyrics-display ${animatingLyrics ? `animation-${currentAnimation}` : ''}`}
            ref={(el) => {
                if (lyricsDisplayRef) lyricsDisplayRef.current = el;
                internalLyricsContainerRef.current = el;
            }}
        >
            {/* Debug-Anzeige */}
            {debugMode && (
                <div className="lyrics-debug-panel">
                    <div>Current Time: {currentTime.toFixed(2)}s</div>
                    <div>External Index: {currentLyricIndex}</div>
                    <div>Stable Index: {stableCurrentIndex}</div>
                    <div>Auto-Scroll: {autoScrollEnabled ? 'Aktiv' : 'Aus'}</div>
                    <div>Animation: {animatingLyrics ? currentAnimation : 'keine'}</div>
                </div>
            )}

            {/* Auto-Scroll Button */}
            <div className="auto-scroll-toggle"
                 onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round">
                    {autoScrollEnabled ? (
                        <>
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <polyline points="19 12 12 19 5 12"></polyline>
                        </>
                    ) : (
                        <>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </>
                    )}
                </svg>
            </div>

            {/* Vergangene Lyrics Indikator */}
            {showPastIndicator && (
                <div className="past-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                         strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    <span>Vergangene Zeilen</span>
                </div>
            )}

            {/* Lyrics-Container mit 3D-Perspektive */}
            <div className="visible-lyrics">
                {visibleLyrics.map((lyric) => {
                    const isActive = lyric.actualIndex === stableCurrentIndex;
                    const isPast = lyric.actualIndex < stableCurrentIndex;
                    const isFuture = lyric.actualIndex > stableCurrentIndex;
                    const isTimeRelevant = currentTime >= lyric.startTime &&
                        (lyric.endTime ? currentTime < lyric.endTime : true);
                    const progress = calculateProgress(lyric, lyric.actualIndex);

                    // Position relativ zum aktuellen Lyric bestimmen für 3D-Effekt
                    const positionIndex = lyric.actualIndex - stableCurrentIndex;

                    // Dynamische Klassen
                    const classes = [
                        'lyric-line',
                        isActive ? 'active' : '',
                        isPast ? 'past' : '',
                        isFuture ? 'future' : '',
                        positionIndex === 1 ? 'next-line' : '',
                        positionIndex === -1 ? 'previous-line' : '',
                        debugMode ? 'debug-line' : ''
                    ].filter(Boolean).join(' ');

                    // Distanz vom aktiven Lyric für 3D-Effekt
                    const depthStyle = {
                        transform: isActive
                            ? 'translateZ(20px) scale(1.05)'
                            : `translateZ(${-Math.abs(positionIndex) * 5}px) scale(${1 - Math.abs(positionIndex) * 0.03})`,
                        opacity: isActive
                            ? 1
                            : Math.max(0.3, 1 - Math.abs(positionIndex) * 0.15),
                        filter: isActive
                            ? 'none'
                            : `blur(${Math.abs(positionIndex) * 0.7}px)`
                    };

                    return (
                        <div
                            key={`lyric-${lyric.actualIndex}`}
                            className={classes}
                            style={depthStyle}
                            data-index={lyric.actualIndex}
                        >
                            {/* Partikel-Effekt für aktive Zeile */}
                            {isActive && (
                                <div className="particle-container">
                                    {activeParticles.map(p => (
                                        <div
                                            key={`particle-${p.id}`}
                                            className="particle"
                                            style={{
                                                width: `${p.size}px`,
                                                height: `${p.size}px`,
                                                left: `${p.xPos}%`,
                                                top: `${p.yPos}%`,
                                                animationDelay: `${p.delay}s`,
                                                animationDuration: `${p.duration}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Glühender Hintergrund für aktive Zeile */}
                            {isActive && <div className="active-glow" />}

                            {/* Lyric Text */}
                            <div className="lyric-content">
                                <span className="lyric-text">
                                    {lyric.text}
                                </span>
                            </div>

                            {/* Fortschrittsbalken */}
                            <div
                                className={`lyric-progress-bar ${isActive ? 'active-progress' : ''}`}
                                style={{
                                    width: isTimeRelevant ? `${progress}%` : '0%'
                                }}
                            >
                                {/* Leuchtender Indikator am Ende des Fortschrittsbalkens */}
                                {isActive && progress > 0 && (
                                    <div className="progress-indicator" />
                                )}
                            </div>

                            {/* Prozent-Anzeige */}
                            {isActive && progress > 0 && (
                                <div className="lyric-progress-percent">
                                    {Math.floor(progress)}%
                                </div>
                            )}

                            {/* Debug-Informationen */}
                            {debugMode && (
                                <div className="debug-info">
                                    Zeit: {lyric.startTime.toFixed(2)}s -
                                    {lyric.endTime ? lyric.endTime.toFixed(2) : 'N/A'}s |
                                    Position: {positionIndex} |
                                    Fortschritt: {progress.toFixed(0)}%
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Dynamische Styles für Animationen und Effekte */}
            <style>
                {`
                /* === Basis-Container === */
                .lyrics-display {
                    position: relative;
                    max-height: 20rem;
                    overflow-y: auto !important;
                    padding: 1.5rem;
                    background-color: rgba(44, 46, 59, 0.95);
                    border-radius: 1rem;
                    box-shadow: inset 0 2px 20px rgba(0, 0, 0, 0.3), 
                                0 10px 30px -10px rgba(0, 0, 0, 0.5);
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary) rgba(44, 46, 59, 0.5);
                    transition: all 0.3s ease;
                    perspective: 1000px;
                    transform-style: preserve-3d;
                    backface-visibility: hidden;
                }
                
                /* Scrollbar anpassen */
                .lyrics-display::-webkit-scrollbar {
                    width: 0.375rem;
                }
                
                .lyrics-display::-webkit-scrollbar-track {
                    background: rgba(44, 46, 59, 0.3);
                    border-radius: 9999px;
                }
                
                .lyrics-display::-webkit-scrollbar-thumb {
                    background-color: rgba(139, 92, 246, 0.7);
                    border-radius: 9999px;
                    box-shadow: inset 0 0 5px rgba(139, 92, 246, 0.3);
                }
                
                .lyrics-display::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(139, 92, 246, 0.9);
                }
                
                /* Container für den 3D-Effekt */
                .visible-lyrics {
                    position: relative;
                    transform-style: preserve-3d;
                    perspective: 1200px;
                    transform: translateZ(0);
                }
                
                /* === Lyric Zeilen === */
                .lyric-line {
                    position: relative;
                    border-radius: 1rem;
                    color: var(--text-muted);
                    font-size: 1.125rem;
                    line-height: 1.5;
                    overflow: hidden;
                    margin-bottom: 1rem;
                    transform-style: preserve-3d;
                    transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                    transform-origin: center center;
                    backface-visibility: hidden;
                    background: linear-gradient(
                        135deg, 
                        rgba(40, 42, 55, 0.9),
                        rgba(36, 38, 52, 0.7)
                    );
                    border: 1px solid rgba(60, 62, 80, 0.6);
                    box-shadow: 0 5px 15px -5px rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(5px);
                    padding: 1rem 1.25rem 1.5rem;
                    text-align: center;
                    z-index: 1;
                }

                /* Hover-Effekt für alle Zeilen */
                .lyric-line:hover {
                    transform: translateY(-2px) translateZ(15px) !important;
                    box-shadow: 0 7px 20px -5px rgba(0, 0, 0, 0.3);
                }

                /* Aktive Lyric-Zeile */
                .lyric-line.active {
                    color: white;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    background: linear-gradient(
                        135deg, 
                        rgba(50, 46, 80, 0.9), 
                        rgba(44, 40, 70, 0.8)
                    );
                    border: 2px solid rgba(139, 92, 246, 0.7);
                    box-shadow: 
                        0 0 15px rgba(139, 92, 246, 0.3),
                        0 10px 20px -5px rgba(0, 0, 0, 0.4),
                        inset 0 0 20px rgba(139, 92, 246, 0.1);
                    z-index: 2;
                }

                /* Glühender Hintergrund für aktive Zeile */
                .active-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(
                        circle at center,
                        rgba(139, 92, 246, 0.2) 0%,
                        rgba(139, 92, 246, 0.05) 60%,
                        transparent 100%
                    );
                    animation: pulse-glow 2s infinite alternate;
                    z-index: -1;
                }

                /* Vergangene Lyrics */
                .lyric-line.past {
                    color: rgba(148, 163, 184, 0.7);
                    opacity: 0.7;
                }

                /* Nächste/Vorherige Zeile (direkt benachbart zur aktiven) */
                .lyric-line.next-line,
                .lyric-line.previous-line {
                    color: rgba(255, 255, 255, 0.7);
                    background: linear-gradient(
                        135deg, 
                        rgba(45, 47, 60, 0.8),
                        rgba(40, 42, 55, 0.7)
                    );
                    border: 1px solid rgba(70, 72, 90, 0.5);
                }

                /* Zukünftige Zeilen */
                .lyric-line.future {
                    color: rgba(203, 213, 225, 0.8);
                }

                /* Lyric-Inhalt */
                .lyric-content {
                    position: relative;
                    z-index: 2;
                }

                /* Textformatierung für aktiven Lyric */
                .lyric-line.active .lyric-text {
                    display: inline-block;
                    color: white;
                    font-weight: 700;
                    text-shadow: 
                        0 0 10px rgba(255, 255, 255, 0.7),
                        0 0 20px rgba(139, 92, 246, 0.7);
                    animation: text-pulse 1.5s infinite alternate;
                }

                /* Fortschrittsbalken */
                .lyric-progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 6px;
                    border-radius: 0 3px 3px 0;
                    transition: width 0.2s linear;
                    z-index: 2;
                    background: linear-gradient(
                        90deg, 
                        rgba(139, 92, 246, 0.8), 
                        rgba(124, 58, 237, 0.9)
                    );
                    box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
                }

                /* Aktiver Fortschrittsbalken */
                .lyric-progress-bar.active-progress {
                    height: 8px;
                    background: linear-gradient(
                        90deg, 
                        rgba(139, 92, 246, 1), 
                        rgba(124, 58, 237, 1)
                    );
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.7);
                }

                /* Leuchtender Indikator am Ende des Fortschrittsbalkens */
                .progress-indicator {
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background-color: white;
                    box-shadow: 
                        0 0 5px rgba(255, 255, 255, 0.7),
                        0 0 10px rgba(139, 92, 246, 0.7),
                        0 0 15px rgba(139, 92, 246, 0.5);
                    animation: indicator-pulse 1s infinite alternate;
                }

                /* Prozentanzeige */
                .lyric-progress-percent {
                    position: absolute;
                    right: 10px;
                    bottom: 10px;
                    font-size: 0.75rem;
                    color: white;
                    background: rgba(139, 92, 246, 0.7);
                    padding: 2px 8px;
                    border-radius: 12px;
                    box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
                    z-index: 3;
                    font-weight: bold;
                    animation: percent-fade 1s infinite alternate;
                }

                /* Auto-Scroll Button */
                .auto-scroll-toggle {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 20;
                    background: linear-gradient(
                        135deg,
                        rgba(139, 92, 246, 0.8),
                        rgba(124, 58, 237, 0.7)
                    );
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                    opacity: 0.7;
                }

                .auto-scroll-toggle:hover {
                    transform: scale(1.1);
                    opacity: 1;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
                }

                .auto-scroll-toggle svg {
                    width: 20px;
                    height: 20px;
                    color: white;
                }

                /* Vergangene Lyrics Indikator */
                .past-indicator {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0;
                    color: rgba(148, 163, 184, 0.8);
                    font-size: 0.875rem;
                    background: linear-gradient(
                        180deg, 
                        rgba(44, 46, 59, 0.9), 
                        rgba(44, 46, 59, 0.4)
                    );
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    margin-bottom: 1rem;
                    border-radius: 0.5rem;
                    backdrop-filter: blur(5px);
                    text-align: center;
                    animation: fade-in 0.5s ease;
                }

                .past-indicator svg {
                    animation: float 2s ease infinite;
                }

                /* Debug Panel */
                .lyrics-debug-panel {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(0, 0, 0, 0.7);
                    color: #a78bfa;
                    padding: 8px;
                    border-radius: 8px;
                    font-size: 12px;
                    z-index: 50;
                    font-family: monospace;
                    border: 1px solid rgba(139, 92, 246, 0.5);
                    pointer-events: none;
                }

                /* Partikel-Container und Partikel */
                .particle-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1;
                    overflow: hidden;
                }

                .particle {
                    position: absolute;
                    background: radial-gradient(
                        circle, 
                        rgba(255, 255, 255, 0.9), 
                        rgba(139, 92, 246, 0.6) 70%,
                        transparent 100%
                    );
                    border-radius: 50%;
                    animation: float-particle 3s ease-in-out infinite;
                    z-index: 1;
                    pointer-events: none;
                }

                /* === Animationen === */
                /* Pulsieren für aktiven Text */
                @keyframes text-pulse {
                    0% {
                        text-shadow: 
                            0 0 10px rgba(255, 255, 255, 0.7),
                            0 0 20px rgba(139, 92, 246, 0.6);
                    }
                    100% {
                        text-shadow: 
                            0 0 12px rgba(255, 255, 255, 0.9),
                            0 0 24px rgba(139, 92, 246, 0.8),
                            0 0 30px rgba(139, 92, 246, 0.5);
                    }
                }

                /* Pulsieren für den Hintergrund */
                @keyframes pulse-glow {
                    0% {
                        opacity: 0.5;
                    }
                    100% {
                        opacity: 0.9;
                    }
                }

                /* Pulsieren für den Fortschrittsindikator */
                @keyframes indicator-pulse {
                    0% {
                        transform: translateY(-50%) scale(1);
                        box-shadow: 
                            0 0 5px rgba(255, 255, 255, 0.7),
                            0 0 10px rgba(139, 92, 246, 0.7);
                    }
                    100% {
                        transform: translateY(-50%) scale(1.3);
                        box-shadow: 
                            0 0 8px rgba(255, 255, 255, 0.9),
                            0 0 15px rgba(139, 92, 246, 0.9),
                            0 0 20px rgba(139, 92, 246, 0.7);
                    }
                }

                /* Fade-Animation für Prozentanzeige */
                @keyframes percent-fade {
                    0% {
                        opacity: 0.8;
                    }
                    100% {
                        opacity: 1;
                    }
                }

                /* Schwebende Animation für Partikel */
                @keyframes float-particle {
                    0% {
                        transform: translateY(0) translateX(0) scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: translateY(-20px) translateX(10px) scale(1.2);
                        opacity: 0.6;
                    }
                    100% {
                        transform: translateY(-40px) translateX(-5px) scale(0.8);
                        opacity: 0;
                    }
                }

                /* Schwebende Animation für Indikator */
                @keyframes float {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                    100% { transform: translateY(0); }
                }

                /* Fade-In-Animation */
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                /* === Animations für Lyric-Wechsel === */
                /* Pulse-Animation */
                @keyframes pulse-animation {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                /* Wave-Animation */
                @keyframes wave-animation {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                    100% { transform: translateX(0); }
                }

                /* Sparkle-Animation */
                @keyframes sparkle-animation {
                    0% { filter: brightness(1); }
                    50% { filter: brightness(1.3); }
                    100% { filter: brightness(1); }
                }

                /* Bounce-Animation */
                @keyframes bounce-animation {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0); }
                }

                /* Animation-Klassen anwenden */
                .lyrics-display.animation-pulse .lyric-line.active {
                    animation: pulse-animation 0.5s ease;
                }

                .lyrics-display.animation-wave .lyric-line.active {
                    animation: wave-animation 0.5s ease;
                }

                .lyrics-display.animation-sparkle .lyric-line.active {
                    animation: sparkle-animation 0.5s ease;
                }

                .lyrics-display.animation-bounce .lyric-line.active {
                    animation: bounce-animation 0.5s ease;
                }
                `}
            </style>
        </div>
    );
};

export default LyricsDisplay;