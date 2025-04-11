import React, { useEffect, useState, useRef } from 'react';

const LyricsDisplay = ({ lyrics, currentLyricIndex, debugMode, lyricsDisplayRef }) => {
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

    }, [lyrics, currentLyricIndex, prevLyricIndex, VISIBLE_RANGE.future, VISIBLE_RANGE.past, debugMode]);

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

    // Debug: Überprüfe styles und CSS
    useEffect(() => {
        if (debugMode) {
            // Gib einen Hinweis aus, wenn wir animierte Elemente haben
            if (removingLyrics.length > 0) {
                console.log('%c[Style Check] Lyrics mit removing-Klasse:', 'background: #334155; color: #ef4444; padding: 2px 6px; border-radius: 4px;',
                    removingLyrics.map(l => l.text)
                );

                // Prüfe, ob die CSS-Animation-Klasse existiert
                const styleSheets = document.styleSheets;
                let animationFound = false;

                for (let i = 0; i < styleSheets.length; i++) {
                    try {
                        const rules = styleSheets[i].cssRules || styleSheets[i].rules;
                        for (let j = 0; j < rules.length; j++) {
                            if (rules[j].type === CSSRule.KEYFRAMES_RULE && rules[j].name === 'slideOutUp') {
                                animationFound = true;
                                console.log('%c[Style Check] Animation slideOutUp gefunden!', 'background: #334155; color: #10b981; padding: 2px 6px; border-radius: 4px;');
                                break;
                            }
                        }
                        if (animationFound) break;
                    } catch (e) {
                        // Sicherheitsregeln können Zugriff auf einige externe Stylesheets verhindern
                    }
                }

                if (!animationFound) {
                    console.warn('%c[Style Check] Animation slideOutUp wurde NICHT gefunden! CSS-Datei möglicherweise nicht geladen.',
                        'background: #334155; color: #f59e0b; padding: 2px 6px; border-radius: 4px;'
                    );
                }

                // Füge temporär eine Inline-Animation hinzu, falls die CSS fehlt
                const removeEl = document.querySelector('.lyric-line.removing');
                if (removeEl && !animationFound) {
                    removeEl.style.animation = 'none'; // Deaktiviere potenzielle fehlerhafte Animation
                    removeEl.style.transition = 'all 0.5s ease';
                    removeEl.style.opacity = '0';
                    removeEl.style.transform = 'translateY(-20px)';
                    removeEl.style.maxHeight = '0';
                    removeEl.style.overflow = 'hidden';
                    removeEl.style.marginBottom = '0';
                    removeEl.style.padding = '0 1rem';
                }
            }
        }
    }, [removingLyrics, debugMode]);

    return (
        <div className="lyrics-display" ref={lyricsDisplayRef}>
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

                    // Bestimme die CSS-Klassen
                    const classes = [
                        'lyric-line',
                        isActive ? 'active' : '',
                        isPast ? 'past' : '',
                        debugMode ? 'debug-line' : '',
                        lyric.animation || '',
                        lyric.removing ? 'removing' : ''
                    ].filter(Boolean).join(' ');

                    // Inline-Styles für den Notfall, falls CSS nicht funktioniert
                    const inlineStyles = lyric.removing && !debugMode ? {
                        animation: 'slideOutUp 0.5s forwards'
                    } : {};

                    return (
                        <div
                            key={`lyric-${lyric.actualIndex}-${lyric.removing ? 'removing' : 'normal'}`}
                            className={classes}
                            style={inlineStyles}
                            data-index={lyric.actualIndex}
                            data-status={lyric.removing ? 'removing' : (lyric.animation || 'normal')}
                        >
                            {lyric.text}
                            {debugMode && (
                                <div className="debug-info">
                                    Zeit: {lyric.startTime.toFixed(2)}s |
                                    Index: {lyric.actualIndex} |
                                    Aktiv: {isActive ? 'Ja' : 'Nein'} |
                                    Status: {lyric.removing ? 'Wird entfernt' : (lyric.animation || 'Normal')}
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