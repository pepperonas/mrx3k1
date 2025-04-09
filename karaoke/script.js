// UI-Elemente
const micSetup = document.getElementById('microphone-setup');
const songSelection = document.getElementById('song-selection');
const gameplay = document.getElementById('gameplay');
const results = document.getElementById('results');
const songGrid = document.querySelector('.song-grid');
const micLevelFill = document.getElementById('mic-level-fill');
const micStatus = document.getElementById('mic-status');
const startAppBtn = document.getElementById('start-app');
const currentLyric = document.getElementById('current-lyric');
const nextLyric = document.getElementById('next-lyric');
const pitchIndicator = document.getElementById('pitch-indicator');
const songProgress = document.getElementById('song-progress');
const currentScore = document.getElementById('current-score');
const pauseBtn = document.getElementById('pause-btn');
const quitBtn = document.getElementById('quit-btn');
const finalScore = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');
const newSongBtn = document.getElementById('new-song-btn');
const statPerfect = document.getElementById('stat-perfect');
const statGood = document.getElementById('stat-good');
const statOk = document.getElementById('stat-ok');
const statMissed = document.getElementById('stat-missed');
const stars = document.querySelectorAll('.star');

// Audio-Kontext und Analyse
let audioContext;
let analyser;
let microphone;
let javascriptNode;
let currentSong;
let gameInterval;
let isPaused = false;
let currentTime = 0;
let score = 0;
let stats = {
    perfect: 0,
    good: 0,
    ok: 0,
    missed: 0
};

// Liste verfügbarer Songs (wird dynamisch geladen)
let songs = [];

// Audio-Player für Songs
let audioPlayer = null;

// Pitch-Erkennung (vereinfachte Version)
let currentPitch = 0;

// Lade verfügbare Songs
async function loadSongs() {
    try {
        // Zuerst die Metadaten für alle Songs laden
        const response = await fetch('songs.json');
        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }

        const data = await response.json();

        // Für jeden Song die separaten Lyrics und Notes laden
        for (const song of data) {
            try {
                // Lyrics laden
                const lyricsResponse = await fetch(`lyrics/${song.id}.json`);
                if (lyricsResponse.ok) {
                    const lyricsData = await lyricsResponse.json();
                    song.lyrics = lyricsData;
                } else {
                    console.warn(`Lyrics für Song ${song.id} konnten nicht geladen werden`);
                    song.lyrics = [];
                }

                // Notes laden
                const notesResponse = await fetch(`notes/${song.id}.json`);
                if (notesResponse.ok) {
                    const notesData = await notesResponse.json();
                    // Überprüfen des Formats der Noten und einheitliche Verarbeitung
                    if (Array.isArray(notesData)) {
                        // Format von old_thing_back.json: direktes Array
                        song.notes = notesData;
                    } else if (notesData.notes && Array.isArray(notesData.notes)) {
                        // Format von welcome-to-st-tropez.json: { notes: [...] }
                        song.notes = notesData.notes;
                    } else {
                        console.warn(`Unbekanntes Notenformat für Song ${song.id}`);
                        song.notes = [];
                    }
                } else {
                    console.warn(`Notes für Song ${song.id} konnten nicht geladen werden`);
                    song.notes = [];
                }
            } catch (err) {
                console.error(`Fehler beim Laden der Daten für Song ${song.id}:`, err);
            }
        }

        // Füge einen speziellen Song hinzu, der die Daten aus paste.txt verwendet
        try {
            const pasteResponse = await fetch('paste.txt');
            if (pasteResponse.ok) {
                const songJson = await pasteResponse.text();
                const songData = JSON.parse(songJson);

                // Erstelle einen neuen Song mit den Daten aus paste.txt
                const customSong = {
                    id: 'custom_song',
                    title: 'Benutzerdefinierter Song',
                    artist: 'Unbekannt',
                    cover: 'https://via.placeholder.com/300x200/2C2E3B/FFFFFF?text=Custom+Song',
                    audioUrl: '#', // Kein Audio
                    difficulty: 3,
                    lyrics: [], // Keine Lyrics
                    notes: songData.notes // Verwende die Noten aus paste.txt
                };

                data.push(customSong);
            }
        } catch (err) {
            console.error('Fehler beim Laden von paste.txt:', err);
        }

        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Songs:', error);
        return []; // Im Fehlerfall leeres Array zurückgeben
    }
}

