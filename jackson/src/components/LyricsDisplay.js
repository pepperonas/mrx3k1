import React, {useEffect, useRef, useState} from 'react';
import '../Player.css';

const LyricsDisplay = ({lyrics, currentLyricIndex, currentTime, debugMode, lyricsDisplayRef}) => {
    // Anzahl der Zeilen die im Viewport sichtbar sein sollen
    const VISIBLE_RANGE = {
        past: 2,     // Anzahl der vergangenen Lyrics
        future: 10    // Anzahl der zukünftigen Lyrics
    };

    const [visibleLyrics, setVisibleLyrics] = useState([]);
    const [showPastIndicator, setShowPastIndicator] = useState(false);
    // Auto-Scroll standardmäßig aktiviert
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const [manualScrollDetected, setManualScrollDetected] = useState(false);

    // Neue State-Variable für den intern berechneten aktuellen Lyric-Index
    // Dieser wird nur intern verwendet, um Sprünge zu vermeiden
    const [stableCurrentIndex, setStableCurrentIndex] = useState(-1);

    // Interne Ref für das Lyrics-Container-Element
    const internalLyricsContainerRef = useRef(null);
    const userScrollTimerRef = useRef(null);
    const lastScrollTimeRef = useRef(0);
    const lastScrollPositionRef = useRef(0);
    // Ref für den Scroll-Timeout
    const scrollTimeoutRef = useRef(null);
    // Ref für den letzten stabilen Index
    const lastStableIndexRef = useRef(-1);
    // Zeitintervall-Ref für index-Stabilisierung
    const indexStabilizationRef = useRef(null);

    // Log-Funktion für Debugging
    const logDebug = (message, data) => {
        if (debugMode) {
            console.log(`%c[LyricsDisplay] ${message}`, 'background: #334155; color: #a78bfa; padding: 2px 6px; border-radius: 4px;', data || '');
        }
    };

    // Berechne den Fortschritt des aktuellen Lyrics in Prozent
    const calculateProgress = (lyric, index) => {
        if (!currentTime || !lyric) return 0;

        // Prüfe, ob endTime definiert ist
        if (lyric.hasOwnProperty('endTime')) {
            const total = lyric.endTime - lyric.startTime;
            if (total <= 0) return 0; // Verhindere Division durch 0

            const elapsed = currentTime - lyric.startTime;
            return Math.min(Math.max((elapsed / total) * 100, 0), 100);
        }

        // Fallback für alte JSON-Daten ohne endTime
        const nextLyric = lyrics[index + 1];
        if (nextLyric) {
            const total = nextLyric.startTime - lyric.startTime;
            if (total <= 0) return 0; // Verhindere Division durch 0

            const elapsed = currentTime - lyric.startTime;
            return Math.min(Math.max((elapsed / total) * 100, 0), 100);
        }

        // Fallback für letzten Lyric
        const total = 5; // Annahme: 5 Sekunden für den letzten Lyric
        const elapsed = currentTime - lyric.startTime;
        return Math.min(Math.max((elapsed / total) * 100, 0), 100);
    };

    // Verbesserte Funktion zur Berechnung des aktuellen Lyric-Index
    const calculateCurrentLyricIndex = (time) => {
        if (!lyrics || lyrics.length === 0) return -1;

        // Durchlaufe alle Lyrics und finde den passenden für die aktuelle Zeit
        for (let i = 0; i < lyrics.length; i++) {
            const lyric = lyrics[i];

            if (!lyric || !lyric.hasOwnProperty('startTime')) continue;

            // Stelle sicher, dass startTime und endTime numerisch sind
            const startTime = parseFloat(lyric.startTime);
            if (isNaN(startTime)) continue;

            const endTime = lyric.hasOwnProperty('endTime') ? parseFloat(lyric.endTime) : null;

            // Fall 1: Wenn es ein endTime gibt, überprüfe den Bereich
            if (endTime !== null && !isNaN(endTime)) {
                if (time >= startTime && time < endTime) {
                    return i;
                }
            }
            // Fall 2: Wenn es kein endTime gibt, prüfe, ob wir zwischen diesem und dem nächsten liegen
            else if (i < lyrics.length - 1) {
                const nextLyric = lyrics[i + 1];
                if (nextLyric && nextLyric.hasOwnProperty('startTime')) {
                    const nextStartTime = parseFloat(nextLyric.startTime);
                    if (!isNaN(nextStartTime) && time >= startTime && time < nextStartTime) {
                        return i;
                    }
                }
            }
            // Fall 3: Letzter Lyric ohne endTime
            else if (i === lyrics.length - 1 && time >= startTime) {
                return i;
            }
        }

        // Wenn kein passender Lyric gefunden wurde, aber die Zeit nach dem ersten Lyric ist
        if (lyrics.length > 0 && lyrics[0].hasOwnProperty('startTime')) {
            const firstStartTime = parseFloat(lyrics[0].startTime);
            if (!isNaN(firstStartTime)) {
                // Vor dem ersten Lyric
                if (time < firstStartTime) {
                    return -1;
                }
                // Nach dem letzten Lyric
                const lastLyric = lyrics[lyrics.length - 1];
                if (lastLyric && lastLyric.hasOwnProperty('endTime')) {
                    const lastEndTime = parseFloat(lastLyric.endTime);
                    if (!isNaN(lastEndTime) && time >= lastEndTime) {
                        return -1;
                    }
                }
            }
        }

        return -1;
    };

    // Verbesserte Funktion zur Erkennung von manuellem Scrollen
    const handleUserScroll = (e) => {
        // Aktuelle Scroll-Position erfassen
        const container = lyricsDisplayRef?.current || internalLyricsContainerRef.current;
        if (!container) return;

        const currentScrollPosition = container.scrollTop;

        // Überprüfen, ob signifikante Änderung im Vergleich zur letzten Position
        const scrollDifference = Math.abs(currentScrollPosition - lastScrollPositionRef.current);

        // Aktuellen Zeitstempel speichern
        const now = Date.now();

        // Nur als manuellen Scroll erkennen, wenn signifikante Änderung und bestimmter Zeitabstand
        if (scrollDifference > 20 && now - lastScrollTimeRef.current > 300) {
            logDebug(`Manuelles Scrollen erkannt: Differenz ${scrollDifference}px`);
            setManualScrollDetected(true);
            setAutoScrollEnabled(false);

            // Timer zum Zurücksetzen des Auto-Scroll nach 5 Sekunden Inaktivität
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

    // WICHTIG: Stabilisierung des currentLyricIndex
    // Dieser Effekt sorgt dafür, dass kurzfristige Schwankungen im currentLyricIndex
    // abgefangen werden, indem ein interner stableCurrentIndex verwendet wird
    useEffect(() => {
        // Wenn wir keinen aktuellen Index haben, nichts zu tun
        if (!lyrics || lyrics.length === 0) {
            setStableCurrentIndex(-1);
            return;
        }

        // Berechne den internen Index direkt
        const calculatedIndex = calculateCurrentLyricIndex(currentTime);

        // Wenn der berechnete Index mit dem externen Index übereinstimmt, übernehmen wir ihn direkt
        if (calculatedIndex === currentLyricIndex) {
            setStableCurrentIndex(calculatedIndex);
            lastStableIndexRef.current = calculatedIndex;
            return;
        }

        // Sonst prüfen wir:
        // 1. Ist der aktuelle externe Index gleich dem letzten stabilen Index?
        //    Wenn ja, behalten wir ihn bei, um Sprünge zu vermeiden
        if (currentLyricIndex === lastStableIndexRef.current) {
            return;
        }

        // 2. Ist der berechnete Index valide und liegt innerhalb des Bereichs?
        if (calculatedIndex >= 0 && calculatedIndex < lyrics.length) {
            // Wir verwenden eine leichte Verzögerung, um kurze Flackern zu vermeiden
            if (indexStabilizationRef.current) {
                clearTimeout(indexStabilizationRef.current);
            }

            indexStabilizationRef.current = setTimeout(() => {
                setStableCurrentIndex(calculatedIndex);
                lastStableIndexRef.current = calculatedIndex;
                logDebug(`Index stabilisiert: ${calculatedIndex}`);
            }, 100); // Kurze Verzögerung
        }
        // 3. Wenn der externe Index valide ist, übernehmen wir ihn
        else if (currentLyricIndex >= 0 && currentLyricIndex < lyrics.length) {
            setStableCurrentIndex(currentLyricIndex);
            lastStableIndexRef.current = currentLyricIndex;
        }
        // 4. Sonst verwenden wir -1 als Fallback
        else {
            setStableCurrentIndex(-1);
            lastStableIndexRef.current = -1;
        }
    }, [currentTime, currentLyricIndex, lyrics]);

    // Cleanup für Timer
    useEffect(() => {
        return () => {
            if (userScrollTimerRef.current) {
                clearTimeout(userScrollTimerRef.current);
            }
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            if (indexStabilizationRef.current) {
                clearTimeout(indexStabilizationRef.current);
            }
        };
    }, []);

    // Füge Scroll-Event-Listener hinzu und behandle Scrolling
    useEffect(() => {
        // Referenz auf den Container sichern
        const lyricsContainer = lyricsDisplayRef?.current || internalLyricsContainerRef.current;

        if (lyricsContainer) {
            // Event-Listener für Scroll-Events hinzufügen
            lyricsContainer.addEventListener('scroll', handleUserScroll, { passive: true });
            lyricsContainer.addEventListener('wheel', handleUserScroll, { passive: true });
            lyricsContainer.addEventListener('touchmove', handleUserScroll, { passive: true });

            // Bereinigen beim Unmount
            return () => {
                lyricsContainer.removeEventListener('scroll', handleUserScroll);
                lyricsContainer.removeEventListener('wheel', handleUserScroll);
                lyricsContainer.removeEventListener('touchmove', handleUserScroll);
            };
        }
    }, []);

    // Bearbeiten der visibleLyrics basierend auf dem stabilisierten Lyric-Index
    useEffect(() => {
        if (!lyrics || lyrics.length === 0) return;

        // Wir verwenden den stabilen Index statt des externen currentLyricIndex
        const effectiveIndex = stableCurrentIndex;

        // Wenn kein aktueller Lyric ausgewählt ist, zeigen wir die ersten Lyrics an
        if (effectiveIndex < 0) {
            const initialLyrics = lyrics.slice(0, VISIBLE_RANGE.future + 1).map((lyric, idx) => ({
                ...lyric,
                actualIndex: idx
            }));
            setVisibleLyrics(initialLyrics);
            setShowPastIndicator(false);
            return;
        }

        // Bereich der sichtbaren Lyrics berechnen - mehr vergangene Lyrics anzeigen
        const startIndex = Math.max(0, effectiveIndex - VISIBLE_RANGE.past);
        const endIndex = Math.min(lyrics.length, effectiveIndex + VISIBLE_RANGE.future + 1);

        // Sichtbare Lyrics festlegen
        const newVisibleLyrics = lyrics.slice(startIndex, endIndex).map((lyric, idx) => ({
            ...lyric,
            actualIndex: startIndex + idx
        }));

        setVisibleLyrics(newVisibleLyrics);

        // Past-Indikator anzeigen, wenn es vergangene Lyrics gibt, die nicht angezeigt werden
        setShowPastIndicator(startIndex > 0);

    }, [lyrics, stableCurrentIndex, VISIBLE_RANGE.future, VISIBLE_RANGE.past]);

    // VERBESSERTER Scroll-Effekt - stabile Positionierung ohne Sprünge
    useEffect(() => {
        // Frühes Beenden, wenn keine Auto-Scroll Bedingungen erfüllt sind
        if (stableCurrentIndex < 0 || !autoScrollEnabled || manualScrollDetected) return;

        const container = lyricsDisplayRef?.current || internalLyricsContainerRef.current;
        if (!container) return;

        // Eventuelle frühere Timeouts löschen, um Überlappung zu vermeiden
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Verzögerung für DOM-Update und Animation
        scrollTimeoutRef.current = setTimeout(() => {
            // Finde das aktive Lyric-Element
            const activeLyric = container.querySelector('.lyric-line.active');
            if (!activeLyric) return;

            // Berechne die Position des aktiven Lyrics
            const containerRect = container.getBoundingClientRect();
            const lyricRect = activeLyric.getBoundingClientRect();

            // Prüfe ob das Element überhaupt im sichtbaren Bereich ist
            const isVisible = (
                lyricRect.top >= containerRect.top &&
                lyricRect.bottom <= containerRect.bottom
            );

            // Wenn Lyric nicht sichtbar ist oder Index gewechselt hat
            if (!isVisible) {
                logDebug(`Scrolling zu Lyric ${stableCurrentIndex}`, activeLyric.textContent);

                // WICHTIG: Eine feste Position vom Top, damit es keinen Sprung gibt
                // Wir positionieren den aktiven Lyric bei 30% vom oberen Rand
                const targetPosition = activeLyric.offsetTop - (container.clientHeight * 0.3);

                // Smooth scrolling zu der berechneten Position
                container.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 50); // Kurze Verzögerung für DOM-Updates

    }, [stableCurrentIndex, autoScrollEnabled, manualScrollDetected, currentTime]);

    return (
        <div
            className="lyrics-display"
            ref={(el) => {
                // Setze sowohl die externe Ref (falls vorhanden) als auch die interne Ref
                if (lyricsDisplayRef) lyricsDisplayRef.current = el;
                internalLyricsContainerRef.current = el;
            }}
        >
            {debugMode && (
                <div style={{
                    backgroundColor: '#333',
                    padding: '8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    color: '#fff',
                    fontSize: '12px'
                }}>
                    <div>Current Time: {currentTime.toFixed(2)}s</div>
                    <div>External Lyric Index: {currentLyricIndex}</div>
                    <div>Stable Lyric Index: {stableCurrentIndex}</div>
                    <div>Auto-Scroll: {autoScrollEnabled ? 'Aktiv' : 'Deaktiviert'}</div>
                    <div>Manueller Scroll: {manualScrollDetected ? 'Erkannt' : 'Nein'}</div>
                </div>
            )}

            {/* Auto-Scroll Toggle Button */}
            <div className="auto-scroll-toggle"
                 style={{
                     position: 'absolute',
                     top: '10px',
                     right: '10px',
                     zIndex: 10,
                     backgroundColor: autoScrollEnabled ? 'rgba(139, 92, 246, 0.7)' : 'rgba(100, 116, 139, 0.7)',
                     borderRadius: '50%',
                     width: '36px',
                     height: '36px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     cursor: 'pointer',
                     transition: 'all 0.2s ease',
                     boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
                 }}
                 onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                 title={autoScrollEnabled ? "Auto-Scroll deaktivieren" : "Auto-Scroll aktivieren"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round"
                     style={{width: '20px', height: '20px'}}>
                    {autoScrollEnabled ? (
                        // Auto-scroll icon (arrow down with lines)
                        <>
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <polyline points="19 12 12 19 5 12"></polyline>
                        </>
                    ) : (
                        // Locked scroll icon
                        <>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </>
                    )}
                </svg>
            </div>

            {showPastIndicator && (
                <div className="past-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                         viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                         strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    Vergangene Lyrics
                </div>
            )}

            <div className="visible-lyrics">
                {visibleLyrics.map((lyric) => {
                    // Verwende stableCurrentIndex anstelle von currentLyricIndex
                    const isActive = lyric.actualIndex === stableCurrentIndex;
                    const isPast = lyric.actualIndex < stableCurrentIndex;
                    const isTimeRelevant = currentTime >= lyric.startTime &&
                        (lyric.endTime ? currentTime < lyric.endTime : true);
                    const progress = calculateProgress(lyric, lyric.actualIndex);

                    // Bestimme die CSS-Klassen
                    const classes = [
                        'lyric-line',
                        isActive ? 'active' : '',
                        isPast ? 'past' : '',
                        debugMode ? 'debug-line' : ''
                    ].filter(Boolean).join(' ');

                    // Text für das Fortschritts-Label
                    const progressLabel = `${Math.floor(progress)}%`;

                    return (
                        <div
                            key={`lyric-${lyric.actualIndex}`}
                            className={classes}
                            data-index={lyric.actualIndex}
                        >
                            {/* Lyric Text mit eigenem span-Element für die Texthervorhebung */}
                            <span className="lyric-text">
                                {lyric.text}
                            </span>

                            {/* Fortschrittsbalken */}
                            <div
                                className="lyric-progress-bar"
                                style={{
                                    width: isTimeRelevant ? `${progress}%` : '0%'
                                }}
                            />

                            {/* Prozent-Anzeige für Fortschritt */}
                            <div className="lyric-progress-percent">
                                {progressLabel}
                            </div>

                            {/* Debug-Informationen */}
                            {debugMode && (
                                <div className="debug-info">
                                    Zeit: {lyric.startTime.toFixed(2)}s -
                                    {lyric.endTime ? lyric.endTime.toFixed(2) : 'N/A'}s |
                                    Zeit relevant: {isTimeRelevant ? 'JA' : 'NEIN'} |
                                    Fortschritt: {progress.toFixed(0)}% |
                                    Aktiv: {isActive ? 'JA' : 'NEIN'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Zusätzliche Styles für die Texthervorhebung und Scrolling */}
            <style>
                {`
                /* Lyrics-Display Container selbst */
                .lyrics-display {
                    position: relative;
                    max-height: 20rem;
                    overflow-y: auto !important;
                    padding: 1rem;
                    background-color: var(--inner-bg);
                    border-radius: 0.5rem;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
                    scrollbar-width: thin;
                    scrollbar-color: var(--primary) var(--inner-bg);
                }
                
                /* Scroll-Styling */
                .lyrics-display::-webkit-scrollbar {
                    width: 0.375rem;
                }
                
                .lyrics-display::-webkit-scrollbar-track {
                    background: var(--inner-bg);
                    border-radius: 9999px;
                }
                
                .lyrics-display::-webkit-scrollbar-thumb {
                    background-color: var(--primary);
                    border-radius: 9999px;
                }
                
                /* Lyric-Lines */
                .lyric-line {
                    padding: 0.75rem 1rem;
                    margin-bottom: 0.5rem;
                    border-radius: 0.5rem;
                    color: var(--text-muted);
                    font-size: 1.125rem;
                    transition: all 0.3s ease-in-out;
                    background-color: rgba(36, 38, 52, 0.9);
                    position: relative;
                    overflow: hidden;
                    padding-bottom: 16px !important;
                    border-left: 4px solid transparent;
                }
                
                /* Aktiver Lyric - sanftere Transition hinzugefügt */
                .lyric-line.active {
                    background-color: rgba(44, 46, 59, 0.7) !important;
                    border-left: 4px solid #8b5cf6 !important;
                    color: white !important;
                    font-weight: bold;
                    padding-left: 16px !important;
                    transform: scale(1.03);
                    box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
                    /* Sanftere Transition für bessere Animation */
                    transition: transform 0.3s ease-out, 
                                background-color 0.5s ease, 
                                border-left 0.5s ease,
                                padding-left 0.5s ease;
                }
                
                /* Vergangene Lyrics - sanftere Transition */
                .lyric-line.past {
                    color: var(--text-dimmed);
                    opacity: 0.65;
                    transform: scale(0.95);
                    transform-origin: center left;
                    transition: transform 0.5s ease, 
                                opacity 0.5s ease,
                                color 0.5s ease;
                }
                
                /* Intensiver Glow-Effekt für aktiven Lyric-Text */
                .lyric-line.active .lyric-text {
                    color: white !important;  
                    font-weight: bold !important;
                    letter-spacing: 0.05em;
                    text-shadow: 
                        0 0 10px #fff,
                        0 0 20px #fff,
                        0 0 30px #8b5cf6,
                        0 0 40px #8b5cf6,
                        0 0 70px #8b5cf6;
                    animation: textNeonGlow 1.2s infinite alternate;
                    display: inline-block;
                }
                
                @keyframes textNeonGlow {
                    0% {
                        text-shadow: 
                            0 0 10px #fff,
                            0 0 20px #fff,
                            0 0 30px #8b5cf6,
                            0 0 40px #8b5cf6,
                            0 0 70px #8b5cf6;
                    }
                    100% {
                        text-shadow: 
                            0 0 15px #fff,
                            0 0 30px #fff,
                            0 0 40px #8b5cf6,
                            0 0 70px #8b5cf6,
                            0 0 90px #8b5cf6;
                    }
                }
                
                /* Fortschrittsbalken */
                .lyric-progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 8px !important;
                    background: linear-gradient(90deg, #8b5cf6, #3b82f6) !important;
                    border-radius: 0 4px 4px 0;
                    transition: width 0.2s linear;
                    z-index: 10;
                    box-shadow: 0 0 10px rgba(139, 92, 246, 0.7);
                    animation: progress-pulse 2s infinite;
                }
                
                @keyframes progress-pulse {
                    0% {
                        opacity: 0.8;
                        box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
                    }
                    50% {
                        opacity: 1;
                        box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
                    }
                    100% {
                        opacity: 0.8;
                        box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
                    }
                }
                
                /* Prozentanzeige */
                .lyric-progress-percent {
                    position: absolute;
                    right: 8px;
                    bottom: 3px;
                    font-size: 10px;
                    color: white;
                    background-color: rgba(139, 92, 246, 0.6);
                    padding: 1px 6px;
                    border-radius: 10px;
                    box-shadow: 0 0 5px rgba(139, 92, 246, 0.4);
                    z-index: 11;
                }
                
                /* Auto-Scroll Button */
                .auto-scroll-toggle:hover {
                    transform: scale(1.1);
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
                }
                
                .lyrics-display:hover .auto-scroll-toggle {
                    opacity: 0.8;
                }
                
                .lyrics-display .auto-scroll-toggle:hover {
                    opacity: 1;
                }
                
                /* Past Indicator */
                .past-indicator {
                    text-align: center;
                    padding: 8px;
                    color: var(--text-dimmed);
                    font-size: 0.85rem;
                    opacity: 0.7;
                    background: linear-gradient(180deg, var(--inner-bg), transparent);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    margin-bottom: 8px;
                    border-radius: 4px;
                }
                `}
            </style>
        </div>
    );
};

export default LyricsDisplay;