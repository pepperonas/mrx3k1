// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { processImage } = require('./imageProcessingAPI');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// API routes
app.post('/api/remove-background', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const processedImageBuffer = await processImage(req.file.buffer);

        res.set('Content-Type', 'image/png');
        res.send(processedImageBuffer);
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../build', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// server/imageProcessingAPI.js
const sharp = require('sharp');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Process image with rembg using python script
async function processImage(imageBuffer) {
    return new Promise((resolve, reject) => {
        // Create temporary directory for processing
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'objectcut-'));
        const inputPath = path.join(tempDir, 'input.png');
        const outputPath = path.join(tempDir, 'output.png');

        // Write input image to disk
        fs.writeFileSync(inputPath, imageBuffer);

        // Run rembg using Python
        const python = spawn('python', [
            '-c',
            `
import sys
from rembg import remove
from PIL import Image
import io

# Read input image
with open('${inputPath.replace(/\\/g, '\\\\')}', 'rb') as i:
    input_data = i.read()
    
# Process with rembg
output_data = remove(input_data)

# Save to output path
with open('${outputPath.replace(/\\/g, '\\\\')}', 'wb') as o:
    o.write(output_data)
      `
        ]);

        python.stderr.on('data', (data) => {
            console.error(`Python error: ${data}`);
        });

        python.on('close', (code) => {
            if (code !== 0) {
                // Clean up temp files
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                    fs.rmdirSync(tempDir);
                } catch (err) {
                    console.error('Error cleaning up:', err);
                }

                return reject(new Error(`Python process exited with code ${code}`));
            }

            try {
                // Read processed image
                const outputBuffer = fs.readFileSync(outputPath);

                // Clean up temp files
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
                fs.rmdirSync(tempDir);

                resolve(outputBuffer);
            } catch (err) {
                reject(err);
            }
        });
    });
}

// Fallback method if rembg isn't available
async function processImageFallback(imageBuffer) {
    try {
        // Using sharp for a simple transparency effect (not as good as rembg)
        // This is just a fallback that creates a simple circular mask
        const metadata = await sharp(imageBuffer).metadata();

        // Create a circular mask
        const size = Math.min(metadata.width, metadata.height);
        const radius = size / 2;
        const centerX = metadata.width / 2;
        const centerY = metadata.height / 2;

        // Create an SVG circle mask
        const circleSvg = Buffer.from(
            `<svg width="${metadata.width}" height="${metadata.height}">
        <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="white"/>
      </svg>`
        );

        // Apply the mask
        const result = await sharp(imageBuffer)
            .composite([
                {
                    input: circleSvg,
                    blend: 'dest-in'
                }
            ])
            .png()
            .toBuffer();

        return result;
    } catch (error) {
        console.error('Fallback processing error:', error);
        throw error;
    }
}

module.exports = {
    processImage
};