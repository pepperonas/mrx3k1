const {exec, execSync} = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const contentDisposition = require('content-disposition');
const morgan = require('morgan');
const filesize = require('filesize');
const os = require('os');
const crypto = require('crypto');

const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME || '';
const INSTAGRAM_PASSWORD = process.env.INSTAGRAM_PASSWORD || '';


// Create temp directory for downloads
const TEMP_DIR = path.join(os.tmpdir(), 'sm-downloader');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, {recursive: true});
}

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/fetch', async (req, res) => {
    try {
        const {url, platform} = req.body;

        if (!url || !platform) {
            return res.status(400).json({
                success: false,
                error: 'URL und Plattform sind erforderlich'
            });
        }

        let videoInfo;

        switch (platform) {
            case 'youtube':
                videoInfo = await fetchYouTubeInfo(url);
                break;
            case 'instagram':
                videoInfo = await fetchInstagramInfo(url);
                break;
            case 'tiktok':
                videoInfo = await fetchTikTokInfo(url);
                break;
            case 'twitter':
                videoInfo = await fetchTwitterInfo(url);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Nicht unterstützte Plattform'
                });
        }

        res.json({success: true, video: videoInfo});
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).json({
            success: false,
            error: `Fehler beim Abrufen des Videos: ${error.message}`
        });
    }
});

// Verbesserte Fehlerbehandlung im Download-Endpunkt
app.post('/api/download', async (req, res) => {
    try {
        const {url, platform, formatId} = req.body;

        if (!url || !platform || !formatId) {
            return res.status(400).json({
                success: false,
                error: 'URL, Plattform und Format-ID sind erforderlich'
            });
        }

        let filePath, filename, mimeType;

        try {
            switch (platform) {
                case 'youtube':
                    try {
                        const result = await downloadYouTube(url, formatId);
                        filePath = result.filePath;
                        filename = result.filename;
                        mimeType = result.mimeType;
                    } catch (youtubeError) {
                        console.error('YouTube download specific error:', youtubeError.message);

                        // Return a specific error message for YouTube
                        return res.status(403).json({
                            success: false,
                            error: youtubeError.message
                        });
                    }
                    break;
                case 'instagram':
                    const igResult = await downloadInstagram(url, formatId);
                    filePath = igResult.filePath;
                    filename = igResult.filename;
                    mimeType = igResult.mimeType;
                    break;
                case 'tiktok':
                    const ttResult = await downloadTikTok(url, formatId);
                    filePath = ttResult.filePath;
                    filename = ttResult.filename;
                    mimeType = ttResult.mimeType;
                    break;
                case 'twitter':
                    const twResult = await downloadTwitter(url, formatId);
                    filePath = twResult.filePath;
                    filename = twResult.filename;
                    mimeType = twResult.mimeType;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Nicht unterstützte Plattform'
                    });
            }
        } catch (downloadError) {
            console.error(`Error during ${platform} download:`, downloadError);
            return res.status(500).json({
                success: false,
                error: `Fehler beim Download: ${downloadError.message}`
            });
        }

        // Check if file exists and is not empty
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            return res.status(500).json({
                success: false,
                error: 'Die heruntergeladene Datei ist leer oder existiert nicht'
            });
        }

        // Set appropriate headers for file download
        res.setHeader('Content-Disposition', contentDisposition(filename));
        res.setHeader('Content-Type', mimeType);

        // Stream the file to response
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', (streamError) => {
            console.error('Error streaming file:', streamError);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Fehler beim Streamen der Datei'
                });
            }
        });

        fileStream.pipe(res);

        // Clean up temp file after download is complete
        fileStream.on('end', () => {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error removing temp file:', err);
            });
        });
    } catch (error) {
        console.error('Error in download endpoint:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: `Fehler beim Herunterladen des Videos: ${error.message}`
            });
        }
    }
});

app.get('/api/placeholder/:width/:height', (req, res) => {
    const width = parseInt(req.params.width, 10) || 640;
    const height = parseInt(req.params.height, 10) || 360;

    // Einfaches SVG als Platzhalter erstellen
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="#ccc" stroke-width="4"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" alignment-baseline="middle" fill="#999">
        Video Vorschau (${width}x${height})
      </text>
    </svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
});

