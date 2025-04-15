#!/bin/bash
# Script to create the ZipZap project structure

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Creating ZipZap project structure...${NC}"

# Create main directory
mkdir -p zipzap
cd zipzap

# Create directory structure
mkdir -p public src/components src/services server/data

# Create package.json
echo -e "${GREEN}Creating package.json...${NC}"
cat > package.json << 'EOL'
{
  "name": "zipzap",
  "version": "1.0.0",
  "description": "ZipZap - A demonstration of zip bombs with password protection for educational purposes",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.4.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^3.3.1",
    "tailwindcss": "^3.3.2",
    "postcss": "^8.4.24",
    "autoprefixer": "^10.4.14",
    "jszip": "^3.10.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "start-server": "node server/server.js",
    "dev": "concurrently \"npm run start\" \"npm run start-server\""
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "concurrently": "^8.0.1"
  }
}
EOL

# Create server.js
echo -e "${GREEN}Creating server.js...${NC}"
cat > server/server.js << 'EOL'
// server.js - With Brute-Force Protection
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 4996;

// Rate-Limiting and Brute-Force Protection
const ipAttempts = new Map(); // IP -> {attempts: number, lastAttempt: timestamp, blocked: boolean}
const MAX_ATTEMPTS = 5;       // Maximum number of failed attempts
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes block in milliseconds
const ATTEMPT_RESET = 60 * 60 * 1000;  // Reset after 1 hour without attempts
const MIN_ATTEMPT_INTERVAL = 1000;     // At least 1 second between attempts

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
    const url = req.url;

    // API Endpoint for checking password
    if (url === '/api/checkPassword' && req.method === 'POST') {
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

    // 404 for all other routes
    else {
        console.log('Route not found:', url);
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({error: 'Not found'}));
    }
});

