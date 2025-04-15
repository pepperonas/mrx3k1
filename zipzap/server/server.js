// server.js - With Brute-Force Protection and Download Support
const http = require('http');
const fs = require('fs');
const path = require('path');
const {exec} = require('child_process');
const PORT = process.env.PORT || 4996;

// Rate-Limiting and Brute-Force Protection
const ipAttempts = new Map(); // IP -> {attempts: number, lastAttempt: timestamp, blocked: boolean}
const MAX_ATTEMPTS = 5;       // Maximum number of failed attempts
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes block in milliseconds
const ATTEMPT_RESET = 60 * 60 * 1000;  // Reset after 1 hour without attempts
const MIN_ATTEMPT_INTERVAL = 1000;     // At least 1 second between attempts

// Cache for generated zip bombs
const zipCache = new Map(); // cacheKey -> {filePath, createdAt}
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache duration

// Helper function: Check and update rate limiting for an IP
function checkRateLimit(ip) {
    const now = Date.now();

    // If the IP is not in the map, add it
    if (!ipAttempts.has(ip)) {
        ipAttempts.set(ip, {attempts: 0, lastAttempt: now, blocked: false});
        return {allowed: true};
    }

    const attemptData = ipAttempts.get(ip);

    // If IP is blocked, check if block has expired
    if (attemptData.blocked) {
        if (now - attemptData.lastAttempt >= BLOCK_DURATION) {
            // Remove block
            attemptData.blocked = false;
            attemptData.attempts = 0;
            attemptData.lastAttempt = now;
            ipAttempts.set(ip, attemptData);
            return {allowed: true};
        }

        // Calculate remaining block time in seconds
        const remainingTime = Math.ceil((BLOCK_DURATION - (now - attemptData.lastAttempt)) / 1000);
        return {
            allowed: false,
            reason: 'blocked',
            message: `Too many attempts. Please wait ${remainingTime} seconds.`
        };
    }

    // Check if last request was too recent
    if (now - attemptData.lastAttempt < MIN_ATTEMPT_INTERVAL) {
        return {
            allowed: false,
            reason: 'tooFast',
            message: 'Too many requests. Please wait.'
        };
    }

    // If no requests for a longer time, reset counter
    if (now - attemptData.lastAttempt >= ATTEMPT_RESET) {
        attemptData.attempts = 0;
    }

    // Update timestamp for last attempt
    attemptData.lastAttempt = now;
    ipAttempts.set(ip, attemptData);

    return {allowed: true};
}

// Helper function: Register a failed attempt
function registerFailedAttempt(ip) {
    if (!ipAttempts.has(ip)) {
        ipAttempts.set(ip, {attempts: 1, lastAttempt: Date.now(), blocked: false});
        return;
    }

    const attemptData = ipAttempts.get(ip);
    attemptData.attempts += 1;
    attemptData.lastAttempt = Date.now();

    // If too many attempts, block the IP
    if (attemptData.attempts >= MAX_ATTEMPTS) {
        attemptData.blocked = true;
        console.log(`IP ${ip} was blocked due to too many failed attempts`);
    }

    ipAttempts.set(ip, attemptData);
}

// Helper function: Register successful login (resets attempts)
function registerSuccessfulAttempt(ip) {
    if (ipAttempts.has(ip)) {
        const attemptData = ipAttempts.get(ip);
        attemptData.attempts = 0;
        attemptData.lastAttempt = Date.now();
        attemptData.blocked = false;
        ipAttempts.set(ip, attemptData);
    }
}

// Generate a zip bomb using the Python script
function generateZipBomb(options) {
    return new Promise((resolve, reject) => {
        const { size, levels, outputDir } = options;

        // Stelle sicher, dass das Ausgabeverzeichnis existiert
        try {
            fs.mkdirSync(outputDir, { recursive: true });
        } catch (err) {
            console.error(`Fehler beim Erstellen des Ausgabeverzeichnisses: ${err.message}`);
        }

        // Verwende absolute Pfade
        const scriptPath = path.resolve(__dirname, '..', 'ZipBombGenerator.py');
        const absoluteOutputDir = path.resolve(__dirname, '..', outputDir);

        // Wähle den richtigen Python-Befehl je nach Betriebssystem
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

        // Erstelle den Befehl mit absoluten Pfaden und der --force Option
        const command = `${pythonCommand} "${scriptPath}" --size ${size} --levels ${levels} --output "${absoluteOutputDir}" --force`;

        console.log(`Executing Python script at: ${scriptPath}`);
        console.log(`Full command: ${command}`);
        console.log(`Working directory: ${__dirname}`);

        // Führe den Befehl aus und zeige alle Ausgaben an
        exec(command, (error, stdout, stderr) => {
            console.log("Python stdout:", stdout);

            if (stderr) {
                console.error("Python stderr:", stderr);
            }

            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return reject(new Error('Failed to generate zip bomb'));
            }

            // Suche den generierten Dateinamen in der Ausgabe
            const expectedFilename = `zipzap_bomb_${size}MB_${levels}levels.zip`;
            const expectedFilePath = path.join(absoluteOutputDir, expectedFilename);

            console.log(`Überprüfe ob Datei existiert: ${expectedFilePath}`);
            console.log(`Datei existiert: ${fs.existsSync(expectedFilePath)}`);

            if (fs.existsSync(expectedFilePath)) {
                resolve(expectedFilePath);
            } else {
                console.error('Zip-Datei wurde nicht gefunden');
                reject(new Error('Zip file not found after generation'));
            }
        });
    });
}