// Improved YouTube info fetching with better error handling and user feedback
async function fetchYouTubeInfo(url) {
    try {
        console.log('Fetching YouTube info with yt-dlp...');

        // Try with advanced options (removed cookies-from-browser)
        const command = `yt-dlp -j --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
        console.log('Executing command:', command);

        try {
            const {stdout, stderr} = await execPromise(command, {timeout: 15000});

            if (stderr) {
                console.error('yt-dlp stderr:', stderr);
            }

            if (!stdout) {
                throw new Error('No output from yt-dlp');
            }

            // Parse the JSON output
            const info = JSON.parse(stdout);

            // Format duration
            const seconds = parseInt(info.duration || 0);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const formattedDuration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

            // Estimate sizes based on duration
            const estimatedHDSize = Math.max(1, Math.round(seconds * 0.05 * 10) / 10);
            const estimatedSDSize = Math.max(0.5, Math.round(seconds * 0.025 * 10) / 10);
            const estimatedAudioSize = Math.max(0.2, Math.round(seconds * 0.01 * 10) / 10);

            return {
                title: info.title || 'Unknown Video',
                thumbnail: info.thumbnail || '/api/placeholder/640/360',
                duration: formattedDuration,
                originalUrl: url,
                formats: [
                    {
                        formatId: 'hd',
                        quality: 'HD Qualität',
                        description: 'Beste verfügbare Qualität',
                        container: 'mp4',
                        size: `${estimatedHDSize} MB`,
                        type: 'video'
                    },
                    {
                        formatId: 'sd',
                        quality: 'SD Qualität',
                        description: 'Standard Auflösung',
                        container: 'mp4',
                        size: `${estimatedSDSize} MB`,
                        type: 'video'
                    },
                    {
                        formatId: 'audio',
                        quality: 'Nur Audio',
                        description: 'MP3 Audioformat',
                        container: 'mp3',
                        size: `${estimatedAudioSize} MB`,
                        type: 'audio'
                    }
                ]
            };
        } catch (execError) {
            // Create an enhanced mock response with YouTube bot protection warning
            console.log('YouTube API error, using mock response with warning');

            return {
                title: 'YouTube Video (Bot-Schutz aktiv)',
                thumbnail: '/api/placeholder/640/360',
                duration: '0:00',
                originalUrl: url,
                formats: [
                    {
                        formatId: 'hd',
                        quality: 'HD Qualität',
                        description: 'YouTube-Schutz aktiv - Download könnte nicht funktionieren',
                        container: 'mp4',
                        size: '~8 MB',
                        type: 'video'
                    },
                    {
                        formatId: 'sd',
                        quality: 'SD Qualität',
                        description: 'YouTube-Schutz aktiv - Download könnte nicht funktionieren',
                        container: 'mp4',
                        size: '~4 MB',
                        type: 'video'
                    },
                    {
                        formatId: 'audio',
                        quality: 'Nur Audio',
                        description: 'YouTube-Schutz aktiv - Download könnte nicht funktionieren',
                        container: 'mp3',
                        size: '~2 MB',
                        type: 'audio'
                    }
                ]
            };
        }
    } catch (error) {
        console.error('YouTube info fetch error:', error);

        // Enhanced mock with warning
        return {
            title: 'YouTube Video (Bot-Schutz aktiv)',
            thumbnail: '/api/placeholder/640/360',
            duration: '0:00',
            originalUrl: url,
            formats: [
                {
                    formatId: 'hd',
                    quality: 'HD Qualität',
                    description: 'YouTube-Schutz aktiv - Download könnte nicht funktionieren',
                    container: 'mp4',
                    size: '~8 MB',
                    type: 'video'
                },
                {
                    formatId: 'sd',
                    quality: 'SD Qualität',
                    description: 'YouTube-Schutz aktiv - Download könnte nicht funktionieren',
                    container: 'mp4',
                    size: '~4 MB',
                    type: 'video'
                },
                {
                    formatId: 'audio',
                    quality: 'Nur Audio',
                    description: 'YouTube-Schutz aktiv - Download könnte nicht funktionieren',
                    container: 'mp3',
                    size: '~2 MB',
                    type: 'audio'
                }
            ]
        };
    }
}

// Improved download function with better YouTube handling
async function downloadYouTube(url, formatId) {
    const tempFilename = crypto.randomBytes(16).toString('hex');
    let filePath = path.join(TEMP_DIR, tempFilename);
    let mimeType, finalFilename;

    try {
        console.log(`Downloading YouTube video: ${url} with format: ${formatId}`);

        // Try to get the video title for filename
        let videoTitle = 'youtube_video';
        try {
            const titleCommand = `yt-dlp --print title --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
            const {stdout} = await execPromise(titleCommand, {timeout: 10000});
            videoTitle = stdout.trim();
        } catch (titleError) {
            console.error('Error getting video title:', titleError);
            // Continue with default title
        }

        const sanitizedTitle = videoTitle
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        // Common bypass options (removed cookies-from-browser)
        const bypassOptions = '--no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"';

        if (formatId === 'audio') {
            // Audio-only download
            filePath += '.mp3';
            finalFilename = `${sanitizedTitle}.mp3`;
            mimeType = 'audio/mp3';

            const downloadCommand = `yt-dlp -x --audio-format mp3 -o "${filePath}" ${bypassOptions} "${url}"`;
            console.log(`Executing command: ${downloadCommand}`);
            await execPromise(downloadCommand, {timeout: 180000});
        } else {
            // Video download
            filePath += '.mp4';
            finalFilename = `${sanitizedTitle}.mp4`;
            mimeType = 'video/mp4';

            const quality = formatId === 'hd' ? 'bestvideo[height<=1080]+bestaudio/best[height<=1080]' : 'bestvideo[height<=480]+bestaudio/best[height<=480]';
            const downloadCommand = `yt-dlp -f "${quality}" --merge-output-format mp4 -o "${filePath}" ${bypassOptions} "${url}"`;
            console.log(`Executing command: ${downloadCommand}`);
            await execPromise(downloadCommand, {timeout: 180000});
        }

        // Verify the file exists and has content
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            throw new Error('Download failed or file is empty');
        }

        return {
            filePath,
            filename: finalFilename,
            mimeType
        };
    } catch (error) {
        console.error('YouTube download error:', error);

        // Show a better error message to the user by throwing a custom error
        // This will be caught by the download endpoint and returned to the user
        if (error.stderr && error.stderr.includes("Sign in to confirm you're not a bot")) {
            throw new Error('YouTube hat uns als Bot erkannt. Der Download ist nicht möglich. Bitte versuche es später erneut oder mit einem anderen Video.');
        } else if (error.stderr && error.stderr.includes("This video is only available for registered users")) {
            throw new Error('Dieses Video ist nur für registrierte Benutzer verfügbar. Der Download ist nicht möglich.');
        } else if (error.stderr && error.stderr.includes("Video unavailable")) {
            throw new Error('Dieses Video ist nicht verfügbar. Bitte prüfe, ob das Video existiert und öffentlich zugänglich ist.');
        } else {
            throw new Error('Der Download ist fehlgeschlagen. YouTube hat den Zugriff blockiert oder das Video ist nicht verfügbar.');
        }
    }
}

