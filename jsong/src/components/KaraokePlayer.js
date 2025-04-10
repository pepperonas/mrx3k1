import React, { useState, useRef, useEffect } from 'react';
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

    const audioRef = useRef(null);
    const analyser = useRef(null);
    const microphone = useRef(null);

    // Handle JSON file upload
    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);
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
            setAudioUrl(url);

            // Reset states
            setIsPlaying(false);
            setCurrentTime(0);
            setScore(0);
            setPitchHistory([]);
        }
    };

    // Initialize audio element
    useEffect(() => {
        if (audioRef.current && audioUrl) {
            audioRef.current.onloadedmetadata = () => {
                setDuration(audioRef.current.duration);
            };
        }
    }, [audioUrl]);

    // Update current time and handle lyrics timing
    useEffect(() => {
        if (audioRef.current && songData) {
            const updateTime = () => {
                setCurrentTime(audioRef.current.currentTime);

                // Find current lyric based on timestamp
                const index = songData.lyrics.findIndex((lyric, idx) => {
                    const nextLyric = songData.lyrics[idx + 1];
                    if (nextLyric) {
                        return audioRef.current.currentTime >= lyric.startTime &&
                            audioRef.current.currentTime < nextLyric.startTime;
                    }
                    return audioRef.current.currentTime >= lyric.startTime;
                });

                if (index !== -1 && index !== currentLyricIndex) {
                    setCurrentLyricIndex(index);
                }

                // Find target pitch
                if (index !== -1) {
                    const currentLyric = songData.lyrics[index];
                    // Get the pitch target closest to current time
                    if (currentLyric.pitchTargets && currentLyric.pitchTargets.length > 0) {
                        const relativeTime = audioRef.current.currentTime - currentLyric.startTime;
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
                }
            };

            const timeUpdateInterval = setInterval(updateTime, 100);
            return () => clearInterval(timeUpdateInterval);
        }
    }, [songData, currentLyricIndex]);

    // Play/pause audio
    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
                if (!isAnalyzing) {
                    startPitchAnalysis();
                }
            }
            setIsPlaying(!isPlaying);
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
            await Tone.start();

            microphone.current = new Tone.UserMedia();
            await microphone.current.open();

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
                            const newHistory = [...prev, { time: currentTime, pitch }];
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

            return () => {
                clearInterval(analyzeInterval);
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
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Start the game (hide uploads and show player)
    const startGame = () => {
        if (songData && audioUrl) {
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
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Spiel starten
                            </button>
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

                                <button
                                    onClick={resetGame}
                                    className="btn btn-small btn-outline"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2.5 2v6h6M21.5 22v-6h-6"></path>
                                        <path d="M22 11.5A10 10 0 0 0 3 9"></path>
                                        <path d="M2 13a10 10 0 0 0 18.5 3"></path>
                                    </svg>
                                    Neues Lied
                                </button>
                            </div>

                            <div className="player-controls">
                                <button
                                    onClick={togglePlayback}
                                    className={`btn ${isPlaying ? 'btn-error' : 'btn-primary'} btn-large`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

                            <audio ref={audioRef} src={audioUrl} />

                            <div className="progress-container">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                />
                                <div
                                    className="progress-handle"
                                    style={{ left: `${(currentTime / duration) * 100}%` }}
                                />
                            </div>
                        </section>

                        {/* Lyrics and Pitch Display */}
                        <div className="karaoke-container">
                            <section className="card lyrics-card">
                                <h2 className="card-title">
                                    <span className="card-number">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </span>
                                    Lyrics
                                </h2>

                                <div className="lyrics-display">
                                    {songData.lyrics.map((lyric, index) => (
                                        <div
                                            key={index}
                                            className={`lyric-line ${index === currentLyricIndex ? 'active' : ''} ${index < currentLyricIndex ? 'past' : ''}`}
                                        >
                                            {lyric.text}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="card pitch-card">
                                <h2 className="card-title">
                                    <span className="card-number">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                            {Array.from({ length: 5 }, (_, i) => {
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
                                                    style={{ bottom: `${((targetPitch - ((targetPitch || 60) - 12)) / 24) * 100}%` }}
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
                                            <span className="pitch-stat-value" style={{ color: getAccuracyColor() }}>
                                                {currentPitch || '-'}
                                            </span>
                                        </div>
                                        <div className="pitch-stat-item">
                                            <span className="pitch-stat-label">Ziel Pitch:</span>
                                            <span className="pitch-stat-value">
                                                {targetPitch || '-'}
                                            </span>
                                        </div>
                                        <div className="pitch-accuracy" style={{ backgroundColor: getAccuracyColor() }}>
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
                jsong Karaoke Player | Made with ♥
            </footer>
        </div>
    );
};

export default KaraokePlayer;