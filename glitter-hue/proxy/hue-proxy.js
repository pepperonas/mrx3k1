/**
 * Hue Proxy Server für GlitterHue
 * Leitet API-Anfragen an Philips Hue Bridges weiter und fügt CORS-Header hinzu
 */

const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');

// Konfiguration
const PORT = process.env.PORT || 8081;
const ALLOWED_ORIGINS = '*';  // Im Produktionsmodus einschränken
const DISCOVERY_INTERVAL = 60 * 1000;  // Millisekunden zwischen Discovery-Versuchen

// Gespeicherte Bridge-Informationen
let bridges = [];
let lastDiscoveryTime = 0;

// Express-App erstellen
const app = express();

// Middleware für CORS und JSON-Parsing
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400
}));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());

/**
 * Bridge-Discovery-Funktion
 * Sucht nach Hue Bridges im Netzwerk
 */
async function discoverBridges() {
    bridges = [];

    try {
        console.log('Führe Bridge-Discovery durch...');

        // Methode 1: Verwende die offizielle Meethue Discovery URL
        try {
            const response = await fetch('https://discovery.meethue.com/');
            const officialBridges = await response.json();

            for (const bridge of officialBridges) {
                if (bridge && bridge.internalipaddress && !bridges.some(b => b.internalipaddress === bridge.internalipaddress)) {
                    bridges.push(bridge);
                }
            }
        } catch (error) {
            console.error('Fehler bei offizieller Discovery-Methode:', error.message);
        }

        // Methode 2: Vereinfachte lokale Discovery (falls nötig)
        // In einer vollständigen Implementation könnte hier eine zusätzliche
        // lokale Discovery-Methode wie UPNP/SSDP implementiert werden

        lastDiscoveryTime = Date.now();
        console.log(`Discovery abgeschlossen. Gefundene Bridges: ${bridges.length}`);

        bridges.forEach((bridge, index) => {
            console.log(`Bridge ${index + 1}: ${bridge.internalipaddress}`);
        });
    } catch (error) {
        console.error('Fehler bei der Bridge-Discovery:', error);
    }
}

/**
 * Discovery-Endpunkt
 * Gibt eine Liste aller gefundenen Bridges zurück
 */
app.get('/hue/discovery', async (req, res) => {
    // Prüfe, ob ein neuer Discovery-Lauf notwendig ist
    const currentTime = Date.now();
    if (currentTime - lastDiscoveryTime > DISCOVERY_INTERVAL || bridges.length === 0) {
        try {
            await discoverBridges();
        } catch (error) {
            console.error('Fehler beim Bridge-Discovery:', error);
        }
    }

    // Wenn keine Bridges gefunden wurden, versuche einen Fallback
    if (bridges.length === 0) {
        // Wenn im lokalen Netzwerk, könnte die Bridge so zu finden sein
        try {
            const officialResponse = await fetch('https://discovery.meethue.com/');
            const officialBridges = await officialResponse.json();

            if (officialBridges && officialBridges.length > 0) {
                bridges = officialBridges;
            }
        } catch (error) {
            console.error('Fallback Discovery fehlgeschlagen:', error);
        }
    }

    // Sende die gefundenen Bridges zurück
    res.json({bridges});
});

/**
 * Proxy-Middleware für Hue API-Anfragen
 * Leitet Anfragen an die Hue Bridge weiter
 */
app.all('/hue/:bridgeIp/*', async (req, res) => {
    const bridgeIp = req.params.bridgeIp;
    // Rekonstruiere den Pfad ohne /hue/<bridge-ip>
    const pathParts = req.url.split('/').slice(3);
    const targetPath = '/' + pathParts.join('/');

    // Vollständige Ziel-URL
    const targetUrl = `http://${bridgeIp}${targetPath}`;

    try {
        console.log(`Proxy-Anfrage: ${req.method} ${targetUrl}`);

        // Optionen für die Fetch-Anfrage
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': req.get('Content-Type') || 'application/json'
            }
        };

        // Füge den Body hinzu, falls vorhanden
        if (['POST', 'PUT'].includes(req.method)) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        // Sende die Anfrage an die Bridge
        const response = await fetch(targetUrl, fetchOptions);
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // Falls die Antwort kein JSON ist, sende den Text
            data = await response.text();
        }

        // Antwort an den Client senden
        res.status(response.status).json(data);
    } catch (error) {
        console.error(`Proxy-Fehler: ${error.message}`);
        res.status(500).json({error: `Proxy-Fehler: ${error.message}`});
    }
});

/**
 * Options-Handler für CORS-Preflight-Anfragen
 */
app.options('*', (req, res) => {
    res.status(200).end();
});

/**
 * Status-Endpunkt
 * Gibt Informationen über den Proxy zurück
 */
app.get('/hue/status', (req, res) => {
    res.json({
        status: 'online',
        bridgesFound: bridges.length,
        lastDiscoveryTime: new Date(lastDiscoveryTime).toISOString(),
        uptime: process.uptime()
    });
});

/**
 * Fallback-Route für ungültige Pfade
 */
app.use((req, res) => {
    res.status(404).json({error: 'Ungültiger Pfad. Format: /hue/<bridge-ip>/...'});
});

/**
 * Error Handler
 */
app.use((err, req, res, next) => {
    console.error('Server-Fehler:', err);
    res.status(500).json({error: 'Interner Serverfehler', message: err.message});
});

/**
 * Server starten
 */
app.listen(PORT, () => {
    console.log(`Hue Proxy Server läuft unter http://0.0.0.0:${PORT}`);
    console.log('Drücke Ctrl+C zum Beenden');

    // Initiales Discovery beim Start
    discoverBridges().catch(error => {
        console.error('Initiales Discovery fehlgeschlagen:', error);
    });
});