async function fetchInstagramInfo(url) {
    try {
        console.log('Fetching Instagram info with yt-dlp...');

        // Build authentication options
        let authOptions = '';
        if (INSTAGRAM_USERNAME && INSTAGRAM_PASSWORD) {
            authOptions = `--username "${INSTAGRAM_USERNAME}" --password "${INSTAGRAM_PASSWORD}"`;
            console.log('Using Instagram authentication');
        } else {
            console.log('No Instagram credentials provided. Some content may not be accessible.');
        }

        // Add rate limiting protection with a random delay
        const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 second random delay
        console.log(`Adding a ${delay}ms delay to avoid rate limiting...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Use yt-dlp to get video information in JSON format with authentication
        const command = `yt-dlp -j ${authOptions} --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
        console.log('Executing command:', command.replace(INSTAGRAM_PASSWORD, '********')); // Log without showing password

        const {stdout, stderr} = await execPromise(command, {timeout: 30000});

        if (stderr) {
            console.error('yt-dlp stderr:', stderr);
            // Check for rate limiting
            if (stderr.includes("Too Many Requests") || stderr.includes("429")) {
                throw new Error('RATE_LIMITED');
            }
        }

        if (!stdout) {
            throw new Error('No output from yt-dlp');
        }

        // Parse the JSON output
        const info = JSON.parse(stdout);

        // Format duration
        const seconds = parseInt(info.duration || 0);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedDuration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

        // Estimate sizes based on duration
        const estimatedHDSize = Math.max(1, Math.round(seconds * 0.04 * 10) / 10);
        const estimatedSDSize = Math.max(0.5, Math.round(seconds * 0.02 * 10) / 10);
        const estimatedAudioSize = Math.max(0.2, Math.round(seconds * 0.008 * 10) / 10);

        return {
            title: info.title || 'Instagram Video',
            thumbnail: info.thumbnail || '/api/placeholder/640/360',
            duration: formattedDuration,
            originalUrl: url,
            formats: [
                {
                    formatId: 'hd',
                    quality: 'HD Qualität',
                    description: 'Beste verfügbare Qualität',
                    container: 'mp4',
                    size: `${estimatedHDSize} MB`,
                    type: 'video'
                },
                {
                    formatId: 'sd',
                    quality: 'SD Qualität',
                    description: 'Standard Auflösung',
                    container: 'mp4',
                    size: `${estimatedSDSize} MB`,
                    type: 'video'
                },
                {
                    formatId: 'audio',
                    quality: 'Nur Audio',
                    description: 'MP3 Audioformat',
                    container: 'mp3',
                    size: `${estimatedAudioSize} MB`,
                    type: 'audio'
                }
            ]
        };
    } catch (error) {
        console.error('Instagram info fetch error:', error);

        // Handle specific Instagram errors
        if (error.message === 'RATE_LIMITED' ||
            (error.stderr && (error.stderr.includes("Too Many Requests") || error.stderr.includes("429")))) {
            return {
                title: 'Instagram Video (Rate Limit)',
                thumbnail: '/api/placeholder/640/360',
                duration: '0:30',
                originalUrl: url,
                formats: [
                    {
                        formatId: 'hd',
                        quality: 'HD Qualität',
                        description: 'Rate-Limit erreicht - Bitte versuche es später erneut (15-30 Minuten)',
                        container: 'mp4',
                        size: '~4 MB',
                        type: 'video'
                    },
                    {
                        formatId: 'sd',
                        quality: 'SD Qualität',
                        description: 'Rate-Limit erreicht - Bitte versuche es später erneut (15-30 Minuten)',
                        container: 'mp4',
                        size: '~2 MB',
                        type: 'video'
                    },
                    {
                        formatId: 'audio',
                        quality: 'Nur Audio',
                        description: 'Rate-Limit erreicht - Bitte versuche es später erneut (15-30 Minuten)',
                        container: 'mp3',
                        size: '~1 MB',
                        type: 'audio'
                    }
                ]
            };
        }
        // Check for authentication errors
        if (error.stderr && error.stderr.includes("login required")) {
            if (!INSTAGRAM_USERNAME || !INSTAGRAM_PASSWORD) {
                // No credentials provided
                return {
                    title: 'Instagram Video (Login erforderlich)',
                    thumbnail: '/api/placeholder/640/360',
                    duration: '0:30',
                    originalUrl: url,
                    formats: [
                        {
                            formatId: 'hd',
                            quality: 'HD Qualität',
                            description: 'Login erforderlich - Instagram-Anmeldedaten erforderlich',
                            container: 'mp4',
                            size: '~4 MB',
                            type: 'video'
                        },
                        {
                            formatId: 'sd',
                            quality: 'SD Qualität',
                            description: 'Login erforderlich - Instagram-Anmeldedaten erforderlich',
                            container: 'mp4',
                            size: '~2 MB',
                            type: 'video'
                        },
                        {
                            formatId: 'audio',
                            quality: 'Nur Audio',
                            description: 'Login erforderlich - Instagram-Anmeldedaten erforderlich',
                            container: 'mp3',
                            size: '~1 MB',
                            type: 'audio'
                        }
                    ]
                };
            } else {
                // Credentials provided but still failed
                return {
                    title: 'Instagram Video (Login fehlgeschlagen)',
                    thumbnail: '/api/placeholder/640/360',
                    duration: '0:30',
                    originalUrl: url,
                    formats: [
                        {
                            formatId: 'hd',
                            quality: 'HD Qualität',
                            description: 'Login fehlgeschlagen - Bitte überprüfe deine Anmeldedaten',
                            container: 'mp4',
                            size: '~4 MB',
                            type: 'video'
                        },
                        {
                            formatId: 'sd',
                            quality: 'SD Qualität',
                            description: 'Login fehlgeschlagen - Bitte überprüfe deine Anmeldedaten',
                            container: 'mp4',
                            size: '~2 MB',
                            type: 'video'
                        },
                        {
                            formatId: 'audio',
                            quality: 'Nur Audio',
                            description: 'Login fehlgeschlagen - Bitte überprüfe deine Anmeldedaten',
                            container: 'mp3',
                            size: '~1 MB',
                            type: 'audio'
                        }
                    ]
                };
            }
        }

        // Fallback to a simple mock if fetching fails
        return {
            title: 'Instagram Video',
            thumbnail: '/api/placeholder/640/360',
            duration: '0:30',
            originalUrl: url,
            formats: [
                {
                    formatId: 'hd',
                    quality: 'HD Qualität',
                    description: 'Beste verfügbare Qualität',
                    container: 'mp4',
                    size: '~4 MB',
                    type: 'video'
                },
                {
                    formatId: 'sd',
                    quality: 'SD Qualität',
                    description: 'Standard Auflösung',
                    container: 'mp4',
                    size: '~2 MB',
                    type: 'video'
                },
                {
                    formatId: 'audio',
                    quality: 'Nur Audio',
                    description: 'MP3 Audioformat',
                    container: 'mp3',
                    size: '~1 MB',
                    type: 'audio'
                }
            ]
        };
    }
}

async function downloadInstagram(url, formatId) {
    const tempFilename = crypto.randomBytes(16).toString('hex');
    let filePath = path.join(TEMP_DIR, tempFilename);
    let mimeType, finalFilename;

    try {
        console.log(`Downloading Instagram video: ${url} with format: ${formatId}`);

        // Build authentication options
        let authOptions = '';
        if (INSTAGRAM_USERNAME && INSTAGRAM_PASSWORD) {
            authOptions = `--username "${INSTAGRAM_USERNAME}" --password "${INSTAGRAM_PASSWORD}"`;
            console.log('Using Instagram authentication');
        } else {
            console.log('No Instagram credentials provided. Some content may not be accessible.');
        }

        // Add rate limiting protection with a random delay
        const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 second random delay
        console.log(`Adding a ${delay}ms delay to avoid rate limiting...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Try to get the video title for filename
        let videoTitle = 'instagram_video';
        try {
            const titleCommand = `yt-dlp --print title ${authOptions} --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
            console.log('Executing title command:', titleCommand.replace(INSTAGRAM_PASSWORD, '********')); // Log without showing password

            const {stdout, stderr} = await execPromise(titleCommand, {timeout: 20000});

            if (stderr && (stderr.includes("Too Many Requests") || stderr.includes("429"))) {
                throw new Error('RATE_LIMITED');
            }

            videoTitle = stdout.trim();
        } catch (titleError) {
            console.error('Error getting video title:', titleError);
            // Check for rate limiting
            if (titleError.message === 'RATE_LIMITED' ||
                (titleError.stderr && (titleError.stderr.includes("Too Many Requests") || titleError.stderr.includes("429")))) {
                throw new Error('RATE_LIMITED');
            }
            // Continue with default title
        }

        const sanitizedTitle = videoTitle
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        // Common bypass options
        const bypassOptions = `${authOptions} --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"`;

        if (formatId === 'audio') {
            // Audio-only download
            filePath += '.mp3';
            finalFilename = `${sanitizedTitle}.mp3`;
            mimeType = 'audio/mp3';

            const downloadCommand = `yt-dlp -x --audio-format mp3 -o "${filePath}" ${bypassOptions} "${url}"`;
            console.log(`Executing command: ${downloadCommand.replace(INSTAGRAM_PASSWORD, '********')}`);
            const {stdout, stderr} = await execPromise(downloadCommand, {timeout: 180000});

            if (stderr && (stderr.includes("Too Many Requests") || stderr.includes("429"))) {
                throw new Error('RATE_LIMITED');
            }
        } else {
            // Video download
            filePath += '.mp4';
            finalFilename = `${sanitizedTitle}.mp4`;
            mimeType = 'video/mp4';

            // For Instagram, we don't need to specify different qualities as much
            // If HD is selected, try to get the best quality
            // If SD is selected, get a lower quality to save bandwidth
            const quality = formatId === 'hd' ? 'best[ext=mp4]' : 'worst[ext=mp4]';
            const downloadCommand = `yt-dlp -f "${quality}" -o "${filePath}" ${bypassOptions} "${url}"`;
            console.log(`Executing command: ${downloadCommand.replace(INSTAGRAM_PASSWORD, '********')}`);
            const {stdout, stderr} = await execPromise(downloadCommand, {timeout: 180000});

            if (stderr && (stderr.includes("Too Many Requests") || stderr.includes("429"))) {
                throw new Error('RATE_LIMITED');
            }
        }

        // Verify the file exists and has content
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            throw new Error('Download failed or file is empty');
        }

        return {
            filePath,
            filename: finalFilename,
            mimeType
        };
    } catch (error) {
        console.error('Instagram download error:', error);

        // Check for rate limiting
        if (error.message === 'RATE_LIMITED' ||
            (error.stderr && (error.stderr.includes("Too Many Requests") || error.stderr.includes("429")))) {
            throw new Error('Instagram Rate-Limit erreicht. Bitte warte 15-30 Minuten, bevor du es erneut versuchst.');
        }

        // Check for authentication errors
        if (error.stderr && error.stderr.includes("login required")) {
            if (!INSTAGRAM_USERNAME || !INSTAGRAM_PASSWORD) {
                throw new Error('Instagram-Anmeldedaten erforderlich. Bitte konfiguriere den Server mit deinen Instagram-Anmeldedaten.');
            } else {
                throw new Error('Instagram-Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten oder versuche es später erneut.');
            }
        }

        // Show a better error message to the user
        if (error.stderr && error.stderr.includes("This video is only available for registered users")) {
            throw new Error('Dieses Video ist nur für registrierte Benutzer verfügbar. Der Download ist nicht möglich.');
        } else if (error.stderr && error.stderr.includes("Video unavailable")) {
            throw new Error('Dieses Video ist nicht verfügbar. Bitte prüfe, ob das Video existiert und öffentlich zugänglich ist.');
        } else {
            throw new Error('Der Download ist fehlgeschlagen. Instagram hat den Zugriff blockiert oder das Video ist nicht verfügbar.');
        }
    }
}

