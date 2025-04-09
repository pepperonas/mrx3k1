// server.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware für JSON-Parsing
app.use(express.json());

// Statische Dateien aus dem Build-Verzeichnis bereitstellen
app.use(express.static(path.join(__dirname, 'client/build')));

// API-Route zum Überprüfen des Passworts
app.post('/api/checkPassword', (req, res) => {
    const { password } = req.body;

    // Passwörter sicher im Backend prüfen
    // Man könnte diese auch in einer Umgebungsvariable oder Datenbank speichern
    if (password === '🫦') {
        return res.json({ success: true, type: 'opener' });
    } else if (password === '🫠') {
        return res.json({ success: true, type: 'dates' });
    } else {
        return res.json({ success: false });
    }
});

// API-Route zum Laden der Opener-Daten
app.get('/api/getOpeners', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/opener.json'), 'utf8');
        const openerData = JSON.parse(data);
        res.json(openerData.opener);
    } catch (error) {
        console.error('Fehler beim Laden der Opener-Daten:', error);
        res.status(500).json({ error: 'Serverfehler beim Laden der Daten' });
    }
});

// API-Route zum Laden der Dates-Daten
app.get('/api/getDates', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/dates.json'), 'utf8');
        const datesData = JSON.parse(data);
        res.json(datesData.aktivitaeten);
    } catch (error) {
        console.error('Fehler beim Laden der Dates-Daten:', error);
        res.status(500).json({ error: 'Serverfehler beim Laden der Daten' });
    }
});

// Alle anderen Anfragen an die React-App weiterleiten
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});