// Periodic cleanup (remove old entries)
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipAttempts.entries()) {
        // If last attempt was more than 24 hours ago, remove entry
        if (now - data.lastAttempt > 24 * 60 * 60 * 1000) {
            ipAttempts.delete(ip);
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
EOL

# Create App.js
echo -e "${GREEN}Creating App.js...${NC}"
cat > src/App.js << 'EOL'
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [fileSize, setFileSize] = useState(10);
  const [levels, setLevels] = useState(1);
  const [outputDir, setOutputDir] = useState('zipzap_output');
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  // Constants for rate limiting
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  // Calculate estimated uncompressed size
  useEffect(() => {
    const sizeInMB = fileSize * (levels === 1 ? 10 : 10);
    setEstimatedSize(sizeInMB);
  }, [fileSize, levels]);

  // Handle countdown timer when blocked
  useEffect(() => {
    let timer;
    if (blocked && blockTimeRemaining > 0) {
      timer = setInterval(() => {
        setBlockTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            setBlocked(false);
            setAttempts(0);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [blocked, blockTimeRemaining]);

  const handleSizeChange = (e) => {
    const value = parseInt(e.target.value);
    setFileSize(value);
  };

  const handleLevelsChange = (e) => {
    const value = parseInt(e.target.value);
    setLevels(value);
  };

  const handleOutputDirChange = (e) => {
    setOutputDir(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError('');
  };

  const handleStartGeneration = () => {
    // Check if we need password verification (size > 100MB)
    if (estimatedSize > 100) {
      setShowPasswordModal(true);
    } else {
      generateZipBomb();
    }
  };

  const handlePasswordSubmit = async () => {
    if (blocked) {
      return;
    }

    try {
      setLoading(true);

      // API call to verify password
      const response = await fetch('http://localhost:4996/api/checkPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          setPasswordError(data.message || 'Rate limit exceeded. Please try again later.');
          return;
        }
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Success
        setPasswordError('');
        setAttempts(0);
        setShowPasswordModal(false);
        setSuccess(true);
        generateZipBomb();
      } else {
        // Failed attempt
        setAttempts(data.remainingAttempts ? MAX_ATTEMPTS - data.remainingAttempts : attempts + 1);
        setPasswordError(data.message || 'Incorrect password');

        if (data.remainingAttempts === 0) {
          setBlocked(true);
          setBlockTimeRemaining(BLOCK_DURATION / 1000);
        }
      }
    } catch (error) {
      setPasswordError('Error verifying password. Please try again.');
      console.error('Password verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelPasswordModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
  };

  const generateZipBomb = () => {
    setSuccess(true);
    setGenerationStatus('Generating files...');

    // Simulate generation process
    setTimeout(() => {
      setGenerationStatus('Creating base file...');
      setTimeout(() => {
        setGenerationStatus('Compressing files...');
        setTimeout(() => {
          setGenerationStatus('Creating archive...');
          setTimeout(() => {
            setGenerationStatus('Done! Zip bomb created successfully.');
          }, 1000);
        }, 1500);
      }, 1000);
    }, 500);
  };

  return (
    <div className="App bg-gray-900 text-white min-h-screen flex flex-col">
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-xl font-bold">ZipZap - Zip Bomb Generator</h1>
        <p className="text-sm text-gray-400">For educational purposes only</p>
      </header>

      <main className="flex-grow p-6 max-w-4xl mx-auto w-full">
        {!success ? (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Base File Size (MB)</label>
              <input
                type="range"
                min="1"
                max="50"
                value={fileSize}
                onChange={handleSizeChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm mt-1">
                <span>1 MB</span>
                <span>{fileSize} MB</span>
                <span>50 MB</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Nesting Levels</label>
              <select
                value={levels}
                onChange={handleLevelsChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="1">1 (Simple)</option>
                <option value="2">2 (Nested)</option>
                <option value="3">3 (Complex)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">Output Directory</label>
              <input
                type="text"
                value={outputDir}
                onChange={handleOutputDirChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Estimated Output</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Base File:</p>
                  <p className="font-mono">{fileSize} MB</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Nesting:</p>
                  <p className="font-mono">{levels} level{levels > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-gray-400">Duplicates:</p>
                  <p className="font-mono">10x</p>
                </div>
                <div>
                  <p className="text-gray-400">Extracted Size:</p>
                  <p className={`font-mono ${estimatedSize > 100 ? 'text-red-400' : 'text-green-400'}`}>
                    ~{estimatedSize} MB
                    {estimatedSize > 100 && ' (Password Required)'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartGeneration}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Generate Zip Bomb
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Generation Progress</h2>

            <div className="mb-6">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "100%" }}></div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <p className="font-mono">{generationStatus}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-400">Output Directory:</p>
                <p className="font-mono">{outputDir}</p>
              </div>
              <div>
                <p className="text-gray-400">Extracted Size:</p>
                <p className="font-mono">~{estimatedSize} MB</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccess(false);
                setGenerationStatus('');
              }}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
            >
              Create Another
            </button>
          </div>
        )}
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Password Required</h2>
            <p className="mb-4 text-gray-300">
              The extracted size will be over 100MB. Please enter the verification password to continue.
            </p>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={blocked}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              {passwordError && <p className="mt-2 text-red-400 text-sm">{passwordError}</p>}

              {blocked && (
                <div className="mt-2 text-yellow-400 text-sm">
                  Account locked. Try again in {Math.floor(blockTimeRemaining / 60)}:{blockTimeRemaining % 60 < 10 ? '0' : ''}{blockTimeRemaining % 60}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelPasswordModal}
                className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={blocked || loading}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-lg"
              >
                {loading ? 'Verifying...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-gray-800 p-4 text-center text-gray-400 text-sm">
        <p>© 2025 Security Research Tool - For Educational Purposes Only</p>
      </footer>
    </div>
  );
}

export default App;
EOL

# Create App.css
echo -e "${GREEN}Creating App.css...${NC}"
cat > src/App.css << 'EOL'
/* App.css - Custom styling for the ZipZap App */

/* Import Tailwind CSS */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Custom color scheme */
:root {
  --primary-bg: #2C2E3B;
  --secondary-bg: #21232F;
  --accent-color: #5D64E4;
  --text-color: #E5E7EB;
  --secondary-text: #9CA3AF;
  --border-color: #3E4151;
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --error-color: #EF4444;
}

body {
  background-color: var(--primary-bg);
  color: var(--text-color);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.App {
  background-color: var(--primary-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: var(--secondary-bg);
  border-bottom: 1px solid var(--border-color);
}

main {
  flex-grow: 1;
  padding: 1.5rem;
  max-width: 64rem;
  margin: 0 auto;
  width: 100%;
}

footer {
  background-color: var(--secondary-bg);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
  text-align: center;
  color: var(--secondary-text);
  font-size: 0.875rem;
}
EOL

# Create index.js
echo -e "${GREEN}Creating index.js...${NC}"
cat > src/index.js << 'EOL'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
EOL

# Create index.css
echo -e "${GREEN}Creating index.css...${NC}"
cat > src/index.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOL

# Create reportWebVitals.js
echo -e "${GREEN}Creating reportWebVitals.js...${NC}"
cat > src/reportWebVitals.js << 'EOL'
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
EOL

# Create ZipBombService.js
echo -e "${GREEN}Creating ZipBombService.js...${NC}"
mkdir -p src/services
cat > src/services/ZipBombService.js << 'EOL'
// ZipBombService.js - Handles the creation of the zip bomb and password verification

const API_URL = 'http://localhost:4996';

class ZipBombService {
  /**
   * Verifies the password with the server
   * @param {string} password - The password to verify
   * @returns {Promise<Object>} The server response
   */
  async verifyPassword(password) {
    try {
      const response = await fetch(`${API_URL}/api/checkPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        // If response is 429 (Too Many Requests), handle rate limiting
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(data.message || 'Rate limit exceeded. Please try again later.');
        }

        throw new Error(`Server responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Generates a zip bomb with the given parameters
   * @param {Object} params - The parameters for the zip bomb
   * @param {number} params.fileSize - The size of the original file in MB
   * @param {number} params.levels - The number of nesting levels
   * @param {string} params.outputDir - The output directory
   * @param {Function} statusCallback - Callback function to update generation status
   * @returns {Promise<string>} The path to the generated zip bomb
   */
  async generateZipBomb(params, statusCallback = () => {}) {
    const { fileSize, levels, outputDir } = params;

    try {
      // For frontend demo purposes, we'll simulate the creation process
      // In a real application, this would call the actual creation function

      // Update status: starting
      statusCallback('Starting zip bomb generation...');
      await this.delay(500);

      // Update status: creating base file
      statusCallback(`Creating base file (${fileSize} MB)...`);
      await this.delay(1000);

      // Update status: compression steps
      for (let i = 0; i < levels; i++) {
        statusCallback(`Compressing level ${i + 1} of ${levels}...`);
        await this.delay(800);
      }

      // Update status: finalizing
      statusCallback('Finalizing zip bomb...');
      await this.delay(1200);

      // Calculate final statistics
      const compressedSize = (fileSize / 100).toFixed(2);
      const uncompressedSize = fileSize * 10;
      const compressionRatio = (uncompressedSize / compressedSize).toFixed(2);

      // Final status update
      statusCallback(`Done! Created zip bomb at '${outputDir}' (${compressedSize} MB compressed, expands to ${uncompressedSize} MB, ratio ${compressionRatio}:1)`);

      return `${outputDir}/level_${levels - 1}.zip`;
    } catch (error) {
      statusCallback(`Error: ${error.message}`);
      console.error('Error generating zip bomb:', error);
      throw error;
    }
  }

  /**
   * Helper method to simulate delay
   * @param {number} ms - The delay in milliseconds
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ZipBombService();
EOL

# Create ZipBombGenerator.py
echo -e "${GREEN}Creating ZipBombGenerator.py...${NC}"
cat > ZipBombGenerator.py << 'EOL'
#!/usr/bin/env python3
"""
ZipZap - Zip Bomb Demo Script
A simple demonstration script that creates a zip bomb.
When extracted, the content equals approximately 100 MB.
For educational and research purposes only.
"""

import os
import zipfile
import argparse
from pathlib import Path


def create_test_file(filename, size_mb):
    """Creates a test file with the specified size (in MB)"""
    size_bytes = size_mb * 1024 * 1024
    with open(filename, 'wb') as f:
        f.write(b'0' * size_bytes)
    print(f"File '{filename}' created with {size_mb} MB")


def create_nested_zip(output_dir, levels, file_size_mb, compression=zipfile.ZIP_DEFLATED):
    """Creates a nested zip file with multiple levels"""

    # Ensure that the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Create the original file
    original_file = os.path.join(output_dir, "original.dat")
    create_test_file(original_file, file_size_mb)

    # Incremental compression
    current_file = original_file

    for level in range(levels):
        zip_filename = os.path.join(output_dir, f"level_{level}.zip")

        with zipfile.ZipFile(zip_filename, 'w', compression=compression) as zipf:
            # Add multiple copies at the last level
            if level == levels - 1:
                for i in range(10):  # 10 copies of the file in the outermost zip
                    zipf.write(current_file, f"file_{i}.dat")
            else:
                zipf.write(current_file, os.path.basename(current_file))

        # Clean up, except for the first file (keep for comparison purposes)
        if level > 0 or levels == 1:
            os.remove(current_file)

        current_file = zip_filename
        print(f"Level {level} created: {zip_filename}")

    # Display size information
    final_size = os.path.getsize(current_file)
    uncompressed_size = file_size_mb * 1024 * 1024
    if levels == 1:
        total_uncompressed = uncompressed_size
    else:
        # Multiply by 10 copies at the last level
        total_uncompressed = uncompressed_size * 10

    print("\nZip Bomb Demo created:")
    print(f"Compressed size: {final_size / 1024 / 1024:.2f} MB")
    print(f"Extracted size (estimated): {total_uncompressed / 1024 / 1024:.2f} MB")
    print(f"Compression ratio: {total_uncompressed / final_size:.2f}:1")

    return current_file


def main():
    parser = argparse.ArgumentParser(description="Creates a Zip Bomb Demo")
    parser.add_argument("--output", "-o", default="zipzap_output",
                        help="Output directory (default: zipzap_output)")
    parser.add_argument("--size", "-s", type=int, default=10,
                        help="Size of the original file in MB (default: 10)")
    parser.add_argument("--levels", "-l", type=int, default=1,
                        help="Number of nesting levels (default: 1)")

    args = parser.parse_args()

    print("Creating Zip Bomb Demo...")
    print(f"Base size: {args.size} MB, Levels: {args.levels}")

    # Create path to output directory
    output_dir = Path(args.output)

    # Display warning if directory exists
    if output_dir.exists() and any(output_dir.iterdir()):
        print(f"Warning: Directory '{output_dir}' is not empty.")
        confirm = input("Continue? (y/n): ")
        if confirm.lower() not in ["y", "yes"]:
            print("Aborted.")
            return

    # Create demo
    final_zip = create_nested_zip(str(output_dir), args.levels, args.size)

    print(f"\nSuccess! The Zip Bomb Demo has been created: {final_zip}")
    print("NOTE: This script is for demonstration and educational purposes only.")


if __name__ == "__main__":
    main()
EOL

# Create README.md
echo -e "${GREEN}Creating README.md...${NC}"
cat > README.md << 'EOL'
# ZipZap - Zip Bomb Demonstration Application

A security research tool for educational purposes that demonstrates the concept of a ZIP bomb with password protection and brute-force prevention.

## Overview

This application consists of:

1. A React frontend for configuring and generating ZIP bombs
2. A Node.js backend for password verification with brute-force protection
3. A simulated ZIP bomb generator

When the extracted output would exceed 100MB, the system requires password verification to prevent misuse.

## Security Features

- Password protection for potentially large zip bombs
- Brute force protection:
  - Maximum 5 failed attempts
  - 15-minute lockout after exceeding the limit
  - Rate limiting between attempts
  - IP-based tracking
- Session cleanup

## Setup Instructions

### Backend Setup

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```

The server will run on port 4996 by default.

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Access the application at `http://localhost:3000`

## Usage

1. Configure your ZIP bomb parameters:
   - Base file size (MB)
   - Nesting levels
   - Output directory

2. If the extracted size exceeds 100MB, you will be prompted for a password
   - For this demo, the password is: `1337`
   - After 5 failed attempts, your IP will be locked for 15 minutes

3. After successful verification, the ZIP bomb will be generated with status updates

## Warning

This tool is for **educational purposes only**. Creating ZIP bombs with malicious intent may be illegal and harmful. Always use this tool responsibly and in controlled environments.
EOL

# Create public/index.html
echo -e "${GREEN}Creating public/index.html...${NC}"
mkdir -p public
cat > public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2C2E3B" />
    <meta
      name="description"
      content="ZipZap - A demonstration of zip bombs with password protection for educational purposes"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>ZipZap - Zip Bomb Demonstration</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOL

# Create public/manifest.json
echo -e "${GREEN}Creating public/manifest.json...${NC}"
cat > public/manifest.json << 'EOL'
{
  "short_name": "ZipZap",
  "name": "ZipZap - Zip Bomb Demonstration",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#2C2E3B",
  "background_color": "#2C2E3B"
}
EOL

# Create tailwind.config.js
echo -e "${GREEN}Creating tailwind.config.js...${NC}"
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C2E3B',
        secondary: '#21232F',
        accent: '#5D64E4',
      },
    },
  },
  plugins: [],
}
EOL

# Create postcss.config.js
echo -e "${GREEN}Creating postcss.config.js...${NC}"
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# Create .gitignore
echo -e "${GREEN}Creating .gitignore...${NC}"
cat > .gitignore << 'EOL'
# dependencies
/node_modules
/server/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# zip bomb outputs
/zipzap_output
EOL

# Make Python script executable
chmod +x ZipBombGenerator.py

echo -e "${GREEN}ZipZap project structure created successfully!${NC}"
echo -e "${BLUE}To start the project:${NC}"
echo "1. Install dependencies:"
echo "   npm install"
echo "2. Start the server (in a separate terminal):"
echo "   node server/server.js"
echo "3. Start the React app:"
echo "   npm start"