async function fetchTikTokInfo(url) {
    try {
        console.log('Fetching TikTok info with yt-dlp...');

        // Use yt-dlp to get video information in JSON format
        const command = `yt-dlp -j --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
        console.log('Executing command:', command);

        const {stdout, stderr} = await execPromise(command, {timeout: 15000});

        if (stderr) {
            console.error('yt-dlp stderr:', stderr);
        }

        if (!stdout) {
            throw new Error('No output from yt-dlp');
        }

        // Parse the JSON output
        const info = JSON.parse(stdout);

        // Format duration
        const seconds = parseInt(info.duration || 0);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedDuration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

        // Estimate sizes based on duration (TikTok videos are usually smaller)
        const estimatedHDSize = Math.max(0.8, Math.round(seconds * 0.035 * 10) / 10);
        const estimatedSDSize = Math.max(0.4, Math.round(seconds * 0.018 * 10) / 10);
        const estimatedAudioSize = Math.max(0.15, Math.round(seconds * 0.007 * 10) / 10);

        return {
            title: info.title || 'TikTok Video',
            thumbnail: info.thumbnail || '/api/placeholder/640/360',
            duration: formattedDuration,
            originalUrl: url,
            formats: [
                {
                    formatId: 'hd',
                    quality: 'HD Qualität',
                    description: 'Beste verfügbare Qualität',
                    container: 'mp4',
                    size: `${estimatedHDSize} MB`,
                    type: 'video'
                },
                {
                    formatId: 'sd',
                    quality: 'SD Qualität',
                    description: 'Standard Auflösung',
                    container: 'mp4',
                    size: `${estimatedSDSize} MB`,
                    type: 'video'
                },
                {
                    formatId: 'audio',
                    quality: 'Nur Audio',
                    description: 'MP3 Audioformat',
                    container: 'mp3',
                    size: `${estimatedAudioSize} MB`,
                    type: 'audio'
                }
            ]
        };
    } catch (error) {
        console.error('TikTok info fetch error:', error);

        // Fallback to a simple mock if fetching fails
        return {
            title: 'TikTok Video',
            thumbnail: '/api/placeholder/640/360',
            duration: '0:15',
            originalUrl: url,
            formats: [
                {
                    formatId: 'hd',
                    quality: 'HD Qualität',
                    description: 'Beste verfügbare Qualität',
                    container: 'mp4',
                    size: '~2 MB',
                    type: 'video'
                },
                {
                    formatId: 'sd',
                    quality: 'SD Qualität',
                    description: 'Standard Auflösung',
                    container: 'mp4',
                    size: '~1 MB',
                    type: 'video'
                },
                {
                    formatId: 'audio',
                    quality: 'Nur Audio',
                    description: 'MP3 Audioformat',
                    container: 'mp3',
                    size: '~0.5 MB',
                    type: 'audio'
                }
            ]
        };
    }
}

async function downloadTikTok(url, formatId) {
    const tempFilename = crypto.randomBytes(16).toString('hex');
    let filePath = path.join(TEMP_DIR, tempFilename);
    let mimeType, finalFilename;

    try {
        console.log(`Downloading TikTok video: ${url} with format: ${formatId}`);

        // Try to get the video title for filename
        let videoTitle = 'tiktok_video';
        try {
            const titleCommand = `yt-dlp --print title --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
            const {stdout} = await execPromise(titleCommand, {timeout: 10000});
            videoTitle = stdout.trim();
        } catch (titleError) {
            console.error('Error getting video title:', titleError);
            // Continue with default title
        }

        const sanitizedTitle = videoTitle
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        // Common bypass options
        const bypassOptions = '--no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"';

        if (formatId === 'audio') {
            // Audio-only download
            filePath += '.mp3';
            finalFilename = `${sanitizedTitle}.mp3`;
            mimeType = 'audio/mp3';

            const downloadCommand = `yt-dlp -x --audio-format mp3 -o "${filePath}" ${bypassOptions} "${url}"`;
            console.log(`Executing command: ${downloadCommand}`);
            await execPromise(downloadCommand, {timeout: 180000});
        } else {
            // Video download
            filePath += '.mp4';
            finalFilename = `${sanitizedTitle}.mp4`;
            mimeType = 'video/mp4';

            // For TikTok, HD and SD are similar due to TikTok's nature
            const quality = formatId === 'hd' ? 'best[ext=mp4]' : 'worst[ext=mp4]';
            const downloadCommand = `yt-dlp -f "${quality}" -o "${filePath}" ${bypassOptions} "${url}"`;
            console.log(`Executing command: ${downloadCommand}`);
            await execPromise(downloadCommand, {timeout: 180000});
        }

        // Verify the file exists and has content
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            throw new Error('Download failed or file is empty');
        }

        return {
            filePath,
            filename: finalFilename,
            mimeType
        };
    } catch (error) {
        console.error('TikTok download error:', error);

        // Show a better error message to the user
        if (error.stderr && error.stderr.includes("This video is only available for registered users")) {
            throw new Error('Dieses Video ist nur für registrierte Benutzer verfügbar. Der Download ist nicht möglich.');
        } else if (error.stderr && error.stderr.includes("Video unavailable")) {
            throw new Error('Dieses Video ist nicht verfügbar. Bitte prüfe, ob das Video existiert und öffentlich zugänglich ist.');
        } else {
            throw new Error('Der Download ist fehlgeschlagen. TikTok hat den Zugriff blockiert oder das Video ist nicht verfügbar.');
        }
    }
}

