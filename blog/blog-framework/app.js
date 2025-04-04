const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4777;
const ejs = require('ejs');
const {errorHandler} = require('./utils/errorHandler');

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/blog', express.static(path.join(__dirname, 'public')));

// Benutzerdefinierte Rendering-Funktion für Layout-Support
app.engine('ejs', (filePath, options, callback) => {
    // Original-Template rendern
    ejs.renderFile(filePath, options, (err, content) => {
        if (err) return callback(err);

        // Wenn es sich nicht um das Layout-Template handelt, in Layout einbetten
        if (filePath !== path.join(__dirname, 'views', 'layout.ejs')) {
            // Layout-Template laden und Content einfügen
            ejs.renderFile(path.join(__dirname, 'views', 'layout.ejs'), {
                ...options,
                body: content
            }, callback);
        } else {
            // Wenn es das Layout selbst ist, einfach zurückgeben
            return callback(null, content);
        }
    });
});

// Logs-Verzeichnis erstellen falls nicht vorhanden
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, {recursive: true});
}

// Posts-Verzeichnisse erstellen falls nicht vorhanden
['ai', 'development', 'it-security'].forEach(category => {
    const dir = path.join(__dirname, 'posts', category);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
});

// Routes
const indexRoutes = require('./routes/index');
const postsRoutes = require('./routes/posts');

app.use('/blog', indexRoutes);
app.use('/blog/posts', postsRoutes);

// 404-Route für alle nicht gefundenen Seiten
app.use('/blog/*', (req, res) => {
    res.status(404).render('404', {
        title: 'Seite nicht gefunden',
        message: 'Die angeforderte Seite existiert nicht.'
    });
});

// Startseite auf /blog umleiten
app.get('/', (req, res) => {
    res.redirect('/blog');
});

// Fehlerbehandlung
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}/blog`);
    console.log(`Drücke STRG+C zum Beenden.`);
});