// Mikrofon einrichten
async function setupMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        micStatus.textContent = "Mikrofon gefunden! Sprich oder singe etwas...";

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 2048;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = function () {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);

            // Einfache Lautstärkenberechnung
            let values = 0;
            const length = array.length;

            for (let i = 0; i < length; i++) {
                values += array[i];
            }

            const average = values / length;
            const volumePercentage = Math.min(average / 50 * 100, 100);

            // Einfache Pitch-Schätzung (nicht akkurat, nur für Demo)
            let maxIndex = 0;
            let maxValue = 0;

            for (let i = 0; i < length; i++) {
                if (array[i] > maxValue) {
                    maxValue = array[i];
                    maxIndex = i;
                }
            }

            // Sehr einfache Zuordnung zum MIDI-Pitch (nur für Demo)
            if (maxValue > 10) {
                currentPitch = Math.min(Math.max(40 + Math.floor(maxIndex / 4), 40), 90);
            } else {
                currentPitch = 0;
            }

            micLevelFill.style.width = volumePercentage + '%';

            if (volumePercentage > 5) {
                startAppBtn.disabled = false;
            }
        };

        startAppBtn.disabled = false;
    } catch (err) {
        console.error('Fehler beim Zugriff auf das Mikrofon:', err);
        micStatus.textContent = "Fehler beim Zugriff auf das Mikrofon. Bitte erlaube den Zugriff und lade die Seite neu.";
    }
}

// Songs in das Grid einfügen
function populateSongGrid() {
    songGrid.innerHTML = '';

    songs.forEach(song => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        songCard.dataset.songId = song.id;

        let difficultyStars = '';
        for (let i = 1; i <= 5; i++) {
            difficultyStars += `<span class="${i <= song.difficulty ? 'active' : ''}"></span>`;
        }

        songCard.innerHTML = `
            <img src="${song.cover}" alt="${song.title}" class="song-image">
            <div class="song-info">
                <h3 class="song-title">${song.title}</h3>
                <p class="song-artist">${song.artist}</p>
                <div class="difficulty">
                    ${difficultyStars}
                </div>
            </div>
        `;

        songCard.addEventListener('click', () => startGame(song.id));
        songGrid.appendChild(songCard);
    });
}

// Spiel starten
function startGame(songId) {
    currentSong = songs.find(song => song.id === songId);
    if (!currentSong) {
        console.error(`Song mit ID ${songId} nicht gefunden!`);
        return;
    }

    currentTime = 0;
    score = 0;
    stats = {perfect: 0, good: 0, ok: 0, missed: 0};

    songSelection.classList.remove('active');
    gameplay.classList.add('active');

    // Audio abspielen
    playBackingTrack(currentSong);

    updateLyrics();
    initializeGameLoop();
}

// Song abspielen
function playBackingTrack(song) {
    // Stoppe vorherige Audios
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    // Neuen Audio-Player erstellen
    if (song.audioUrl && song.audioUrl !== '#') {
        audioPlayer = new Audio(song.audioUrl);

        // Event-Listener für das Ende des Songs
        audioPlayer.addEventListener('ended', endGame);

        // Starte Wiedergabe
        audioPlayer.play().catch(error => {
            console.error('Fehler beim Abspielen des Audios:', error);
            alert('Fehler beim Abspielen des Songs. Bitte versuche es erneut.');
        });
    } else {
        // Falls kein Audio verfügbar ist, setzen wir den audioPlayer auf null
        // und erstellen einen Timer, der den endGame nach einer bestimmten Zeit aufruft
        audioPlayer = null;
        const songDuration = 222; // Ungefähre Songlänge aus den Notendaten
        setTimeout(endGame, songDuration * 1000);
    }

    return audioPlayer;
}

// Spielablauf
function initializeGameLoop() {
    clearInterval(gameInterval);

    gameInterval = setInterval(() => {
        if (!isPaused) {
            updateGame();
        }
    }, 100);
}

// Spiel aktualisieren
function updateGame() {
    // Wenn Audio-Player existiert, nutze seine aktuelle Zeit
    if (audioPlayer && !isPaused) {
        currentTime = audioPlayer.currentTime;
    } else {
        currentTime += 0.1; // Fallback wenn kein Audio-Player
    }

    updateLyrics();
    updateNotes();
    updateProgress();
}

// Liedtext aktualisieren
function updateLyrics() {
    if (!currentSong.lyrics || currentSong.lyrics.length === 0) return;

    // Aktuelle Zeile finden
    const currentLyricObj = currentSong.lyrics.find(lyric =>
        lyric.time <= currentTime && lyric.time + 4 > currentTime);

    // Nächste Zeile finden
    let nextIndex = 0;
    if (currentLyricObj) {
        nextIndex = currentSong.lyrics.indexOf(currentLyricObj) + 1;
    }

    const nextLyricObj = nextIndex < currentSong.lyrics.length ?
        currentSong.lyrics[nextIndex] : null;

    // Text aktualisieren
    currentLyric.textContent = currentLyricObj ? currentLyricObj.text : '';
    nextLyric.textContent = nextLyricObj ? nextLyricObj.text : '';
}

