// server.js - Mit Brute-Force-Schutz
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 4996;

// Rate-Limiting und Brute-Force-Schutz
const ipAttempts = new Map(); // IP -> {attempts: number, lastAttempt: timestamp, blocked: boolean}
const MAX_ATTEMPTS = 5;       // Maximale Anzahl von fehlgeschlagenen Versuchen
const BLOCK_DURATION = 15 * 60 * 1000; // 15 Minuten Blockierung in Millisekunden
const ATTEMPT_RESET = 60 * 60 * 1000;  // Nach 1 Stunde ohne Versuche zurücksetzen
const MIN_ATTEMPT_INTERVAL = 1000;     // Mindestens 1 Sekunde zwischen Versuchen

// Hilfsfunktion: Prüft und aktualisiert Rate-Limiting für eine IP
function checkRateLimit(ip) {
    const now = Date.now();

    // Wenn die IP nicht in der Map ist, füge sie hinzu
    if (!ipAttempts.has(ip)) {
        ipAttempts.set(ip, {attempts: 0, lastAttempt: now, blocked: false});
        return {allowed: true};
    }

    const attemptData = ipAttempts.get(ip);

    // Wenn IP blockiert ist, prüfe ob Blockierung abgelaufen ist
    if (attemptData.blocked) {
        if (now - attemptData.lastAttempt >= BLOCK_DURATION) {
            // Blockierung aufheben
            attemptData.blocked = false;
            attemptData.attempts = 0;
            attemptData.lastAttempt = now;
            ipAttempts.set(ip, attemptData);
            return {allowed: true};
        }

        // Berechne verbleibende Blockzeit in Sekunden
        const remainingTime = Math.ceil((BLOCK_DURATION - (now - attemptData.lastAttempt)) / 1000);
        return {
            allowed: false,
            reason: 'blocked',
            message: `Zu viele Versuche. Bitte warten Sie ${remainingTime} Sekunden.`
        };
    }

    // Prüfe, ob die letzte Anfrage zu kurz zurückliegt
    if (now - attemptData.lastAttempt < MIN_ATTEMPT_INTERVAL) {
        return {
            allowed: false,
            reason: 'tooFast',
            message: 'Zu viele Anfragen. Bitte warten Sie kurz.'
        };
    }

    // Wenn längere Zeit keine Anfragen kamen, setze Zähler zurück
    if (now - attemptData.lastAttempt >= ATTEMPT_RESET) {
        attemptData.attempts = 0;
    }

    // Aktualisiere Timestamp für letzten Versuch
    attemptData.lastAttempt = now;
    ipAttempts.set(ip, attemptData);

    return {allowed: true};
}

// Hilfsfunktion: Registriert einen fehlgeschlagenen Versuch
function registerFailedAttempt(ip) {
    if (!ipAttempts.has(ip)) {
        ipAttempts.set(ip, {attempts: 1, lastAttempt: Date.now(), blocked: false});
        return;
    }

    const attemptData = ipAttempts.get(ip);
    attemptData.attempts += 1;
    attemptData.lastAttempt = Date.now();

    // Wenn zu viele Versuche, blockiere die IP
    if (attemptData.attempts >= MAX_ATTEMPTS) {
        attemptData.blocked = true;
        console.log(`IP ${ip} wurde wegen zu vieler fehlgeschlagener Versuche blockiert`);
    }

    ipAttempts.set(ip, attemptData);
}

// Hilfsfunktion: Erfolgreichen Login registrieren (setzt Versuche zurück)
function registerSuccessfulAttempt(ip) {
    if (ipAttempts.has(ip)) {
        const attemptData = ipAttempts.get(ip);
        attemptData.attempts = 0;
        attemptData.lastAttempt = Date.now();
        attemptData.blocked = false;
        ipAttempts.set(ip, attemptData);
    }
}

// Einfacher HTTP-Server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} [REQUEST] ${req.method} ${req.url}`);

    // IP-Adresse des Clients ermitteln
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

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
                res.end(JSON.stringify({error: 'Datei nicht gefunden'}));
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
                res.end(JSON.stringify({error: 'Fehler beim Parsen der Daten'}));
            }
        } catch (error) {
            console.error('Server-Fehler:', error.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({error: 'Interner Serverfehler'}));
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
                res.end(JSON.stringify({error: 'Datei nicht gefunden'}));
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
                res.end(JSON.stringify({error: 'Fehler beim Parsen der Daten'}));
            }
        } catch (error) {
            console.error('Server-Fehler:', error.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({error: 'Interner Serverfehler'}));
        }
    }

    // API-Endpoint für Passwort-Check
    else if (url === '/api/checkPassword' && req.method === 'POST') {
        // Brute-Force-Schutz anwenden
        const rateLimitCheck = checkRateLimit(ip);

        if (!rateLimitCheck.allowed) {
            console.log(`Rate-Limit für IP ${ip}: ${rateLimitCheck.reason}`);
            res.statusCode = 429; // Too Many Requests
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Rate limit exceeded',
                message: rateLimitCheck.message
            }));
            return;
        }

        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const {password} = data;
                console.log('Passwort-Check angefordert');

                if (password === '💋!') {
                    console.log('Passwort korrekt für: opener');
                    registerSuccessfulAttempt(ip);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({success: true, type: 'opener'}));
                } else if (password === '😘!') {
                    console.log('Passwort korrekt für: dates');
                    registerSuccessfulAttempt(ip);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({success: true, type: 'dates'}));
                } else if (password === '😍!') {
                    console.log('Passwort korrekt für: tips');
                    registerSuccessfulAttempt(ip);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({success: true, type: 'tips'}));
                } else {
                    console.log('Falsches Passwort');
                    registerFailedAttempt(ip);

                    // Aktuelle Versuchsdaten abrufen
                    const attemptData = ipAttempts.get(ip);
                    const remainingAttempts = MAX_ATTEMPTS - attemptData.attempts;

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
                        message: remainingAttempts > 0
                            ? `Falsches Passwort. Noch ${remainingAttempts} Versuche übrig.`
                            : 'Zu viele fehlgeschlagene Versuche. Bitte warten Sie 15 Minuten.'
                    }));
                }
            } catch (error) {
                console.error('Fehler beim Parsen des Request-Body:', error);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({error: 'Ungültiges Request-Format'}));
            }
        });
    }

    // 404 für alle anderen Routen
    else {
        console.log('Route nicht gefunden:', url);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({error: 'Nicht gefunden'}));
    }
});

// Periodische Bereinigung der Daten (alte Einträge entfernen)
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipAttempts.entries()) {
        // Wenn der letzte Versuch länger als 24 Stunden her ist, entferne den Eintrag
        if (now - data.lastAttempt > 24 * 60 * 60 * 1000) {
            ipAttempts.delete(ip);
        }
    }
}, 60 * 60 * 1000); // Alle 60 Minuten aufräumen

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