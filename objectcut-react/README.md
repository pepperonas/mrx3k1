# ObjectCut React - Setup Guide

This guide provides instructions for setting up the ObjectCut React application on an Ubuntu 24.04 VPS server.

## About ObjectCut

ObjectCut is a tool that allows users to extract objects from images with transparency using:
- AI-based background removal with rembg
- Manual rectangle selection

## Prerequisites

- Ubuntu 24.04 VPS
- Node.js v20.x
- Python 3.12
- Nginx web server

## Installation Steps

### 1. System Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install required packages
sudo apt install -y python3-pip python3-venv python3-full nginx
```

### 2. Application Setup

```bash
# Navigate to web directory
cd /var/www/html

# Create application directory (or clone repository)
mkdir -p objectcut-react
cd objectcut-react

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install rembg[gpu,cli] opencv-python-headless numpy pillow onnxruntime

# Install Node.js dependencies
npm install express cors multer fs-extra path os
```

### 3. Server Configuration

Create the backend Python script for background removal:

```bash
mkdir -p server
```

Create `server/remove_bg.py`:

```python
#!/usr/bin/env python3
import sys
import os
from rembg import remove
from PIL import Image
import io
import traceback

def remove_background(input_path, output_path):
    """
    Removes the background from an image using the rembg package
    
    Args:
        input_path: Path to the input image
        output_path: Path for the output image with transparent background
    """
    try:
        print(f"Processing image: {input_path}", file=sys.stderr)
        
        # Open image with Pillow
        input_img = Image.open(input_path)
        print(f"Image loaded: {input_img.size}px, Format: {input_img.format}", file=sys.stderr)
        
        # Remove background
        output_img = remove(input_img)
        print(f"Background removed, saving result...", file=sys.stderr)
        
        # Save output
        output_img.save(output_path, format="PNG")
        
        print(f"Background removed successfully. Output saved to: {output_path}", file=sys.stderr)
        print(f"Output size: {os.path.getsize(output_path)} bytes", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"Error removing background: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return False

if __name__ == "__main__":
    # Check if enough command line arguments are provided
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input_image_path> <output_image_path>", file=sys.stderr)
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    # Check if the input file exists
    if not os.path.isfile(input_path):
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)
        
    # Remove background
    success = remove_background(input_path, output_path)
    
    # Exit code based on success
    sys.exit(0 if success else 1)
```

Create `server/server.js`:

```javascript
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

// Temporary storage location for uploads
const uploadDir = path.join(os.tmpdir(), 'objectcut-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'input-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// API route for background removal
app.post('/api/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(uploadDir, 'output-' + path.basename(inputPath));

    console.log(`Processing image: ${inputPath}`);
    console.log(`Output will be saved to: ${outputPath}`);

    // Execute Python script
    const pythonProcess = spawn('/var/www/html/objectcut-react/venv/bin/python3', [
      path.join(__dirname, 'remove_bg.py'),
      inputPath,
      outputPath
    ]);

    let errorOutput = '';

    // Collect error output
    pythonProcess.stderr.on('data', (data) => {
      console.log(`Python stderr: ${data}`);
      errorOutput += data.toString();
    });

    // Wait for process to complete
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        resolve(code);
      });
    });

    // Check if the script was successful
    if (exitCode !== 0) {
      console.error(`Python process exited with code ${exitCode}`);
      console.error(`Error output: ${errorOutput}`);
      return res.status(500).json({ 
        error: 'Error during background removal',
        details: errorOutput
      });
    }

    // Check if the output file exists
    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ 
        error: 'Output file was not created',
        details: errorOutput
      });
    }

    // Send file
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Error sending file' });
      }
      
      // Clean up: delete temporary files
      setTimeout(() => {
        try {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.error('Error deleting temporary files:', err);
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error during image processing',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload directory: ${uploadDir}`);
});

// Clean up on exit
process.on('SIGINT', () => {
  console.log('Server shutting down. Cleaning up temporary files...');
  try {
    // Delete directory if it exists and is empty
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadDir, file));
      });
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
  process.exit();
});
```

Make the Python script executable:

```bash
chmod +x server/remove_bg.py
```

### 4. Create SystemD Service

Create a systemd service to run the backend server:

```bash
sudo nano /etc/systemd/system/objectcut.service
```

Add this content:

```
[Unit]
Description=ObjectCut React Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/html/objectcut-react
ExecStart=/usr/bin/node server/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=4991
Environment=PATH=/var/www/html/objectcut-react/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=U2NET_HOME=/tmp/u2net

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable objectcut
sudo systemctl start objectcut
```

### 5. Nginx Configuration

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/objectcut
```

Add this content (replace `your-domain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Root directory for other applications
    root /var/www/html;
    index index.html index.htm;

    # ObjectCut React Frontend at /objectcut-react path
    location /objectcut-react/ {
        alias /var/www/html/objectcut-react/build/;
        try_files $uri $uri/ /objectcut-react/index.html;
        
        # Fallback for SPA routing
        index index.html;
    }

    # API route without /objectcut-react prefix
    location /api/remove-background {
        proxy_pass http://localhost:4991/api/remove-background;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Increase timeouts for large image uploads
        proxy_read_timeout 600;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        
        # Increase max file size
        client_max_body_size 20M;
    }

    # API route with /objectcut-react prefix
    location /objectcut-react/api/remove-background {
        rewrite ^/objectcut-react/api/(.*)$ /api/$1 break;
        proxy_pass http://localhost:4991;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Increase timeouts for large image uploads
        proxy_read_timeout 600;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        
        # Increase max file size
        client_max_body_size 20M;
    }

    # Default location block
    location / {
        try_files $uri $uri/ =404;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/objectcut /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Set Permissions

Set the correct permissions for the application directories:

```bash
# Set permissions for the application directory
sudo chown -R www-data:www-data /var/www/html/objectcut-react
sudo chmod -R 755 /var/www/html/objectcut-react

# Create directory for U2Net model
sudo mkdir -p /tmp/u2net
sudo chown -R www-data:www-data /tmp/u2net
sudo chmod 755 /tmp/u2net
```

## Troubleshooting

### Check Service Status

```bash
sudo systemctl status objectcut
```

### View Service Logs

```bash
sudo journalctl -u objectcut -f
```

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Common Issues

1. **Permission denied for U2Net model directory**:
    - Ensure the directory exists and has correct permissions:
   ```bash
   sudo mkdir -p /tmp/u2net
   sudo chown -R www-data:www-data /tmp/u2net
   ```

2. **Module not found errors**:
    - Install missing Node.js modules:
   ```bash
   cd /var/www/html/objectcut-react
   npm install missing-module-name
   ```

3. **Python dependencies issues**:
    - Ensure the virtual environment is activated and dependencies installed:
   ```bash
   cd /var/www/html/objectcut-react
   source venv/bin/activate
   pip install -U rembg[gpu,cli] onnxruntime pillow numpy
   ```

## Features

- Upload images by drag & drop or file selection
- Choose between AI-based background removal or manual rectangle selection
- Save the processed image with transparency
- Modern dark-themed interface

## Credits

- The application uses [rembg](https://github.com/danielgatis/rembg) for AI-based background removal
- Frontend built with React
- Backend uses Express.js and Python