// Twitter Implementation

async function fetchTwitterInfo(url) {
    try {
        console.log('Fetching Twitter info with yt-dlp...');

        // Use yt-dlp to get video information in JSON format
        const command = `yt-dlp -j --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
        console.log('Executing command:', command);

        const {stdout, stderr} = await execPromise(command, {timeout: 15000});

        if (stderr) {
            console.error('yt-dlp stderr:', stderr);
        }

        if (!stdout) {
            throw new Error('No output from yt-dlp');
        }

        // Parse the JSON output
        const info = JSON.parse(stdout);

        // Format duration
        const seconds = parseInt(info.duration || 0);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedDuration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

        // Estimate sizes based on duration
        const estimatedHDSize = Math.max(1, Math.round(seconds * 0.045 * 10) / 10);
        const estimatedSDSize = Math.max(0.5, Math.round(seconds * 0.022 * 10) / 10);
        const estimatedAudioSize = Math.max(0.2, Math.round(seconds * 0.009 * 10) / 10);

        return {
            title: info.title || 'Twitter Video',
            thumbnail: info.thumbnail || '/api/placeholder/640/360',
            duration: formattedDuration,
            originalUrl: url,
            formats: [
                {
                    formatId: 'hd',
                    quality: 'HD Qualität',
                    description: 'Beste verfügbare Qualität',
                    container: 'mp4',
                    size: `${estimatedHDSize} MB`,
                    type: 'video'
                },
                {
                    formatId: 'sd',
                    quality: 'SD Qualität',
                    description: 'Standard Auflösung',
                    container: 'mp4',
                    size: `${estimatedSDSize} MB`,
                    type: 'video'
                },
                {
                    formatId: 'audio',
                    quality: 'Nur Audio',
                    description: 'MP3 Audioformat',
                    container: 'mp3',
                    size: `${estimatedAudioSize} MB`,
                    type: 'audio'
                }
            ]
        };
    } catch (error) {
        console.error('Twitter info fetch error:', error);

        // Fallback to a simple mock if fetching fails
        return {
            title: 'Twitter Video',
            thumbnail: '/api/placeholder/640/360',
            duration: '1:20',
            originalUrl: url,
            formats: [
                {
                    formatId: 'hd',
                    quality: 'HD Qualität',
                    description: 'Beste verfügbare Qualität',
                    container: 'mp4',
                    size: '~5 MB',
                    type: 'video'
                },
                {
                    formatId: 'sd',
                    quality: 'SD Qualität',
                    description: 'Standard Auflösung',
                    container: 'mp4',
                    size: '~3 MB',
                    type: 'video'
                },
                {
                    formatId: 'audio',
                    quality: 'Nur Audio',
                    description: 'MP3 Audioformat',
                    container: 'mp3',
                    size: '~1.2 MB',
                    type: 'audio'
                }
            ]
        };
    }
}

async function downloadTwitter(url, formatId) {
    const tempFilename = crypto.randomBytes(16).toString('hex');
    let filePath = path.join(TEMP_DIR, tempFilename);
    let mimeType, finalFilename;

    try {
        console.log(`Downloading Twitter video: ${url} with format: ${formatId}`);

        // Try to get the video title for filename
        let videoTitle = 'twitter_video';
        try {
            const titleCommand = `yt-dlp --print title --no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
            const {stdout} = await execPromise(titleCommand, {timeout: 10000});
            videoTitle = stdout.trim();
        } catch (titleError) {
            console.error('Error getting video title:', titleError);
            // Continue with default title
        }

        const sanitizedTitle = videoTitle
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        // Common bypass options
        const bypassOptions = '--no-check-certificate --geo-bypass --no-playlist --extractor-retries 5 --force-ipv4 --ignore-config --no-warnings --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"';

        if (formatId === 'audio') {
            // Audio-only download
            filePath += '.mp3';
            finalFilename = `${sanitizedTitle}.mp3`;
            mimeType = 'audio/mp3';

            const downloadCommand = `yt-dlp -x --audio-format mp3 -o "${filePath}" ${bypassOptions} "${url}"`;
            console.log(`Executing command: ${downloadCommand}`);
            await execPromise(downloadCommand, {timeout: 180000});
        } else {
            // Video download
            filePath += '.mp4';
            finalFilename = `${sanitizedTitle}.mp4`;
            mimeType = 'video/mp4';

            // Twitter quality selection
            const quality = formatId === 'hd' ? 'best[ext=mp4]' : 'worst[ext=mp4]';
            const downloadCommand = `yt-dlp -f "${quality}" -o "${filePath}" ${bypassOptions} "${url}"`;
            console.log(`Executing command: ${downloadCommand}`);
            await execPromise(downloadCommand, {timeout: 180000});
        }

        // Verify the file exists and has content
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
            throw new Error('Download failed or file is empty');
        }

        return {
            filePath,
            filename: finalFilename,
            mimeType
        };
    } catch (error) {
        console.error('Twitter download error:', error);

        // Show a better error message to the user
        if (error.stderr && error.stderr.includes("This video is only available for registered users")) {
            throw new Error('Dieses Video ist nur für registrierte Benutzer verfügbar. Der Download ist nicht möglich.');
        } else if (error.stderr && error.stderr.includes("Video unavailable")) {
            throw new Error('Dieses Video ist nicht verfügbar. Bitte prüfe, ob das Video existiert und öffentlich zugänglich ist.');
        } else {
            throw new Error('Der Download ist fehlgeschlagen. Twitter hat den Zugriff blockiert oder das Video ist nicht verfügbar.');
        }
    }
}

