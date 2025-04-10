// song-converter.js
// Dieses Tool kann verwendet werden, um vorhandene Song-Daten in JSON-Dateien zu konvertieren

document.addEventListener('DOMContentLoaded', function() {
    // Funktion zum Konvertieren eines Song-Objekts in JSON und Herunterladen
    function convertAndDownloadSong(songObject, filename) {
        // JSON-String erstellen
        const songJSON = JSON.stringify(songObject, null, 2); // Pretty-Print mit 2 Spaces

        // Blob erstellen
        const blob = new Blob([songJSON], {type: 'application/json'});

        // Download-Link erstellen
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename || 'song.json';

        // Link klicken und entfernen
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // URL freigeben
        URL.revokeObjectURL(a.href);
    }

    // UI für Konverter erstellen
    function createConverterUI() {
        const container = document.createElement('div');
        container.style.padding = '20px';
        container.style.backgroundColor = '#2C2E3B';
        container.style.color = 'white';
        container.style.borderRadius = '10px';
        container.style.marginTop = '20px';

        const title = document.createElement('h2');
        title.textContent = 'Song-Konverter';
        title.style.color = '#FFA500';

        const description = document.createElement('p');
        description.textContent = 'Wähle einen Song aus und konvertiere ihn in eine JSON-Datei.';

        const songSelect = document.createElement('select');
        songSelect.style.padding = '10px';
        songSelect.style.backgroundColor = '#22232D';
        songSelect.style.color = 'white';
        songSelect.style.border = 'none';
        songSelect.style.borderRadius = '5px';
        songSelect.style.marginRight = '10px';

        // Songs aus dem globalen songs-Objekt hinzufügen
        if (window.songs) {
            Object.keys(window.songs).forEach(songId => {
                const option = document.createElement('option');
                option.value = songId;
                option.textContent = window.songs[songId].title || songId;
                songSelect.appendChild(option);
            });
        }

        const convertBtn = document.createElement('button');
        convertBtn.textContent = 'Konvertieren und Herunterladen';
        convertBtn.style.backgroundColor = '#FFA500';
        convertBtn.style.color = '#2C2E3B';
        convertBtn.style.border = 'none';
        convertBtn.style.padding = '10px 15px';
        convertBtn.style.borderRadius = '5px';
        convertBtn.style.cursor = 'pointer';
        convertBtn.style.fontWeight = 'bold';

        // Event-Listener für den Konvertier-Button
        convertBtn.addEventListener('click', () => {
            const selectedSongId = songSelect.value;
            if (selectedSongId && window.songs[selectedSongId]) {
                const songData = window.songs[selectedSongId];
                const filename = `${selectedSongId}.json`;
                convertAndDownloadSong(songData, filename);
            }
        });

        // Elemente zum Container hinzufügen
        container.appendChild(title);
        container.appendChild(description);
        container.appendChild(songSelect);
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createElement('br'));
        container.appendChild(convertBtn);

        return container;
    }

    // Konverter zur Seite hinzufügen (nur für Entwicklungszwecke)
    const converterUI = createConverterUI();

    // Prüfen, ob ein Abfrageparameter 'converter=true' vorhanden ist
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('converter') === 'true') {
        document.querySelector('.container').appendChild(converterUI);
    }

    // Globales Konverter-Objekt bereitstellen
    window.songConverter = {
        convertAndDownload: convertAndDownloadSong,
        showUI: function() {
            document.querySelector('.container').appendChild(converterUI);
        }
    };

    // Konsolenhinweis zur Verwendung
    console.log('Song-Konverter geladen. Verwende window.songConverter.showUI() um die Benutzeroberfläche anzuzeigen.');
});