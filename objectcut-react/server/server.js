// server/server.js - Anpassungen für den Pfad /objectcut-react

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 4991;

// Middleware
app.use(cors());
app.use(express.json());

// Temporärer Speicherort für Uploads
const uploadDir = path.join(os.tmpdir(), 'objectcut-uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer-Konfiguration für Datei-Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Eindeutigen Dateinamen generieren
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'input-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB Limit
    },
    fileFilter: (req, file, cb) => {
        // Akzeptiere nur Bilder
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Nur Bilddateien sind erlaubt'), false);
        }
    }
});

// API-Route für die Hintergrundentfernung
app.post('/api/remove-background', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Keine Bilddatei hochgeladen' });
        }

        const inputPath = req.file.path;
        const outputPath = path.join(uploadDir, 'output-' + path.basename(inputPath));

        console.log(`Processing image: ${inputPath}`);
        console.log(`Output will be saved to: ${outputPath}`);

        // Python-Skript ausführen
        const pythonProcess = spawn('/var/www/html/objectcut-react/venv/bin/python3', [
            path.join(__dirname, 'remove_bg.py'),
            inputPath,
            outputPath
        ]);

        let errorOutput = '';

        // Fehlerausgabe sammeln
        pythonProcess.stderr.on('data', (data) => {
            console.log(`Python stderr: ${data}`);
            errorOutput += data.toString();
        });

        // Warten auf Prozessende
        const exitCode = await new Promise((resolve) => {
            pythonProcess.on('close', (code) => {
                resolve(code);
            });
        });

        // Überprüfen, ob das Skript erfolgreich war
        if (exitCode !== 0) {
            console.error(`Python process exited with code ${exitCode}`);
            console.error(`Error output: ${errorOutput}`);
            return res.status(500).json({
                error: 'Fehler bei der Hintergrundentfernung',
                details: errorOutput
            });
        }

        // Überprüfen, ob die Ausgabedatei existiert
        if (!fs.existsSync(outputPath)) {
            return res.status(500).json({
                error: 'Ausgabedatei wurde nicht erstellt',
                details: errorOutput
            });
        }

        // Datei senden
        res.sendFile(outputPath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ error: 'Fehler beim Senden der Datei' });
            }

            // Aufräumen: Temporäre Dateien löschen
            setTimeout(() => {
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (err) {
                    console.error('Fehler beim Löschen temporärer Dateien:', err);
                }
            }, 1000);
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Serverfehler bei der Bildverarbeitung',
            details: error.message
        });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
    console.log(`Upload-Verzeichnis: ${uploadDir}`);
});

// Aufräumen beim Beenden
process.on('SIGINT', () => {
    console.log('Server wird beendet. Räume temporäre Dateien auf...');
    try {
        // Verzeichnis löschen, falls es existiert und leer ist
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(uploadDir, file));
            });
        }
    } catch (err) {
        console.error('Fehler beim Aufräumen:', err);
    }
    process.exit();
});