// Helper functions
function mockSocialMediaInfo(url, title, duration) {
    return {
        title: title,
        // Statt einer externen URL verwenden wir einen relativen Pfad zu unserem Server
        thumbnail: '/api/placeholder/640/360', // Diese Route werden wir unten definieren
        duration: duration,
        originalUrl: url,
        formats: [
            {
                formatId: 'hd',
                quality: 'HD Qualität',
                description: 'Beste verfügbare Qualität',
                container: 'mp4',
                size: '8.5 MB',
                type: 'video'
            },
            {
                formatId: 'sd',
                quality: 'SD Qualität',
                description: 'Standard Auflösung',
                container: 'mp4',
                size: '4.2 MB',
                type: 'video'
            },
            {
                formatId: 'audio',
                quality: 'Nur Audio',
                description: 'MP3 Audioformat',
                container: 'mp3',
                size: '1.8 MB',
                type: 'audio'
            }
        ]
    };
}

function mockDownload(formatId) {
    // Eindeutigen Dateinamen erstellen
    const tempFilename = crypto.randomBytes(16).toString('hex');
    let filePath = path.join(TEMP_DIR, tempFilename);
    let finalFilename;
    let mimeType;

    // Datei je nach Format erstellen
    if (formatId === 'audio') {
        filePath += '.mp3';
        finalFilename = 'audio.mp3';
        mimeType = 'audio/mp3';

        try {
            // MP3-Header erzeugen (ID3v2 Tag Format)
            const header = Buffer.from('ID3\x03\x00\x00\x00\x00\x10\x00', 'binary');

            // Dummy MP3 Frame-Header (MPEG 1 Layer 3)
            const frameHeader = Buffer.from('\xFF\xFB\x90\x44\x00', 'binary');

            // Größere Dummy-Datei erzeugen (1MB)
            const contentSize = 1024 * 1024; // 1MB
            const dataChunks = [];

            // Header hinzufügen
            dataChunks.push(header);

            // Frame-Headers und zufällige Daten hinzufügen
            for (let i = 0; i < 100; i++) {
                dataChunks.push(frameHeader);
                const chunk = crypto.randomBytes(10 * 1024);
                dataChunks.push(chunk);
            }

            // Alles zusammenfügen und in Datei schreiben
            const mockContent = Buffer.concat(dataChunks);
            fs.writeFileSync(filePath, mockContent);

            return {
                filePath,
                filename: finalFilename,
                mimeType
            };
        } catch (error) {
            console.error('Error creating mock MP3:', error);
            throw new Error('Fehler beim Erstellen der Audiodatei');
        }
    } else {
        // Video-Format (HD oder SD)
        filePath += '.mp4';
        finalFilename = formatId === 'hd' ? 'video_hd.mp4' : 'video_sd.mp4';
        mimeType = 'video/mp4';

        try {
            // MP4-Format erzeugen
            // ftyp Box (File Type Box)
            const ftypBox = Buffer.from(
                '\x00\x00\x00\x18' + // Size (24 bytes)
                'ftyp' +           // Type
                'mp42' +           // Major Brand
                '\x00\x00\x00\x00' + // Minor Version
                'mp42' +           // Compatible Brand
                'isom',            // Compatible Brand
                'binary'
            );

            // mdat Box (Media Data Box) - einfach ein Header mit Zufallsdaten
            const mdatHeader = Buffer.from('\x00\x00\xFF\xFF' + 'mdat', 'binary');

            // Größere Datei erstellen
            const contentSize = formatId === 'hd' ? 3 * 1024 * 1024 : 1.5 * 1024 * 1024; // 3MB für HD, 1.5MB für SD
            const randomData = crypto.randomBytes(contentSize);

            // Alles zusammenfügen
            const mockContent = Buffer.concat([ftypBox, mdatHeader, randomData]);

            // In Datei schreiben
            fs.writeFileSync(filePath, mockContent);

            return {
                filePath,
                filename: finalFilename,
                mimeType
            };
        } catch (error) {
            console.error('Error creating mock MP4:', error);
            throw new Error('Fehler beim Erstellen der Videodatei');
        }
    }
}

function estimateSize(bytes) {
    // If no byte information, provide an estimate
    if (!bytes) {
        return '~5 MB';
    }

    return filesize(bytes);
}

function saveStreamToFile(stream, filePath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        let hasEnded = false;

        // Timeout nach 60 Sekunden
        const timeout = setTimeout(() => {
            if (!hasEnded) {
                hasEnded = true;
                fileStream.end();
                reject(new Error('Download-Timeout nach 60 Sekunden'));
            }
        }, 60000);

        stream.pipe(fileStream);

        fileStream.on('finish', () => {
            clearTimeout(timeout);
            if (!hasEnded) {
                hasEnded = true;
                resolve();
            }
        });

        fileStream.on('error', (error) => {
            clearTimeout(timeout);
            if (!hasEnded) {
                hasEnded = true;
                reject(error);
            }
        });

        stream.on('error', (error) => {
            clearTimeout(timeout);
            if (!hasEnded) {
                hasEnded = true;
                fileStream.end();
                reject(error);
            }
        });
    });
}

function extractAudio(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
        const command = `ffmpeg -i "${videoPath}" -vn -ab 128k -ar 44100 -f mp3 "${audioPath}"`;

        exec(command, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
