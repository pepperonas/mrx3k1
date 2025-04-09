// server.js - Vereinfachter Server ohne Express-Routing
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 4996;

// Einfacher HTTP-Server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} [REQUEST] ${req.method} ${req.url}`);

    // CORS-Header
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS-Requests sofort beantworten
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // Einfaches Routing basierend auf URL-Pfad
    const url = req.url;

    // API-Endpoint für Opener-Daten
    if (url === '/api/getOpeners' && req.method === 'GET') {
        try {
            console.log('Lese opener.json...');
            const filePath = path.join(__dirname, 'data', 'opener.json');

            // Prüfe ob Datei existiert
            if (!fs.existsSync(filePath)) {
                console.error('Datei nicht gefunden:', filePath);
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Datei nicht gefunden' }));
                return;
            }

            // Datei lesen
            const fileContent = fs.readFileSync(filePath, 'utf8');
            console.log('Dateiinhalt gelesen, Länge:', fileContent.length);

            try {
                const data = JSON.parse(fileContent);
                if (!data.opener) {
                    throw new Error('Ungültiges Datenformat: opener-Feld fehlt');
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data.opener));
            } catch (parseError) {
                console.error('JSON-Parse-Fehler:', parseError.message);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Fehler beim Parsen der Daten' }));
            }
        } catch (error) {
            console.error('Server-Fehler:', error.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Interner Serverfehler' }));
        }
    }

    // API-Endpoint für Dates-Daten
    else if (url === '/api/getDates' && req.method === 'GET') {
        try {
            console.log('Lese dates.json...');
            const filePath = path.join(__dirname, 'data', 'dates.json');

            // Prüfe ob Datei existiert
            if (!fs.existsSync(filePath)) {
                console.error('Datei nicht gefunden:', filePath);
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Datei nicht gefunden' }));
                return;
            }

            // Datei lesen
            const fileContent = fs.readFileSync(filePath, 'utf8');
            console.log('Dateiinhalt gelesen, Länge:', fileContent.length);

            try {
                const data = JSON.parse(fileContent);
                if (!data.aktivitaeten) {
                    throw new Error('Ungültiges Datenformat: aktivitaeten-Feld fehlt');
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data.aktivitaeten));
            } catch (parseError) {
                console.error('JSON-Parse-Fehler:', parseError.message);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Fehler beim Parsen der Daten' }));
            }
        } catch (error) {
            console.error('Server-Fehler:', error.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Interner Serverfehler' }));
        }
    }

    // API-Endpoint für Passwort-Check
    else if (url === '/api/checkPassword' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { password } = data;
                console.log('Passwort-Check:', password);

                if (password === '💋') {
                    console.log('Passwort korrekt für: opener');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, type: 'opener' }));
                } else if (password === '😘') {
                    console.log('Passwort korrekt für: dates');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, type: 'dates' }));
                } else {
                    console.log('Falsches Passwort');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false }));
                }
            } catch (error) {
                console.error('Fehler beim Parsen des Request-Body:', error);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Ungültiges Request-Format' }));
            }
        });
    }

    // 404 für alle anderen Routen
    else {
        console.log('Route nicht gefunden:', url);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Nicht gefunden' }));
    }
});

// Starte den Server
server.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log(`Server-Verzeichnis: ${__dirname}`);
    console.log(`Datenverzeichnis: ${path.join(__dirname, 'data')}`);
});

// Fehlerbehandlung
server.on('error', (error) => {
    console.error('Server-Fehler:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Unbehandelte Ausnahme:', error);
});