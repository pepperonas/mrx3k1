import React, {useEffect, useRef, useState} from 'react';
import lamejs from 'lamejs';

// Manually define icons
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="mr-2">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="mr-2">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="mr-2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         className="mr-2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

const ClipTune = () => {
    // State
    const [audioFile, setAudioFile] = useState(null);
    const [audioBuffer, setAudioBuffer] = useState(null);
    const [waveformData, setWaveformData] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [startMarker, setStartMarker] = useState(0);
    const [endMarker, setEndMarker] = useState(0);
    const [duration, setDuration] = useState(0);
    const [dragType, setDragType] = useState(null);
    const [stepSize, setStepSize] = useState({start: 1000, end: 1000});

    // Refs
    const audioContext = useRef(null);
    const audioSource = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const startTimeRef = useRef(0);
    const waveformRef = useRef(null);

    // Initialize Audio Context
    useEffect(() => {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        return () => {
            if (audioContext.current) {
                audioContext.current.close();
            }
        };
    }, []);

    // Load audio file
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                setAudioFile(file);
                setAudioBuffer(audioBuffer);
                setDuration(audioBuffer.duration * 1000);
                setEndMarker(audioBuffer.duration * 1000);

                // Generate waveform
                generateWaveformData(audioBuffer);
            } catch (error) {
                console.error("Error loading audio file:", error);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.includes('audio')) {
            const input = document.createElement('input');
            input.type = 'file';
            input.files = e.dataTransfer.files;
            handleFileSelect({target: input});
        }
    };

    // Generate waveform data
    const generateWaveformData = (audioBuffer) => {
        const channelData = audioBuffer.getChannelData(0);

        // Downsample for performance
        const sampleStep = Math.max(1, Math.floor(channelData.length / 2000));
        const downsampled = [];

        for (let i = 0; i < channelData.length; i += sampleStep) {
            let max = 0;
            for (let j = 0; j < sampleStep && i + j < channelData.length; j++) {
                const absolute = Math.abs(channelData[i + j]);
                if (absolute > max) max = absolute;
            }
            downsampled.push(max);
        }

        setWaveformData(downsampled);
    };

    // Draw the waveform on canvas
    useEffect(() => {
        if (!waveformData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#2C2E3B';
        ctx.fillRect(0, 0, width, height);

        // Draw waveform
        ctx.beginPath();
        const barWidth = width / waveformData.length;
        const halfHeight = height / 2;

        for (let i = 0; i < waveformData.length; i++) {
            const x = i * barWidth;
            const barHeight = waveformData[i] * halfHeight * 0.8;
            ctx.fillStyle = '#4A90E2';
            ctx.fillRect(x, halfHeight - barHeight, barWidth, barHeight * 2);
        }

        // Draw selection area
        const startX = (startMarker / duration) * width;
        const endX = (endMarker / duration) * width;
        ctx.fillStyle = 'rgba(74, 144, 226, 0.3)';
        ctx.fillRect(startX, 0, endX - startX, height);

        // Draw markers
        const markerWidth = 3;

        // Start marker (blue)
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(startX - markerWidth / 2, 0, markerWidth, height);

        // End marker (blue)
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(endX - markerWidth / 2, 0, markerWidth, height);

        // Current position (white)
        const posX = (currentPosition / duration) * width;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(posX - markerWidth / 2, 0, markerWidth, height);

    }, [waveformData, currentPosition, startMarker, endMarker, duration]);

    // Play/Pause control
    const togglePlayback = () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    };

    const startPlayback = (start = currentPosition, end = duration) => {
        if (!audioBuffer || isPlaying) return;

        const audioCtx = audioContext.current;

        // Stop any existing playback
        if (audioSource.current) {
            audioSource.current.stop();
            audioSource.current.disconnect();
        }

        // Create new source
        audioSource.current = audioCtx.createBufferSource();
        audioSource.current.buffer = audioBuffer;
        audioSource.current.connect(audioCtx.destination);

        // Calculate offset and duration in seconds
        const offsetSeconds = start / 1000;
        const durationSeconds = (end - start) / 1000;

        // Start playback
        audioSource.current.start(0, offsetSeconds, durationSeconds);
        audioSource.current.onended = stopPlayback;

        // Set playback state
        setIsPlaying(true);
        startTimeRef.current = audioCtx.currentTime - offsetSeconds;

        // Start animation for position updates
        animatePlaybackPosition(start, end);
    };

    const stopPlayback = () => {
        if (audioSource.current) {
            audioSource.current.stop();
            audioSource.current.disconnect();
        }

        setIsPlaying(false);
        cancelAnimationFrame(animationRef.current);
    };

    const animatePlaybackPosition = (start, end) => {
        const updatePosition = () => {
            if (!isPlaying || !audioContext.current) return;

            const elapsedTime = audioContext.current.currentTime - startTimeRef.current;
            const positionMs = start + (elapsedTime * 1000);

            if (positionMs >= end) {
                stopPlayback();
                setCurrentPosition(start); // Reset to start of selection
            } else {
                setCurrentPosition(positionMs);
                animationRef.current = requestAnimationFrame(updatePosition);
            }
        };

        animationRef.current = requestAnimationFrame(updatePosition);
    };

    const playSelection = () => {
        setCurrentPosition(startMarker);
        startPlayback(startMarker, endMarker);
    };

    // Handle waveform interactions
    const handleWaveformMouseDown = (e) => {
        if (!waveformRef.current || !duration) return;

        const rect = waveformRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const xPercent = x / rect.width;
        const posMs = xPercent * duration;

        // Check if near start or end marker (10px tolerance)
        const startX = (startMarker / duration) * rect.width;
        const endX = (endMarker / duration) * rect.width;
        const tolerance = 10;

        if (Math.abs(x - startX) < tolerance) {
            setDragType('start');
        } else if (Math.abs(x - endX) < tolerance) {
            setDragType('end');
        } else {
            setDragType('position');
            setCurrentPosition(posMs);
        }
    };

    const handleWaveformMouseMove = (e) => {
        if (!waveformRef.current || !dragType || !duration) return;

        const rect = waveformRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const posMs = (x / rect.width) * duration;

        if (dragType === 'start') {
            setStartMarker(Math.min(posMs, endMarker));
        } else if (dragType === 'end') {
            setEndMarker(Math.max(posMs, startMarker));
        } else if (dragType === 'position') {
            setCurrentPosition(posMs);
        }
    };

    const handleWaveformMouseUp = () => {
        setDragType(null);
    };

    // Move markers with buttons
    const moveStartMarker = (delta) => {
        const newPos = Math.max(0, Math.min(startMarker + delta, endMarker));
        setStartMarker(newPos);
    };

    const moveEndMarker = (delta) => {
        const newPos = Math.max(startMarker, Math.min(endMarker + delta, duration));
        setEndMarker(newPos);
    };

    // Format time display (mm:ss.ms)
    const formatTime = (ms) => {
        const totalSeconds = ms / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
    };

    // Export selection
    const exportSelection = async () => {
        if (!audioBuffer || startMarker >= endMarker) return;

        try {
            // Create offline context for rendering
            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                (endMarker - startMarker) * audioBuffer.sampleRate / 1000,
                audioBuffer.sampleRate
            );

            // Create buffer source
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineCtx.destination);

            // Start rendering from the selected position
            source.start(0, startMarker / 1000);

            // Render audio
            const renderedBuffer = await offlineCtx.startRendering();

            // WAV im Browser erstellen
            const wavBlob = bufferToWav(renderedBuffer);

            // Download-Link mit MP3-Erweiterung
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cliptune-export.wav'; // Geändert von .wav zu .mp3
            a.click();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting audio:", error);
        }
    };

    // AudioBuffer zu MP3 konvertieren mit lamejs
    const bufferToMp3 = (audioBuffer) => {
        // In lamejs gibt es Probleme mit MPEGMode, verwenden wir direkte Werte
        // MONO = 3, STEREO = 0, JOINT_STEREO = 1
        const MONO = 3;
        const STEREO = 0;

        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const bitRate = 128;

        // Erstelle den Encoder mit numerischen Werten statt Enums
        const mp3encoder = new lamejs.Mp3Encoder(
            numChannels === 1 ? MONO : STEREO,
            sampleRate,
            bitRate
        );

        const mp3Data = [];

        // Für bessere Browserkompatibilität
        const maxSamples = 1152;

        // Konvertiere Float32Array zu Int16Array und erstelle stereo/mono samples
        const samples = new Int16Array(audioBuffer.length * numChannels);

        // Für jeden Kanal die Samples kopieren und umwandeln
        if (numChannels === 1) {
            // Mono
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < channelData.length; i++) {
                // Float32 (-1.0 bis 1.0) zu Int16 (-32768 bis 32767)
                const sample = Math.max(-1, Math.min(1, channelData[i]));
                samples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            }
        } else {
            // Stereo - interleaved für den encoder
            const leftChannel = audioBuffer.getChannelData(0);
            const rightChannel = audioBuffer.getChannelData(1);

            for (let i = 0, j = 0; i < leftChannel.length; i++, j += 2) {
                // Links und rechts interleaved
                const leftSample = Math.max(-1, Math.min(1, leftChannel[i]));
                const rightSample = Math.max(-1, Math.min(1, rightChannel[i]));

                samples[j] = leftSample < 0 ? leftSample * 0x8000 : leftSample * 0x7FFF;
                samples[j + 1] = rightSample < 0 ? rightSample * 0x8000 : rightSample * 0x7FFF;
            }
        }

        // MP3 kodieren
        for (let i = 0; i < samples.length; i += maxSamples) {
            const sampleChunk = samples.subarray(i, i + maxSamples);
            let mp3buf;

            if (numChannels === 1) {
                // Mono
                mp3buf = mp3encoder.encodeBuffer(sampleChunk);
            } else {
                // Stereo - müssen die Kanäle trennen
                const leftChunk = new Int16Array(maxSamples / 2);
                const rightChunk = new Int16Array(maxSamples / 2);

                // De-interleave für lamejs
                for (let j = 0, k = 0; j < sampleChunk.length; j += 2, k++) {
                    if (k < leftChunk.length) {
                        leftChunk[k] = sampleChunk[j];
                        rightChunk[k] = sampleChunk[j + 1];
                    }
                }

                mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            }

            if (mp3buf && mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        // Flush und finale MP3-Frames
        const mp3buf = mp3encoder.flush();
        if (mp3buf && mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        // Erstelle Blob mit korrekt typisiertem mp3-content
        return new Blob(mp3Data, { type: 'audio/mp3' });
    };

    // Convert AudioBuffer to WAV Blob
    const bufferToWav = (buffer) => {
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numberOfChannels * 2; // 16-bit samples
        const sampleRate = buffer.sampleRate;
        const fileSize = 44 + length;

        const arrayBuffer = new ArrayBuffer(fileSize);
        const view = new DataView(arrayBuffer);

        // RIFF identifier
        writeString(view, 0, 'RIFF');
        // File size minus RIFF identifier and size
        view.setUint32(4, fileSize - 8, true);
        // RIFF type
        writeString(view, 8, 'WAVE');
        // Format chunk identifier
        writeString(view, 12, 'fmt ');
        // Format chunk length
        view.setUint32(16, 16, true);
        // Sample format (1 for PCM)
        view.setUint16(20, 1, true);
        // Channel count
        view.setUint16(22, numberOfChannels, true);
        // Sample rate
        view.setUint32(24, sampleRate, true);
        // Byte rate (sample rate * block align)
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        // Block align (channel count * bytes per sample)
        view.setUint16(32, numberOfChannels * 2, true);
        // Bits per sample
        view.setUint16(34, 16, true);
        // Data chunk identifier
        writeString(view, 36, 'data');
        // Data chunk length
        view.setUint32(40, length, true);

        // Write the data
        const offset = 44;
        const channelData = [];
        for (let i = 0; i < numberOfChannels; i++) {
            channelData.push(buffer.getChannelData(i));
        }

        let index = 0;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                // Convert float to int16
                const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
                const value = (sample < 0) ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset + index * 2, value, true);
                index++;
            }
        }

        return new Blob([view], {type: 'audio/wav'});
    };

    // Helper to write strings to DataView
    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            backgroundColor: '#1E1F29',
            color: 'white',
            padding: '16px',
        },
        header: {
            marginBottom: '16px',
        },
        headerTitle: {
            fontSize: '24px',
            fontWeight: 'bold',
        },
        fileInput: {
            display: 'flex',
            marginBottom: '16px',
        },
        fileButton: {
            backgroundColor: '#2C2E3B',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginRight: '16px',
            border: 'none',
        },
        fileButtonHover: {
            backgroundColor: '#3C3E4B',
        },
        hiddenInput: {
            display: 'none',
        },
        dropHint: {
            color: '#8C8C8C',
            alignSelf: 'center',
        },
        waveformContainer: {
            position: 'relative',
            height: '160px',
            backgroundColor: '#2C2E3B',
            borderRadius: '4px',
            marginBottom: '8px',
            overflow: 'hidden',
            cursor: 'pointer',
        },
        waveformPlaceholder: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8C8C8C',
        },
        timeDisplay: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px',
        },
        timeText: {
            fontSize: '14px',
        },
        controlsGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
            marginBottom: '24px',
        },
        controlPanel: {
            backgroundColor: '#2C2E3B',
            padding: '16px',
            borderRadius: '4px',
        },
        controlTitle: {
            fontSize: '18px',
            marginBottom: '8px',
        },
        buttonRow: {
            display: 'flex',
            gap: '8px',
        },
        playButton: {
            backgroundColor: '#4A90E2',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            border: 'none',
            cursor: 'pointer',
        },
        playButtonHover: {
            backgroundColor: '#3A80D2',
        },
        selectionButton: {
            backgroundColor: '#2C2E3B',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #4A90E2',
            cursor: 'pointer',
        },
        selectionButtonHover: {
            backgroundColor: '#3C3E4B',
        },
        markerRow: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
        },
        markerLabel: {
            width: '48px',
        },
        markerValue: {
            marginRight: '8px',
        },
        stepLabel: {
            margin: '0 8px',
        },
        stepSelect: {
            backgroundColor: '#3C3E4B',
            borderRadius: '4px',
            padding: '4px 8px',
            marginRight: '8px',
            border: 'none',
            color: 'white',
        },
        markerButton: {
            backgroundColor: '#3C3E4B',
            padding: '4px 8px',
            borderRadius: '4px',
            marginRight: '4px',
            border: 'none',
            cursor: 'pointer',
        },
        exportButton: {
            backgroundColor: '#4A90E2',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            width: 'fit-content',
            border: 'none',
            cursor: 'pointer',
        },
        statusBar: {
            fontSize: '14px',
            color: '#8C8C8C',
            marginTop: '16px',
        },
        footer: {
            textAlign: 'center',
            fontSize: '14px',
            color: '#8C8C8C',
            marginTop: '24px',
            paddingTop: '16px',
            paddingBottom: '32px', // Fügt Abstand unten hinzu
            borderTop: '1px solid #2C2E3B',
            width: 'calc(100% - 32px)', // Breite abzüglich des Container-Paddings
        },
        // Media query styles are handled with CSS Media Queries
    };

    return (
        <div style={styles.container} onDragOver={handleDragOver} onDrop={handleDrop}>
            <header style={styles.header}>
                <h1 style={styles.headerTitle}>ClipTune</h1>
            </header>

            <div style={styles.fileInput}>
                <label style={styles.fileButton}>
                    <input type="file" accept="audio/*" style={styles.hiddenInput}
                           onChange={handleFileSelect}/>
                    <UploadIcon/>
                    Open file
                </label>
                <span style={styles.dropHint}>or drag and drop audio file here</span>
            </div>

            <div
                ref={waveformRef}
                style={styles.waveformContainer}
                onMouseDown={handleWaveformMouseDown}
                onMouseMove={handleWaveformMouseMove}
                onMouseUp={handleWaveformMouseUp}
                onMouseLeave={handleWaveformMouseUp}
            >
                <canvas ref={canvasRef} width={1000} height={150}
                        style={{width: '100%', height: '100%'}}/>
                {!audioBuffer && (
                    <div style={styles.waveformPlaceholder}>
                        No audio file loaded
                    </div>
                )}
            </div>

            <div style={styles.timeDisplay}>
                <div style={styles.timeText}>{formatTime(currentPosition)}</div>
                <div style={styles.timeText}>Selection: {formatTime(endMarker - startMarker)}</div>
            </div>

            <div style={{
                ...styles.controlsGrid,
                '@media (min-width: 768px)': {gridTemplateColumns: '1fr 1fr'}
            }}>
                <div style={styles.controlPanel}>
                    <h3 style={styles.controlTitle}>Playback</h3>
                    <div style={styles.buttonRow}>
                        <button
                            onClick={togglePlayback}
                            disabled={!audioBuffer}
                            style={styles.playButton}
                        >
                            {isPlaying ? <PauseIcon/> : <PlayIcon/>}
                            {isPlaying ? "Pause" : "Play"}
                        </button>
                        <button
                            onClick={playSelection}
                            disabled={!audioBuffer}
                            style={styles.selectionButton}
                        >
                            Play selection
                        </button>
                    </div>
                </div>

                <div style={styles.controlPanel}>
                    <h3 style={styles.controlTitle}>Marker controls</h3>

                    <div style={styles.markerRow}>
                        <span style={styles.markerLabel}>Start:</span>
                        <span style={styles.markerValue}>{formatTime(startMarker)}</span>
                        <span style={styles.stepLabel}>Step size:</span>
                        <select
                            value={stepSize.start}
                            onChange={(e) => setStepSize({
                                ...stepSize,
                                start: parseInt(e.target.value)
                            })}
                            style={styles.stepSelect}
                        >
                            <option value="10">10ms</option>
                            <option value="100">100ms</option>
                            <option value="1000">1s</option>
                            <option value="5000">5s</option>
                            <option value="10000">10s</option>
                        </select>
                        <button
                            onClick={() => moveStartMarker(-stepSize.start)}
                            style={styles.markerButton}
                        >
                            <ChevronLeftIcon/>
                        </button>
                        <button
                            onClick={() => moveStartMarker(stepSize.start)}
                            style={styles.markerButton}
                        >
                            <ChevronRightIcon/>
                        </button>
                    </div>

                    <div style={styles.markerRow}>
                        <span style={styles.markerLabel}>End:</span>
                        <span style={styles.markerValue}>{formatTime(endMarker)}</span>
                        <span style={styles.stepLabel}>Step size:</span>
                        <select
                            value={stepSize.end}
                            onChange={(e) => setStepSize({
                                ...stepSize,
                                end: parseInt(e.target.value)
                            })}
                            style={styles.stepSelect}
                        >
                            <option value="10">10ms</option>
                            <option value="100">100ms</option>
                            <option value="1000">1s</option>
                            <option value="5000">5s</option>
                            <option value="10000">10s</option>
                        </select>
                        <button
                            onClick={() => moveEndMarker(-stepSize.end)}
                            style={styles.markerButton}
                        >
                            <ChevronLeftIcon/>
                        </button>
                        <button
                            onClick={() => moveEndMarker(stepSize.end)}
                            style={styles.markerButton}
                        >
                            <ChevronRightIcon/>
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={exportSelection}
                disabled={!audioBuffer || startMarker >= endMarker}
                style={styles.exportButton}
            >
                <SaveIcon/>
                Export selection
            </button>

            <div style={styles.statusBar}>
                {audioFile ? `Loaded: ${audioFile.name}` : "Ready. Open an audio file to begin."}
            </div>

            <footer style={styles.footer}>
                Made with ❤️ by Martin Pfeffer
            </footer>
        </div>
    );
};

export default ClipTune;