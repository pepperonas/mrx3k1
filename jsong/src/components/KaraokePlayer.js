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
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Neue Konfigurationsoptionen
    const [defaultEndTimeDuration, setDefaultEndTimeDuration] = useState(3);
    const [markerOffset, setMarkerOffset] = useState(-2);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [generateEmptyPitchTargets, setGenerateEmptyPitchTargets] = useState(true);
    const [autoSortLyrics, setAutoSortLyrics] = useState(true);

    const audioRef = useRef(null);
    const analyser = useRef(null);
    const microphone = useRef(null);

    // Neue Refs für stabilere Datenhaltung
    const lastValidLyricIndexRef = useRef(-1);
    const checkingLyricIndexRef = useRef(false);
    const pitchTargetsRef = useRef({});  // Speichert Pitch-Targets für jeden Lyric
    const lyricTextInputsRef = useRef({}); // Speichert Texteingaben temporär
    const uiRefreshBlockerRef = useRef(false); // Verhindert zu häufige UI-Updates

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

    // Update current time when audio is playing - VERBESSERT
    useEffect(() => {
        if (audioRef.current) {
            const updateTime = () => {
                // Aktualisiere Zeit ohne UI-Refresh zu triggern
                const newTime = audioRef.current.currentTime;

                // Nur Zeit-Update, kein Lyric-Index-Update
                setCurrentTime(newTime);

                // Finde aktuellen Lyric nur alle 500ms (reduziert UI-Updates)
                if (!uiRefreshBlockerRef.current) {
                    uiRefreshBlockerRef.current = true;

                    // Finde aktuellen Lyric
                    if (lyrics.length > 0) {
                        let foundIndex = -1;

                        for (let i = 0; i < lyrics.length; i++) {
                            const lyric = lyrics[i];
                            const nextLyric = lyrics[i + 1];

                            if (newTime >= lyric.startTime) {
                                if (nextLyric) {
                                    if (newTime < nextLyric.startTime) {
                                        foundIndex = i;
                                        break;
                                    }
                                } else {
                                    foundIndex = i;
                                    break;
                                }
                            }
                        }

                        // Setze den Index, aber nur wenn er sich ändert
                        if (foundIndex !== currentLyricIndex) {
                            console.log(`Lyric Index geändert: ${currentLyricIndex} -> ${foundIndex}`);
                            setCurrentLyricIndex(foundIndex);
                            lastValidLyricIndexRef.current = foundIndex >= 0 ? foundIndex : lastValidLyricIndexRef.current;
                        }
                    }

                    // Erlaube Updates erst nach 500ms wieder
                    setTimeout(() => {
                        uiRefreshBlockerRef.current = false;
                    }, 500);
                }
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

    // Add new lyric line with default endTime - VERBESSERT
    const addLyricLine = () => {
        // Berechne die Startzeit mit dem Offset
        const offsetStartTime = currentTime + markerOffset;
        const startTime = Math.round(Math.max(offsetStartTime, 0) * 10) / 10;
        const calculatedEndTime = startTime + defaultEndTimeDuration;
        const endTime = Math.round(Math.min(calculatedEndTime, duration) * 10) / 10;

        const newLyric = {
            id: Date.now(),
            text: '',
            startTime: startTime,
            endTime: endTime,
            pitchTargets: []
        };

        // Aktualisiere lokalen State
        const updatedLyrics = [...lyrics, newLyric];
        setLyrics(updatedLyrics);

        console.log(`Neuer Lyric hinzugefügt: startTime=${startTime}s, endTime=${endTime}s`);
        console.log(`Aktuelle Lyrics-Array Länge: ${updatedLyrics.length}`);

        // Finde passenden Index, aber ohne sofortiges UI-Update
        const newIndex = updatedLyrics.findIndex((lyric, idx) => {
            const nextLyric = updatedLyrics[idx + 1];
            if (nextLyric) {
                return currentTime >= lyric.startTime && currentTime < nextLyric.startTime;
            }
            return currentTime >= lyric.startTime;
        });

        if (newIndex >= 0) {
            lastValidLyricIndexRef.current = newIndex;

            // Verzögere das Index-Update um UI-Flickering zu verhindern
            setTimeout(() => {
                setCurrentLyricIndex(newIndex);
                console.log(`Nach Hinzufügen: Zeit=${currentTime.toFixed(2)}s, Index=${newIndex} (gespeichert)`);
            }, 100);
        }
    };

    // Update lyric text - VERBESSERT
    const updateLyricText = (id, text) => {
        // Speichere Text in Ref für schnelles Zugreifen ohne UI-Update
        lyricTextInputsRef.current[id] = text;

        // Throttle das Update des Lyrics-Arrays (weniger UI-Updates)
        if (!uiRefreshBlockerRef.current) {
            uiRefreshBlockerRef.current = true;

            setTimeout(() => {
                // Sammle alle Textänderungen und wende sie auf einmal an
                const updatedLyrics = lyrics.map(lyric => {
                    if (lyricTextInputsRef.current[lyric.id] !== undefined) {
                        return {...lyric, text: lyricTextInputsRef.current[lyric.id]};
                    }
                    return lyric;
                });

                setLyrics(updatedLyrics);
                uiRefreshBlockerRef.current = false;
            }, 500); // Verzögerung für Updates
        }
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

    // Detect pitch from frequency data - VERBESSERT
    const detectPitch = (frequencyData) => {
        // Finde den höchsten Wert und seinen Index
        let maxIndex = 0;
        let maxValue = -Infinity; // Starte bei minus unendlich um sicherzustellen, dass negative Werte auch erfasst werden

        // Ausgabe der ersten 10 Werte für Debugging
        console.log("FFT Samples:", Array.from(frequencyData).slice(0, 10));

        for (let i = 0; i < frequencyData.length; i++) {
            // Konvertiere zu number falls es ein TypedArray ist
            const value = Number(frequencyData[i]);
            if (value > maxValue) {
                maxValue = value;
                maxIndex = i;
            }
        }

        // Debug-Ausgabe zum Status
        console.log(`FFT Max Value: ${maxValue} at index ${maxIndex}`);

        // Wir ignorieren den negativen Wert und arbeiten nur mit dem absoluten Betrag
        const absValue = Math.abs(maxValue);

        // Deutlich reduzierter Schwellenwert (von 100 auf 20)
        if (absValue > 20) {
            // Convert FFT bin index to frequency
            const nyquist = 22050; // Half the sample rate
            const frequency = maxIndex * nyquist / frequencyData.length;

            // Konvertiere zu MIDI Notennummer
            const noteNumber = 12 * Math.log2(frequency / 440) + 69;
            const roundedNote = Math.round(noteNumber);

            console.log(`Erkannte Frequenz: ${frequency.toFixed(1)} Hz, MIDI Note: ${roundedNote}`);
            return roundedNote;
        } else {
            console.log(`Schwellenwert nicht erreicht: ${absValue} < 20`);
        }

        return null;
    };

    // NEUE FUNKTION: Synchronisiere Pitch-Targets mit Lyrics
    const syncPitchTargetsToLyrics = () => {
        // Kopiere aktuelle Lyrics
        const updatedLyrics = [...lyrics];

        // Füge die gesammelten Pitch-Targets hinzu
        Object.keys(pitchTargetsRef.current).forEach(index => {
            const numIndex = parseInt(index);
            if (updatedLyrics[numIndex]) {
                updatedLyrics[numIndex].pitchTargets = [...pitchTargetsRef.current[numIndex]];
            }
        });

        // Aktualisiere den State (löst Rerendering aus)
        setLyrics(updatedLyrics);
        console.log("Pitch-Targets mit Lyrics synchronisiert");
    };

    // Analyze pitch for microphone input - KOMPLETT ÜBERARBEITET
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

            // Füge eine Force-Recording-Variable hinzu
            let forceRecording = false;
            // Button zum Umschalten hinzufügen
            const forceRecordingButton = document.createElement('button');
            forceRecordingButton.innerHTML = "Force Recording: OFF";
            forceRecordingButton.style.padding = "8px";
            forceRecordingButton.style.background = "#333";
            forceRecordingButton.style.color = "white";
            forceRecordingButton.style.border = "1px solid #666";
            forceRecordingButton.style.borderRadius = "4px";
            forceRecordingButton.style.marginLeft = "10px";

            // Füge den Button neben dem Analyse-Button ein
            const analysisControls = document.querySelector('.analysis-controls');
            if (analysisControls) {
                analysisControls.appendChild(forceRecordingButton);
            }

            forceRecordingButton.addEventListener('click', () => {
                forceRecording = !forceRecording;
                forceRecordingButton.innerHTML = `Force Recording: ${forceRecording ? 'ON' : 'OFF'}`;
                forceRecordingButton.style.background = forceRecording ? "#8b5cf6" : "#333";
                console.log(`Force Recording: ${forceRecording ? 'ON' : 'OFF'}`);
            });

            const analyzeInterval = setInterval(() => {
                if (analyser.current) {
                    const frequencyData = analyser.current.getValue();
                    // Pitch erkennen mit verbesserter Funktion
                    const pitch = detectPitch(frequencyData);

                    // Ob wir einen Pitch haben oder nicht, wir erfassen immer den Max-Wert
                    const maxVal = Array.from(frequencyData).reduce((max, val) => Math.max(max, val), -Infinity);
                    console.log(`Max Freq: ${maxVal.toFixed(1)}, Pitch: ${pitch || 'keiner'}, Lyric Index: ${currentLyricIndex}`);

                    // WICHTIG: Verwende den effektiven Index
                    const effectiveLyricIndex = currentLyricIndex >= 0 ?
                        currentLyricIndex :
                        lastValidLyricIndexRef.current;

                    // Entweder wir haben einen Pitch und einen gültigen Index, oder wir forcieren die Aufnahme
                    if ((pitch && (effectiveLyricIndex >= 0 || forceRecording))) {
                        // Pitch-Daten für die Visualisierung aktualisieren
                        const newPitchData = [...pitchData];
                        newPitchData.push({
                            time: currentTime,
                            pitch: pitch
                        });
                        setPitchData(newPitchData);

                        // Nur wenn wir einen gültigen Index haben ODER im Force-Modus sind
                        if (effectiveLyricIndex >= 0) {
                            // WICHTIG: Speicher die Pitch-Targets in der Ref statt direkt in lyrics
                            // Dies verhindert zu viele State-Updates und UI-Rerender
                            if (!pitchTargetsRef.current[effectiveLyricIndex]) {
                                pitchTargetsRef.current[effectiveLyricIndex] = [];
                            }

                            // Füge Pitch-Target zur Ref hinzu
                            pitchTargetsRef.current[effectiveLyricIndex].push({
                                time: currentTime - lyrics[effectiveLyricIndex].startTime,
                                pitch: pitch
                            });

                            const targetCount = pitchTargetsRef.current[effectiveLyricIndex].length;
                            console.log(`Pitch ${pitch} hinzugefügt, jetzt ${targetCount} Targets für Lyric "${lyrics[effectiveLyricIndex].text || '(kein Text)'}" bei Index ${effectiveLyricIndex}`);

                            // Nur alle 5 Targets den State aktualisieren
                            if (targetCount % 5 === 0) {
                                syncPitchTargetsToLyrics();
                            }
                        } else if (forceRecording) {
                            console.log(`Force Recording aktiv: Pitch ${pitch} erfasst, aber kein Lyric ausgewählt.`);
                        }
                    }
                }
            }, 200);

            return () => {
                if (forceRecordingButton.parentNode) {
                    forceRecordingButton.parentNode.removeChild(forceRecordingButton);
                }

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

    // NEUE FUNKTION: Vorbereitung für JSON-Generierung
    const prepareJsonGeneration = () => {
        // Synchronisiere alle Pitch-Targets mit den Lyrics vor der JSON-Generierung
        syncPitchTargetsToLyrics();

        // Kleine Verzögerung, damit React Zeit hat, den State zu aktualisieren
        return new Promise(resolve => setTimeout(resolve, 200));
    };

    // Generate JSON output with endTime for each lyric - VERBESSERT
    const generateJson = async () => {
        // Stelle sicher, dass alle Pitch-Targets im lyrics-Array sind
        await prepareJsonGeneration();

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

            // PitchTargets einschließen, falls vorhanden oder wenn leere Arrays erzwungen werden
            if (lyric.pitchTargets.length > 0 || generateEmptyPitchTargets) {
                processedLyric.pitchTargets = lyric.pitchTargets.map(target => ({
                    time: parseFloat(target.time.toFixed(2)),
                    pitch: parseFloat(target.pitch.toFixed(2))
                }));
            }

            return processedLyric;
        });

        const output = {
            songName: audioFile?.name.replace(/\.[^/.]+$/, "") || "Unnamed Song",
            duration: parseFloat(duration.toFixed(6)),
            lyrics: processedLyrics
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

                        {/* JSON Configuration */}
                        <section className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">
                                    <span className="card-number">3</span>
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
                                        <input
                                            type="checkbox"
                                            id="generateEmptyPitchTargets"
                                            checked={generateEmptyPitchTargets}
                                            onChange={() => setGenerateEmptyPitchTargets(!generateEmptyPitchTargets)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="generateEmptyPitchTargets"
                                               className="text-primary-light">
                                            Leere pitchTargets für Lyrics ohne Pitch-Daten erzeugen
                                        </label>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Lyrics editor */}
                        <section className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="card-title">
                                    <span className="card-number">4</span>
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
                        </section>

                        {/* Pitch analysis */}
                        <section className="card">
                            <h2 className="card-title">
                                <span className="card-number">5</span>
                                Pitch analysieren
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
                                    <p>Starte die Analyse und singe, um Pitch-Daten zu sammeln</p>
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
                jsong Karaoke JSON Generator | Made with ❤️ by Martin Pfeffer
            </footer>
        </div>
    );
};

export default KaraokeJsonGenerator;