#!/bin/bash

# Farben für Terminal-Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Philips Hue Controller - Installations-Skript${NC}"
echo -e "=========================================="

# Überprüfen, ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js ist nicht installiert. Bitte installiere Node.js.${NC}"
    echo "https://nodejs.org/en/download/"
    exit 1
fi

# Überprüfen, ob npm installiert ist
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm ist nicht installiert. Bitte installiere npm.${NC}"
    exit 1
fi

# Projektordner erstellen
echo -e "\n${GREEN}1. Erstelle Projektordner${NC}"
PROJECT_NAME="philips-hue-controller"

if [ -d "$PROJECT_NAME" ]; then
    echo -e "${YELLOW}Ordner '$PROJECT_NAME' existiert bereits. Möchtest du ihn überschreiben? (j/n)${NC}"
    read -r OVERWRITE
    if [ "$OVERWRITE" == "j" ] || [ "$OVERWRITE" == "J" ]; then
        rm -rf "$PROJECT_NAME"
    else
        echo "Abbruch."
        exit 1
    fi
fi

# React-App erstellen
echo -e "\n${GREEN}2. Erstelle React-App${NC}"
echo -e "Dies kann einige Minuten dauern..."
npx create-react-app "$PROJECT_NAME"

# In Projektordner wechseln
cd "$PROJECT_NAME" || exit

# Erstelle Verzeichnisstruktur
echo -e "\n${GREEN}3. Erstelle Verzeichnisstruktur${NC}"
mkdir -p src/components

# Lösche nicht benötigte Dateien
echo -e "\n${GREEN}4. Lösche nicht benötigte Dateien${NC}"
rm -f src/App.css src/App.js src/App.test.js src/logo.svg src/reportWebVitals.js src/setupTests.js

# Erstelle App.jsx
echo -e "\n${GREEN}5. Erstelle Hauptkomponente (App.jsx)${NC}"
cat > src/App.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import './App.css';
import LightCard from './components/LightCard';

