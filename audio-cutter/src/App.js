import React, { useState, useRef, useEffect } from 'react';

// SVG Icon Components
const ScissorsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
        <path d="M6 9C7.65685 9 9 7.65685 9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9Z" />
        <path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" />
        <path d="M21 11L8.5 6" />
        <path d="M21 13L8.5 18" />
    </svg>
);

const PlayIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const PauseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
);

const SaveIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const ResetIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 4v16l7-8-7-8z" />
        <path d="M23 12c0 5.52-4.48 10-10 10-2.76 0-5.26-1.12-7.07-2.93l1.42-1.42C8.84 19.21 10.83 20 13 20c4.42 0 8-3.58 8-8s-3.58-8-8-8c-2.17 0-4.16.79-5.65 2.35l-1.42-1.42C7.74 3.12 10.24 2 13 2c5.52 0 10 4.48 10 10z" />
    </svg>
);

const MinusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// Inline styles
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '24px',
        backgroundColor: '#2C2E3B',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
    },
    dropZone: {
        width: '100%',
        border: '2px dashed #666',
        borderRadius: '8px',
        height: '256px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: '#383A4A',
    },
    dropText: {
        fontSize: '18px',
        marginBottom: '8px',
    },
    dropSubtext: {
        fontSize: '14px',
        color: '#AAA',
    },
    fileInfo: {
        width: '100%',
        marginBottom: '16px',
    },
    fileName: {
        fontSize: '18px',
        fontWeight: '500',
    },
    fileDetails: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: '#AAA',
    },
    waveformContainer: {
        position: 'relative',
        marginBottom: '16px',
        border: '1px solid #555',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#383A4A',
        width: '100%',
    },
    canvas: {
        width: '100%',
        cursor: 'pointer',
    },
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        width: '100%',
    },
    timeDisplay: {
        fontSize: '14px',
        fontFamily: 'monospace',
    },
    buttonsGroup: {
        display: 'flex',
        gap: '8px',
    },
    button: {
        padding: '8px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        backgroundColor: '#4C6EF5',
    },
    trimButton: {
        backgroundColor: '#9C36B5',
    },
    saveButton: {
        backgroundColor: '#37B24D',
    },
    resetButton: {
        backgroundColor: '#666',
    },
    speedControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    speedText: {
        fontSize: '14px',
    },
    speedButton: {
        padding: '4px',
        fontSize: '12px',
        borderRadius: '4px',
        backgroundColor: '#555',
        border: 'none',
        cursor: 'pointer',
    },
    sliders: {
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        width: '100%',
    },
    sliderGroup: {
        flex: 1,
    },
    sliderLabel: {
        display: 'block',
        fontSize: '14px',
        marginBottom: '4px',
    },
    slider: {
        width: '100%',
    }
};

