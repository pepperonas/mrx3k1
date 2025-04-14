const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 4992;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Debug logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} [${req.method}] ${req.originalUrl}`);
    next();
});

// Create upload directories
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMP_DIR = path.join(__dirname, 'temp');

fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(TEMP_DIR);

console.log('Directories created/checked:');
console.log('- Upload Dir:', UPLOAD_DIR);
console.log('- Output Dir:', OUTPUT_DIR);
console.log('- Temp Dir:', TEMP_DIR);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const taskId = uuidv4();
        const taskDir = path.join(UPLOAD_DIR, taskId);
        fs.ensureDirSync(taskDir);
        req.taskId = taskId;
        cb(null, taskDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedFileTypes = ['.mp3', '.wav', '.flac', '.ogg', '.m4a'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedFileTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only MP3, WAV, FLAC, OGG, and M4A files are allowed.'));
        }
    },
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max file size
    }
});

// Store tasks and their statuses
const tasks = new Map();

// API routes - Verwende einfache /api Pfade
app.post('/api/upload', upload.array('files', 5), (req, res) => {
    try {
        const { taskId } = req;
        const { model, format } = req.body;

        console.log(`Upload request received for task ${taskId}`);
        console.log(`Files: ${req.files.length}, Model: ${model}, Format: ${format}`);

        // Store task info
        tasks.set(taskId, {
            state: 'uploaded',
            files: req.files.map(file => file.originalname),
            uploadDir: path.join(UPLOAD_DIR, taskId),
            outputDir: path.join(OUTPUT_DIR, taskId),
            model: model || 'htdemucs',
            format: format || 'mp3',
            progress: 0,
            results: {}
        });

        // Create output directory
        fs.ensureDirSync(path.join(OUTPUT_DIR, taskId));

        // Start processing in background
        setTimeout(() => {
            processTask(taskId);
        }, 100);

        return res.status(200).json({
            message: 'Files uploaded successfully',
            taskId
        });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            message: 'Error uploading files',
            error: error.message
        });
    }
});

app.get('/api/status/:taskId', (req, res) => {
    const { taskId } = req.params;

    console.log(`Status request for task ${taskId}`);

    if (!tasks.has(taskId)) {
        console.log(`Task ${taskId} not found`);
        return res.status(404).json({
            message: 'Task not found'
        });
    }

    const taskInfo = tasks.get(taskId);
    console.log(`Returning status for task ${taskId}: ${taskInfo.state}`);

    return res.status(200).json(taskInfo);
});

app.get('/api/download/:filepath', (req, res) => {
    try {
        // Security check to prevent path traversal
        const requestedPath = decodeURIComponent(req.params.filepath);
        console.log(`Download request for: ${requestedPath}`);

        const normalizedPath = path.normalize(requestedPath);

        if (!normalizedPath.startsWith(OUTPUT_DIR)) {
            console.log(`Security violation: ${normalizedPath} is outside OUTPUT_DIR`);
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        // Check if file exists
        if (!fs.existsSync(normalizedPath)) {
            console.log(`File not found: ${normalizedPath}`);
            return res.status(404).json({
                message: 'File not found'
            });
        }

        console.log(`Sending file: ${normalizedPath}`);
        return res.download(normalizedPath);

    } catch (error) {
        console.error('Download error:', error);
        return res.status(500).json({
            message: 'Error downloading file',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve React frontend for any route not handled by the API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Function to process audio files using Python script
function processTask(taskId) {
    const task = tasks.get(taskId);

    if (!task) {
        console.error(`Task ${taskId} not found`);
        return;
    }

    // Update task state
    task.state = 'processing';
    tasks.set(taskId, task);

    console.log(`Starting processing for task ${taskId} with ${task.files.length} files`);

    // Process files sequentially
    processFiles(task, taskId);
}

async function processFiles(task, taskId) {
    const { files, uploadDir, outputDir, model, format } = task;
    const results = {};
    let fileIndex = 0;

    // Process each file
    for (const filename of files) {
        try {
            console.log(`Processing file ${fileIndex + 1}/${files.length}: ${filename}`);

            // Update progress
            task.progress = Math.round((fileIndex / files.length) * 100);
            tasks.set(taskId, task);

            const inputFile = path.join(uploadDir, filename);
            const fileOutputDir = path.join(outputDir, path.basename(filename, path.extname(filename)));

            console.log(`Input file: ${inputFile}`);
            console.log(`Output directory: ${fileOutputDir}`);

            // Create output directory for this file
            fs.ensureDirSync(fileOutputDir);

            // Run Python script
            console.log(`Running Python script for file: ${filename}`);
            const result = await runPythonScript(inputFile, fileOutputDir, model, format);

            console.log(`Processing completed for ${filename}`);
            console.log(`Results: ${JSON.stringify(result)}`);

            // Store results
            results[filename] = result;

            fileIndex++;
        } catch (error) {
            console.error(`Error processing file ${filename}:`, error);

            // Update task with error
            task.state = 'error';
            task.error = `Error processing file ${filename}: ${error.message}`;
            tasks.set(taskId, task);

            return;
        }
    }

    // Update task with results
    task.state = 'completed';
    task.progress = 100;
    task.results = results;
    tasks.set(taskId, task);

    console.log(`Task ${taskId} completed successfully`);

    // Clean up upload directory after some time
    setTimeout(() => {
        try {
            fs.removeSync(uploadDir);
            console.log(`Cleaned up upload directory for task ${taskId}`);
        } catch (err) {
            console.error(`Error cleaning up task ${taskId}:`, err);
        }
    }, 3600000); // Remove after 1 hour
}

function runPythonScript(inputFile, outputDir, model, format) {
    return new Promise((resolve, reject) => {
        // Check if Python script exists
        const scriptPath = path.join(__dirname, 'voicextract.py');

        if (!fs.existsSync(scriptPath)) {
            return reject(new Error(`Python script not found at ${scriptPath}`));
        }

        console.log(`Running Python script for ${inputFile}`);
        console.log(`Script path: ${scriptPath}`);

        // Build command arguments
        const args = [
            scriptPath,
            inputFile,
            '--output', outputDir,
            '--model', model,
            '--format', format
        ];

        console.log(`Python command: python3 ${args.join(' ')}`);

        // Spawn Python process
        const pythonProcess = spawn('python3', args);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString();
            outputData += output;
            console.log(`Python output: ${output}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            const error = data.toString();
            errorData += error;
            console.error(`Python error: ${error}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);

            if (code !== 0) {
                console.error(`Python process failed with code ${code}`);
                return reject(new Error(`Python process failed with code ${code}: ${errorData}`));
            }

            // Check if output files exist
            const vocalPath = path.join(outputDir, `vocals.${format}`);
            const accompPath = path.join(outputDir, `accompaniment.${format}`);

            console.log(`Checking for output files:`);
            console.log(`- Vocals: ${vocalPath} (exists: ${fs.existsSync(vocalPath)})`);
            console.log(`- Accompaniment: ${accompPath} (exists: ${fs.existsSync(accompPath)})`);

            const result = {};

            if (fs.existsSync(vocalPath)) {
                result.vocals = vocalPath;
            }

            if (fs.existsSync(accompPath)) {
                result.accompaniment = accompPath;
            }

            if (Object.keys(result).length === 0) {
                return reject(new Error('No output files were generated'));
            }

            resolve(result);
        });
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});