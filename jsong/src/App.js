import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';

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
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#2C2E3B] to-[#20222F] text-gray-100 font-sans">
            <header className="p-6 bg-gradient-to-r from-[#262836] to-[#2A2C3D] shadow-lg border-b border-purple-900/20">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">jSong</h1>
                <p className="text-purple-300/70 mt-1">Karaoke JSON Generator</p>
            </header>

            <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
                {/* Audio upload section */}
                <div className="bg-[#333545]/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-purple-500/10 transition-all hover:border-purple-500/20">
                    <h2 className="text-xl font-semibold mb-5 flex items-center text-purple-200">
                        <span className="bg-purple-600/70 h-8 w-8 rounded-lg flex items-center justify-center mr-3 shadow-md">1</span>
                        Audio hochladen
                    </h2>
                    <label className="block w-full">
                        <div className="flex flex-col items-center justify-center w-full bg-[#2A2C3A] border-2 border-dashed border-[#4A4C5C] p-6 rounded-lg cursor-pointer hover:bg-[#303243] hover:border-purple-500/50 transition-all duration-300">
                            <svg className="w-10 h-10 text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                            </svg>
                            <p className="text-purple-300 text-lg">{audioFile ? audioFile.name : 'MP3-Datei auswählen'}</p>
                            <p className="text-purple-400/50 text-sm mt-1">{!audioFile && 'oder hierher ziehen'}</p>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                    </label>
                </div>

                {audioUrl && (
                    <>
                        {/* Audio player */}
                        <div className="bg-[#333545]/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-purple-500/10 transition-all hover:border-purple-500/20">
                            <h2 className="text-xl font-semibold mb-5 flex items-center text-purple-200">
                                <span className="bg-purple-600/70 h-8 w-8 rounded-lg flex items-center justify-center mr-3 shadow-md">2</span>
                                Audio steuern
                            </h2>

                            <div className="flex items-center space-x-4 mb-6">
                                <button
                                    onClick={togglePlayback}
                                    className={`${isPlaying ? 'bg-purple-500' : 'bg-blue-600'} hover:bg-opacity-90 px-6 py-3 rounded-lg w-32 shadow-lg flex items-center justify-center transition-all duration-300 font-medium`}
                                >
                                    <span className="mr-2">{isPlaying ? "⏸" : "▶️"}</span>
                                    {isPlaying ? "Pause" : "Play"}
                                </button>
                                <div className="bg-[#242634] py-2 px-4 rounded-lg shadow-inner text-center min-w-24">
                                    <span className="text-lg font-mono text-purple-200">{formatTime(currentTime)}</span>
                                    <span className="text-gray-500 mx-2">/</span>
                                    <span className="text-lg font-mono text-gray-400">{formatTime(duration)}</span>
                                </div>
                            </div>

                            <audio ref={audioRef} src={audioUrl} />

                            <div className="relative w-full h-4 bg-[#242634] rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                />
                                <div className="absolute top-0 left-0 w-full h-full flex items-center">
                                    <div
                                        className="h-6 w-6 rounded-full bg-white shadow-lg -ml-3 cursor-pointer"
                                        style={{ marginLeft: `${(currentTime / duration) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lyrics editor */}
                        <div className="bg-[#333545]/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-purple-500/10 transition-all hover:border-purple-500/20">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-semibold flex items-center text-purple-200">
                                    <span className="bg-purple-600/70 h-8 w-8 rounded-lg flex items-center justify-center mr-3 shadow-md">3</span>
                                    Lyrics hinzufügen
                                </h2>
                                <button
                                    onClick={addLyricLine}
                                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-5 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center text-white font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Zeile bei {formatTime(currentTime)}
                                </button>
                            </div>

                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366F1 #242634' }}>
                                {lyrics.map((lyric, index) => (
                                    <div
                                        key={lyric.id}
                                        className={`p-4 border rounded-lg ${
                                            index === currentLyricIndex
                                                ? 'border-purple-500 bg-[#383A52] shadow-md'
                                                : 'border-[#4A4C5C] bg-[#2A2C3A] hover:bg-[#323445] transition-colors duration-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm ${index === currentLyricIndex ? 'text-purple-300' : 'text-gray-400'} flex items-center`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Start: {formatTime(lyric.startTime)}
                      </span>
                                            <span className="text-sm text-blue-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                                                {lyric.pitchTargets.length} Pitch-Punkte
                      </span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={lyric.text}
                                                onChange={(e) => updateLyricText(lyric.id, e.target.value)}
                                                className="w-full bg-[#1E202A] p-3 rounded-lg border border-[#4A4C5C] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-inner text-white transition-all duration-200"
                                                placeholder="Lyric text eingeben..."
                                            />
                                            <div className="absolute right-3 top-3 text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {lyrics.length === 0 && (
                                    <div className="text-center p-8 border border-dashed border-[#4A4C5C] rounded-lg text-gray-400 bg-[#2A2C3A]/50">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg">Klicke auf "+ Zeile" während der Wiedergabe,<br />um Lyrics zu erfassen</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pitch analysis */}
                        <div className="bg-[#333545]/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-purple-500/10 transition-all hover:border-purple-500/20">
                            <h2 className="text-xl font-semibold mb-5 flex items-center text-purple-200">
                                <span className="bg-purple-600/70 h-8 w-8 rounded-lg flex items-center justify-center mr-3 shadow-md">4</span>
                                Pitch analysieren
                            </h2>
                            <div className="flex items-center space-x-4 mb-4">
                                <button
                                    onClick={isAnalyzing ? stopPitchAnalysis : startPitchAnalysis}
                                    className={`flex items-center px-5 py-3 rounded-lg shadow-lg transition-all duration-300 font-medium ${
                                        isAnalyzing
                                            ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
                                            : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                                    }`}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                            </svg>
                                            Analyse stoppen
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                            </svg>
                                            Analyse starten
                                        </>
                                    )}
                                </button>
                                <div className={`flex items-center space-x-2 text-gray-300 bg-[#242634] py-2 px-4 rounded-lg transition-opacity duration-300 ${isAnalyzing ? 'opacity-100' : 'opacity-70'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isAnalyzing ? 'text-green-400 animate-pulse' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                    </svg>
                                    <span>{isAnalyzing ? 'Singe mit, um Pitch-Daten zu erfassen' : 'Mikrofon erforderlich'}</span>
                                </div>
                            </div>

                            {pitchData.length > 0 ? (
                                <div className="mt-4 h-40 bg-[#242634] rounded-lg p-3 relative overflow-hidden shadow-inner border border-[#4A4C5C]">
                                    <div className="absolute inset-0 grid grid-cols-12 grid-rows-4 gap-px opacity-20">
                                        {Array(48).fill(0).map((_, i) => (
                                            <div key={i} className="border-t border-l border-gray-700"></div>
                                        ))}
                                    </div>
                                    {pitchData.map((data, index) => (
                                        <div
                                            key={index}
                                            className="absolute w-1.5 bg-gradient-to-t from-blue-400 to-purple-400 rounded-t transition-all duration-300"
                                            style={{
                                                height: `${Math.min(data.pitch / 4, 100)}%`,
                                                bottom: 0,
                                                left: `${(data.time / duration) * 100}%`,
                                                opacity: 0.7 + Math.min(data.pitch / 500, 0.3)
                                            }}
                                        >
                                            <div className="h-2 w-2 bg-purple-300 rounded-full relative -top-1 -left-0.25 shadow-glow" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 h-40 bg-[#242634] rounded-lg flex flex-col items-center justify-center p-4 border border-dashed border-[#4A4C5C] text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <p>Starte die Analyse und singe, um Pitch-Daten zu sammeln</p>
                                </div>
                            )}
                        </div>

                        {/* JSON output */}
                        <div className="bg-[#333545]/80 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-purple-500/10 transition-all hover:border-purple-500/20">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-semibold flex items-center text-purple-200">
                                    <span className="bg-purple-600/70 h-8 w-8 rounded-lg flex items-center justify-center mr-3 shadow-md">5</span>
                                    JSON generieren
                                </h2>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={generateJson}
                                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-5 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center font-medium"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Generieren
                                    </button>
                                    <button
                                        onClick={downloadJson}
                                        disabled={!jsonOutput}
                                        className={`px-5 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center font-medium ${
                                            jsonOutput
                                                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                                                : 'bg-gray-600 bg-opacity-50 cursor-not-allowed text-gray-400'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Download
                                    </button>
                                </div>
                            </div>

                            {jsonOutput ? (
                                <div className="relative">
                  <pre className="bg-[#212330] p-5 rounded-lg overflow-x-auto text-sm font-mono text-gray-300 max-h-96 overflow-y-auto border border-[#4A4C5C] shadow-inner">
                    <code>{jsonOutput}</code>
                  </pre>
                                    <button
                                        onClick={() => {navigator.clipboard.writeText(jsonOutput)}}
                                        className="absolute top-4 right-4 bg-[#3D3F50] p-2 rounded-md hover:bg-[#4A4C5C] transition-colors duration-200"
                                        title="In die Zwischenablage kopieren"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-[#242634] border border-dashed border-[#4A4C5C] rounded-lg p-8 text-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-lg">Klicke auf "Generieren", um das JSON für deine<br />Karaoke-App zu erstellen</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
            <footer className="py-4 px-6 bg-[#262836] border-t border-purple-900/20 text-center text-sm text-gray-500">
                jSong Karaoke JSON Generator | Made with ♥
            </footer>
        </div>
    );
};

export default KaraokeJsonGenerator;