export default function AudioCutter() {
    const [file, setFile] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [startMarker, setStartMarker] = useState(0);
    const [endMarker, setEndMarker] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [waveformData, setWaveformData] = useState([]);
    const [isTrimmed, setIsTrimmed] = useState(false);
    const [trimmedAudioUrl, setTrimmedAudioUrl] = useState(null);
    const [isPlaybackTransitioning, setIsPlaybackTransitioning] = useState(false);

    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const canvasRef = useRef(null);
    const dragStartRef = useRef(null);

    // Handle file drop or selection
    const handleDrop = (e) => {
        e.preventDefault();

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.includes('audio')) {
                setFile(droppedFile);
                loadAudioFile(droppedFile);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type.includes('audio')) {
                setFile(selectedFile);
                loadAudioFile(selectedFile);
            }
        }
    };

    // Load audio file
    const loadAudioFile = (file) => {
        const objectUrl = URL.createObjectURL(file);

        if (audioRef.current) {
            audioRef.current.src = objectUrl;
            audioRef.current.load();

            audioRef.current.onloadedmetadata = () => {
                setDuration(audioRef.current.duration);
                setEndMarker(audioRef.current.duration);
                setCurrentTime(0);
                analyzeAudio(file);
            };
        }

        setIsTrimmed(false);
        setTrimmedAudioUrl(null);
    };

    // Analyze audio to create waveform data
    const analyzeAudio = async (file) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

            const channelData = audioBuffer.getChannelData(0);
            const samples = 200; // Number of samples to display
            const blockSize = Math.floor(channelData.length / samples);
            const waveform = [];

            for (let i = 0; i < samples; i++) {
                let blockStart = blockSize * i;
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum += Math.abs(channelData[blockStart + j]);
                }
                waveform.push(sum / blockSize);
            }

            setWaveformData(waveform);
        } catch (error) {
            console.error("Error analyzing audio:", error);
            alert("Fehler beim Analysieren der Audiodatei. Bitte versuche es mit einer anderen Datei.");
        }
    };

    // Draw waveform on canvas
    useEffect(() => {
        if (waveformData.length > 0 && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = '#2C2E3B';
            ctx.fillRect(0, 0, width, height);

            // Draw waveform
            const barWidth = width / waveformData.length;

            ctx.fillStyle = '#6C7EE1';

            waveformData.forEach((value, index) => {
                const x = index * barWidth;
                const barHeight = value * height * 3;
                ctx.fillRect(x, (height - barHeight) / 2, barWidth - 1, barHeight);
            });

            // Draw time markers
            const startX = (startMarker / duration) * width;
            const endX = (endMarker / duration) * width;
            const currentX = (currentTime / duration) * width;

            // Selected area
            ctx.fillStyle = 'rgba(80, 100, 240, 0.3)';
            ctx.fillRect(startX, 0, endX - startX, height);

            // Start marker
            ctx.fillStyle = '#50E3C2';
            ctx.fillRect(startX - 2, 0, 4, height);

            // End marker
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(endX - 2, 0, 4, height);

            // Current time
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(currentX - 1, 0, 2, height);
        }
    }, [waveformData, currentTime, startMarker, endMarker, duration]);

    // Update current time during playback
    useEffect(() => {
        let animationFrame;

        const updateTime = () => {
            if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);

                // Check if we've reached the end marker
                if (audioRef.current.currentTime >= endMarker) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = startMarker;
                    setIsPlaying(false);
                } else {
                    animationFrame = requestAnimationFrame(updateTime);
                }
            }
        };

        if (isPlaying) {
            animationFrame = requestAnimationFrame(updateTime);
        }

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [isPlaying, endMarker, startMarker]);

    // Setup audio events
    useEffect(() => {
        const audio = audioRef.current;

        if (!audio) return;

        const handleAudioEnd = () => {
            setIsPlaying(false);
        };

        const handlePlay = () => {
            setIsPlaybackTransitioning(false);
        };

        const handlePause = () => {
            setIsPlaybackTransitioning(false);
        };

        audio.addEventListener('ended', handleAudioEnd);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('ended', handleAudioEnd);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, []);

    // Handle marker dragging on canvas
    const handleCanvasMouseDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const position = (x / canvas.width) * duration;

        // Determine if we're grabbing a marker or setting current time
        const startX = (startMarker / duration) * canvas.width;
        const endX = (endMarker / duration) * canvas.width;

        const isNearStart = Math.abs(x - startX) < 10;
        const isNearEnd = Math.abs(x - endX) < 10;

        if (isNearStart) {
            dragStartRef.current = 'start';
        } else if (isNearEnd) {
            dragStartRef.current = 'end';
        } else {
            dragStartRef.current = 'position';
            setCurrentTime(position);
            if (audioRef.current) {
                audioRef.current.currentTime = position;
            }
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (!dragStartRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const position = (x / canvas.width) * duration;

        if (dragStartRef.current === 'start') {
            setStartMarker(Math.min(position, endMarker - 0.1));
        } else if (dragStartRef.current === 'end') {
            setEndMarker(Math.max(position, startMarker + 0.1));
        }
    };

    const handleCanvasMouseUp = () => {
        dragStartRef.current = null;
    };

    // Playback controls
    const togglePlayback = async () => {
        if (!audioRef.current || isPlaybackTransitioning) return;

        setIsPlaybackTransitioning(true);

        try {
            if (isPlaying) {
                await audioRef.current.pause();
            } else {
                // If at the end of selection, go back to start
                if (currentTime >= endMarker) {
                    audioRef.current.currentTime = startMarker;
                }

                // Make sure we're not beyond the end marker
                if (audioRef.current.currentTime > endMarker) {
                    audioRef.current.currentTime = startMarker;
                }

                await audioRef.current.play();
            }

            setIsPlaying(!isPlaying);
        } catch (error) {
            console.error("Playback error:", error);
            setIsPlaybackTransitioning(false);
        }
    };

    // Adjust playback rate
    const changePlaybackRate = (delta) => {
        const newRate = Math.max(0.25, Math.min(2, playbackRate + delta));
        setPlaybackRate(newRate);

        if (audioRef.current) {
            audioRef.current.playbackRate = newRate;
        }
    };

    // Trim audio
    const trimAudio = async () => {
        if (!file || !audioContextRef.current) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

            const sampleRate = audioBuffer.sampleRate;
            const channels = audioBuffer.numberOfChannels;

            const startSample = Math.floor(startMarker * sampleRate);
            const endSample = Math.floor(endMarker * sampleRate);
            const frameCount = endSample - startSample;

            const trimmedBuffer = audioContextRef.current.createBuffer(
                channels,
                frameCount,
                sampleRate
            );

            // Copy the trimmed portion
            for (let channel = 0; channel < channels; channel++) {
                const channelData = audioBuffer.getChannelData(channel);
                const trimmedData = trimmedBuffer.getChannelData(channel);

                for (let i = 0; i < frameCount; i++) {
                    trimmedData[i] = channelData[startSample + i];
                }
            }

            // Convert to WAV file
            const wavBuffer = bufferToWav(trimmedBuffer);
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);

            // Pause the current playback
            if (isPlaying) {
                await audioRef.current.pause();
                setIsPlaying(false);
            }

            setTrimmedAudioUrl(url);
            setIsTrimmed(true);

            // Update audio player to play the trimmed version
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.load();
                setCurrentTime(0);
                setStartMarker(0);
                setEndMarker(frameCount / sampleRate);
                setDuration(frameCount / sampleRate);
            }
        } catch (error) {
            console.error("Error trimming audio:", error);
            alert("Fehler beim Trimmen der Audiodatei. Bitte versuche es erneut.");
        }
    };

    // Buffer to WAV conversion
    const bufferToWav = (buffer) => {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const length = buffer.length * numChannels * 2;
        const arrBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(arrBuffer);

        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(view, 8, 'WAVE');

        // FMT sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // subchunk1size
        view.setUint16(20, 1, true); // audio format (PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
        view.setUint16(32, numChannels * 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample

        // Data sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, length, true);

        // Write the PCM samples
        const offset = 44;
        let pos = 0;

        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset + pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                pos += 2;
            }
        }

        return arrBuffer;
    };

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // Download trimmed audio
    const downloadTrimmedAudio = () => {
        if (!trimmedAudioUrl) return;

        const a = document.createElement('a');
        a.href = trimmedAudioUrl;
        a.download = `trimmed_${file.name}`;
        a.click();
    };

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>
                <ScissorsIcon /> Audio Cutter
            </h1>

            {!file ? (
                <div
                    style={styles.dropZone}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('file-input').click()}
                >
                    <p style={styles.dropText}>Drag & Drop deine Audio-Datei hier</p>
                    <p style={styles.dropSubtext}>Unterstützte Formate: MP3, WAV, OGG, etc.</p>
                    <input
                        id="file-input"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <div style={{ width: '100%' }}>
                    <div style={styles.fileInfo}>
                        <p style={styles.fileName}>{file.name}</p>
                        <div style={styles.fileDetails}>
                            <span>Länge: {formatTime(duration)}</span>
                            <span>Auswahl: {formatTime(startMarker)} - {formatTime(endMarker)}</span>
                        </div>
                    </div>

                    <div style={styles.waveformContainer}>
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={150}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            style={styles.canvas}
                        />
                    </div>

                    <div style={styles.controls}>
                        <div style={styles.timeDisplay}>{formatTime(currentTime)}</div>

                        <div style={styles.buttonsGroup}>
                            <button
                                onClick={togglePlayback}
                                style={{
                                    ...styles.button,
                                    ...styles.playButton,
                                    opacity: isPlaybackTransitioning ? 0.7 : 1
                                }}
                                disabled={isPlaybackTransitioning}
                            >
                                {isPlaying ? <PauseIcon /> : <PlayIcon />}
                            </button>

                            <button
                                onClick={trimAudio}
                                style={{ ...styles.button, ...styles.trimButton }}
                                title="Ausschnitt trimmen"
                            >
                                <ScissorsIcon />
                            </button>

                            {isTrimmed && (
                                <button
                                    onClick={downloadTrimmedAudio}
                                    style={{ ...styles.button, ...styles.saveButton }}
                                    title="Getrimmte Datei herunterladen"
                                >
                                    <SaveIcon />
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (audioRef.current) {
                                        if (isPlaying) {
                                            audioRef.current.pause();
                                            setIsPlaying(false);
                                        }
                                        audioRef.current.currentTime = startMarker;
                                        setCurrentTime(startMarker);
                                    }
                                }}
                                style={{ ...styles.button, ...styles.resetButton }}
                                title="Zum Startmarker springen"
                            >
                                <ResetIcon />
                            </button>
                        </div>

                        <div style={styles.speedControls}>
                            <span style={styles.speedText}>Geschwindigkeit: {playbackRate.toFixed(2)}x</span>
                            <button
                                onClick={() => changePlaybackRate(-0.25)}
                                style={styles.speedButton}
                            >
                                <MinusIcon />
                            </button>
                            <button
                                onClick={() => changePlaybackRate(0.25)}
                                style={styles.speedButton}
                            >
                                <PlusIcon />
                            </button>
                        </div>
                    </div>

                    <div style={styles.sliders}>
                        <div style={styles.sliderGroup}>
                            <label style={styles.sliderLabel}>Startmarker: {formatTime(startMarker)}</label>
                            <input
                                type="range"
                                min={0}
                                max={duration}
                                step={0.01}
                                value={startMarker}
                                onChange={(e) => setStartMarker(Math.min(parseFloat(e.target.value), endMarker - 0.1))}
                                style={styles.slider}
                            />
                        </div>
                        <div style={styles.sliderGroup}>
                            <label style={styles.sliderLabel}>Endmarker: {formatTime(endMarker)}</label>
                            <input
                                type="range"
                                min={0}
                                max={duration}
                                step={0.01}
                                value={endMarker}
                                onChange={(e) => setEndMarker(Math.max(parseFloat(e.target.value), startMarker + 0.1))}
                                style={styles.slider}
                            />
                        </div>
                    </div>

                    <audio ref={audioRef} style={{ display: 'none' }} />
                </div>
            )}
        </div>
    );
}