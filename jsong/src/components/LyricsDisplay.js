import React, { useEffect, useState, useRef } from 'react';

const LyricsDisplay = ({ lyrics, currentLyricIndex, currentTime, debugMode, lyricsDisplayRef }) => {
    // Anzahl der Zeilen die im Viewport sichtbar sein sollen
    const VISIBLE_RANGE = {
        past: 2,     // Anzahl der vergangenen Lyrics
        future: 4    // Anzahl der zukünftigen Lyrics
    };

    const [visibleLyrics, setVisibleLyrics] = useState([]);
    const [showPastIndicator, setShowPastIndicator] = useState(false);
    const [removingLyrics, setRemovingLyrics] = useState([]);
    const [prevLyricIndex, setPrevLyricIndex] = useState(-1);

    // Ref für Timeout-Cleanup und Animation-Tracking
    const timeoutsRef = useRef([]);
    const animationStateRef = useRef({
        isAnimating: false,
        lastUpdate: Date.now()
    });

    // Bereinige Timeouts bei Unmount
    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    // Log-Funktion für Debugging
    const logDebug = (message, data) => {
        if (debugMode) {
            console.log(`%c[LyricsDisplay] ${message}`, 'background: #334155; color: #a78bfa; padding: 2px 6px; border-radius: 4px;', data || '');
        }
    };

    // DEBUGGING: Direktes Logging der aktuellen Zeit
    useEffect(() => {
        if (debugMode) {
            console.log(`Current Time: ${currentTime}, Current Index: ${currentLyricIndex}`);

            if (lyrics && lyrics.length > 0) {
                lyrics.forEach((lyric, index) => {
                    const isRelevant = currentTime >= lyric.startTime &&
                        (lyric.endTime ? currentTime < lyric.endTime : true);
                    if (isRelevant) {
                        console.log(`Relevant Lyric [${index}]: "${lyric.text}" - Progress: ${calculateProgress(lyric, index).toFixed(1)}%`);
                    }
                });
            }
        }
    }, [currentTime, lyrics, debugMode, currentLyricIndex]);

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

    useEffect(() => {
        if (!lyrics || lyrics.length === 0) return;

        const now = Date.now();
        const timeSinceLastUpdate = now - animationStateRef.current.lastUpdate;

        logDebug(`useEffect triggered: currentLyricIndex=${currentLyricIndex}, prevLyricIndex=${prevLyricIndex}, timeSince=${timeSinceLastUpdate}ms`);

        // Setze den Timer-Status
        animationStateRef.current = {
            isAnimating: true,
            lastUpdate: now
        };

        // Wenn es einen Wechsel zu einem höheren Index gab, prüfe auf zu entfernende Lyrics
        if (currentLyricIndex > prevLyricIndex) {
            // Berechne vorherigen sichtbaren Bereich
            const prevStartIndex = Math.max(0, prevLyricIndex - VISIBLE_RANGE.past);
            const newStartIndex = Math.max(0, currentLyricIndex - VISIBLE_RANGE.past);

            // Finde Lyrics, die verschwinden sollen
            if (newStartIndex > prevStartIndex) {
                const lyricsToRemove = lyrics.slice(prevStartIndex, newStartIndex).map(lyric => ({
                    ...lyric,
                    actualIndex: lyrics.indexOf(lyric),
                    removing: true
                }));

                if (lyricsToRemove.length > 0) {
                    logDebug(`Adding ${lyricsToRemove.length} lyrics to removal animation`, lyricsToRemove);

                    // Füge die zu entfernenden Lyrics dem State hinzu
                    setRemovingLyrics(prev => {
                        const newRemovingLyrics = [...prev, ...lyricsToRemove];
                        logDebug(`New removingLyrics state:`, newRemovingLyrics);
                        return newRemovingLyrics;
                    });

                    // Setze Timeout, um sie später zu entfernen
                    const timeoutId = setTimeout(() => {
                        logDebug(`Timeout triggered: Removing animated lyrics`);
                        setRemovingLyrics(prev => {
                            const filtered = prev.filter(item =>
                                !lyricsToRemove.some(lyric => lyric.actualIndex === item.actualIndex)
                            );
                            logDebug(`Filtered removingLyrics:`, filtered);
                            return filtered;
                        });

                        animationStateRef.current.isAnimating = false;
                    }, 500); // Entspricht der Animation-Dauer

                    timeoutsRef.current.push(timeoutId);
                }
            }
        }

        // Aktualisiere den vorherigen Index
        setPrevLyricIndex(currentLyricIndex);

        // Wenn kein aktueller Lyric ausgewählt ist, zeigen wir die ersten Lyrics an
        if (currentLyricIndex < 0) {
            setVisibleLyrics(lyrics.slice(0, VISIBLE_RANGE.future + 1).map(lyric => ({
                ...lyric,
                actualIndex: lyrics.indexOf(lyric),
                animation: 'incoming'
            })));
            setShowPastIndicator(false);
            return;
        }

        // Bereich der sichtbaren Lyrics berechnen
        let startIndex = Math.max(0, currentLyricIndex - VISIBLE_RANGE.past);
        let endIndex = Math.min(lyrics.length, currentLyricIndex + VISIBLE_RANGE.future + 1);

        // Sichtbare Lyrics festlegen mit Animation-Markierungen
        const newVisibleLyrics = lyrics.slice(startIndex, endIndex).map((lyric, idx) => {
            const actualIndex = startIndex + idx;

            // Bestimme Animation-Typ
            let animation = '';
            if (actualIndex === currentLyricIndex && currentLyricIndex !== prevLyricIndex) {
                animation = 'incoming';
            }

            // Kopie des Lyrics mit zusätzlichen Eigenschaften
            return {
                ...lyric,
                animation,
                actualIndex
            };
        });

        logDebug(`Setting visibleLyrics:`, newVisibleLyrics);
        setVisibleLyrics(newVisibleLyrics);

        // Past-Indikator anzeigen, wenn es vergangene Lyrics gibt, die nicht angezeigt werden
        setShowPastIndicator(startIndex > 0);

    }, [lyrics, currentLyricIndex, prevLyricIndex, VISIBLE_RANGE.future, VISIBLE_RANGE.past, debugMode, currentTime]);

    useEffect(() => {
        // Zum aktiven Lyric scrollen
        if (lyricsDisplayRef.current) {
            const activeLyric = lyricsDisplayRef.current.querySelector('.lyric-line.active');
            if (activeLyric) {
                logDebug(`Scrolling to active lyric: ${activeLyric.textContent.trim()}`);
                activeLyric.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [visibleLyrics, debugMode]);

    // Alle anzuzeigenden Lyrics (inkl. der animiert verschwindenden)
    const allDisplayedLyrics = [...removingLyrics, ...visibleLyrics];

    // Sortiere nach Index für korrekte Reihenfolge und entferne Duplikate
    const uniqueDisplayedLyrics = allDisplayedLyrics
        .filter((lyric, index, self) =>
            index === self.findIndex((t) => t.actualIndex === lyric.actualIndex)
        )
        .sort((a, b) => a.actualIndex - b.actualIndex);

    return (
        <div className="lyrics-display" ref={lyricsDisplayRef}>
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
                    <div>Current Lyric Index: {currentLyricIndex}</div>
                </div>
            )}

            {showPastIndicator && (
                <div className="past-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    Vergangene Lyrics
                </div>
            )}

            <div className="visible-lyrics">
                {uniqueDisplayedLyrics.map((lyric) => {
                    const isActive = lyric.actualIndex === currentLyricIndex;
                    const isPast = lyric.actualIndex < currentLyricIndex;
                    const isTimeRelevant = currentTime >= lyric.startTime &&
                        (lyric.endTime ? currentTime < lyric.endTime : true);
                    const progress = calculateProgress(lyric, lyric.actualIndex);

                    // Bestimme die CSS-Klassen
                    const classes = [
                        'lyric-line',
                        isActive ? 'active' : '',
                        isPast ? 'past' : '',
                        debugMode ? 'debug-line' : '',
                        lyric.animation || '',
                        lyric.removing ? 'removing' : ''
                    ].filter(Boolean).join(' ');

                    // Text für das Fortschritts-Label
                    const progressLabel = `${Math.floor(progress)}%`;

                    return (
                        <div
                            key={`lyric-${lyric.actualIndex}-${lyric.removing ? 'removing' : 'normal'}`}
                            className={classes}
                            data-index={lyric.actualIndex}
                            data-status={lyric.removing ? 'removing' : (lyric.animation || 'normal')}
                            style={{
                                position: 'relative',
                                overflow: 'hidden',
                                borderWidth: isTimeRelevant ? '1px' : '0',
                                borderStyle: 'solid',
                                borderColor: isTimeRelevant ? 'red' : 'transparent'
                            }}
                        >
                            {/* Lyric Text */}
                            {lyric.text}

                            {/* IMMER einen Fortschrittsbalken zeigen, für Testzwecke */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    height: '15px',
                                    width: isTimeRelevant ? `${progress}%` : '0%',
                                    backgroundColor: 'red',
                                    transition: 'width 0.2s linear',
                                    zIndex: 9999,
                                    borderRight: '2px solid white'
                                }}
                            />

                            {/* Prozent-Anzeige immer sichtbar machen */}
                            <div style={{
                                position: 'absolute',
                                right: '10px',
                                bottom: '5px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: 'white',
                                background: 'black',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                zIndex: 10000
                            }}>
                                {progressLabel}
                            </div>

                            {/* Debug-Informationen */}
                            {debugMode && (
                                <div style={{
                                    marginTop: '8px',
                                    fontSize: '10px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    padding: '4px',
                                    borderRadius: '4px'
                                }}>
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
        </div>
    );
};

export default LyricsDisplay;