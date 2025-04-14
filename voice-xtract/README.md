# VoiceXtract

A web application for extracting vocals from music files using state-of-the-art audio source
separation with the Demucs library.

![VoiceXtract Screenshot](screenshot.jpg)

## Features

- Extract vocals from audio files (MP3, WAV, FLAC, OGG, M4A)
- Modern, responsive user interface
- Multiple model options for different quality levels
- Output formats in MP3 or WAV
- Clean separation of vocals and accompaniment tracks
- Progress tracking for uploads and processing

## Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Audio Processing**: Python with Demucs
- **Deployment**: Nginx, PM2

## Prerequisites

- Node.js 16+ and npm
- Python 3.x
- CUDA-compatible GPU (optional, for faster processing)
- Nginx
- PM2

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/VoiceXtract.git
cd VoiceXtract
```

### 2. Set up the client (React frontend)

```bash
cd client
npm install
npm run build
```

### 3. Set up the server (Node.js backend)

```bash
cd ../server
npm install
```

### 4. Install Python dependencies

```bash
pip install demucs torch torchaudio tqdm soundfile pydub
```

### 5. Install ffmpeg (required for MP3 processing)

```bash
# On Ubuntu
sudo apt update
sudo apt install ffmpeg

# On macOS
brew install ffmpeg
```

## Configuration

### Nginx Configuration

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/voice-xtract
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Voice Extract React App
    location /voice-xtract {
        alias /var/www/html/voice-xtract/client/build;
        try_files $uri $uri/ /voice-xtract/index.html;
        index index.html;
    }
    
    # Voice Extract API Backend
    location /voice-xtract/api/ {
        proxy_pass http://localhost:4992/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Allow larger uploads
        client_max_body_size 500M;
        
        # Debug logging
        access_log /var/log/nginx/voicextract-api-access.log;
        error_log /var/log/nginx/voicextract-api-error.log debug;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/voice-xtract /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### PM2 Configuration

Create a PM2 ecosystem configuration file:

```bash
cd server
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
    apps: [{
        name: "voicextract-api",
        script: "./server.js",
        env: {
            NODE_ENV: "production",
            PORT: 4992
        },
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "1G"
    }]
};
```

## Deployment

### 1. Deploy the client files to your server

```bash
# Local machine
scp -r client/build/* user@yourdomain.com:/var/www/html/voice-xtract/client/build/
```

### 2. Deploy the server files to your server

```bash
# Local machine
scp -r server/* user@yourdomain.com:/var/www/html/voice-xtract/server/
```

### 3. Set up the required directories on the server

```bash
# On the server
cd /var/www/html/voice-xtract/server
mkdir -p uploads output temp
```

### 4. Start the server with PM2

```bash
# On the server
cd /var/www/html/voice-xtract/server
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Troubleshooting

### Server not responding

Check if the server is running:

```bash
pm2 status
```

Check the logs for errors:

```bash
pm2 logs voicextract-api
```

### File processing issues

Ensure Python dependencies are correctly installed:

```bash
python3 -c "import torch, torchaudio, demucs, soundfile; print('All modules available')"
```

Check if ffmpeg is installed and working:

```bash
ffmpeg -version
```

### Nginx issues

Check Nginx configuration:

```bash
sudo nginx -t
```

Check Nginx logs:

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/voicextract-api-error.log
```

## License

[MIT License](LICENSE)

## Author

Created with ❤️ by Martin Pfeffer