// Noten anzeigen und bewerten
function updateNotes() {
    if (!currentSong.notes || currentSong.notes.length === 0) return;

    pitchIndicator.innerHTML = '';

    // Aktive Noten finden und anzeigen
    const activeNotes = currentSong.notes.filter(note =>
        note.time <= currentTime + 3 && note.time + note.duration >= currentTime - 0.5);

    activeNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-line';

        // Position und Dauer berechnen
        const left = ((note.time - currentTime + 3) / 3) * 100;
        const top = 100 - ((note.pitch - 40) / 50 * 100);
        const width = (note.duration / 3) * 100;

        noteElement.style.left = left + '%';
        noteElement.style.top = top + '%';
        noteElement.style.width = width + '%';

        // Setze zusätzliche Eigenschaften basierend auf den Notendaten
        // Noten mit höherer Confidence bekommen intensivere Farbe
        const confidence = note.confidence || 0.5;
        noteElement.style.opacity = Math.max(0.5, confidence);

        // Bei hoher pitch_accuracy eigene Klasse hinzufügen
        if (note.pitch_accuracy && note.pitch_accuracy >= 0.9) {
            noteElement.classList.add('high-accuracy');
        }

        pitchIndicator.appendChild(noteElement);

        // Punkte berechnen, wenn Note aktiv ist
        if (note.time <= currentTime && note.time + note.duration >= currentTime) {
            const pitchDifference = Math.abs(note.pitch - currentPitch);

            if (pitchDifference < 2) {
                score += 100;
                stats.perfect++;
                // Visuelle Rückmeldung für perfekten Treffer
                noteElement.classList.add('perfect-hit');
            } else if (pitchDifference < 4) {
                score += 50;
                stats.good++;
                // Visuelle Rückmeldung für guten Treffer
                noteElement.classList.add('good-hit');
            } else if (pitchDifference < 6) {
                score += 20;
                stats.ok++;
                // Visuelle Rückmeldung für ok Treffer
                noteElement.classList.add('ok-hit');
            } else {
                stats.missed++;
            }

            currentScore.textContent = score;
        }
    });

    // User-Pitch anzeigen
    if (currentPitch > 0) {
        const userPitchElement = document.createElement('div');
        userPitchElement.className = 'user-pitch';

        const top = 100 - ((currentPitch - 40) / 50 * 100);
        userPitchElement.style.left = '50%';
        userPitchElement.style.top = top + '%';

        pitchIndicator.appendChild(userPitchElement);
    }
}

// Fortschritt aktualisieren
function updateProgress() {
    let duration = 222; // Standard-Fallback - nutzt die ungefähre Länge aus dem JSON

    // Wenn Audio-Player verfügbar, nimm die tatsächliche Dauer
    if (audioPlayer && audioPlayer.duration && !isNaN(audioPlayer.duration)) {
        duration = audioPlayer.duration;
    }

    const progressPercentage = (currentTime / duration) * 100;
    songProgress.style.width = progressPercentage + '%';
}

// Spiel pausieren/fortsetzen
function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Fortsetzen' : 'Pause';

    // Auch Audio pausieren/fortsetzen
    if (audioPlayer) {
        if (isPaused) {
            audioPlayer.pause();
        } else {
            audioPlayer.play();
        }
    }
}

// Spiel beenden
function endGame() {
    clearInterval(gameInterval);

    // Audio stoppen
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    gameplay.classList.remove('active');
    results.classList.add('active');

    finalScore.textContent = score;
    statPerfect.textContent = stats.perfect;
    statGood.textContent = stats.good;
    statOk.textContent = stats.ok;
    statMissed.textContent = stats.missed;

    // Sterne basierend auf Punktzahl setzen
    const maxScore = 10000;
    const starRating = Math.ceil((score / maxScore) * 5);

    stars.forEach((star, index) => {
        if (index < starRating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
}

// MIDI-Noten-Pitch in Frequenz umrechnen
function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

// Frequenz in MIDI-Noten-Pitch umrechnen
function freqToMidi(freq) {
    return Math.round(12 * Math.log2(freq / 440) + 69);
}

// Event-Listener
document.addEventListener('DOMContentLoaded', async () => {
    // Mikrofon einrichten
    await setupMicrophone();

    // Songs laden
    songs = await loadSongs();

    // Event-Handler registrieren
    startAppBtn.addEventListener('click', () => {
        micSetup.classList.remove('active');
        songSelection.classList.add('active');
        populateSongGrid();
    });

    pauseBtn.addEventListener('click', togglePause);

    quitBtn.addEventListener('click', () => {
        clearInterval(gameInterval);

        // Audio stoppen
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }

        gameplay.classList.remove('active');
        songSelection.classList.add('active');
    });

    playAgainBtn.addEventListener('click', () => {
        results.classList.remove('active');
        startGame(currentSong.id);
    });

    newSongBtn.addEventListener('click', () => {
        results.classList.remove('active');
        songSelection.classList.add('active');
    });

    // Autoplay-Probleme behandeln
    document.addEventListener('click', () => {
        // Viele Browser erlauben Audio erst nach einer Benutzerinteraktion
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    });
});