function App() {
  const [bridgeIP, setBridgeIP] = useState('');
  const [username, setUsername] = useState('');
  const [connectedToBridge, setConnectedToBridge] = useState(false);
  const [lights, setLights] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ message: '', type: 'info' });

  // Gespeicherte Werte laden
  useEffect(() => {
    const savedBridgeIP = localStorage.getItem('hue-bridge-ip');
    const savedUsername = localStorage.getItem('hue-username');

    if (savedBridgeIP) {
      setBridgeIP(savedBridgeIP);
    }

    if (savedUsername) {
      setUsername(savedUsername);
    }

    if (savedBridgeIP && savedUsername) {
      connectToBridge(savedBridgeIP, savedUsername);
    }
  }, []);

  // Status setzen
  const setStatus = (message, type = 'info') => {
    setStatusMessage({ message, type });
  };

  // Bridge finden
  const discoverBridge = async () => {
    setLoading(true);
    setStatus('Suche nach Hue Bridge im Netzwerk...', 'info');

    try {
      const response = await fetch('https://discovery.meethue.com/');
      const bridges = await response.json();

      if (bridges && bridges.length > 0) {
        setBridgeIP(bridges[0].internalipaddress);
        setStatus(`Bridge gefunden: ${bridges[0].internalipaddress}`, 'success');
      } else {
        setStatus('Keine Bridge gefunden. Versuche die IP manuell einzugeben.', 'error');
      }
    } catch (error) {
      setStatus('Fehler bei der Bridge-Suche: ' + error.message, 'error');
    }

    setLoading(false);
  };

  // Mit Bridge verbinden
  const connectToBridge = async (ip = bridgeIP, user = username) => {
    if (!ip) {
      setStatus('Bitte Bridge IP eingeben', 'error');
      return;
    }

    if (!user) {
      setStatus('Bitte API Username eingeben', 'error');
      return;
    }

    setLoading(true);
    setStatus('Verbinde mit Hue Bridge...', 'info');

    try {
      const response = await fetch(`http://${ip}/api/${user}/lights`);
      const data = await response.json();

      if (data.error && data.error[0].description.includes('unauthorized')) {
        setStatus('Unauthorisiert. Bitte erstelle einen neuen Benutzer.', 'error');
        setLoading(false);
        return;
      }

      setConnectedToBridge(true);
      setLights(data);

      // Einstellungen speichern
      localStorage.setItem('hue-bridge-ip', ip);
      localStorage.setItem('hue-username', user);

      setStatus('Erfolgreich mit Hue Bridge verbunden', 'success');
    } catch (error) {
      setStatus('Verbindungsfehler: ' + error.message, 'error');
    }

    setLoading(false);
  };

  // Neuen Benutzer erstellen
  const createUser = async () => {
    if (!bridgeIP) {
      setStatus('Bitte Bridge IP eingeben', 'error');
      return;
    }

    setLoading(true);
    setStatus('Drücke den Link-Button auf deiner Hue Bridge und klicke dann hier', 'info');

    try {
      const response = await fetch(`http://${bridgeIP}/api`, {
        method: 'POST',
        body: JSON.stringify({
          devicetype: 'hue_react_controller'
        })
      });
      const data = await response.json();

      if (data[0].error && data[0].error.type === 101) {
        setStatus('Drücke zuerst den Link-Button auf der Bridge', 'error');
      } else if (data[0].success) {
        const newUsername = data[0].success.username;
        setUsername(newUsername);
        localStorage.setItem('hue-username', newUsername);
        setStatus('Benutzer erfolgreich erstellt', 'success');
      }
    } catch (error) {
      setStatus('Fehler beim Erstellen des Benutzers: ' + error.message, 'error');
    }

    setLoading(false);
  };

  // Licht ein-/ausschalten
  const toggleLight = async (id, on) => {
    try {
      const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${id}/state`, {
        method: 'PUT',
        body: JSON.stringify({ on })
      });
      const data = await response.json();

      if (data[0].success) {
        setLights(prevLights => ({
          ...prevLights,
          [id]: {
            ...prevLights[id],
            state: {
              ...prevLights[id].state,
              on
            }
          }
        }));
      }
    } catch (error) {
      setStatus(`Fehler beim Schalten von Licht ${id}: ${error.message}`, 'error');
    }
  };

  // Helligkeit setzen
  const setBrightness = async (id, brightness) => {
    try {
      const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${id}/state`, {
        method: 'PUT',
        body: JSON.stringify({ bri: parseInt(brightness) })
      });
      const data = await response.json();

      if (data[0].success) {
        setLights(prevLights => ({
          ...prevLights,
          [id]: {
            ...prevLights[id],
            state: {
              ...prevLights[id].state,
              bri: parseInt(brightness)
            }
          }
        }));
      }
    } catch (error) {
      setStatus(`Fehler beim Einstellen der Helligkeit von Licht ${id}: ${error.message}`, 'error');
    }
  };

  // Farbe setzen
  const setColor = async (id, hexColor) => {
    const hsv = hexToHsv(hexColor);

    try {
      const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${id}/state`, {
        method: 'PUT',
        body: JSON.stringify({
          hue: hsv.hue,
          sat: hsv.sat
        })
      });
      const data = await response.json();

      if (data[0].success) {
        setLights(prevLights => ({
          ...prevLights,
          [id]: {
            ...prevLights[id],
            state: {
              ...prevLights[id].state,
              hue: hsv.hue,
              sat: hsv.sat
            }
          }
        }));
      }
    } catch (error) {
      setStatus(`Fehler beim Einstellen der Farbe von Licht ${id}: ${error.message}`, 'error');
    }
  };

  // Konvertierung: Hex zu HSV für die Hue API
  const hexToHsv = (hex) => {
    // Hex zu RGB
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;

    if (diff === 0) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    // Für Hue API: hue von 0-65535
    const hueForApi = Math.round((h / 360) * 65535);

    // Sättigung von 0-254
    const s = (max === 0) ? 0 : diff / max;
    const satForApi = Math.round(s * 254);

    return {
      hue: hueForApi,
      sat: satForApi
    };
  };

  return (
    <div className="app">
      <header>
        <h1>Philips Hue Controller</h1>
      </header>

      <div className="container">
        <div className="setup-section">
          <h2>Verbindung einrichten</h2>
          <div>
            <label htmlFor="bridge-ip">Bridge IP:</label>
            <input
              type="text"
              id="bridge-ip"
              placeholder="z.B. 192.168.1.2"
              value={bridgeIP}
              onChange={(e) => setBridgeIP(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="username">API Username:</label>
            <input
              type="text"
              id="username"
              placeholder="API Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <button onClick={() => connectToBridge()}>Verbinden</button>
            <button onClick={discoverBridge}>Bridge finden</button>
            <button onClick={createUser}>Neuen Benutzer erstellen</button>
          </div>
          {statusMessage.message && (
            <div className={`status-message status-${statusMessage.type}`}>
              {statusMessage.message}
            </div>
          )}
        </div>

        {loading && (
          <div className="loading">
            <p>Lade Daten...</p>
          </div>
        )}

        {connectedToBridge && !loading && (
          <div className="lights-section">
            <h2>Verfügbare Lampen</h2>
            <div className="lights-container">
              {Object.keys(lights).map(id => (
                <LightCard
                  key={id}
                  id={id}
                  light={lights[id]}
                  toggleLight={toggleLight}
                  setBrightness={setBrightness}
                  setColor={setColor}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
EOF

# Erstelle LightCard.jsx
echo -e "\n${GREEN}6. Erstelle LightCard-Komponente${NC}"
cat > src/components/LightCard.jsx << 'EOF'
import React from 'react';

const LightCard = ({ id, light, toggleLight, setBrightness, setColor }) => {
  // Farbe aus Licht-Status ermitteln
  const getColorFromState = (state) => {
    if (state.hue === undefined || state.sat === undefined) {
      // Für weiße Lampen
      const bri = state.bri || 254;
      const briPercentage = (bri / 254) * 100;
      return `hsl(0, 0%, ${briPercentage}%)`;
    }

    // Für Farblampen
    const hue = (state.hue / 65535) * 360;
    const sat = (state.sat / 254) * 100;
    const bri = (state.bri || 254) / 254 * 100;

    return `hsl(${hue}, ${sat}%, ${bri}%)`;
  };

  // Hex-Farbe aus Licht-Status ermitteln
  const getHexColor = (state) => {
    if (state.hue === undefined || state.sat === undefined) {
      return '#ffffff';
    }

    return hsvToHex(state.hue, state.sat, state.bri || 254);
  };

  // Konvertierung: HSV zu Hex
  const hsvToHex = (h, s, v) => {
    // Konvertieren der Hue-API-Werte zu Standard-HSV
    h = (h / 65535) * 360;
    s = s / 254;
    v = v / 254;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r, g, b;

    if (h >= 0 && h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    b = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  };

  return (
    <div className="light-card" data-light-id={id}>
      <div className="light-header">
        <div
          className="color-indicator"
          style={{
            backgroundColor: light.state.on
              ? getColorFromState(light.state)
              : '#333'
          }}
        />
        <h3>{light.name}</h3>
      </div>

      <label className="switch">
        <input
          type="checkbox"
          checked={light.state.on}
          onChange={(e) => toggleLight(id, e.target.checked)}
        />
        <span className="slider"></span>
      </label>

      <div className="light-controls">
        <div>
          <label>Helligkeit:</label>
          <input
            type="range"
            min="1"
            max="254"
            value={light.state.bri || 254}
            onChange={(e) => setBrightness(id, e.target.value)}
          />
        </div>

        {light.state.hue !== undefined && light.state.sat !== undefined && (
          <div>
            <label>Farbe:</label>
            <input
              type="color"
              className="color-picker"
              value={getHexColor(light.state)}
              onChange={(e) => setColor(id, e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LightCard;
EOF

# Erstelle App.css
echo -e "\n${GREEN}7. Erstelle CSS-Datei${NC}"
cat > src/App.css << 'EOF'
/* App.css */
:root {
  --primary-color: #2C2E3B;
  --text-color: #ffffff;
  --accent-color: #5072A7;
  --background-color: #1A1B23;
  --card-color: #33364A;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', 'Roboto', sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: var(--primary-color);
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  flex: 1;
}

.setup-section {
  background-color: var(--card-color);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.setup-section div {
  margin-bottom: 1rem;
}

.setup-section label {
  display: block;
  margin-bottom: 0.5rem;
}

.setup-section input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.2);
  color: var(--text-color);
}

.setup-section button {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.lights-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.light-card {
  background-color: var(--card-color);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.light-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.light-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.color-indicator {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
}

.light-controls {
  margin-top: 1rem;
}

.light-controls div {
  margin-bottom: 1rem;
}

.light-controls label {
  display: block;
  margin-bottom: 0.5rem;
}

button {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #3c5a8f;
}

input[type="range"] {
  width: 100%;
  margin: 0.5rem 0;
}

.color-picker {
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--accent-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.loading {
  text-align: center;
  padding: 2rem;
}

.status-message {
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
}

.status-error {
  background-color: rgba(255, 99, 71, 0.2);
  color: tomato;
}

.status-success {
  background-color: rgba(144, 238, 144, 0.2);
  color: lightgreen;
}

.status-info {
  background-color: rgba(100, 149, 237, 0.2);
  color: cornflowerblue;
}
EOF

# Erstelle index.js
echo -e "\n${GREEN}8. Aktualisiere index.js${NC}"
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Aktualisiere public/index.html
echo -e "\n${GREEN}9. Aktualisiere index.html${NC}"
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2C2E3B" />
    <meta
      name="description"
      content="Philips Hue Controller - Browser-App zur Steuerung von Philips Hue-Lampen"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Philips Hue Controller</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Erstelle CORS Proxy Script
echo -e "\n${GREEN}10. Erstelle CORS Proxy Script${NC}"
cat > cors-proxy.js << 'EOF'
// cors-proxy.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// CORS für alle Anfragen aktivieren
app.use(cors());

// Proxy-Middleware-Konfiguration
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:8080', // Wird dynamisch überschrieben
  changeOrigin: true,
  router: function(req) {
    // Extrahiere die Ziel-IP aus dem Pfad
    const pathParts = req.url.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'hue') {
      const targetIp = pathParts[2];
      const newPath = '/' + pathParts.slice(3).join('/');
      req.url = newPath;
      return `http://${targetIp}`;
    }
    return 'http://localhost';
  },
  pathRewrite: function(path, req) {
    const pathParts = path.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'hue') {
      return '/' + pathParts.slice(3).join('/');
    }
    return path;
  }
});

