import React, {useCallback, useEffect, useRef, useState} from 'react';
import * as Tone from 'tone';
import '../App.css';
import '../Player.css';
import '../Debug.css';
import LyricsDisplay from './LyricsDisplay';
import PitchVisualizer from './PitchVisualizer'; // PitchVisualizer korrekt importieren
a
const KaraokePlayer = () => {
    const [songData, setSongData] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentPitch, setCurrentPitch] = useState(null);
    const [targetPitch, setTargetPitch] = useState(null);
    const [score, setScore] = useState(0);
    const [pitchHistory, setPitchHistory] = useState([]);
    const [showUpload, setShowUpload] = useState(true);
    const [debugMode, setDebugMode] = useState(false);
    const [currentTargetPitchData, setCurrentTargetPitchData] = useState(null);

    const audioRef = useRef(null);
    const analyser = useRef(null);
    const microphone = useRef(null);
    const lyricsDisplayRef = useRef(null);
    const timeUpdateIntervalRef = useRef(null);
    const firstPlayRef = useRef(true);

    const [visiblePitchData, setVisiblePitchData] = useState([]);
    const [pitchRange, setPitchRange] = useState({min: 40, max: 90});

    const updateDomTime = (time) => {
        const currentTimeElement = document.querySelector('.time-current');
        const totalTimeElement = document.querySelector('.time-total');

        if (currentTimeElement) {
            currentTimeElement.textContent = formatTime(time);
        }

        if (totalTimeElement && audioRef.current) {
            totalTimeElement.textContent = formatTime(audioRef.current.duration || 0);
        }
    };

    // Finde den aktuellen Lyric-Index basierend auf der Zeit
    const findCurrentLyricIndex = (time) => {
        if (!songData || !songData.lyrics || songData.lyrics.length === 0) return -1;

        // Direktes Debug-Logging der Zeitwerte
        if (debugMode) {
            console.log(`Finding lyric index for time: ${time.toFixed(2)}`);
        }

        for (let i = 0; i < songData.lyrics.length; i++) {
            const lyric = songData.lyrics[i];

            // Prüfe zuerst, ob endTime im Lyric definiert ist
            if (lyric.hasOwnProperty('endTime')) {
                // Verwende die explizite endTime für die Prüfung
                if (time >= lyric.startTime && time < lyric.endTime) {
                    if (debugMode) {
                        console.log(`Found lyric index ${i} (${lyric.text}) using endTime: ${lyric.startTime} to ${lyric.endTime}`);
                    }
                    return i;
                }
            } else {
                // Fallback auf die alte Methode (implizites Ende)
                const nextLyric = songData.lyrics[i + 1];
                if (nextLyric) {
                    if (time >= lyric.startTime && time < nextLyric.startTime) {
                        if (debugMode) {
                            console.log(`Found lyric index ${i} (${lyric.text}) using next lyric: ${lyric.startTime} to ${nextLyric.startTime}`);
                        }
                        return i;
                    }
                } else if (time >= lyric.startTime) {
                    // Letzter Lyric
                    if (debugMode) {
                        console.log(`Found last lyric index ${i} (${lyric.text}) starting at ${lyric.startTime}`);
                    }
                    return i;
                }
            }
        }

        // Falls keine passende Lyric gefunden wurde, aber die Zeit > 0 ist:
        // Versuche den letzten vergangenen Lyric zu finden
        if (time > 0) {
            let lastPossibleIndex = -1;
            for (let i = 0; i < songData.lyrics.length; i++) {
                if (time >= songData.lyrics[i].startTime) {
                    lastPossibleIndex = i;
                } else {
                    break; // Keine weiteren Lyrics prüfen, wenn wir schon einen zukünftigen gefunden haben
                }
            }

            if (lastPossibleIndex >= 0) {
                if (debugMode) {
                    console.log(`Using last possible lyric index ${lastPossibleIndex} for time ${time.toFixed(2)}`);
                }
                return lastPossibleIndex;
            }
        }

        if (debugMode) {
            console.log(`No matching lyric found for time ${time.toFixed(2)}`);
        }
        return -1;
    };

    const processPitchData = useCallback(() => {
        if (!songData || !songData.pitchData || songData.pitchData.length === 0) return;

        // Berechne den Bereich der Pitch-Daten für die Visualisierung
        const pitches = songData.pitchData.map(p => p.pitch);
        const minPitch = Math.min(...pitches);
        const maxPitch = Math.max(...pitches);

        // Setze den Pitch-Bereich mit etwas Padding
        setPitchRange({
            min: Math.max(minPitch - 5, 0),
            max: maxPitch + 5
        });

        if (debugMode) {
            console.log(`Pitch-Bereich berechnet: ${minPitch} bis ${maxPitch}`);
        }
    }, [songData, debugMode]);

    // Debug-Funktion, um Probleme zu diagnostizieren
    const debugState = () => {
        console.group("KaraokePlayer Debug Info");
        console.log("Audio Element:", audioRef.current);
        console.log("Current Time:", currentTime);
        console.log("Duration:", duration);
        console.log("Is Playing:", isPlaying);
        console.log("Audio URL exists:", !!audioUrl);
        console.log("Song Data:", songData);
        console.log("Current Lyric Index:", currentLyricIndex);

        if (songData && songData.lyrics) {
            console.log("Lyrics count:", songData.lyrics.length);
            console.log("Current time check:");

            songData.lyrics.forEach((lyric, idx) => {
                const isCurrentByTime = lyric.hasOwnProperty('endTime')
                    ? (currentTime >= lyric.startTime && currentTime < lyric.endTime)
                    : false;

                console.log(
                    `Lyric ${idx}: "${lyric.text.substring(0, 15)}..." - ` +
                    `startTime: ${lyric.startTime} - ` +
                    `endTime: ${lyric.endTime} - ` +
                    `is current: ${isCurrentByTime} - ` +
                    `matches currentLyricIndex: ${idx === currentLyricIndex}`
                );
            });
        }

        console.log("Current Target Pitch Data:", currentTargetPitchData);

        // DOM-Elemente überprüfen
        if (lyricsDisplayRef.current) {
            console.log("Lyrics Display Element:", lyricsDisplayRef.current);
            console.log("Lyric lines:", lyricsDisplayRef.current.querySelectorAll('.lyric-line').length);

            // Aktiven Lyric überprüfen
            const activeLines = lyricsDisplayRef.current.querySelectorAll('.lyric-line.active');
            console.log("Aktive Lyric-Zeilen:", activeLines.length);
            if (activeLines.length > 0) {
                console.log("Aktive Linie:", activeLines[0].textContent);
            }
        }

        console.groupEnd();
    };

    // Handle JSON file upload
    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);
                    console.log("Parsed JSON data:", jsonData);

                    // Format validieren - prüfe auf erwartete Felder
                    if (!jsonData.lyrics || !Array.isArray(jsonData.lyrics) ||
                        !jsonData.pitchData || !Array.isArray(jsonData.pitchData)) {
                        alert("Die JSON-Datei hat nicht das erwartete Format. Überprüfe die Datenstruktur.");
                        return;
                    }

                    // Stelle sicher, dass alle Lyrics ein startTime-Feld haben
                    const validLyrics = jsonData.lyrics.every(lyric =>
                        lyric.hasOwnProperty('text') &&
                        lyric.hasOwnProperty('startTime')
                    );

                    if (!validLyrics) {
                        alert("Die Lyrics in der JSON-Datei haben nicht alle benötigten Felder (text, startTime).");
                        return;
                    }

                    setSongData(jsonData);
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("Fehler beim Parsen der JSON-Datei: " + error.message);
                }
            };
            reader.readAsText(file);
        }
    };

    // Handle audio file upload
    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFile(file);
            const url = URL.createObjectURL(file);
            console.log("Created audio URL:", url);
            setAudioUrl(url);

            // Reset states
            setIsPlaying(false);
            setCurrentTime(0);
            setScore(0);
            setPitchHistory([]);
            setCurrentLyricIndex(-1);
        }
    };

    // Initialize audio element
    useEffect(() => {
        if (audioRef.current && audioUrl) {
            console.log("Audio URL changed, setting up listeners");

            // Wichtig: Speichere eine Referenz zum aktuellen Audio-Element
            const audioElement = audioRef.current;

            // Forciere das erneute Laden
            audioElement.load();

            // Metadaten-Listener
            const handleMetadata = () => {
                console.log("Metadata loaded, duration:", audioElement.duration);
                setDuration(audioElement.duration);
            };

            // Aktualisiere Zeit bei jedem Zeitupdate
            const handleTimeUpdate = () => {
                const newTime = audioElement.currentTime;
                setCurrentTime(newTime);
                updateDomTime(newTime);

                // Finde den aktuellen Lyric basierend auf der Zeit
                const foundIndex = findCurrentLyricIndex(newTime);

                // Setze den aktuellen Lyric-Index
                if (foundIndex !== -1 && foundIndex !== currentLyricIndex) {
                    setCurrentLyricIndex(foundIndex);
                    updateTargetPitch(foundIndex, newTime);
                }

                // Finde passende Pitch-Daten für die aktuelle Zeit
                if (songData && songData.pitchData) {
                    findMatchingPitchData(newTime);
                }

                // Direkt prüfen, ob die aktuelle Zeit einen gültigen Lyric treffen sollte
                const shouldHaveActiveLyric = songData && songData.lyrics && songData.lyrics.some(lyric =>
                    newTime >= lyric.startTime &&
                    (lyric.endTime ? newTime < lyric.endTime : true)
                );

                // Wenn wir einen Lyric haben sollten, aber keinen aktiven index (-1)
                if (shouldHaveActiveLyric && currentLyricIndex === -1) {
                    // Erzwinge ein Update mit dem gefundenen Index
                    console.log(`Zeit ${newTime.toFixed(2)}: Forciere Update von -1 zu ${foundIndex}`);
                    setCurrentLyricIndex(foundIndex);
                    updateTargetPitch(foundIndex, newTime);
                }
            };

            // Höre auf Events
            audioElement.addEventListener('loadedmetadata', handleMetadata);
            audioElement.addEventListener('timeupdate', handleTimeUpdate);
            audioElement.addEventListener('durationchange', handleMetadata);
            audioElement.addEventListener('play', () => console.log("Audio play event"));
            audioElement.addEventListener('error', (e) => console.error("Audio error:", e));

            // Falls das Element bereits geladen ist
            if (audioElement.readyState >= 1) {
                setDuration(audioElement.duration);
            }

            // Cleanup
            return () => {
                audioElement.removeEventListener('loadedmetadata', handleMetadata);
                audioElement.removeEventListener('timeupdate', handleTimeUpdate);
                audioElement.removeEventListener('durationchange', handleMetadata);
                audioElement.removeEventListener('play', () => {
                });
                audioElement.removeEventListener('error', () => {
                });
            };
        }
    }, [audioUrl, songData, currentLyricIndex]);

    useEffect(() => {
        processPitchData();
    }, [songData, processPitchData]);

    // Neue Funktion: Finde den nächstgelegenen Pitch-Datenpunkt für die aktuelle Zeit
    const findMatchingPitchData = (time) => {
        if (!songData || !songData.pitchData || songData.pitchData.length === 0) {
            setCurrentTargetPitchData(null);
            setTargetPitch(null);
            return;
        }

        // Anstatt nach dem genauen Zeitpunkt zu suchen, nehmen wir den nächsten verfügbaren
        // innerhalb eines Toleranzbereichs
        const TOLERANCE = 0.5; // Zeittoleranz in Sekunden

        let closestPitchData = null;
        let minTimeDifference = Infinity;

        // Finde den nächstgelegenen Pitch-Datenpunkt
        for (const pitchData of songData.pitchData) {
            const timeDifference = Math.abs(pitchData.time - time);

            if (timeDifference < minTimeDifference) {
                minTimeDifference = timeDifference;
                closestPitchData = pitchData;
            }
        }

        // Nur verwenden, wenn wir nahe genug sind
        if (minTimeDifference <= TOLERANCE) {
            setCurrentTargetPitchData(closestPitchData);
            setTargetPitch(closestPitchData.pitch);
        } else {
            // Zu weit entfernt, kein gültiger Pitch
            setCurrentTargetPitchData(null);
            setTargetPitch(null);
        }
    };

    // Separate Funktion für Pitch-Target-Updates
    const updateTargetPitch = (lyricIndex, time) => {
        if (!songData || !songData.lyrics || lyricIndex === -1) {
            // Wenn kein Lyric ausgewählt ist, versuche direkt Pitch-Daten zu finden
            findMatchingPitchData(time);
            return;
        }

        const currentLyric = songData.lyrics[lyricIndex];

        // Wenn Lyric individuell pitchTargets hat (nicht im vorliegenden JSON)
        if (currentLyric.pitchTargets && currentLyric.pitchTargets.length > 0) {
            const relativeTime = time - currentLyric.startTime;
            let closestTarget = currentLyric.pitchTargets[0];
            let minDiff = Math.abs(relativeTime - closestTarget.time);

            for (let i = 1; i < currentLyric.pitchTargets.length; i++) {
                const target = currentLyric.pitchTargets[i];
                const diff = Math.abs(relativeTime - target.time);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestTarget = target;
                }
            }

            // Nur aktualisieren, wenn wir nahe genug am Target sind
            if (minDiff < 0.5) {
                setTargetPitch(closestTarget.pitch);
            } else {
                // Sonst versuche globale Pitch-Daten zu finden
                findMatchingPitchData(time);
            }
        } else {
            // Keine lyric-spezifischen Pitch-Targets, verwende globale Pitch-Daten
            findMatchingPitchData(time);
        }
    };

    // Play/pause audio
    const togglePlayback = async () => {
        if (audioRef.current) {
            try {
                if (debugMode) {
                    debugState();
                }

                // Starte Tone.js nur beim ersten Klick
                if (firstPlayRef.current) {
                    await Tone.start();
                    console.log('Tone.js context started successfully');
                    firstPlayRef.current = false;
                }

                if (isPlaying) {
                    console.log("Pausing audio");
                    audioRef.current.pause();
                } else {
                    console.log("Starting audio playback");
                    try {
                        // WICHTIG: Setze currentTime auf einen kleinen Wert größer als 0,
                        // falls die Zeit 0 ist, um timeupdate-Events zu triggern
                        if (audioRef.current.currentTime === 0) {
                            audioRef.current.currentTime = 0.01;
                        }

                        // Versuche abzuspielen
                        const playPromise = audioRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise
                                .then(() => console.log("Audio playback started successfully"))
                                .catch(error => {
                                    console.error('Error playing audio:', error);
                                    alert("Fehler beim Abspielen der Audio-Datei: " + error.message);
                                });
                        }

                        if (!isAnalyzing) {
                            startPitchAnalysis();
                        }
                    } catch (error) {
                        console.error('Error during play attempt:', error);
                        alert("Fehler beim Abspielen: " + error.message);
                    }
                }
                setIsPlaying(!isPlaying);
            } catch (err) {
                console.error('Failed to start audio context:', err);
                alert("Fehler beim Starten des Audio-Kontexts: " + err.message);
            }
        } else {
            console.error("Audio reference is not available");
            alert("Audio-Element nicht verfügbar");
        }
    };

    // Detect pitch from frequency data
    const detectPitch = (frequencyData) => {
        // Simple implementation - find the dominant frequency
        let maxIndex = 0;
        let maxValue = 0;

        for (let i = 0; i < frequencyData.length; i++) {
            if (frequencyData[i] > maxValue) {
                maxValue = frequencyData[i];
                maxIndex = i;
            }
        }

        // Convert FFT bin index to frequency
        const nyquist = 22050; // Half the sample rate
        const frequency = maxIndex * nyquist / frequencyData.length;

        // Only return if we have a significant peak
        if (maxValue > 100) {
            // Convert frequency to MIDI note number
            // f = 440 * 2^((n-69)/12)
            // n = 12 * log2(f/440) + 69
            const noteNumber = 12 * Math.log2(frequency / 440) + 69;
            return Math.round(noteNumber);
        }

        return null;
    };

    // Start pitch analysis
    const startPitchAnalysis = async () => {
        setIsAnalyzing(true);

        try {
            // Tone.js wird bereits in togglePlayback initialisiert

            microphone.current = new Tone.UserMedia();
            await microphone.current.open();
            console.log("Microphone access granted");

            analyser.current = new Tone.Analyser('fft', 1024);
            microphone.current.connect(analyser.current);

            const analyzeInterval = setInterval(() => {
                if (analyser.current) {
                    const frequencyData = analyser.current.getValue();
                    const pitch = detectPitch(frequencyData);

                    if (pitch) {
                        setCurrentPitch(pitch);

                        // Update pitch history for visualization
                        setPitchHistory(prev => {
                            const newHistory = [...prev, {time: currentTime, pitch}];
                            // Keep only the last 100 pitch values
                            if (newHistory.length > 100) {
                                return newHistory.slice(newHistory.length - 100);
                            }
                            return newHistory;
                        });

                        // Update score based on target pitch
                        if (targetPitch) {
                            const pitchDifference = Math.abs(pitch - targetPitch);
                            if (pitchDifference <= 2) {
                                // Perfect match
                                setScore(prev => prev + 10);
                            } else if (pitchDifference <= 4) {
                                // Good match
                                setScore(prev => prev + 5);
                            } else if (pitchDifference <= 7) {
                                // Okay match
                                setScore(prev => prev + 2);
                            }
                        }
                    }
                }
            }, 100);

            timeUpdateIntervalRef.current = analyzeInterval;

            return () => {
                if (timeUpdateIntervalRef.current) {
                    clearInterval(timeUpdateIntervalRef.current);
                }
                if (microphone.current) {
                    microphone.current.close();
                }
            };
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setIsAnalyzing(false);
        }
    };

    // Stop pitch analysis
    const stopPitchAnalysis = () => {
        setIsAnalyzing(false);
        if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
        }
        if (microphone.current) {
            microphone.current.close();
        }
    };

    // Get accuracy color based on pitch difference
    const getAccuracyColor = () => {
        if (!currentPitch || !targetPitch) return '#6B7280'; // Gray

        const difference = Math.abs(currentPitch - targetPitch);

        if (difference <= 2) return '#10B981'; // Green - perfect
        if (difference <= 4) return '#FBBF24'; // Yellow - good
        if (difference <= 7) return '#F59E0B'; // Orange - okay
        return '#EF4444'; // Red - off
    };

    // Format time as MM:SS
    const formatTime = (time) => {
        if (isNaN(time) || time === undefined) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Start the game (hide uploads and show player)
    const startGame = async () => {
        if (songData && audioUrl) {
            try {
                await Tone.start();
                console.log('Tone.js context started successfully');
                firstPlayRef.current = false;
            } catch (err) {
                console.error('Failed to start Tone.js context:', err);
            }
            setShowUpload(false);
        } else {
            alert("Bitte lade sowohl eine JSON-Datei als auch eine Audio-Datei hoch");
        }
    };

    // Reset the game
    const resetGame = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setShowUpload(true);
        setIsPlaying(false);
        setCurrentTime(0);
        setScore(0);
        setPitchHistory([]);
        setCurrentLyricIndex(-1);
        stopPitchAnalysis();
    };

    // Seek audio to specific position when clicking progress bar
    const handleProgressClick = (e) => {
        if (audioRef.current && duration > 0) {
            const container = e.currentTarget;
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const newTime = percentage * duration;

            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);

            console.log(`Seek to time: ${newTime.toFixed(2)}`);
        }
    };

    return (
        <div className="app-container">
            <main className="app-main">
                {showUpload ? (
                    <section className="card">
                        <h2 className="card-title">
                            <span className="card-number">1</span>
                            Dateien hochladen
                        </h2>

                        <div className="upload-container">
                            <label className="file-upload">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <path
                                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <p className="file-upload-text">{songData ? 'JSON geladen: ' + songData.songName : 'JSON Datei auswählen'}</p>
                                <p className="file-upload-hint">{!songData && '(Mit dem jsong Generator erstellt)'}</p>
                                <input
                                    type="file"
                                    accept="application/json"
                                    onChange={handleJsonUpload}
                                />
                            </label>
                            <label className="file-upload">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18V5l12-2v13"></path>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <circle cx="18" cy="16" r="3"></circle>
                                </svg>
                                <p className="file-upload-text">{audioFile ? audioFile.name : 'MP3 Datei auswählen'}</p>
                                <p className="file-upload-hint">{!audioFile && '(Passend zur JSON Datei)'}</p>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleAudioUpload}
                                />
                            </label>
                        </div>

                        <div className="start-container">
                            <button
                                onClick={startGame}
                                className={`btn ${songData && audioUrl ? 'btn-success' : 'btn-disabled'}`}
                                disabled={!songData || !audioUrl}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Spiel starten
                            </button>
                        </div>

                        <div className="debug-container">
                            <label className="debug-checkbox">
                                <input
                                    type="checkbox"
                                    checked={debugMode}
                                    onChange={() => setDebugMode(!debugMode)}
                                />
                                Debug-Modus
                            </label>
                        </div>
                    </section>
                ) : (
                    <>
                        {/* Karaoke Player UI */}
                        <section className="card player-card">
                            <div className="player-header">
                                <div className="song-info">
                                    <h2 className="song-title">{songData.songName}</h2>
                                    <div className="player-score">
                                        <span className="score-label">Punkte:</span>
                                        <span className="score-value">{score}</span>
                                    </div>
                                </div>

                                <div style={{display: 'flex', gap: '8px'}}>
                                    <button
                                        onClick={resetGame}
                                        className="btn btn-small btn-outline"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                             fill="none" stroke="currentColor" strokeWidth="2"
                                             strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2.5 2v6h6M21.5 22v-6h-6"></path>
                                            <path d="M22 11.5A10 10 0 0 0 3 9"></path>
                                            <path d="M2 13a10 10 0 0 0 18.5 3"></path>
                                        </svg>
                                        Neues Lied
                                    </button>

                                    {debugMode && (
                                        <button
                                            onClick={debugState}
                                            className="btn btn-small btn-outline debug-button"
                                        >
                                            Debug
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="player-controls">
                                <button
                                    onClick={togglePlayback}
                                    className={`btn ${isPlaying ? 'btn-error' : 'btn-primary'} btn-large`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2"
                                         strokeLinecap="round" strokeLinejoin="round">
                                        {isPlaying ? (
                                            <rect x="6" y="4" width="4" height="16"></rect>
                                        ) : (
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        )}
                                    </svg>
                                    {isPlaying ? "Pause" : "Play"}
                                </button>

                                <div className="audio-player-time">
                                    <span className="time-current">{formatTime(currentTime)}</span>
                                    <span className="time-separator">/</span>
                                    <span className="time-total">{formatTime(duration)}</span>
                                </div>
                            </div>

                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                preload="auto"
                                crossOrigin="anonymous"
                                // Inline Event-Handler für zusätzliche Sicherheit
                                onTimeUpdate={(e) => {
                                    const time = e.target.currentTime;
                                    updateDomTime(time);
                                    setCurrentTime(e.target.currentTime);
                                    console.log("Time update direct:", time);
                                }}
                                onDurationChange={(e) => {
                                    const duration = e.target.duration;
                                    const totalTimeElement = document.querySelector('.time-total');
                                    if (totalTimeElement) {
                                        totalTimeElement.textContent = formatTime(duration);
                                    }
                                    setDuration(duration);
                                }}
                                onPlay={() => console.log("Play event")}
                                onError={(e) => console.error("Audio error event:", e)}
                            />

                            <div
                                className="progress-container"
                                onClick={handleProgressClick}
                            >
                                <div
                                    className="progress-bar"
                                    style={{width: `${(currentTime / Math.max(duration, 0.01)) * 100}%`}}
                                />
                                <div
                                    className="progress-handle"
                                    style={{left: `${(currentTime / Math.max(duration, 0.01)) * 100}%`}}
                                />
                            </div>
                        </section>

                        {/* Lyrics and Pitch Display */}
                        <div className="karaoke-container">
                            <section className="card lyrics-card">
                                <h2 className="card-title">
                                    <span className="card-number">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                             fill="none" stroke="currentColor" strokeWidth="2"
                                             strokeLinecap="round" strokeLinejoin="round">
                                            <path
                                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </span>
                                    Lyrics
                                </h2>

                                {songData && songData.lyrics && (
                                    <LyricsDisplay
                                        lyrics={songData.lyrics}
                                        currentLyricIndex={currentLyricIndex}
                                        currentTime={currentTime}
                                        debugMode={debugMode}
                                        lyricsDisplayRef={lyricsDisplayRef}
                                    />
                                )}
                            </section>

                            <section className="card pitch-card">
                                <h2 className="card-title">
    <span className="card-number">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" strokeWidth="2"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="18" cy="16" r="3"></circle>
      </svg>
    </span>
                                    Pitch Visualisierung
                                </h2>

                                {/* Neue PitchVisualizer-Komponente */}
                                <PitchVisualizer
                                    songData={songData}
                                    currentTime={currentTime}
                                    currentPitch={currentPitch}
                                    targetPitch={targetPitch}
                                    pitchHistory={pitchHistory}
                                    debugMode={debugMode}
                                />

                                {/* Bestehende Pitch-Statistiken */}
                                <div className="pitch-display">
                                    <div className="pitch-stats">
                                        <div className="pitch-stat-item">
                                            <span className="pitch-stat-label">Dein Pitch:</span>
                                            <span className="pitch-stat-value"
                                                  style={{color: getAccuracyColor()}}>
          {currentPitch || '-'}
        </span>
                                        </div>
                                        <div className="pitch-stat-item">
                                            <span className="pitch-stat-label">Ziel Pitch:</span>
                                            <span className="pitch-stat-value">
          {targetPitch || '-'}
        </span>
                                        </div>
                                        <div className="pitch-accuracy"
                                             style={{backgroundColor: getAccuracyColor()}}>
                                            {currentPitch && targetPitch ? (
                                                Math.abs(currentPitch - targetPitch) <= 2 ? 'Perfekt!' :
                                                    Math.abs(currentPitch - targetPitch) <= 4 ? 'Gut!' :
                                                        Math.abs(currentPitch - targetPitch) <= 7 ? 'Okay' : 'Daneben'
                                            ) : 'Singe!'}
                                        </div>
                                    </div>
                                </div>

                                {/* Debug-Informationen wenn im Debug-Modus */}
                                {debugMode && (
                                    <div className="debug-container" style={{
                                        marginTop: '1rem',
                                        padding: '0.5rem',
                                        backgroundColor: 'var(--inner-bg)',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.75rem'
                                    }}>
                                        <div>Pitch
                                            Bereich: {pitchRange.min} bis {pitchRange.max}</div>
                                        <div>Datenpunkte
                                            gesamt: {songData?.pitchData?.length || 0}</div>
                                        <div>Aktuelle Zeit: {currentTime.toFixed(2)}s</div>
                                        <div>Target Pitch
                                            Daten: {JSON.stringify(currentTargetPitchData)}</div>
                                    </div>
                                )}
                            </section>
                        </div>
                    </>
                )}
            </main>
            <footer className="app-footer">
                jsong Karaoke Player | Made with ❤️ by Martin Pfeffer
            </footer>
        </div>
    );
};

export default KaraokePlayer;