import React, {useEffect, useRef, useState} from 'react';
import * as Tone from 'tone';
import '../App.css';
import '../Player.css';
import '../Debug.css';
import LyricsDisplay from './LyricsDisplay';

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
    const [debugMode, setDebugMode] = useState(true);

    const audioRef = useRef(null);
    const analyser = useRef(null);
    const microphone = useRef(null);
    const lyricsDisplayRef = useRef(null);
    const timeUpdateIntervalRef = useRef(null);
    const firstPlayRef = useRef(true);

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
                const nextLyric = songData.lyrics[idx + 1];
                const isCurrentByTime = nextLyric
                    ? (currentTime >= lyric.startTime && currentTime < nextLyric.startTime)
                    : (currentTime >= lyric.startTime);

                console.log(
                    `Lyric ${idx}: "${lyric.text.substring(0, 15)}..." - ` +
                    `startTime: ${lyric.startTime} - ` +
                    `is current: ${isCurrentByTime} - ` +
                    `matches currentLyricIndex: ${idx === currentLyricIndex}`
                );
            });
        }

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
                    setSongData(jsonData);
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("Fehler beim Parsen der JSON-Datei");
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
            const foundIndex = findCurrentLyricIndex(newTime);

// Direkt prüfen, ob die aktuelle Zeit einen gültigen Lyric treffen sollte
            const shouldHaveActiveLyric = songData.lyrics.some(lyric =>
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
    }, [audioUrl, songData]);

    const generateJson = () => {
        // Sortiere Lyrics nach startTime für korrekte endTime-Berechnung
        const sortedLyrics = [...lyrics].sort((a, b) => a.startTime - b.startTime);

        // Berechne endTime für jeden Lyric
        const processedLyrics = sortedLyrics.map((lyric, index) => {
            // Basisinformationen
            const processedLyric = {
                text: lyric.text,
                startTime: parseFloat(lyric.startTime.toFixed(2)),
                pitchTargets: lyric.pitchTargets.map(target => ({
                    time: parseFloat(target.time.toFixed(2)),
                    pitch: parseFloat(target.pitch.toFixed(2))
                }))
            };

            // endTime hinzufügen
            if (index < sortedLyrics.length - 1) {
                // Für alle Lyrics außer dem letzten: endTime ist startTime des nächsten Lyrics
                processedLyric.endTime = parseFloat(sortedLyrics[index + 1].startTime.toFixed(2));
            } else {
                // Für den letzten Lyric: endTime ist entweder duration oder startTime + 5 Sekunden
                processedLyric.endTime = parseFloat(Math.min(duration, lyric.startTime + 5).toFixed(2));
            }

            return processedLyric;
        });

        const output = {
            songName: audioFile?.name.replace(/\.[^/.]+$/, "") || "Unnamed Song",
            duration: duration,
            lyrics: processedLyrics
        };

        setJsonOutput(JSON.stringify(output, null, 2));
    };

    // Separate Funktion für Pitch-Target-Updates
    const updateTargetPitch = (lyricIndex, time) => {
        if (!songData || !songData.lyrics || lyricIndex === -1) {
            setTargetPitch(null);
            return;
        }

        const currentLyric = songData.lyrics[lyricIndex];

        // Get the pitch target closest to current time
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

            // Only update if we're close enough to the target
            if (minDiff < 0.5) {
                setTargetPitch(closestTarget.pitch);
            } else {
                setTargetPitch(null);
            }
        } else {
            setTargetPitch(null);
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
            <header className="app-header">
                <h1 className="app-title">jsong Player</h1>
                <p className="app-subtitle">Karaoke Spiel</p>
            </header>

            <main className="app-main">
                {showUpload ? (
                    <section className="card">
                        <h2 className="card-title">
                            <span className="card-number">1</span>
                            Dateien hochladen
                        </h2>

                        <div className="upload-container">
                            <div className="upload-card">
                                <h3 className="upload-title">JSON Datei</h3>
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
                            </div>

                            <div className="upload-card">
                                <h3 className="upload-title">MP3 Datei</h3>
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
                                        currentTime={currentTime} // Neue Prop hinzugefügt
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
                                    Pitch
                                </h2>

                                <div className="pitch-display">
                                    <div className="pitch-meter-container">
                                        <div className="pitch-labels">
                                            {Array.from({length: 5}, (_, i) => {
                                                const note = ((targetPitch || 60) - 12) + (i * 6);
                                                return (
                                                    <div key={i} className="pitch-label">
                                                        {note}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="pitch-meter">
                                            {/* Target pitch indicator */}
                                            {targetPitch && (
                                                <div
                                                    className="target-pitch"
                                                    style={{bottom: `${((targetPitch - ((targetPitch || 60) - 12)) / 24) * 100}%`}}
                                                ></div>
                                            )}

                                            {/* Current pitch indicator */}
                                            {currentPitch && (
                                                <div
                                                    className="current-pitch"
                                                    style={{
                                                        bottom: `${((currentPitch - ((targetPitch || 60) - 12)) / 24) * 100}%`,
                                                        backgroundColor: getAccuracyColor()
                                                    }}
                                                ></div>
                                            )}
                                        </div>
                                    </div>

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

                                <div className="pitch-history">
                                    {pitchHistory.map((data, index) => (
                                        <div
                                            key={index}
                                            className="pitch-history-bar"
                                            style={{
                                                height: `${Math.min(data.pitch / 100 * 100, 100)}%`,
                                                left: `${(index / pitchHistory.length) * 100}%`,
                                                backgroundColor: `hsl(${200 + (data.pitch % 30) * 5}, 70%, 60%)`
                                            }}
                                        ></div>
                                    ))}
                                </div>
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