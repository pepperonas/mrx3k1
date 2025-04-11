import React, {useEffect, useRef, useState} from 'react';
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
    const [globalPitchData, setGlobalPitchData] = useState([]);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Tab-Navigation und Batch-Input
    const [activeTab, setActiveTab] = useState('einzeln');
    const [batchLyricsText, setBatchLyricsText] = useState('');
    const [parsedLyrics, setParsedLyrics] = useState([]);
    const [nextLyricIndex, setNextLyricIndex] = useState(0);

    // Konfigurationsoptionen
    const [defaultEndTimeDuration, setDefaultEndTimeDuration] = useState(3);
    const [markerOffset, setMarkerOffset] = useState(-2);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [autoSortLyrics, setAutoSortLyrics] = useState(true);

    const audioRef = useRef(null);
    const analyser = useRef(null);
    const microphone = useRef(null);

    const lastValidLyricIndexRef = useRef(-1);
    const checkingLyricIndexRef = useRef(false);

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
            setGlobalPitchData([]);
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
                // Setze Flag, dass wir gerade prüfen
                checkingLyricIndexRef.current = true;

                const newTime = audioRef.current.currentTime;
                setCurrentTime(newTime);

                // Finde aktuellen Lyric basierend auf Zeitstempel
                if (lyrics.length > 0) {
                    let foundIndex = -1;

                    // Durchlaufe alle Lyrics und finde den passenden
                    for (let i = 0; i < lyrics.length; i++) {
                        const lyric = lyrics[i];
                        const nextLyric = lyrics[i + 1];

                        // Wenn wir zwischen Start und Ende sind (mit oder ohne nächsten Lyric)
                        if (newTime >= lyric.startTime) {
                            if (nextLyric) {
                                if (newTime < nextLyric.startTime) {
                                    foundIndex = i;
                                    break;
                                }
                            } else {
                                // Letzter Lyric
                                foundIndex = i;
                                break;
                            }
                        }
                    }

                    console.log(`Zeit: ${newTime.toFixed(2)}s, Gefundener Index: ${foundIndex}`);

                    // Wenn wir einen gültigen Index gefunden haben, speichern wir ihn
                    if (foundIndex >= 0) {
                        lastValidLyricIndexRef.current = foundIndex;
                        console.log(`Letzter gültiger Index aktualisiert: ${foundIndex}`);
                    }

                    // Wenn der gefundene Index sich vom aktuellen unterscheidet
                    if (foundIndex !== currentLyricIndex) {
                        console.log(`Lyric Index geändert: ${currentLyricIndex} -> ${foundIndex}`);

                        // Verwende ausdrücklich den gefundenen Index
                        setCurrentLyricIndex(foundIndex);
                    }
                }

                // Unser Check ist abgeschlossen
                checkingLyricIndexRef.current = false;
            };

            const timeUpdateInterval = setInterval(updateTime, 100);
            return () => clearInterval(timeUpdateInterval);
        }
    }, [lyrics, currentLyricIndex]);

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

    // Add new lyric line with default endTime
    const addLyricLine = () => {
        // Berechne die Startzeit mit dem Offset
        const offsetStartTime = currentTime + markerOffset;
        // Stelle sicher, dass startTime nicht negativ wird und runde auf eine Dezimalstelle
        const startTime = Math.round(Math.max(offsetStartTime, 0) * 10) / 10;

        const calculatedEndTime = startTime + defaultEndTimeDuration;

        // Ensure endTime doesn't exceed the duration of the song and round to one decimal place
        const endTime = Math.round(Math.min(calculatedEndTime, duration) * 10) / 10;

        // Einfache Lyric-Struktur ohne Pitch-Informationen
        const lyricId = Date.now();
        const newLyric = {
            id: lyricId,
            text: '',
            startTime: startTime,
            endTime: endTime
        };

        const updatedLyrics = [...lyrics, newLyric];
        setLyrics(updatedLyrics);

        console.log(`Neuer Lyric hinzugefügt: startTime=${startTime}s, endTime=${endTime}s`);
        console.log(`Aktuelle Lyrics-Array Länge: ${updatedLyrics.length}`);

        // Finde den passenden Index für die aktuelle Zeit
        // und setze ihn als letzten gültigen Index
        const newIndex = updatedLyrics.findIndex((lyric, idx) => {
            const nextLyric = updatedLyrics[idx + 1];
            if (nextLyric) {
                return currentTime >= lyric.startTime && currentTime < nextLyric.startTime;
            }
            return currentTime >= lyric.startTime;
        });

        if (newIndex >= 0) {
            // Wichtig: Speichere den Index sowohl im State als auch in der Ref
            setCurrentLyricIndex(newIndex);
            lastValidLyricIndexRef.current = newIndex;
            console.log(`Nach Hinzufügen: Zeit=${currentTime.toFixed(2)}s, Index=${newIndex} (gespeichert)`);
        } else {
            console.log(`Nach Hinzufügen: Zeit=${currentTime.toFixed(2)}s, Index=${newIndex} (nicht gültig)`);
        }
    };

    // Update lyric text
    const updateLyricText = (id, text) => {
        setLyrics(lyrics.map(lyric =>
            lyric.id === id ? {...lyric, text} : lyric
        ));
    };

    // Update lyric startTime
    const updateLyricStartTime = (id, startTime) => {
        const numStartTime = parseFloat(startTime);
        if (!isNaN(numStartTime)) {
            // Runde auf eine Dezimalstelle
            const roundedStartTime = Math.round(numStartTime * 10) / 10;
            setLyrics(lyrics.map(lyric => {
                if (lyric.id === id) {
                    // Passe die endTime an, falls die startTime größer wird
                    const endTime = Math.max(lyric.endTime, roundedStartTime + 0.1);
                    return {...lyric, startTime: roundedStartTime, endTime};
                }
                return lyric;
            }));
        }
    };

    // Update lyric endTime
    const updateLyricEndTime = (id, endTime) => {
        const numEndTime = parseFloat(endTime);
        if (!isNaN(numEndTime)) {
            // Runde auf eine Dezimalstelle
            const roundedEndTime = Math.round(numEndTime * 10) / 10;
            setLyrics(lyrics.map(lyric => {
                if (lyric.id === id) {
                    // Stelle sicher, dass endTime größer als startTime ist
                    const validEndTime = Math.max(roundedEndTime, lyric.startTime + 0.1);
                    return {...lyric, endTime: validEndTime};
                }
                return lyric;
            }));
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

        // Niedrigerer Schwellenwert (50 statt 100), um mehr Pitches zu erkennen
        if (maxValue > 50) {
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
            console.log("Tone.js erfolgreich initialisiert");

            microphone.current = new Tone.UserMedia();
            await microphone.current.open();
            console.log("Mikrofon erfolgreich geöffnet");

            analyser.current = new Tone.Analyser('fft', 1024);
            microphone.current.connect(analyser.current);
            console.log("Analyzer mit Mikrofon verbunden");

            const analyzeInterval = setInterval(() => {
                if (analyser.current) {
                    const frequencyData = analyser.current.getValue();

                    // Finde den maximalen Wert (auch negative)
                    let maxValue = -Infinity;
                    let maxIndex = 0;

                    for (let i = 0; i < frequencyData.length; i++) {
                        if (frequencyData[i] > maxValue) {
                            maxValue = frequencyData[i];
                            maxIndex = i;
                        }
                    }

                    // Konvertiere zu absoluten Wert für Schwellenwert
                    const absValue = Math.abs(maxValue);

                    // Pitch erkennen, wenn Wert über Schwelle
                    let pitch = null;
                    if (absValue > 20) {
                        // Convert FFT bin index to frequency
                        const nyquist = 22050; // Half the sample rate
                        const frequency = maxIndex * nyquist / frequencyData.length;

                        // Konvertiere zu MIDI Notennummer
                        const noteNumber = 12 * Math.log2(frequency / 440) + 69;
                        pitch = Math.round(noteNumber);
                    }

                    // Wichtig: Verwende den letzten gültigen Index aus der Ref, wenn gerade kein Update läuft
                    const effectiveLyricIndex = checkingLyricIndexRef.current ? currentLyricIndex :
                        (currentLyricIndex >= 0 ? currentLyricIndex : lastValidLyricIndexRef.current);

                    // Aktuelle Audio-Zeit direkt vom Audio-Element holen
                    const actualCurrentTime = audioRef.current ? audioRef.current.currentTime : currentTime;

                    console.log(`Max Freq: ${maxValue.toFixed(1)}, Pitch: ${pitch || 'keiner'}, ` +
                        `Lyric Index: ${currentLyricIndex}, Effektiver Index: ${effectiveLyricIndex}, ` +
                        `Zeit: ${actualCurrentTime.toFixed(2)}s`);

                    if (pitch) {
                        // PitchData für Visualisierung aktualisieren
                        const newPitchData = [...pitchData];
                        newPitchData.push({
                            time: actualCurrentTime,
                            pitch: pitch
                        });
                        setPitchData(newPitchData);

                        // Globale PitchData unabhängig vom aktuellen Lyric speichern
                        setGlobalPitchData(prev => [
                            ...prev,
                            {
                                time: actualCurrentTime,
                                pitch: pitch
                            }
                        ]);

                        console.log(`Pitch ${pitch} bei Zeit ${actualCurrentTime.toFixed(2)}s aufgezeichnet`);

                        // Zusätzlich ausgeben, wenn ein Lyric aktiv ist (nur für Benutzer-Feedback)
                        if (effectiveLyricIndex >= 0 && effectiveLyricIndex < lyrics.length) {
                            console.log(`Aktueller Lyric: "${lyrics[effectiveLyricIndex].text}"`);
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
            alert("Fehler beim Zugriff auf das Mikrofon: " + err.message);
        }
    };

    // Stop pitch analysis
    const stopPitchAnalysis = () => {
        setIsAnalyzing(false);
        if (microphone.current) {
            microphone.current.close();
        }
    };

    // Generate JSON output with endTime for each lyric
    const generateJson = () => {
        // Sortiere Lyrics nach startTime für korrekte endTime-Berechnung, wenn Option aktiviert
        let processedLyrics = [...lyrics];

        if (autoSortLyrics) {
            processedLyrics.sort((a, b) => a.startTime - b.startTime);
        }

        // Verarbeite die Lyrics, um die endTime zu inkludieren oder zu korrigieren
        processedLyrics = processedLyrics.map((lyric, index) => {
            // Basisinformationen
            const processedLyric = {
                text: lyric.text,
                startTime: parseFloat(lyric.startTime.toFixed(2)),
                endTime: parseFloat(lyric.endTime.toFixed(2))
            };

            // Wenn es das letzte Lyric ist und die endTime über der Dauer liegt, korrigieren
            if (index === processedLyrics.length - 1 && processedLyric.endTime > duration) {
                processedLyric.endTime = parseFloat(duration.toFixed(2));
            }

            // Bei auto sort, stelle sicher, dass endTime nicht die startTime des nächsten Lyrics überschreitet
            if (autoSortLyrics && index < processedLyrics.length - 1) {
                const nextStartTime = processedLyrics[index + 1].startTime;
                if (processedLyric.endTime > nextStartTime) {
                    processedLyric.endTime = parseFloat(nextStartTime.toFixed(2));
                }
            }

            return processedLyric;
        });

        // Sortiere Pitch-Daten nach Zeit
        const sortedPitchData = [...globalPitchData].sort((a, b) => a.time - b.time);

        // Formatiere Pitch-Daten
        const processedPitchData = sortedPitchData.map(point => ({
            time: parseFloat(point.time.toFixed(2)),
            pitch: parseFloat(point.pitch.toFixed(2))
        }));

        const output = {
            songName: audioFile?.name.replace(/\.[^/.]+$/, "") || "Unnamed Song",
            duration: parseFloat(duration.toFixed(6)),
            lyrics: processedLyrics,
            pitchData: processedPitchData
        };

        setJsonOutput(JSON.stringify(output, null, 2));
    };

    // Download JSON file
    const downloadJson = () => {
        if (!jsonOutput) return;

        const blob = new Blob([jsonOutput], {type: 'application/json'});
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

    // Funktionen für die Massenverarbeitung von Lyrics
    const processBatchLyrics = () => {
        if (!batchLyricsText.trim()) return;

        // Text nach Zeilen aufteilen und leere Zeilen entfernen
        const lines = batchLyricsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        setParsedLyrics(lines);
        setNextLyricIndex(0);
    };

    const addLyricFromQueue = (text, index) => {
        if (!audioRef.current) return;

        // Berechne die Startzeit mit dem Offset
        const offsetStartTime = currentTime + markerOffset;
        // Stelle sicher, dass startTime nicht negativ wird und runde auf eine Dezimalstelle
        const startTime = Math.round(Math.max(offsetStartTime, 0) * 10) / 10;

        const calculatedEndTime = startTime + defaultEndTimeDuration;
        // Ensure endTime doesn't exceed the duration of the song and round to one decimal place
        const endTime = Math.round(Math.min(calculatedEndTime, duration) * 10) / 10;

        // Lyric erstellen
        const lyricId = Date.now();
        const newLyric = {
            id: lyricId,
            text: text,
            startTime: startTime,
            endTime: endTime
        };

        // Lyric hinzufügen
        const updatedLyrics = [...lyrics, newLyric];
        setLyrics(updatedLyrics);

        console.log(`Neuer Lyric aus Queue hinzugefügt: "${text}", startTime=${startTime}s, endTime=${endTime}s`);

        // Nächsten Lyric in der Queue markieren
        setNextLyricIndex(index + 1);
    };

    return (
        <div className="app-container">
            <main className="app-main">
                {/* Audio upload section */}
                <section className="card">
                    <h2 className="card-title">
                        <span className="card-number">1</span>
                        Audio hochladen
                    </h2>
                    <label className="file-upload">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                             strokeLinejoin="round">
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

                            <audio ref={audioRef} src={audioUrl}/>

                            <div className="progress-container">
                                <div
                                    className="progress-bar"
                                    style={{width: `${(currentTime / duration) * 100}%`}}
                                />
                                <div
                                    className="progress-handle"
                                    style={{left: `${(currentTime / duration) * 100}%`}}
                                />
                            </div>
                        </section>

                        {/* Pitch analysis - VERSCHOBEN AN POSITION 3 */}
                        <section className="card">
                            <h2 className="card-title">
                                <span className="card-number">3</span>
                                Pitch aufnehmen ({globalPitchData.length} Datenpunkte)
                            </h2>
                            <div className="analysis-controls">
                                <button
                                    onClick={isAnalyzing ? stopPitchAnalysis : startPitchAnalysis}
                                    className={`btn ${isAnalyzing ? 'btn-error' : 'btn-success'}`}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                 viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" strokeWidth="2"
                                                 strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="6" y="4" width="4" height="16"></rect>
                                                <rect x="14" y="4" width="4" height="16"></rect>
                                            </svg>
                                            Analyse stoppen
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                 viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" strokeWidth="2"
                                                 strokeLinecap="round" strokeLinejoin="round">
                                                <path
                                                    d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
                                            </svg>
                                            Analyse starten
                                        </>
                                    )}
                                </button>
                                <div
                                    className={`mic-status ${isAnalyzing ? 'active' : 'inactive'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2"
                                         strokeLinecap="round" strokeLinejoin="round">
                                        <path
                                            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                    </svg>
                                    <span>{isAnalyzing ? 'Singe, um Pitch-Daten zu erfassen' : 'Mikrofon erforderlich'}</span>
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
                                            <div className="pitch-dot"/>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-pitch">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2"
                                         strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" y1="19" x2="12" y2="23"></line>
                                        <line x1="8" y1="23" x2="16" y2="23"></line>
                                        <path
                                            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    </svg>
                                    <p>Starte die Analyse und singe, um Pitch-Daten aufzunehmen - unabhängig von den Lyrics</p>
                                </div>
                            )}
                        </section>

                        {/* JSON Configuration - VERSCHOBEN AN POSITION 4 */}
                        <section className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">
                                    <span className="card-number">4</span>
                                    JSON Konfiguration
                                </h2>
                                <button
                                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                    className="btn btn-primary"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2"
                                         strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path
                                            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                    {showAdvancedOptions ? "Einfache Optionen" : "Erweiterte Optionen"}
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="block text-primary-light mb-2">
                                    Standard Dauer für Lyric (Sekunden):
                                </label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={defaultEndTimeDuration}
                                    onChange={(e) => setDefaultEndTimeDuration(parseFloat(e.target.value))}
                                    className="lyric-input"
                                />
                                <p className="file-upload-hint mt-2">
                                    Diese Zeitspanne wird verwendet, um die endTime für neue Lyrics
                                    zu berechnen (startTime + Dauer)
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-primary-light mb-2">
                                    Zeitverschiebung (Offset) beim Hinzufügen (Sekunden):
                                </label>
                                <input
                                    type="number"
                                    min="-10"
                                    max="10"
                                    step="0.5"
                                    value={markerOffset}
                                    onChange={(e) => setMarkerOffset(parseFloat(e.target.value))}
                                    className="lyric-input"
                                />
                                <p className="file-upload-hint mt-2">
                                    Dieser Offset wird beim Setzen des Markers angewendet (z.B. -2 =
                                    2 Sekunden früher).
                                    Eine Markierung bei Sekunde 12 mit Offset -2 erstellt einen
                                    Lyric bei Sekunde 10.
                                </p>
                            </div>

                            {showAdvancedOptions && (
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="autoSortLyrics"
                                            checked={autoSortLyrics}
                                            onChange={() => setAutoSortLyrics(!autoSortLyrics)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="autoSortLyrics"
                                               className="text-primary-light">
                                            Lyrics automatisch nach startTime sortieren
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <button
                                            onClick={() => setGlobalPitchData([])}
                                            className="btn btn-error btn-small"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                        >
                                            Alle Pitch-Daten zurücksetzen
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Lyrics editor mit Tab-View */}
                        <section className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">
                                    <span className="card-number">5</span>
                                    Lyrics hinzufügen
                                </h2>
                                <button
                                    onClick={addLyricLine}
                                    className="btn btn-primary"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2"
                                         strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Zeile
                                    bei {formatTime(Math.max(currentTime + markerOffset, 0))} ({(Math.max(currentTime + markerOffset, 0)).toFixed(1)}s)
                                </button>
                            </div>

                            {/* Tab Navigation */}
                            <div className="tab-navigation" style={{
                                display: 'flex',
                                borderBottom: '1px solid var(--border-light)',
                                marginBottom: '1rem'
                            }}>
                                <button
                                    className={`tab-button ${activeTab === 'einzeln' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('einzeln')}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: activeTab === 'einzeln' ? '2px solid var(--primary)' : '2px solid transparent',
                                        color: activeTab === 'einzeln' ? 'var(--primary-light)' : 'var(--text-muted)',
                                        fontWeight: activeTab === 'einzeln' ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        marginRight: '1rem'
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                         style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', display: 'inline' }}>
                                        <line x1="8" y1="6" x2="21" y2="6"></line>
                                        <line x1="8" y1="12" x2="21" y2="12"></line>
                                        <line x1="8" y1="18" x2="21" y2="18"></line>
                                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                    </svg>
                                    Einzeleingabe
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'masse' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('masse')}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: activeTab === 'masse' ? '2px solid var(--primary)' : '2px solid transparent',
                                        color: activeTab === 'masse' ? 'var(--primary-light)' : 'var(--text-muted)',
                                        fontWeight: activeTab === 'masse' ? '600' : '400',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                         style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', display: 'inline' }}>
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    Masseneingabe
                                </button>
                            </div>

                            {/* Einzeleingabe Tab */}
                            {activeTab === 'einzeln' && (
                                <div className="lyrics-container">
                                    {lyrics.map((lyric, index) => (
                                        <div
                                            key={lyric.id}
                                            className={`lyric-item ${index === currentLyricIndex ? 'active' : ''}`}
                                        >
                                            <div className="lyric-meta">
                                                <span
                                                    className={`lyric-time ${index === currentLyricIndex ? 'active' : ''}`}
                                                    style={{display: 'flex', alignItems: 'center'}}>
                                                    <svg xmlns="http://www.w3.org/2000/svg"
                                                         viewBox="0 0 24 24" fill="none"
                                                         stroke="currentColor" strokeWidth="2"
                                                         strokeLinecap="round" strokeLinejoin="round"
                                                         style={{
                                                             minWidth: '1rem',
                                                             marginRight: '0.25rem'
                                                         }}>
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                    Start:
                                                    <div className="lyric-input-container" style={{
                                                        width: '80px',
                                                        display: 'inline-block',
                                                        marginLeft: '8px'
                                                    }}>
                                                        <input
                                                            type="number"
                                                            value={lyric.startTime.toFixed(1)}
                                                            min="0"
                                                            max={duration}
                                                            step="0.1"
                                                            onChange={(e) => updateLyricStartTime(lyric.id, e.target.value)}
                                                            className="lyric-input"
                                                            style={{
                                                                padding: '0.4rem',
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        color: 'var(--text-dimmed)',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        ({formatTime(lyric.startTime)})
                                                    </span>
                                                </span>
                                                <span className="lyric-pitch">
                                                    <svg xmlns="http://www.w3.org/2000/svg"
                                                         viewBox="0 0 24 24" fill="none"
                                                         stroke="currentColor" strokeWidth="2"
                                                         strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M9 18V5l12-2v13"></path>
                                                        <circle cx="6" cy="18" r="3"></circle>
                                                    </svg>
                                                    {index === currentLyricIndex ? "(Aktiv)" : ""}
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
                                                    <svg xmlns="http://www.w3.org/2000/svg"
                                                         viewBox="0 0 24 24" fill="none"
                                                         stroke="currentColor" strokeWidth="2"
                                                         strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 20h9"></path>
                                                        <path
                                                            d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* End Time Input */}
                                            <div className="lyric-meta" style={{marginTop: '0.5rem'}}>
                                                <span className="lyric-time"
                                                      style={{display: 'flex', alignItems: 'center'}}>
                                                    <svg xmlns="http://www.w3.org/2000/svg"
                                                         viewBox="0 0 24 24" fill="none"
                                                         stroke="currentColor" strokeWidth="2"
                                                         strokeLinecap="round" strokeLinejoin="round"
                                                         style={{
                                                             minWidth: '1rem',
                                                             marginRight: '0.25rem'
                                                         }}>
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="12" y1="6" x2="12" y2="12"></line>
                                                        <line x1="12" y1="12" x2="16" y2="16"></line>
                                                    </svg>
                                                    Ende:
                                                    <div className="lyric-input-container" style={{
                                                        width: '80px',
                                                        display: 'inline-block',
                                                        marginLeft: '8px'
                                                    }}>
                                                        <input
                                                            type="number"
                                                            value={lyric.endTime.toFixed(1)}
                                                            min={lyric.startTime + 0.1}
                                                            max={duration}
                                                            step="0.1"
                                                            onChange={(e) => updateLyricEndTime(lyric.id, e.target.value)}
                                                            className="lyric-input"
                                                            style={{
                                                                padding: '0.4rem',
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        color: 'var(--text-dimmed)',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        ({formatTime(lyric.endTime)})
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {lyrics.length === 0 && (
                                        <div className="empty-lyrics">
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
                                            <p>Klicke auf "+ Zeile" während der Wiedergabe,<br/>um
                                                Lyrics zu erfassen</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Masseneingabe Tab */}
                            {activeTab === 'masse' && (
                                <div className="batch-lyrics-container">
                                    <div className="batch-input-container" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <textarea
                                            className="lyric-input"
                                            value={batchLyricsText}
                                            onChange={(e) => setBatchLyricsText(e.target.value)}
                                            placeholder="Füge hier mehrere Zeilen von Lyrics ein (eine Zeile pro Lyric)..."
                                            style={{
                                                minHeight: '150px',
                                                resize: 'vertical',
                                                padding: '1rem',
                                                fontSize: '1rem',
                                                lineHeight: '1.5',
                                                backgroundColor: 'var(--input-bg)',
                                                color: 'var(--text-light)',
                                                border: '1px solid var(--border-light)',
                                                borderRadius: '0.5rem'
                                            }}
                                        />

                                        <div style={{display: 'flex', gap: '1rem', justifyContent: 'space-between'}}>
                                            <div>
                                                <span style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>
                                                    Zeilen: {parsedLyrics.length}
                                                </span>
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                onClick={processBatchLyrics}
                                                disabled={!batchLyricsText.trim()}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                     fill="none" stroke="currentColor" strokeWidth="2"
                                                     strokeLinecap="round" strokeLinejoin="round"
                                                     style={{width: '1.25rem', height: '1.25rem', marginRight: '0.5rem'}}>
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <polyline points="19 12 12 19 5 12"></polyline>
                                                </svg>
                                                Zeilen verarbeiten
                                            </button>
                                        </div>
                                    </div>

                                    {/* Scroll-Container für die Lyric-Buttons */}
                                    <div className="lyrics-queue" style={{
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        padding: '0.5rem',
                                        backgroundColor: 'var(--inner-bg)',
                                        borderRadius: '0.5rem',
                                        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        {parsedLyrics.length > 0 ? (
                                            parsedLyrics.map((lyric, index) => (
                                                <button
                                                    key={index}
                                                    className={`lyric-queue-btn ${nextLyricIndex === index ? 'next-lyric' : ''}`}
                                                    onClick={() => addLyricFromQueue(lyric, index)}
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '1rem',
                                                        marginBottom: '0.5rem',
                                                        backgroundColor: nextLyricIndex === index ? 'rgba(139, 92, 246, 0.2)' : 'var(--card-bg)',
                                                        color: 'var(--text-light)',
                                                        border: '1px solid',
                                                        borderColor: nextLyricIndex === index ? 'var(--primary)' : 'var(--border-light)',
                                                        borderRadius: '0.5rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        boxShadow: nextLyricIndex === index ? '0 0 10px rgba(139, 92, 246, 0.3)' : 'none'
                                                    }}
                                                >
                                                    {lyric}
                                                    {nextLyricIndex === index && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '0.25rem',
                                                            right: '0.5rem',
                                                            backgroundColor: 'var(--primary)',
                                                            color: 'white',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            NÄCHSTE
                                                        </div>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="empty-queue" style={{
                                                textAlign: 'center',
                                                padding: '2rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                     fill="none" stroke="currentColor" strokeWidth="2"
                                                     strokeLinecap="round" strokeLinejoin="round"
                                                     style={{
                                                         width: '3rem',
                                                         height: '3rem',
                                                         margin: '0 auto 1rem auto',
                                                         color: 'var(--text-dimmed)'
                                                     }}>
                                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                                </svg>
                                                <p>Füge Lyrics im Textfeld oben ein und klicke auf "Zeilen verarbeiten"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Anleitung */}
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '1rem',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        borderRadius: '0.5rem',
                                        borderLeft: '4px solid var(--accent)',
                                    }}>
                                        <h3 style={{
                                            marginTop: 0,
                                            marginBottom: '0.5rem',
                                            fontSize: '1rem',
                                            color: 'var(--accent-light)',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                 fill="none" stroke="currentColor" strokeWidth="2"
                                                 strokeLinecap="round" strokeLinejoin="round"
                                                 style={{width: '1rem', height: '1rem', marginRight: '0.5rem'}}>
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                            </svg>
                                            Anleitung
                                        </h3>
                                        <ol style={{margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)'}}>
                                            <li>Füge alle Liedzeilen oben ein</li>
                                            <li>Klicke auf "Zeilen verarbeiten"</li>
                                            <li>Spiele das Lied ab</li>
                                            <li>Klicke auf den nächsten Lyric-Button, wenn die Stelle im Song erreicht ist</li>
                                            <li>Wiederhole für alle Lyrics, bis die Liste leer ist</li>
                                        </ol>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* JSON output */}
                        <section className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">
                                    <span className="card-number">6</span>
                                    JSON generieren
                                </h2>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={generateJson}
                                        className="btn btn-primary"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                             fill="none" stroke="currentColor" strokeWidth="2"
                                             strokeLinecap="round" strokeLinejoin="round">
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
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                             fill="none" stroke="currentColor" strokeWidth="2"
                                             strokeLinecap="round" strokeLinejoin="round">
                                            <path
                                                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
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
                                        onClick={() => {
                                            navigator.clipboard.writeText(jsonOutput)
                                        }}
                                        className="json-copy-btn"
                                        title="In die Zwischenablage kopieren"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                             fill="none" stroke="currentColor" strokeWidth="2"
                                             strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2"
                                                  ry="2"></rect>
                                            <path
                                                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="empty-json">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2"
                                         strokeLinecap="round" strokeLinejoin="round">
                                        <path
                                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <path d="M10 12a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2h-4z"></path>
                                    </svg>
                                    <p>Klicke auf "Generieren", um das JSON für deine<br/>Karaoke-App
                                        zu erstellen</p>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
            <footer className="app-footer">
                jackson Karaoke JSON Generator | Made with ❤️ by Martin Pfeffer
            </footer>
        </div>
    );
};

export default KaraokeJsonGenerator;