// Alle Anfragen an /hue/{bridgeIP} werden zum Proxy weitergeleitet
app.use('/hue', apiProxy);

// Standard-Route
app.get('/', (req, res) => {
  res.send('Philips Hue CORS Proxy läuft. Verwende /hue/{bridge-ip}/api/... für Anfragen.');
});

// Server starten
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`CORS Proxy läuft auf Port ${PORT}`);
  console.log(`Für Hue Bridge API-Anfragen verwende: http://localhost:${PORT}/hue/{bridge-ip}/api/...`);
});
EOF

# Aktualisiere package.json für CORS Proxy
echo -e "\n${GREEN}11. Aktualisiere package.json mit CORS Proxy Abhängigkeiten${NC}"
cat > cors-proxy-package.json << 'EOF'
{
  "name": "hue-cors-proxy",
  "version": "1.0.0",
  "description": "CORS Proxy für Philips Hue Bridge API",
  "main": "cors-proxy.js",
  "scripts": {
    "start": "node cors-proxy.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6"
  }
}
EOF

# Erstelle README.md
echo -e "\n${GREEN}12. Erstelle README.md${NC}"
cat > README.md << 'EOF'
# Philips Hue Controller

Eine React-App zur Steuerung von Philips Hue-Lampen über die offizielle API.