// Simple HTTP Server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} [REQUEST] ${req.method} ${req.url}`);

    // Get client IP address
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Respond immediately to OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }

    // Simple routing based on URL path
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // API Endpoint for checking password
    if (pathname === '/api/checkPassword' && req.method === 'POST') {
        // Apply brute-force protection
        const rateLimitCheck = checkRateLimit(ip);

        if (!rateLimitCheck.allowed) {
            console.log(`Rate limit for IP ${ip}: ${rateLimitCheck.reason}`);
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
                console.log('Password check requested');

                if (password === '1337') {
                    console.log('Password correct');
                    registerSuccessfulAttempt(ip);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({success: true}));
                } else {
                    console.log('Incorrect password');
                    registerFailedAttempt(ip);

                    // Get current attempt data
                    const attemptData = ipAttempts.get(ip);
                    const remainingAttempts = MAX_ATTEMPTS - attemptData.attempts;

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
                        message: remainingAttempts > 0
                            ? `Incorrect password. ${remainingAttempts} attempts remaining.`
                            : 'Too many failed attempts. Please wait 15 minutes.'
                    }));
                }
            } catch (error) {
                console.error('Error parsing request body:', error);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({error: 'Invalid request format'}));
            }
        });
    }

    // API Endpoint for generating a zip bomb
    else if (pathname === '/api/generateZipBomb' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const {fileSize, levels, outputDir = 'zipzap_output'} = data;
                const size = parseInt(fileSize) || 10;
                const nestingLevels = parseInt(levels) || 1;

                // Validate and sanitize inputs
                if (isNaN(size) || size <= 0 || size > 50) {
                    throw new Error('Invalid file size. Must be between 1 and 50 MB.');
                }

                if (isNaN(nestingLevels) || nestingLevels <= 0 || nestingLevels > 3) {
                    throw new Error('Invalid nesting levels. Must be between 1 and 3.');
                }

                // Check if this requires password verification
                const estimatedSize = size * 10; // Simple estimation

                if (estimatedSize > 100) {
                    // Verify that this IP has been authenticated
                    const attemptData = ipAttempts.get(ip);
                    if (!attemptData || attemptData.attempts > 0 || attemptData.blocked) {
                        res.statusCode = 403; // Forbidden
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            error: 'Authentication required',
                            message: 'Password verification required for zip bombs over 100MB'
                        }));
                        return;
                    }
                }

                // Generate the zip bomb
                try {
                    const outputFilePath = await generateZipBomb({
                        size,
                        levels: nestingLevels,
                        outputDir
                    });

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        filePath: outputFilePath,
                        downloadUrl: `/api/download?file=${encodeURIComponent(path.basename(outputFilePath))}&dir=${encodeURIComponent(outputDir)}`
                    }));
                } catch (genError) {
                    console.error('Error generating zip bomb:', genError);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        error: 'Generation failed',
                        message: genError.message
                    }));
                }
            } catch (error) {
                console.error('Error parsing request body:', error);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({error: 'Invalid request format', message: error.message}));
            }
        });
    }

    // API Endpoint for downloading a zip bomb
    else if (pathname === '/api/download' && req.method === 'GET') {
        const fileParam = url.searchParams.get('file');
        const dirParam = url.searchParams.get('dir') || 'zipzap_output';

        if (!fileParam) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({error: 'Missing file parameter'}));
            return;
        }

        // Sanitize file path to prevent directory traversal
        const filename = path.basename(fileParam);
        const safeDir = path.resolve(__dirname, '..', dirParam);
        const filePath = path.join(safeDir, filename);

        console.log(`Attempting to download: ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({error: 'File not found'}));
            return;
        }

        // Get file stats
        const stat = fs.statSync(filePath);

        // Set headers for file download
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    }

    // 404 for all other routes
    else {
        console.log('Route not found:', pathname);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({error: 'Not found'}));
    }
});

// Periodic cleanup (remove old entries)
setInterval(() => {
    const now = Date.now();

    // Clean up IP attempts
    for (const [ip, data] of ipAttempts.entries()) {
        // If last attempt was more than 24 hours ago, remove entry
        if (now - data.lastAttempt > 24 * 60 * 60 * 1000) {
            ipAttempts.delete(ip);
        }
    }

    // Clean up cache
    for (const [key, data] of zipCache.entries()) {
        // If cache entry is older than cache duration, remove it
        if (now - data.createdAt > CACHE_DURATION) {
            zipCache.delete(key);
        }
    }
}, 60 * 60 * 1000); // Clean up every 60 minutes

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Error handling
server.on('error', (error) => {
    console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});