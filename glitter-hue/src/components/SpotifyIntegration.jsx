// src/components/SpotifyIntegration.jsx - Spotify-Integration für GlitterHue
import React, {useEffect, useRef, useState} from 'react';
import '../styles/spotify.css';

// Spotify-Authentifizierung und API-Wrapper
const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SPOTIFY_API_ENDPOINT = "https://api.spotify.com/v1";
const SPOTIFY_CLIENT_ID = "b63ce2bce0924a2ba9423b35cbc62b07";
const REDIRECT_URI = window.location.origin;
const SCOPES = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-library-read",
    "user-top-read"
];

// Spotify Player-Komponente
const SpotifyPlayer = ({onAnalyzeAudio, isActive}) => {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [volume, setVolume] = useState(80);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const progressIntervalRef = useRef(null);

    // Lade das Spotify Web Playback SDK
    useEffect(() => {
        // Lade das Spotify Web Playback SDK Script dynamisch
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        // Definiere die Callback-Funktion für das SDK
        window.onSpotifyWebPlaybackSDKReady = () => {
            const spotifyPlayer = new window.Spotify.Player({
                name: 'GlitterHue Player',
                getOAuthToken: cb => {
                    // Hier den aktuellen Access Token abrufen
                    const token = localStorage.getItem('spotify_access_token');
                    cb(token);
                },
                volume: volume / 100
            });

            // Error-Handling
            spotifyPlayer.addListener('initialization_error', ({message}) => {
                console.error('Initialization error:', message);
            });
            spotifyPlayer.addListener('authentication_error', ({message}) => {
                console.error('Authentication error:', message);
                // Token könnte abgelaufen sein, Benutzer erneut authentifizieren
                localStorage.removeItem('spotify_access_token');
                localStorage.removeItem('spotify_expires_at');
            });
            spotifyPlayer.addListener('account_error', ({message}) => {
                console.error('Account error:', message);
                alert('Diese Funktion benötigt Spotify Premium');
            });
            spotifyPlayer.addListener('playback_error', ({message}) => {
                console.error('Playback error:', message);
            });

            // Status-Aktualisierungen
            spotifyPlayer.addListener('player_state_changed', state => {
                if (!state) return;

                setIsPaused(state.paused);

                if (state.track_window.current_track) {
                    setCurrentTrack(state.track_window.current_track);
                    setDuration(state.duration);
                    setProgress(state.position);
                }

                // Audiodaten analysieren, wenn Wiedergabe läuft
                if (!state.paused && isActive && onAnalyzeAudio) {
                    // Hier können wir die Audiodaten für die Analyse bereitstellen
                    // Da wir keinen direkten Zugriff auf die PCM-Daten haben,
                    // verwenden wir Metadaten, um eine Analyse zu simulieren
                    const fakeAnalysis = {
                        bass: Math.random() * 0.8 + 0.2, // Zufällige Werte zwischen 0.2 und 1.0
                        mid: Math.random() * 0.8 + 0.2,
                        treble: Math.random() * 0.8 + 0.2,
                        vocals: Math.random() * 0.8 + 0.2,
                        beat: Math.random() > 0.8, // Zufällige Beat-Erkennung
                        volume: 0.8,
                        timestamp: Date.now()
                    };

                    onAnalyzeAudio(fakeAnalysis);
                }
            });

            // Connect-Event
            spotifyPlayer.addListener('ready', ({device_id}) => {
                console.log('Spotify Player Ready with Device ID:', device_id);
                setDeviceId(device_id);
                setPlayerReady(true);
            });

            // Verbindung herstellen
            spotifyPlayer.connect();
            setPlayer(spotifyPlayer);
        };

        return () => {
            // Cleanup beim Unmount
            if (player) {
                player.disconnect();
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            window.onSpotifyWebPlaybackSDKReady = null;
        };
    }, []);

    // Progress-Bar aktualisieren
    useEffect(() => {
        if (!isPaused && currentTrack) {
            // Starte ein Intervall, um den Fortschritt zu aktualisieren
            progressIntervalRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= duration) return duration;
                    return prev + 1000; // +1 Sekunde
                });
            }, 1000);
        } else {
            // Stoppe das Intervall, wenn pausiert
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [isPaused, currentTrack, duration]);

    // Lautstärke ändern
    useEffect(() => {
        if (player) {
            player.setVolume(volume / 100);
        }
    }, [volume, player]);

    // Funktionen für die Wiedergabesteuerung
    const togglePlay = async () => {
        if (!player) return;

        if (isPaused) {
            await player.resume();
        } else {
            await player.pause();
        }
    };

    const skipNext = async () => {
        if (!player) return;
        await player.nextTrack();
    };

    const skipPrevious = async () => {
        if (!player) return;
        await player.previousTrack();
    };

    const formatTime = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Rendere Player-Steuerelemente
    return (
        <div className="spotify-player">
            {currentTrack ? (
                <>
                    <div className="track-info">
                        <div className="track-image">
                            {currentTrack.album.images && currentTrack.album.images[0] && (
                                <img
                                    src={currentTrack.album.images[0].url}
                                    alt={`Album cover for ${currentTrack.album.name}`}
                                />
                            )}
                        </div>
                        <div className="track-details">
                            <div className="track-title">{currentTrack.name}</div>
                            <div
                                className="track-artist">{currentTrack.artists.map(a => a.name).join(', ')}</div>
                            <div className="track-album">{currentTrack.album.name}</div>
                        </div>
                    </div>

                    <div className="player-controls">
                        <div className="progress-container">
                            <span className="time-elapsed">{formatTime(progress)}</span>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{width: `${(progress / duration) * 100}%`}}
                                ></div>
                            </div>
                            <span className="time-total">{formatTime(duration)}</span>
                        </div>

                        <div className="control-buttons">
                            <button className="control-button" onClick={skipPrevious}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="19 20 9 12 19 4 19 20"></polygon>
                                    <line x1="5" y1="19" x2="5" y2="5"></line>
                                </svg>
                            </button>

                            <button className="control-button play-button" onClick={togglePlay}>
                                {isPaused ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <rect x="6" y="4" width="4" height="16"></rect>
                                        <rect x="14" y="4" width="4" height="16"></rect>
                                    </svg>
                                )}
                            </button>

                            <button className="control-button" onClick={skipNext}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 4 15 12 5 20 5 4"></polygon>
                                    <line x1="19" y1="5" x2="19" y2="19"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="volume-container">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                            </svg>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                className="volume-slider"
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="player-placeholder">
                    {playerReady ? (
                        <div>
                            <p>Wähle einen Track oder eine Playlist aus, um zu starten</p>
                        </div>
                    ) : (
                        <div className="loading-player">
                            <p>Initialisiere Spotify Player...</p>
                            <div className="loader"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Spotify Suche und Content-Browser
const SpotifyContent = ({
                            accessToken,
                            deviceId,
                            onPlayTrack,
                            onPlayContext,
                            isPlayerReady
                        }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({tracks: [], playlists: []});
    const [isSearching, setIsSearching] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [topTracks, setTopTracks] = useState([]);
    const [activeTab, setActiveTab] = useState('playlists'); // 'search', 'playlists', 'top'
    const [isLoading, setIsLoading] = useState(false);

    // Benutzer-Playlists laden
    useEffect(() => {
        if (accessToken) {
            fetchUserPlaylists();
            fetchTopTracks();
        }
    }, [accessToken]);

    // Benutzer-Playlists abrufen
    const fetchUserPlaylists = async () => {
        if (!accessToken) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${SPOTIFY_API_ENDPOINT}/me/playlists?limit=20`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) throw new Error('Fehler beim Abrufen der Playlists');

            const data = await response.json();
            setUserPlaylists(data.items);
        } catch (error) {
            console.error('Fehler beim Laden der Playlists:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Top-Tracks abrufen
    const fetchTopTracks = async () => {
        if (!accessToken) return;

        try {
            const response = await fetch(`${SPOTIFY_API_ENDPOINT}/me/top/tracks?limit=20&time_range=short_term`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) throw new Error('Fehler beim Abrufen der Top-Tracks');

            const data = await response.json();
            setTopTracks(data.items);
        } catch (error) {
            console.error('Fehler beim Laden der Top-Tracks:', error);
        }
    };

    // Suche
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || !accessToken) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `${SPOTIFY_API_ENDPOINT}/search?q=${encodeURIComponent(searchQuery)}&type=track,playlist&limit=10`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!response.ok) throw new Error('Fehler bei der Suche');

            const data = await response.json();
            setSearchResults({
                tracks: data.tracks?.items || [],
                playlists: data.playlists?.items || []
            });
            setActiveTab('search');
        } catch (error) {
            console.error('Suchfehler:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Track abspielen
    const playTrack = async (trackUri) => {
        if (!isPlayerReady || !deviceId) {
            alert('Spotify Player ist noch nicht bereit');
            return;
        }

        try {
            await fetch(`${SPOTIFY_API_ENDPOINT}/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uris: [trackUri]
                })
            });

            if (onPlayTrack) onPlayTrack(trackUri);
        } catch (error) {
            console.error('Fehler beim Abspielen:', error);
        }
    };

    // Playlist oder Album abspielen
    const playContext = async (contextUri) => {
        if (!isPlayerReady || !deviceId) {
            alert('Spotify Player ist noch nicht bereit');
            return;
        }

        try {
            await fetch(`${SPOTIFY_API_ENDPOINT}/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    context_uri: contextUri
                })
            });

            if (onPlayContext) onPlayContext(contextUri);
        } catch (error) {
            console.error('Fehler beim Abspielen der Playlist:', error);
        }
    };

    // Format für Künstler
    const formatArtists = (artists) => {
        return artists.map(artist => artist.name).join(', ');
    };

    return (
        <div className="spotify-content">
            <div className="search-container">
                <form onSubmit={handleSearch}>
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="Suche nach Songs, Playlists..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <button type="submit" className="search-button" disabled={isSearching}>
                            {isSearching ? (
                                <span className="small-loader"></span>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="content-tabs">
                <button
                    className={`tab-button ${activeTab === 'playlists' ? 'active' : ''}`}
                    onClick={() => setActiveTab('playlists')}
                >
                    Deine Playlists
                </button>
                <button
                    className={`tab-button ${activeTab === 'top' ? 'active' : ''}`}
                    onClick={() => setActiveTab('top')}
                >
                    Top Tracks
                </button>
                {searchResults.tracks.length > 0 && (
                    <button
                        className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => setActiveTab('search')}
                    >
                        Suchergebnisse
                    </button>
                )}
            </div>

            <div className="content-container">
                {isLoading ? (
                    <div className="loading-content">
                        <div className="loader"></div>
                        <p>Laden...</p>
                    </div>
                ) : (
                    <>
                        {/* Suchergebnisse */}
                        {activeTab === 'search' && (
                            <div className="search-results">
                                {searchResults.tracks.length > 0 && (
                                    <div className="result-section">
                                        <h4>Tracks</h4>
                                        <div className="track-list">
                                            {searchResults.tracks.map((track) => (
                                                <div key={track.id} className="track-item"
                                                     onClick={() => playTrack(track.uri)}>
                                                    <div className="track-image">
                                                        {track.album.images && track.album.images[0] && (
                                                            <img src={track.album.images[0].url}
                                                                 alt="Album"/>
                                                        )}
                                                    </div>
                                                    <div className="track-details">
                                                        <div
                                                            className="track-name">{track.name}</div>
                                                        <div
                                                            className="track-artist">{formatArtists(track.artists)}</div>
                                                    </div>
                                                    <div className="play-icon">
                                                        <svg viewBox="0 0 24 24" fill="none"
                                                             stroke="currentColor" strokeWidth="2"
                                                             strokeLinecap="round"
                                                             strokeLinejoin="round">
                                                            <polygon
                                                                points="5 3 19 12 5 21 5 3"></polygon>
                                                        </svg>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchResults.playlists.length > 0 && (
                                    <div className="result-section">
                                        <h4>Playlists</h4>
                                        <div className="playlist-grid">
                                            {searchResults.playlists.map((playlist) => (
                                                <div key={playlist.id} className="playlist-item"
                                                     onClick={() => playContext(playlist.uri)}>
                                                    <div className="playlist-image">
                                                        {playlist.images && playlist.images[0] && (
                                                            <img src={playlist.images[0].url}
                                                                 alt="Playlist"/>
                                                        )}
                                                    </div>
                                                    <div className="playlist-details">
                                                        <div
                                                            className="playlist-name">{playlist.name}</div>
                                                        <div
                                                            className="playlist-owner">Von {playlist.owner.display_name}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchResults.tracks.length === 0 && searchResults.playlists.length === 0 && (
                                    <div className="no-results">
                                        <p>Keine Ergebnisse gefunden für "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Playlists */}
                        {activeTab === 'playlists' && (
                            <div className="user-playlists">
                                <div className="playlist-grid">
                                    {userPlaylists.map((playlist) => (
                                        <div key={playlist.id} className="playlist-item"
                                             onClick={() => playContext(playlist.uri)}>
                                            <div className="playlist-image">
                                                {playlist.images && playlist.images[0] && (
                                                    <img src={playlist.images[0].url}
                                                         alt="Playlist"/>
                                                )}
                                            </div>
                                            <div className="playlist-details">
                                                <div className="playlist-name">{playlist.name}</div>
                                                <div
                                                    className="playlist-tracks">{playlist.tracks.total} Tracks
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {userPlaylists.length === 0 && (
                                    <div className="no-results">
                                        <p>Keine Playlists gefunden</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Top Tracks */}
                        {activeTab === 'top' && (
                            <div className="top-tracks">
                                <div className="track-list">
                                    {topTracks.map((track) => (
                                        <div key={track.id} className="track-item"
                                             onClick={() => playTrack(track.uri)}>
                                            <div className="track-image">
                                                {track.album.images && track.album.images[0] && (
                                                    <img src={track.album.images[0].url}
                                                         alt="Album"/>
                                                )}
                                            </div>
                                            <div className="track-details">
                                                <div className="track-name">{track.name}</div>
                                                <div
                                                    className="track-artist">{formatArtists(track.artists)}</div>
                                            </div>
                                            <div className="play-icon">
                                                <svg viewBox="0 0 24 24" fill="none"
                                                     stroke="currentColor" strokeWidth="2"
                                                     strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {topTracks.length === 0 && (
                                    <div className="no-results">
                                        <p>Keine Top-Tracks gefunden</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Hauptkomponente für die Spotify-Integration
const SpotifyIntegration = ({onAnalyzeAudio, isActive}) => {
    const [accessToken, setAccessToken] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // Prüfe, ob bereits ein Token vorhanden ist
    useEffect(() => {
        const token = localStorage.getItem('spotify_access_token');
        const expiresAt = localStorage.getItem('spotify_expires_at');

        if (token && expiresAt) {
            // Prüfe, ob der Token noch gültig ist
            if (new Date().getTime() < parseInt(expiresAt)) {
                setAccessToken(token);
                setIsAuthenticated(true);
            } else {
                // Token ist abgelaufen, entferne ihn
                localStorage.removeItem('spotify_access_token');
                localStorage.removeItem('spotify_expires_at');
            }
        }

        // Prüfe, ob wir von einem Auth-Redirect kommen
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const urlToken = urlParams.get('access_token');
        const urlExpiresIn = urlParams.get('expires_in');

        if (urlToken && urlExpiresIn) {
            // Token aus URL extrahieren und speichern
            const expirationTime = new Date().getTime() + parseInt(urlExpiresIn) * 1000;
            localStorage.setItem('spotify_access_token', urlToken);
            localStorage.setItem('spotify_expires_at', expirationTime.toString());

            setAccessToken(urlToken);
            setIsAuthenticated(true);

            // URL bereinigen
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Bei Spotify authentifizieren
    const authenticateWithSpotify = () => {
        const authUrl = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=token&show_dialog=true`;
        window.location.href = authUrl;
    };

    // Abmelden
    const logout = () => {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_expires_at');
        setAccessToken('');
        setIsAuthenticated(false);
        setDeviceId(null);
        setIsPlayerReady(false);
    };

    // Player-Status aktualisieren
    const handlePlayerReady = (id) => {
        setDeviceId(id);
        setIsPlayerReady(true);
    };

    // Track abspielen
    const handlePlayTrack = (trackUri) => {
        console.log('Spiele Track:', trackUri);
    };

    // Playlist abspielen
    const handlePlayContext = (contextUri) => {
        console.log('Spiele Kontext:', contextUri);
    };

    return (
        <div className="spotify-integration">
            {!isAuthenticated ? (
                <div className="spotify-login">
                    <div className="spotify-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"
                             fill="currentColor">
                            <path
                                d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8z"/>
                            <path fill="#2C2E3B"
                                  d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z"/>
                        </svg>
                    </div>
                    <h3>Verbinde mit Spotify</h3>
                    <p>Verbinde GlitterHue mit deinem Spotify-Konto, um deine Musik zu streamen und
                        mit deinen Hue-Lampen zu synchronisieren.</p>
                    <button className="spotify-login-button" onClick={authenticateWithSpotify}>
                        Mit Spotify verbinden
                    </button>
                    <div className="spotify-premium-notice">
                        <small>* Spotify Premium wird für die Musikwiedergabe benötigt</small>
                    </div>
                </div>
            ) : (
                <div className="spotify-content-container">
                    <div className="spotify-header">
                        <h3>Spotify-Integration</h3>
                        <button className="logout-button" onClick={logout}>Abmelden</button>
                    </div>

                    <div className="spotify-main">
                        <div className="spotify-browser">
                            <SpotifyContent
                                accessToken={accessToken}
                                deviceId={deviceId}
                                onPlayTrack={handlePlayTrack}
                                onPlayContext={handlePlayContext}
                                isPlayerReady={isPlayerReady}
                            />
                        </div>

                        <div className="spotify-playback">
                            <SpotifyPlayer
                                onAnalyzeAudio={onAnalyzeAudio}
                                isActive={isActive}
                                onPlayerReady={handlePlayerReady}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpotifyIntegration;