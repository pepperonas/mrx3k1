// Erforderliche Module importieren
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Umgebungsvariablen laden
dotenv.config();

// Express-App initialisieren
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());

// Statische Dateien aus dem public-Verzeichnis bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 100 // Limit jede IP auf 100 Anfragen pro Zeitfenster
});
app.use('/api/', limiter);

// Routen importieren
const documentationRoutes = require('./routes/documentation');
const categoryRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const authRoutes = require('./routes/auth');
const rootRoutes = require('./routes/root');

// Routen verwenden
app.use('/api/docs', documentationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/', rootRoutes);

// Statische Dateien für Markdown-Content
app.use('/content', express.static(path.join(__dirname, '../content')));

// Frontend im Produktionsmodus bereitstellen
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
    });
}

// MongoDB-Verbindung herstellen
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techdocs', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB verbunden'))
    .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});