import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import '../App.css';

const KaraokeJsonGenerator = () => {
    const [audioFile, setAudioFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [lyrics, setLyrics] = useState([]);
    const [jsonOutput, setJsonOutput] = useState('');
    const [pitchData, setPitchData] = useState([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const audioRef = useRef(null);
    const analyser = useRef(null);
    const microphone = useRef(null);

    // Handle file upload
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFile(file);
            const url = URL.createObjectURL(file);
            setAudioUrl(url);

            // Reset states
            setLyrics([]);
            setPitchData([]);
            setIsPlaying(false);
            setCurrentTime(0);
            setJsonOutput('');
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

    // Update current time when audio is playing
    useEffect(() => {
        if (audioRef.current) {
            const updateTime = () => {
                setCurrentTime(audioRef.current.currentTime);

                // Find current lyric based on timestamp
                const index = lyrics.findIndex((lyric, idx) => {
                    const nextLyric = lyrics[idx + 1];
                    if (nextLyric) {
                        return audioRef.current.currentTime >= lyric.startTime &&
                            audioRef.current.currentTime < nextLyric.startTime;
                    }
                    return audioRef.current.currentTime >= lyric.startTime;
                });

                if (index !== -1) {
                    setCurrentLyricIndex(index);
                }
            };

            const timeUpdateInterval = setInterval(updateTime, 100);
            return () => clearInterval(timeUpdateInterval);
        }
    }, [lyrics]);

    // Play/pause audio
    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Add new lyric line
    const addLyricLine = () => {
        const newLyric = {
            id: Date.now(),
            text: '',
            startTime: currentTime,
            pitchTargets: []
        };

        setLyrics([...lyrics, newLyric]);
    };

    // Update lyric text
    const updateLyricText = (id, text) => {
        setLyrics(lyrics.map(lyric =>
            lyric.id === id ? { ...lyric, text } : lyric
        ));
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

    // Analyze pitch for microphone input
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

                    if (pitch && currentLyricIndex >= 0) {
                        const newPitchData = [...pitchData];
                        newPitchData.push({
                            time: currentTime,
                            pitch: pitch
                        });
                        setPitchData(newPitchData);

                        // Add pitch target to current lyric if it's a significant note
                        if (pitch > 30) {
                            const updatedLyrics = [...lyrics];
                            if (updatedLyrics[currentLyricIndex]) {
                                updatedLyrics[currentLyricIndex].pitchTargets.push({
                                    time: currentTime - updatedLyrics[currentLyricIndex].startTime,
                                    pitch: pitch
                                });
                                setLyrics(updatedLyrics);
                            }
                        }
                    }
                }
            }, 200);

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

    // Generate JSON output
    const generateJson = () => {
        const output = {
            songName: audioFile?.name.replace(/\.[^/.]+$/, "") || "Unnamed Song",
            duration: duration,
            lyrics: lyrics.map(lyric => ({
                text: lyric.text,
                startTime: parseFloat(lyric.startTime.toFixed(2)),
                pitchTargets: lyric.pitchTargets.map(target => ({
                    time: parseFloat(target.time.toFixed(2)),
                    pitch: parseFloat(target.pitch.toFixed(2))
                }))
            }))
        };

        setJsonOutput(JSON.stringify(output, null, 2));
    };

    // Download JSON file
    const downloadJson = () => {
        if (!jsonOutput) return;

        const blob = new Blob([jsonOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${audioFile?.name.replace(/\.[^/.]+$/, "")}_karaoke.json` || "karaoke_data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Format time as MM:SS
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">jsong</h1>
                <p className="app-subtitle">Karaoke JSON Generator</p>
            </header>

            <main className="app-main">
                {/* Audio upload section */}
                <section className="card">
                    <h2 className="card-title">
                        <span className="card-number">1</span>
                        Audio hochladen
                    </h2>
                    <label className="file-upload">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                        <p className="file-upload-text">{audioFile ? audioFile.name : 'MP3-Datei auswählen'}</p>
                        <p className="file-upload-hint">{!audioFile && 'oder hierher ziehen'}</p>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload}
                        />
                    </label>
                </section>

                {audioUrl && (
                    <>
                        {/* Audio player */}
                        <section className="card">
                            <h2 className="card-title">
                                <span className="card-number">2</span>
                                Audio steuern
                            </h2>

                            <div className="audio-player">
                                <button
                                    onClick={togglePlayback}
                                    className={`btn ${isPlaying ? 'btn-error' : 'btn-primary'}`}
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

                        {/* Lyrics editor */}
                        <section className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">
                                    <span className="card-number">3</span>
                                    Lyrics hinzufügen
                                </h2>
                                <button
                                    onClick={addLyricLine}
                                    className="btn btn-primary"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Zeile bei {formatTime(currentTime)}
                                </button>
                            </div>

                            <div className="lyrics-container">
                                {lyrics.map((lyric, index) => (
                                    <div
                                        key={lyric.id}
                                        className={`lyric-item ${index === currentLyricIndex ? 'active' : ''}`}
                                    >
                                        <div className="lyric-meta">
                                            <span className={`lyric-time ${index === currentLyricIndex ? 'active' : ''}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <polyline points="12 6 12 12 16 14"></polyline>
                                                </svg>
                                                Start: {formatTime(lyric.startTime)}
                                            </span>
                                            <span className="lyric-pitch">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18V5l12-2v13"></path>
                                                    <circle cx="6" cy="18" r="3"></circle>
                                                </svg>
                                                {lyric.pitchTargets.length} Pitch-Punkte
                                            </span>
                                        </div>
                                        <div className="lyric-input-container">
                                            <input
                                                type="text"
                                                value={lyric.text}
                                                onChange={(e) => updateLyricText(lyric.id, e.target.value)}
                                                className="lyric-input"
                                                placeholder="Lyric text eingeben..."
                                            />
                                            <div className="lyric-edit-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 20h9"></path>
                                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {lyrics.length === 0 && (
                                    <div className="empty-lyrics">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        <p>Klicke auf "+ Zeile" während der Wiedergabe,<br />um Lyrics zu erfassen</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Pitch analysis */}
                        <section className="card">
                            <h2 className="card-title">
                                <span className="card-number">4</span>
                                Pitch analysieren
                            </h2>
                            <div className="analysis-controls">
                                <button
                                    onClick={isAnalyzing ? stopPitchAnalysis : startPitchAnalysis}
                                    className={`btn ${isAnalyzing ? 'btn-error' : 'btn-success'}`}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                            Analyse stoppen
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
                                            </svg>
                                            Analyse starten
                                        </>
                                    )}
                                </button>
                                <div className={`mic-status ${isAnalyzing ? 'active' : 'inactive'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                    </svg>
                                    <span>{isAnalyzing ? 'Singe mit, um Pitch-Daten zu erfassen' : 'Mikrofon erforderlich'}</span>
                                </div>
                            </div>

                            {pitchData.length > 0 ? (
                                <div className="pitch-visualization">
                                    <div className="pitch-grid">
                                        {Array(48).fill(0).map((_, i) => (
                                            <div key={i} className="pitch-grid-cell"></div>
                                        ))}
                                    </div>
                                    {pitchData.map((data, index) => (
                                        <div
                                            key={index}
                                            className="pitch-bar"
                                            style={{
                                                height: `${Math.min(data.pitch / 4, 100)}%`,
                                                left: `${(data.time / duration) * 100}%`,
                                                opacity: 0.7 + Math.min(data.pitch / 500, 0.3)
                                            }}
                                        >
                                            <div className="pitch-dot" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-pitch">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    </svg>
                                    <p>Starte die Analyse und singe, um Pitch-Daten zu sammeln</p>
                                </div>
                            )}
                        </section>

                        {/* JSON output */}
                        <section className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">
                                    <span className="card-number">5</span>
                                    JSON generieren
                                </h2>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={generateJson}
                                        className="btn btn-primary"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="16 18 22 12 16 6"></polyline>
                                            <polyline points="8 6 2 12 8 18"></polyline>
                                        </svg>
                                        Generieren
                                    </button>
                                    <button
                                        onClick={downloadJson}
                                        disabled={!jsonOutput}
                                        className={`btn ${jsonOutput ? 'btn-success' : 'btn-disabled'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        Download
                                    </button>
                                </div>
                            </div>

                            {jsonOutput ? (
                                <div className="json-preview">
                                    <pre className="json-output">
                                        <code>{jsonOutput}</code>
                                    </pre>
                                    <button
                                        onClick={() => {navigator.clipboard.writeText(jsonOutput)}}
                                        className="json-copy-btn"
                                        title="In die Zwischenablage kopieren"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="empty-json">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <path d="M10 12a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-4z"></path>
                                    </svg>
                                    <p>Klicke auf "Generieren", um das JSON für deine<br />Karaoke-App zu erstellen</p>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
            <footer className="app-footer">
                jsong Karaoke JSON Generator | Made with ♥
            </footer>
        </div>
    );
};

export default KaraokeJsonGenerator;