// songs.js - Datei zum Laden der externen Song-Daten
document.addEventListener('DOMContentLoaded', function () {
    // Referenz zum Song-Auswahlmenü
    const songSelect = document.getElementById('song-select');
    const statusMessage = document.getElementById('status-message');

    // Funktion zum Laden eines Songs aus einer JSON-Datei
    async function loadSongFromJSON(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const songData = await response.json();
            return songData;
        } catch (error) {
            console.error('Fehler beim Laden des Songs:', error);
            return null;
        }
    }

    // Funktion zum Laden aller verfügbaren Songs
    async function loadAvailableSongs() {
        try {
            // Hier könnte ein Verzeichnisinhalt geladen werden,
            // alternativ verwenden wir eine Liste bekannter Songs
            const songList = [
                {id: 'powerOfLove', title: 'Power of Love', filename: 'power-of-love.json'},
                {id: 'yourSoul', title: 'Your Soul', filename: 'your-soul.json'},
                {id: 'example', title: 'Beispielsong: La La La', filename: 'example.json'}
            ];

            // Song-Auswahl-Dropdown befüllen
            songList.forEach(song => {
                const option = document.createElement('option');
                option.value = song.id;
                option.textContent = song.title;
                option.dataset.filename = song.filename;
                songSelect.appendChild(option);
            });

            // Songs in das globale songs-Objekt laden
            window.songs = {};

            // Beispielsong direkt laden und speichern
            window.songs.example = {
                title: "La La La",
                audioUrl: "https://ia801602.us.archive.org/11/items/Rick_Astley_Never_Gonna_Give_You_Up/Rick_Astley_Never_Gonna_Give_You_Up.mp3",
                lyrics: [
                    {time: 0, text: "La la la", pitch: 60, duration: 2},
                    {time: 2, text: "La la la, höher", pitch: 65, duration: 2},
                    {time: 4, text: "La la la, noch höher", pitch: 70, duration: 2},
                    {time: 6, text: "La la la, tiefer", pitch: 60, duration: 2},
                    {time: 8, text: "La la la, ganz tief", pitch: 55, duration: 2},
                    {time: 10, text: "La la la, mittelhoch", pitch: 62, duration: 2},
                    {time: 12, text: "Letztes La la la", pitch: 65, duration: 2},
                ]
            };

            // Event-Listener für Song-Auswahl
            songSelect.addEventListener('change', async function () {
                const selectedOption = songSelect.options[songSelect.selectedIndex];
                const songId = selectedOption.value;

                // Prüfen, ob Song bereits geladen wurde
                if (!window.songs[songId] && songId !== 'example') {
                    const filename = selectedOption.dataset.filename;
                    statusMessage.textContent = `Lade Song: ${selectedOption.textContent}...`;

                    const songData = await loadSongFromJSON(filename);
                    if (songData) {
                        window.songs[songId] = songData;
                        statusMessage.textContent = `Song geladen: ${songData.title}`;
                    } else {
                        statusMessage.textContent = `Fehler beim Laden von ${selectedOption.textContent}`;
                    }
                }
            });

            return true;
        } catch (error) {
            console.error('Fehler beim Laden der verfügbaren Songs:', error);
            return false;
        }
    }

    // Songs laden und Dropdown initialisieren
    loadAvailableSongs();
});