## Features

- Automatische Bridge-Suche im lokalen Netzwerk
- Benutzer-Erstellung für API-Zugriff
- Ein-/Ausschalten, Helligkeit und Farbsteuerung für alle Lampen
- Speicherung der Verbindungsdaten

## Projektstruktur

```
philips-hue-controller/
├── public/           # Statische Dateien
├── src/              # Quellcode
│   ├── components/   # React-Komponenten
│   ├── App.css       # Styling
│   ├── App.jsx       # Hauptkomponente
│   └── index.js      # Einstiegspunkt
├── cors-proxy.js     # CORS Proxy Server
├── cors-proxy-package.json # Abhängigkeiten für CORS Proxy
└── package.json      # Projektabhängigkeiten
```

## Installation

```bash
# React-App Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm start
```

## CORS-Behandlung

Da die Philips Hue Bridge keine CORS-Header sendet, gibt es folgende Optionen:

### Option 1: Enthaltenen CORS Proxy verwenden

```bash
# In einem separaten Terminal:
mkdir -p cors-proxy && cd cors-proxy
cp ../cors-proxy-package.json package.json
cp ../cors-proxy.js cors-proxy.js
npm install
npm start
```

Dann musst du die API-URLs in der App anpassen:
- Ändere `http://${bridgeIP}/api` zu `http://localhost:8080/hue/${bridgeIP}/api`

