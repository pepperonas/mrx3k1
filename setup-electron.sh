#!/bin/bash
# GlitterHue Electron App Setup Script
# Dieses Skript erstellt eine Electron-App aus deiner GlitterHue React-App

# Farben für bessere Lesbarkeit
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== GlitterHue Electron App Setup ===${NC}"
echo -e "${YELLOW}Dieses Skript erstellt eine Electron-App aus deiner React-App.${NC}"
echo -e "${YELLOW}Es wird vorausgesetzt, dass du bereits npm und Node.js installiert hast.${NC}"
echo ""

# Verzeichnisse
SOURCE_DIR="/Users/martin/WebstormProjects/mrx3k1/glitter-hue-electron"  # Passe dies an den Pfad deiner React-App an
ELECTRON_DIR="/Users/martin/WebstormProjects/mrx3k1/glitter-hue-electron"

# Prüfen, ob das Quellverzeichnis existiert
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}Fehler: Das Quellverzeichnis '$SOURCE_DIR' existiert nicht.${NC}"
    echo -e "${YELLOW}Bitte passe den Pfad im Skript an oder stelle sicher, dass es existiert.${NC}"
    exit 1
fi

# Erstelle das Electron-Verzeichnis
mkdir -p $ELECTRON_DIR
cd $ELECTRON_DIR

# package.json erstellen
echo -e "${GREEN}Erstelle package.json für die Electron-App...${NC}"
cat > package.json << 'EOL'
{
  "name": "glitter-hue-desktop",
  "version": "1.0.0",
  "description": "GlitterHue Desktop App - Philips Hue Music Visualizer",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder --win --mac --linux",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "author": "",
  "license": "MIT",
  "build": {
    "appId": "com.glitterhue.app",
    "productName": "GlitterHue",
    "mac": {
      "category": "public.app-category.music",
      "icon": "build/icon.icns"
    },
    "win": {
      "icon": "build/icon.ico"
    },
    "linux": {
      "category": "Audio",
      "icon": "build/icon.png"
    },
    "files": [
      "build/**/*",
      "main.js",
      "preload.js",
      "node_modules/**/*"
    ]
  },
  "devDependencies": {}
}
EOL

# Hauptprozess-Datei (main.js) erstellen
echo -e "${GREEN}Erstelle main.js für die Electron-App...${NC}"
cat > main.js << 'EOL'
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// Globale Referenz auf das Fenster, um zu verhindern, dass es geschlossen wird
let mainWindow;

// Entwicklungsmodus erkennen
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Erstelle das Browser-Fenster
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#121420', // Gleiche Hintergrundfarbe wie in der App
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Erlaubt HTTP-Anfragen von HTTPS-Kontext
    },
    icon: path.join(__dirname, 'build/icon.png'),
    show: false, // Erst anzeigen, wenn geladen
  });

  // Lade die index.html der App
  if (isDev) {
    // Im Entwicklungsmodus: Lade von lokaler Entwicklungsserver-URL
    mainWindow.loadURL('http://localhost:3000');
    // DevTools öffnen
    mainWindow.webContents.openDevTools();
  } else {
    // Im Produktionsmodus: Lade aus dem build-Ordner
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'build/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  // Fenster erst anzeigen, wenn es vollständig geladen ist (verhindert weißes Flackern)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Beim Schließen des Fensters
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Diese Methode wird aufgerufen, wenn Electron die Initialisierung abgeschlossen hat
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // Unter macOS ist es üblich, die Anwendung neu zu erstellen, wenn
    // das Dock-Symbol angeklickt wird und keine anderen Fenster geöffnet sind.
    if (mainWindow === null) createWindow();
  });
});

// Beenden, wenn alle Fenster geschlossen sind, außer auf macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle IPC-Nachrichten für Native-Funktionen
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Erlaubt HTTP-Anfragen von HTTPS-Kontext
app.commandLine.appendSwitch('allow-insecure-localhost');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-running-insecure-content');
EOL

# Preload-Skript erstellen
echo -e "${GREEN}Erstelle preload.js für die Electron-App...${NC}"
cat > preload.js << 'EOL'
const { contextBridge, ipcRenderer } = require('electron');

// API für den Renderer-Prozess exponieren
contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});

// Vereinfachter fetch für HTTP-Anfragen (falls nötig)
contextBridge.exposeInMainWorld('nativeFetch', {
  fetch: (url, options) => fetch(url, options)
});
EOL

# .gitignore erstellen
echo -e "${GREEN}Erstelle .gitignore...${NC}"
cat > .gitignore << 'EOL'
# Abhängigkeiten
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Produktion
/build
/dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
.idea
.vscode/*
!.vscode/extensions.json

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOL

# README.md erstellen
echo -e "${GREEN}Erstelle README.md...${NC}"
cat > README.md << 'EOL'
# GlitterHue Desktop

Eine Electron-basierte Desktop-App für GlitterHue, den Philips Hue Music Visualizer.

## Funktionen

- Voller Mikrofon-Zugriff für den Disco-Modus
- Direkter Zugriff auf die Philips Hue Bridge über HTTP
- Keine CORS- oder Mixed-Content-Probleme

## Entwicklung

```bash
# Dependencies installieren
npm install

# App starten
npm start
```

## Build

```bash
# Für alle Plattformen
npm run build

# Nur für Windows
npm run build:win

# Nur für macOS
npm run build:mac

# Nur für Linux
npm run build:linux
```

## Lizenz

MIT
EOL

# Abhängigkeiten installieren
echo -e "${GREEN}Installiere Electron und andere Abhängigkeiten...${NC}"
npm init -y > /dev/null
npm install --save-dev electron electron-builder > /dev/null

# Verzeichnisse für die Builds erstellen
mkdir -p build

# Zurück zum Ausgangsverzeichnis
cd ..

echo -e "${GREEN}Erstelle Skript zum Kopieren der React-App...${NC}"
cat > $ELECTRON_DIR/copy-react-app.sh << EOL
#!/bin/bash
# Dieses Skript kopiert die gebaute React-App in das Electron-Verzeichnis

echo "Building React App..."
cd $SOURCE_DIR
npm run build

echo "Copying built files to Electron app..."
rm -rf ../$ELECTRON_DIR/build
cp -r build/ ../$ELECTRON_DIR/build/

echo "React app successfully copied to Electron app!"
EOL

chmod +x $ELECTRON_DIR/copy-react-app.sh

# Hinweise für den Benutzer
echo -e "${BLUE}=== Installation abgeschlossen ===${NC}"
echo -e "${GREEN}Die Electron-App wurde erfolgreich eingerichtet.${NC}"
echo ""
echo -e "${YELLOW}Nächste Schritte:${NC}"
echo "1. Baue deine React-App mit: cd $SOURCE_DIR && npm run build"
echo "2. Kopiere die gebaute App: $ELECTRON_DIR/copy-react-app.sh"
echo "3. Starte die Electron-App: cd $ELECTRON_DIR && npm start"
echo ""
echo -e "${YELLOW}Zum Erstellen von Installationspaketen:${NC}"
echo "cd $ELECTRON_DIR && npm run build"
echo ""
echo -e "${BLUE}Viel Spaß mit GlitterHue Desktop!${NC}"