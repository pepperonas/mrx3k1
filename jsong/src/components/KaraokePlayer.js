import React, {useEffect, useRef, useState} from 'react';
import * as Tone from 'tone';
import '../App.css';
import '../Player.css';

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

    const audioRef = useRef(null);
    const analyser = useRef(null);
    const microphone = useRef(null);
    const lyricsDisplayRef = useRef(null);
    const timeUpdateIntervalRef = useRef(null);
    const firstPlayRef = useRef(true);

    // Füge einen eigenen Stylesheet für den Neon-Effekt hinzu
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes neon-glow {
                0% {
                    color: #fff;
                    text-shadow: 0 0 10px #fff, 
                                0 0 20px #fff, 
                                0 0 30px #8b5cf6,
                                0 0 40px #8b5cf6, 
                                0 0 70px #8b5cf6, 
                                0 0 80px #8b5cf6;
                    transform: scale(1.05);
                }
                50% {
                    color: #fff;
                    text-shadow: 0 0 5px #fff, 
                                0 0 10px #fff, 
                                0 0 15px #a78bfa,
                                0 0 30px #a78bfa, 
                                0 0 40px #a78bfa, 
                                0 0 50px #a78bfa;
                    transform: scale(1.1);
                }
                100% {
                    color: #fff;
                    text-shadow: 0 0 10px #fff, 
                                0 0 20px #fff, 
                                0 0 30px #8b5cf6,
                                0 0 40px #8b5cf6, 
                                0 0 70px #8b5cf6, 
                                0 0 80px #8b5cf6;
                    transform: scale(1.05);
                }
            }
            
            @keyframes neon-border {
                0% {
                    box-shadow: 0 0 15px 5px rgba(139, 92, 246, 0.7);
                }
                100% {
                    box-shadow: 0 0 25px 8px rgba(139, 92, 246, 0.9);
                }
            }
            
            .lyric-line.active {
                animation: neon-glow 1.2s infinite;
                color: #fff;
                font-weight: 700;
                letter-spacing: 0.05em;
                z-index: 10;
                background-color: rgba(139, 92, 246, 0.2);
                border-left: 5px solid #8b5cf6;
                backdrop-filter: brightness(1.2);
                transform-origin: center;
                position: relative;
            }
            
            .lyric-line.active::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 0.5rem;
                box-shadow: 0 0 15px 5px rgba(139, 92, 246, 0.7);
                z-index: -1;
                animation: neon-border 1.2s infinite alternate;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

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

    const updateDomLyrics = (index) => {
        if (!songData || !songData.lyrics) return;

        const lyricsContainer = lyricsDisplayRef.current;
        if (!lyricsContainer) return;

        console.log("Aktualisiere Lyrics-Stil für Index:", index);

        // Entferne bestehende Klassen
        const allLyrics = lyricsContainer.querySelectorAll('.lyric-line');
        allLyrics.forEach((line, idx) => {
            line.classList.remove('active', 'past');

            // Wichtig: Alle alten Elemente entfernen
            if (line.querySelector('.glow-overlay')) {
                line.removeChild(line.querySelector('.glow-overlay'));
            }

            if (idx === index) {
                console.log("Stelle aktiven Lyric ein:", idx);
                line.classList.add('active');

                // Schaffe einen benutzerdefinierten Overlay für den Glüheffekt
                const glowOverlay = document.createElement('div');
                glowOverlay.className = 'glow-overlay';
                glowOverlay.style.position = 'absolute';
                glowOverlay.style.inset = '0';
                glowOverlay.style.pointerEvents = 'none';
                glowOverlay.style.zIndex = '-1';
                glowOverlay.style.borderRadius = '0.5rem';
                glowOverlay.style.opacity = '0.8';
                line.style.position = 'relative';
                line.appendChild(glowOverlay);
            } else if (idx < index) {
                line.classList.add('past');
            }
        });

        // Scrolle zum aktiven Lyric
        const activeLyric = lyricsContainer.querySelector('.active');
        if (activeLyric) {
            activeLyric.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
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
            const handleTimeUpdate = () => {
                const newTime = audioElement.currentTime;

                // Direkte DOM-Manipulation für die Zeitanzeige
                updateDomTime(newTime);

                // State-Update für React
                setCurrentTime(newTime);

                // DIREKTES UPDATE DER LYRICS HIER
                if (songData && songData.lyrics && songData.lyrics.length > 0) {
                    // Finde den aktuellen Liedtext basierend auf der Zeit
                    let foundIndex = -1;

                    for (let i = 0; i < songData.lyrics.length; i++) {
                        const lyric = songData.lyrics[i];
                        const nextLyric = songData.lyrics[i + 1];

                        if (nextLyric) {
                            if (newTime >= lyric.startTime && newTime < nextLyric.startTime) {
                                foundIndex = i;
                                break;
                            }
                        } else if (newTime >= lyric.startTime) {
                            // Letzter Liedtext
                            foundIndex = i;
                            break;
                        }
                    }

                    if (foundIndex !== -1 && foundIndex !== currentLyricIndex) {
                        console.log(`Updating lyric index to ${foundIndex} at time ${newTime.toFixed(2)}`);

                        // Direkte DOM-Manipulation für die Lyrics-Hervorhebung
                        updateDomLyrics(foundIndex);

                        // State-Update für React
                        setCurrentLyricIndex(foundIndex);

                        // Update target pitch if needed
                        if (typeof updateTargetPitch === 'function') {
                            updateTargetPitch(foundIndex, newTime);
                        }
                    }
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
    }, [audioUrl, songData]);

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

                        <div style={{marginTop: '20px', textAlign: 'center'}}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={debugMode}
                                    onChange={() => setDebugMode(!debugMode)}
                                    style={{marginRight: '8px'}}
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
                                            className="btn btn-small btn-outline"
                                            style={{backgroundColor: 'rgba(239, 68, 68, 0.2)'}}
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

                                <div className="lyrics-display" ref={lyricsDisplayRef}>
                                    {songData && songData.lyrics && songData.lyrics.map((lyric, index) => (
                                        <div
                                            key={index}
                                            className={`lyric-line ${index === currentLyricIndex ? 'active' : ''} ${index < currentLyricIndex ? 'past' : ''}`}
                                            style={debugMode ? {
                                                border: '1px dashed #333',
                                                padding: '8px'
                                            } : null}
                                        >
                                            {lyric.text}
                                            {debugMode && (
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: '#999',
                                                    marginTop: '4px'
                                                }}>
                                                    Zeit: {lyric.startTime.toFixed(2)}s |
                                                    Index: {index} |
                                                    Aktiv: {index === currentLyricIndex ? 'Ja' : 'Nein'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
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