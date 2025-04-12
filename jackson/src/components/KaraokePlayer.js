import React, {useCallback, useEffect, useRef, useState} from 'react';
// Entferne Tone.js Import, um komplett auf native Web Audio API umzusteigen
// import * as Tone from 'tone';
import '../App.css';
import '../Player.css';
import '../Debug.css';
import LyricsDisplay from './LyricsDisplay';
import PitchVisualizer from './PitchVisualizer';

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
    const lyricsDisplayRef = useRef(null);
    const timeUpdateIntervalRef = useRef(null);
    const firstPlayRef = useRef(true);

    // Refs für die optimierte Lyric-Index-Aktualisierung
    const currentLyricIndexRef = useRef(-1);
    const timeUpdateCounterRef = useRef(0);

    // Neue Refs für Web Audio API
    const audioContextRef = useRef(null);
    const sourceRef = useRef(null);
    const nativeAnalyserRef = useRef(null);
    const streamRef = useRef(null);

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

        // Durchsuche alle Lyrics und finde den passenden für die aktuelle Zeit
        for (let i = 0; i < songData.lyrics.length; i++) {
            const lyric = songData.lyrics[i];

            // Stellen wir sicher, dass startTime und endTime numerisch sind
            const startTime = parseFloat(lyric.startTime);
            const endTime = parseFloat(lyric.endTime);

            // Prüfe, ob die aktuelle Zeit im Bereich des Lyrics liegt (zwischen startTime und endTime)
            if (!isNaN(startTime) && !isNaN(endTime)) {
                if (time >= startTime && time < endTime) {
                    if (debugMode) {
                        console.log(`Found lyric index ${i} (${lyric.text}) using time range: ${startTime} to ${endTime}`);
                    }
                    return i;
                }
            }
        }

        // Wenn kein aktiver Lyric gefunden wurde, versuche einen Fallback-Wert zu ermitteln

        // Wenn die Zeit vor dem ersten Lyric liegt
        if (songData.lyrics[0]) {
            const firstStartTime = parseFloat(songData.lyrics[0].startTime);
            if (!isNaN(firstStartTime) && time < firstStartTime) {
                if (debugMode) {
                    console.log(`Time ${time.toFixed(2)} is before the first lyric`);
                }
                return -1;
            }
        }

        // Wenn die Zeit nach dem letzten Lyric liegt
        const lastLyric = songData.lyrics[songData.lyrics.length - 1];
        if (lastLyric) {
            const lastEndTime = parseFloat(lastLyric.endTime);
            if (!isNaN(lastEndTime) && time >= lastEndTime) {
                if (debugMode) {
                    console.log(`Time ${time.toFixed(2)} is after the last lyric`);
                }
                return -1;
            }
        }

        // Wenn die Zeit zwischen zwei Lyrics liegt, gib -1 zurück
        // da in diesem Fall kein Lyric aktiv sein sollte
        for (let i = 0; i < songData.lyrics.length - 1; i++) {
            const currentLyric = songData.lyrics[i];
            const nextLyric = songData.lyrics[i + 1];

            const currentEndTime = parseFloat(currentLyric.endTime);
            const nextStartTime = parseFloat(nextLyric.startTime);

            if (!isNaN(currentEndTime) && !isNaN(nextStartTime) &&
                time >= currentEndTime && time < nextStartTime) {
                if (debugMode) {
                    console.log(`Time ${time.toFixed(2)} is between lyrics ${i} and ${i + 1}`);
                }
                return -1;
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

    // Separates Effect für die Aktualisierung des currentLyricIndex
    // basierend auf currentTime
    useEffect(() => {
        if (!songData || !songData.lyrics || !audioRef.current) return;

        // Aktualisiere den Index basierend auf der aktuellen Zeit
        const foundIndex = findCurrentLyricIndex(currentTime);

        // Nur aktualisieren, wenn sich der Index tatsächlich geändert hat
        if (foundIndex !== currentLyricIndexRef.current) {
            if (debugMode) {
                console.log(`Lyric Index geändert: ${currentLyricIndexRef.current} -> ${foundIndex} (Zeit: ${currentTime.toFixed(2)}s)`);
            }

            // Aktualisiere sowohl den State als auch die Ref
            setCurrentLyricIndex(foundIndex);
            currentLyricIndexRef.current = foundIndex;

            // Aktualisiere den targetPitch
            updateTargetPitch(foundIndex, currentTime);
        }
    }, [currentTime, songData]); // Entscheidend: Kein currentLyricIndex in den Abhängigkeiten!

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
        console.log("Current Lyric Index Ref:", currentLyricIndexRef.current);
        console.log("Web Audio:", {
            audioContext: audioContextRef.current?.state,
            stream: streamRef.current?.active,
            analyser: !!nativeAnalyserRef.current
        });

        if (songData && songData.lyrics) {
            console.log("Lyrics count:", songData.lyrics.length);
            console.log("Current time check:");

            songData.lyrics.forEach((lyric, idx) => {
                const startTime = parseFloat(lyric.startTime);
                const endTime = parseFloat(lyric.endTime);
                const isCurrentByTime = !isNaN(startTime) && !isNaN(endTime)
                    ? (currentTime >= startTime && currentTime < endTime)
                    : false;

                console.log(
                    `Lyric ${idx}: "${lyric.text.substring(0, 15)}..." - ` +
                    `startTime: ${startTime} - ` +
                    `endTime: ${endTime} - ` +
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

                    // Stelle sicher, dass alle Zeitwerte numerisch sind
                    jsonData.lyrics.forEach(lyric => {
                        if (lyric.startTime !== undefined && typeof lyric.startTime === 'string') {
                            lyric.startTime = parseFloat(lyric.startTime);
                        }
                        if (lyric.endTime !== undefined && typeof lyric.endTime === 'string') {
                            lyric.endTime = parseFloat(lyric.endTime);
                        }
                    });

                    // Sortiere Lyrics nach startTime
                    jsonData.lyrics.sort((a, b) => a.startTime - b.startTime);

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
            currentLyricIndexRef.current = -1;
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
                if (!audioRef.current || !songData || !songData.lyrics) return;

                const newTime = audioRef.current.currentTime;
                setCurrentTime(newTime);
                updateDomTime(newTime);

                // Erhöhe den Counter für Debug-Zwecke
                timeUpdateCounterRef.current++;

                if (debugMode && timeUpdateCounterRef.current % 10 === 0) {
                    console.log(`Time update event #${timeUpdateCounterRef.current}, time: ${newTime.toFixed(2)}s`);
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
                audioElement.removeEventListener('play', () => {});
                audioElement.removeEventListener('error', () => {});
            };
        }
    }, [audioUrl, songData]);

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

    // HIER BEGINNT DER NEUE ERSATZCODE - Play/pause Audio und die Pitch-Analyse-Funktionen
    // Ersetzt die alten Tone.js-basierten Funktionen

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                if (isAnalyzing) {
                    stopPitchAnalysis();
                }
            } else {
                audioRef.current.play()
                    .then(() => {
                        console.log("Audio playback started successfully");
                        if (!isAnalyzing) {
                            startPitchAnalysis();
                        }
                    })
                    .catch(error => {
                        console.error('Error playing audio:', error);
                        alert("Fehler beim Abspielen: " + error.message);
                    });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const startPitchAnalysis = async () => {
        setIsAnalyzing(true);

        try {
            // Erstelle AudioContext wenn nicht vorhanden
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                console.log("AudioContext erstellt:", audioContextRef.current.state);
            }

            // Starte den AudioContext falls er suspendiert ist
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
                console.log("AudioContext resumed:", audioContextRef.current.state);
            }

            // Fordere Mikrofon-Zugriff an
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;
            console.log("Mikrofonzugriff erhalten:", stream.active);

            // Erstelle MediaStreamSource
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

            // Erstelle Analyser
            nativeAnalyserRef.current = audioContextRef.current.createAnalyser();
            nativeAnalyserRef.current.fftSize = 2048; // Größerer Wert für genauere Frequenzanalyse
            nativeAnalyserRef.current.smoothingTimeConstant = 0.8; // Einstellbar für weniger flackern (0-1)

            // Verbinde Source mit Analyser
            sourceRef.current.connect(nativeAnalyserRef.current);
            console.log("Audio-Analyse-Pipeline eingerichtet");

            // Start analysis loop
            const analyzeInterval = setInterval(() => {
                if (nativeAnalyserRef.current) {
                    try {
                        // Erstelle Array für Frequenzdaten
                        const dataArray = new Float32Array(nativeAnalyserRef.current.frequencyBinCount);

                        // Hole aktuelles Frequenzspektrum
                        nativeAnalyserRef.current.getFloatFrequencyData(dataArray);

                        // Debug-Logging
                        if (debugMode && timeUpdateCounterRef.current % 20 === 0) {
                            // Finde Min/Max/Durchschnitt
                            let min = Infinity;
                            let max = -Infinity;
                            let sum = 0;

                            for (let i = 0; i < dataArray.length; i++) {
                                min = Math.min(min, dataArray[i]);
                                max = Math.max(max, dataArray[i]);
                                sum += dataArray[i];
                            }

                            const avg = sum / dataArray.length;
                            console.log(`Frequenzdaten: Min=${min.toFixed(1)}dB, Max=${max.toFixed(1)}dB, Avg=${avg.toFixed(1)}dB`);
                        }

                        // Pitch-Erkennung
                        const pitch = detectPitch(dataArray);

                        if (pitch) {
                            setCurrentPitch(pitch);

                            // History aktualisieren
                            setPitchHistory(prev => {
                                const newHistory = [...prev, {time: currentTime, pitch}];
                                if (newHistory.length > 100) {
                                    return newHistory.slice(newHistory.length - 100);
                                }
                                return newHistory;
                            });

                            // Score aktualisieren
                            if (targetPitch) {
                                const pitchDifference = Math.abs(pitch - targetPitch);
                                if (pitchDifference <= 2) {
                                    setScore(prev => prev + 10); // Perfect
                                } else if (pitchDifference <= 4) {
                                    setScore(prev => prev + 5);  // Good
                                } else if (pitchDifference <= 7) {
                                    setScore(prev => prev + 2);  // Okay
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Fehler bei der Frequenzanalyse:", err);
                    }
                }
            }, 100);

            timeUpdateIntervalRef.current = analyzeInterval;
        } catch (err) {
            console.error("Fehler beim Zugriff auf das Mikrofon:", err);
            alert("Mikrofonzugriff fehlgeschlagen. Bitte erlaube den Zugriff in den Browser-Einstellungen.");
            setIsAnalyzing(false);
        }
    };

    const stopPitchAnalysis = () => {
        setIsAnalyzing(false);

        // Bereinige Intervall
        if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
            timeUpdateIntervalRef.current = null;
        }

        // Bereinige Audio-Stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Trenne MediaStreamSource
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // Bereinige Analyser
        if (nativeAnalyserRef.current) {
            nativeAnalyserRef.current.disconnect();
            nativeAnalyserRef.current = null;
        }

        console.log("Pitch-Analyse gestoppt und bereinigt");
    };

    const detectPitch = (frequencyData) => {
        if (!frequencyData || frequencyData.length === 0) return null;

        // Finde den dominanten Frequenz-Peak
        let maxIndex = 0;
        let maxValue = -Infinity;

        // Ignoriere sehr niedrige Frequenzen (oft Rauschen)
        const startBin = 10;

        for (let i = startBin; i < frequencyData.length; i++) {
            if (frequencyData[i] > maxValue) {
                maxValue = frequencyData[i];
                maxIndex = i;
            }
        }

        // Log für Debugging
        console.log(`Max frequency value: ${maxValue.toFixed(1)}, index: ${maxIndex}`);

        // Konvertiere Index zu Frequenz
        const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
        const nyquist = sampleRate / 2;
        const frequency = maxIndex * nyquist / (frequencyData.length - 1);

        // Typischer Schwellenwert für Spracherkennung in dB
        // (Web Audio API gibt dB-Werte zurück, meist negativ, z.B. -100 bis -30)
        const THRESHOLD = -60; // Schwellwert in dB, anpassbar

        if (maxValue > THRESHOLD && frequency > 80) { // Setze eine Mindestfrequenz
            // Konvertiere Frequenz zu MIDI-Notennummer
            const noteNumber = 12 * Math.log2(frequency / 440) + 69;
            console.log(`Erkannter Pitch: ${Math.round(noteNumber)} (Freq: ${frequency.toFixed(1)} Hz)`);
            return Math.round(noteNumber);
        }

        console.log(`Kein Pitch erkannt (unter Schwelle ${THRESHOLD} oder zu niedrige Frequenz)`);
        return null;
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
            // Beim Spielstart versuchen wir den Audio Context zu erstellen, falls nötig
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context created:', audioContextRef.current.state);
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
        currentLyricIndexRef.current = -1;
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

    // Manuelles Testen des currentLyricIndex
    const testSetLyricIndex = (index) => {
        if (debugMode) {
            setCurrentLyricIndex(index);
            currentLyricIndexRef.current = index;
            console.log(`Manuell gesetzter Lyric-Index: ${index}`);
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

                            {/* DEBUG: Manuelles Testen von Lyric-Indizes */}
                            {debugMode && (
                                <div className="debug-container" style={{marginTop: '1rem'}}>
                                    <div>Current Lyric Index: {currentLyricIndex}</div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginTop: '0.5rem'
                                    }}>
                                        <button
                                            onClick={() => testSetLyricIndex(0)}
                                            className="btn btn-small btn-outline"
                                        >
                                            Index 0
                                        </button>
                                        <button
                                            onClick={() => testSetLyricIndex(1)}
                                            className="btn btn-small btn-outline"
                                        >
                                            Index 1
                                        </button>
                                        <button
                                            onClick={() => testSetLyricIndex(2)}
                                            className="btn btn-small btn-outline"
                                        >
                                            Index 2
                                        </button>
                                    </div>
                                </div>
                            )}
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
                                        <div>Current Lyric
                                            Index: {currentLyricIndex} (Ref: {currentLyricIndexRef.current})
                                        </div>
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
                Jackson Karaoke Player | Made with ❤️ by Martin Pfeffer
            </footer>
        </div>
    );
};

export default KaraokePlayer;