### Option 2: Browser mit deaktivierten Sicherheitseinstellungen starten

Für Chrome unter macOS:
```
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security
```

Für Chrome unter Linux:
```
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_session"
```

## Verwendung

1. Starte die App im Browser
2. Klicke auf "Bridge finden" oder gib die IP-Adresse deiner Hue Bridge manuell ein
3. Drücke den physischen Link-Button auf deiner Hue Bridge
4. Klicke auf "Neuen Benutzer erstellen" in der App
5. Verbinde dich mit der Bridge

Die Verbindungsdaten werden im lokalen Speicher des Browsers gespeichert, sodass du dich nicht jedes Mal neu verbinden musst.

## Produktion

```bash
# Build für Produktionsumgebung erstellen
npm run build
```

Die optimierten Dateien werden im `build/`-Verzeichnis erstellt und können auf einem Webserver gehostet werden.
EOF

# Erstelle Startscript
echo -e "\n${GREEN}13. Erstelle Startscript${NC}"
cat > start-hue-controller.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Philips Hue Controller - Starter${NC}"
echo -e "==============================="

# Verzeichnis für die App
APP_DIR="philips-hue-controller"
PROXY_DIR="cors-proxy"

# Prüfe, ob die App existiert
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}Hue Controller App nicht gefunden. Bitte führe zuerst das Installationsskript aus.${NC}"
    exit 1
fi

# CORS Proxy einrichten, falls er nicht existiert
if [ ! -d "$PROXY_DIR" ]; then
    echo -e "${GREEN}Richte CORS Proxy ein...${NC}"
    mkdir -p "$PROXY_DIR"
    cp "$APP_DIR/cors-proxy-package.json" "$PROXY_DIR/package.json"
    cp "$APP_DIR/cors-proxy.js" "$PROXY_DIR/cors-proxy.js"

    # Ins Proxy-Verzeichnis wechseln und Abhängigkeiten installieren
    cd "$PROXY_DIR" || exit
    npm install

    # Zurück ins Hauptverzeichnis
    cd ..
fi

# Starte CORS Proxy im Hintergrund
echo -e "${GREEN}Starte CORS Proxy...${NC}"
cd "$PROXY_DIR" || exit
node cors-proxy.js &
PROXY_PID=$!
cd ..

# Warte ein wenig, damit der Proxy Zeit zum Starten hat
sleep 2

# Starte die React-App
echo -e "${GREEN}Starte Hue Controller App...${NC}"
cd "$APP_DIR" || exit
npm start

# Wenn die React-App beendet wird, beende auch den Proxy
kill $PROXY_PID

echo -e "${GREEN}Anwendung beendet.${NC}"
EOF

# Zugriffsrechte für Startscript setzen
chmod +x start-hue-controller.sh

# Installiere Abhängigkeiten
echo -e "\n${GREEN}14. Installiere Abhängigkeiten${NC}"
echo -e "Dies kann einige Minuten dauern..."
npm install

echo -e "\n${GREEN}Installation abgeschlossen!${NC}"
echo -e "Der Philips Hue Controller wurde erfolgreich erstellt."
echo -e "\nUm die App zu starten, führe das Startskript aus:"
echo -e "${YELLOW}./start-hue-controller.sh${NC}"
echo -e "\nODER starte die App manuell:"
echo -e "${YELLOW}cd $PROJECT_NAME${NC}"
echo -e "${YELLOW}npm start${NC}"
echo -e "\nHinweis: Aufgrund von CORS-Einschränkungen musst du entweder den CORS Proxy verwenden"
echo -e "oder einen Browser mit deaktivierten Sicherheitseinstellungen starten."
echo -e "Siehe README.md für weitere Informationen."

# Mache das Skript ausführbar
chmod +x install-hue-controller.sh