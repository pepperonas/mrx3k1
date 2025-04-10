import React, {useEffect, useRef, useState} from 'react';

function SimpleKaraokePlayer() {
    const [audioUrl, setAudioUrl] = useState(null);
    const [jsonData, setJsonData] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

    const audioRef = useRef(null);

    // Funktion zum Laden der JSON-Datei
    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    console.log("Geladene JSON-Daten:", data);
                    setJsonData(data);
                } catch (error) {
                    console.error("Fehler beim Parsen der JSON-Datei:", error);
                    alert("Fehler beim Laden der JSON-Datei");
                }
            };
            reader.readAsText(file);
        }
    };

    // Funktion zum Laden der Audio-Datei
    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAudioUrl(url);
        }
    };

    // Play/Pause Funktion
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

    // Aktualisiere Zeit und aktive Lyrics
    useEffect(() => {
        if (audioRef.current) {
            const updateTime = () => {
                const newTime = audioRef.current.currentTime;
                setCurrentTime(newTime);

                // Finde den aktiven Lyrictext basierend auf der Zeit
                if (jsonData && jsonData.lyrics) {
                    let foundIndex = -1;

                    for (let i = 0; i < jsonData.lyrics.length; i++) {
                        const currentLyric = jsonData.lyrics[i];
                        const nextLyric = jsonData.lyrics[i + 1];

                        if (nextLyric) {
                            if (newTime >= currentLyric.startTime && newTime < nextLyric.startTime) {
                                foundIndex = i;
                                break;
                            }
                        } else if (newTime >= currentLyric.startTime) {
                            // Letzter Liedtext
                            foundIndex = i;
                            break;
                        }
                    }

                    // Nur update, wenn sich der Index geändert hat
                    if (foundIndex !== activeLyricIndex) {
                        console.log(`Aktiver Lyric-Index ändert sich von ${activeLyricIndex} zu ${foundIndex} bei Zeit ${newTime.toFixed(2)}`);
                        setActiveLyricIndex(foundIndex);
                    }
                }
            };

            // Event-Listener für timeupdate
            audioRef.current.addEventListener('timeupdate', updateTime);

            return () => {
                if (audioRef.current) {
                    audioRef.current.removeEventListener('timeupdate', updateTime);
                }
            };
        }
    }, [jsonData, activeLyricIndex]);

    // Formatiere Zeit als MM:SS
    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '20px',
            backgroundColor: '#2C2E3B',
            color: 'white'
        }}>
            <h1 style={{textAlign: 'center', color: '#8b5cf6'}}>
                Simple Karaoke Player
            </h1>

            {/* Datei-Upload-Bereich */}
            <div style={{marginBottom: '20px'}}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                }}>
                    <div style={{flex: 1, marginRight: '10px'}}>
                        <label style={{
                            display: 'block',
                            padding: '10px',
                            backgroundColor: '#333545',
                            borderRadius: '5px',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}>
                            <span>JSON Datei wählen</span>
                            <input
                                type="file"
                                accept="application/json"
                                onChange={handleJsonUpload}
                                style={{display: 'none'}}
                            />
                        </label>
                        {jsonData && (
                            <div style={{marginTop: '5px', fontSize: '14px', color: '#a78bfa'}}>
                                Geladen: {jsonData.songName}
                            </div>
                        )}
                    </div>

                    <div style={{flex: 1}}>
                        <label style={{
                            display: 'block',
                            padding: '10px',
                            backgroundColor: '#333545',
                            borderRadius: '5px',
                            textAlign: 'center',
                            cursor: 'pointer'
                        }}>
                            <span>Audio Datei wählen</span>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioUpload}
                                style={{display: 'none'}}
                            />
                        </label>
                        {audioUrl && (
                            <div style={{marginTop: '5px', fontSize: '14px', color: '#a78bfa'}}>
                                Audio geladen ✓
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Audio-Player */}
            {audioUrl && (
                <div style={{
                    backgroundColor: '#242634',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                }}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px'}}>
                        <button
                            onClick={togglePlayback}
                            style={{
                                backgroundColor: isPlaying ? '#ef4444' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '8px 15px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginRight: '15px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>

                        <div style={{
                            backgroundColor: '#1E202A',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            fontFamily: 'monospace'
                        }}>
                            <span style={{color: '#a78bfa'}}>{formatTime(currentTime)}</span>
                            <span style={{margin: '0 5px', color: '#64748b'}}>/</span>
                            <span
                                style={{color: '#94a3b8'}}>{formatTime(audioRef.current?.duration || 0)}</span>
                        </div>
                    </div>

                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        style={{display: 'none'}}
                    />

                    {/* Progress Bar */}
                    <div style={{
                        height: '10px',
                        backgroundColor: '#1E202A',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${(currentTime / (audioRef.current?.duration || 1)) * 100}%`,
                                backgroundColor: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Lyrics Display */}
            <div style={{
                backgroundColor: '#242634',
                padding: '15px',
                borderRadius: '8px',
                maxHeight: '300px',
                overflow: 'auto'
            }}>
                <h2 style={{
                    margin: '0 0 15px',
                    color: '#a78bfa',
                    fontSize: '18px'
                }}>
                    Lyrics
                </h2>

                {jsonData && jsonData.lyrics ? (
                    <div>
                        {jsonData.lyrics.map((lyric, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    backgroundColor: index === activeLyricIndex
                                        ? 'rgba(139, 92, 246, 0.3)'
                                        : 'rgba(36, 38, 52, 0.8)',
                                    borderRadius: '5px',
                                    borderLeft: index === activeLyricIndex
                                        ? '5px solid #8b5cf6'
                                        : '1px solid transparent',
                                    color: index === activeLyricIndex ? '#ffffff' : '#94a3b8',
                                    fontSize: index === activeLyricIndex ? '20px' : '16px',
                                    fontWeight: index === activeLyricIndex ? 'bold' : 'normal',
                                    transition: 'all 0.3s ease',
                                    transform: index === activeLyricIndex ? 'scale(1.05)' : 'scale(1)',
                                    transformOrigin: 'left center',
                                    boxShadow: index === activeLyricIndex
                                        ? '0 0 20px rgba(139, 92, 246, 0.6)'
                                        : 'none',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {lyric.text}

                                {/* Debug-Info für jeden Lyric */}
                                <div style={{
                                    fontSize: '10px',
                                    marginTop: '5px',
                                    color: '#64748b'
                                }}>
                                    Start: {lyric.startTime.toFixed(2)}s (Index: {index})
                                </div>

                                {/* Neon-Effekt für aktive Lyrics */}
                                {index === activeLyricIndex && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: '0',
                                        pointerEvents: 'none',
                                        animation: 'pulsate 1.5s infinite alternate',
                                        opacity: 0.4,
                                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%)',
                                        zIndex: -1
                                    }}/>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{textAlign: 'center', color: '#64748b'}}>
                        Keine Lyrics geladen
                    </div>
                )}
            </div>

            {/* Inline-Styles für Animationen */}
            <style>
                {`
          @keyframes pulsate {
            0% { opacity: 0.4; }
            100% { opacity: 0.8; }
          }
        `}
            </style>
        </div>
    );
}

export default SimpleKaraokePlayer;