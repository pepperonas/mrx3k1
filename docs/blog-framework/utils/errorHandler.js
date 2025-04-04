const fs = require('fs');
const path = require('path');

// Funktion zum Loggen von Fehlern
const logError = (err, req) => {
    const timestamp = new Date().toISOString();
    const logDir = path.join(__dirname, '..', 'logs');

    // Logs-Verzeichnis erstellen, falls nicht vorhanden
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, {recursive: true});
    }

    const logFile = path.join(logDir, 'error.log');
    const logMessage = `${timestamp} - ${req ? req.method : 'SYSTEM'} ${req ? req.originalUrl : ''}\n${err.stack || err}\n\n`;

    fs.appendFileSync(logFile, logMessage);

    // Im Entwicklungsmodus Fehler in der Konsole ausgeben
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[ERROR] ${timestamp}:`);
        console.error(err);
    }
};

// Express-Fehlerbehandlung
const errorHandler = (err, req, res, next) => {
    // Fehler loggen
    logError(err, req);

    // HTTP-Status setzen
    const status = err.status || 500;

    // Rendering der Fehlerseite
    res.status(status).render('error', {
        title: `Fehler ${status}`,
        status: status,
        message: process.env.NODE_ENV === 'production'
            ? 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.'
            : err.message,
        error: process.env.NODE_ENV === 'production' ? {} : err,
        stack: process.env.NODE_ENV === 'production' ? '' : err.stack
    });
};

// Uncaught Exception Handler
process.on('uncaughtException', (err) => {
    logError(err);
    console.error('Uncaught Exception aufgetreten! Server wird neu gestartet...');

    // Im Produktionsmodus den Prozess beenden, damit ein Prozessmanager wie PM2 ihn neu starten kann
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Unhandled Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
    logError(reason);
    console.error('Unbehandelte Promise Rejection:', reason);
});

module.exports = {
    errorHandler,
    logError
};