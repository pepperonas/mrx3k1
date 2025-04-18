#!/bin/bash
# Setup-Skript für GlitterHue Electron-App
# Erstellt die Grundstruktur der Electron-App

# Farbcodes für Ausgaben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   GlitterHue Electron Setup Assistant   ${NC}"
echo -e "${BLUE}==========================================${NC}"

# 1. Prüfen, ob das Verzeichnis existiert, sonst erstellen
if [ -d "glitter-hue-electron" ]; then
  echo -e "${YELLOW}Das Verzeichnis 'glitter-hue-electron' existiert bereits.${NC}"
  read -p "Möchtest du es überschreiben? (j/n): " overwrite
  if [ "$overwrite" != "j" ]; then
    echo -e "${RED}Abgebrochen. Bitte entferne oder benenne das Verzeichnis um und versuche es erneut.${NC}"
    exit 1
  fi
  rm -rf glitter-hue-electron
fi

# Verzeichnis erstellen
echo -e "${YELLOW}Erstelle Verzeichnis 'glitter-hue-electron'...${NC}"
mkdir -p glitter-hue-electron

# 2. Dateien erstellen
echo -e "${YELLOW}Erstelle Electron-Basisdateien...${NC}"

# main.js
cat > glitter-hue-electron/main.js << 'EOL'
// Electron-Hauptprozess
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Fensterreferenz global halten, um GC zu vermeiden
let mainWindow;

function createWindow() {
  // Hauptfenster erstellen
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 650,
    minHeight: 500,
    backgroundColor: '#2C2E3B',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'build', 'logo512.png')
  });

  // In Produktionsumgebung laden wir die aus React gebaute App
  const startUrl = url.format({
    pathname: path.join(__dirname, 'build', 'index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  mainWindow.loadURL(startUrl);

  // Menüleiste in Produktion ausblenden
  if (process.env.NODE_ENV === 'production') {
    mainWindow.setMenuBarVisibility(false);
  } else {
    // DevTools in Entwicklungsumgebung öffnen
    mainWindow.webContents.openDevTools();
  }

  // Ereignisbehandlung für Fensterschließung
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App-Initialisierung
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Unter macOS Fenster neu erstellen, wenn auf Dock-Icon geklickt wird
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// App beenden, wenn alle Fenster geschlossen sind (außer auf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC-Handlers für Kommunikation mit der UI
ipcMain.handle('check-microphone-permission', async () => {
  // Unter macOS und Windows wird der Zugriff vom System abgefragt
  // Hier könnte man für Linux zusätzliche Logik implementieren
  return true;
});
EOL

# preload.js
cat > glitter-hue-electron/preload.js << 'EOL'
// Electron Preload-Skript - sichere Bridge zwischen Renderer und Main-Prozess
const { contextBridge, ipcRenderer } = require('electron');

// Sichere API für den Renderer-Prozess
contextBridge.exposeInMainWorld('electronAPI', {
  // Beispiel für eine API-Methode, die mit dem Main-Prozess kommuniziert
  checkMicrophonePermission: () => ipcRenderer.invoke('check-microphone-permission'),
  
  // Version der App abfragen
  getAppVersion: () => {
    // App-Version aus der package.json lesen
    return process.env.npm_package_version || '1.0.0';
  },

  // Plattforminformationen
  getPlatform: () => process.platform
});

// Logger für die Entwicklung
console.log('Preload-Skript geladen');
EOL

# package.json
cat > glitter-hue-electron/package.json << 'EOL'
{
  "name": "glitter-hue-electron",
  "productName": "GlitterHue",
  "version": "0.1.0",
  "description": "Philips Hue Controller mit Musik-Visualisierung und Disco-Modus",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dev": "concurrently \"cd ../glitter-hue && npm start\" \"wait-on http://localhost:3000 && electron . --dev\"",
    "build": "sh build-app.sh",
    "package-mac": "electron-builder --mac",
    "package-win": "electron-builder --win",
    "package-linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.glitterhue.app",
    "directories": {
      "buildResources": "assets",
      "output": "dist"
    },
    "files": [
      "build/**/*",
      "node_modules/**/*",
      "*.js"
    ],
    "mac": {
      "category": "public.app-category.utilities",
      "target": "dmg",
      "icon": "build/logo512.png"
    },
    "win": {
      "target": "nsis",
      "icon": "build/logo512.png"
    },
    "linux": {
      "target": "AppImage",
      "icon": "build/logo512.png",
      "category": "Utility"
    }
  },
  "author": "GlitterHue Team",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.2",
    "electron": "^29.1.0",
    "electron-builder": "^24.13.1",
    "wait-on": "^7.2.0"
  }
}
EOL

# build-app.sh
cat > glitter-hue-electron/build-app.sh << 'EOL'
#!/bin/bash
# Build-Skript für GlitterHue Electron-App
# Dieses Skript baut die React-App und überträgt sie in die Electron-App

# Farbcodes für Ausgaben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}     GlitterHue Electron Build Tool     ${NC}"
echo -e "${BLUE}==========================================${NC}"

# Prüfen, ob wir im richtigen Verzeichnis sind
if [ ! -f "main.js" ] || [ ! -f "package.json" ]; then
  echo -e "${RED}Fehler: Dieses Skript muss im glitter-hue-electron Verzeichnis ausgeführt werden.${NC}"
  exit 1
fi

# Prüfen, ob das React-Quellverzeichnis existiert
if [ ! -d "../glitter-hue" ]; then
  echo -e "${RED}Fehler: Das React-Quellverzeichnis '../glitter-hue' wurde nicht gefunden.${NC}"
  exit 1
fi

# 1. React-App bauen
echo -e "${YELLOW}1. Baue die React-App...${NC}"
cd ../glitter-hue

# Prüfen, ob npm installiert ist
if ! command -v npm &> /dev/null; then
  echo -e "${RED}Fehler: npm ist nicht installiert. Bitte installiere Node.js und npm.${NC}"
  exit 1
fi

# Installiere React-Abhängigkeiten falls nötig
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installiere React-Abhängigkeiten...${NC}"
  npm install
fi

# Baue die React-App
echo -e "${YELLOW}Führe React build aus...${NC}"
npm run build

# Prüfen, ob der Build erfolgreich war
if [ ! -d "build" ]; then
  echo -e "${RED}Fehler: React-Build fehlgeschlagen. Bitte überprüfe die Fehlermeldungen.${NC}"
  cd ../glitter-hue-electron
  exit 1
fi

echo -e "${GREEN}React-App wurde erfolgreich gebaut.${NC}"

# 2. Zurück zum Electron-Verzeichnis wechseln
cd ../glitter-hue-electron

# 3. Alte Build-Dateien löschen falls vorhanden
echo -e "${YELLOW}2. Lösche alte Build-Dateien...${NC}"
if [ -d "build" ]; then
  rm -rf build
fi

# 4. Build-Dateien kopieren
echo -e "${YELLOW}3. Kopiere Build-Dateien in die Electron-App...${NC}"
mkdir -p build
cp -r ../glitter-hue/build/* build/

# 5. Electron-Abhängigkeiten installieren/aktualisieren
echo -e "${YELLOW}4. Installiere/Aktualisiere Electron-Abhängigkeiten...${NC}"
npm install

# 6. OS-spezifische Icons und Ressourcen kopieren
echo -e "${YELLOW}5. Kopiere Icons und Ressourcen...${NC}"
mkdir -p assets
cp build/logo512.png assets/icon.png

# 7. Fertig
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Build abgeschlossen! Die App kann jetzt mit folgenden Befehlen gestartet werden:${NC}"
echo -e "${BLUE}  npm start${NC}          - Startet die Electron-App"
echo -e "${BLUE}  npm run package-mac${NC}    - Erstellt ein macOS-Paket"
echo -e "${BLUE}  npm run package-win${NC}    - Erstellt ein Windows-Paket"
echo -e "${BLUE}  npm run package-linux${NC}  - Erstellt ein Linux-Paket"
echo -e "${GREEN}=========================================${NC}"
EOL

# Ausführbar machen
chmod +x glitter-hue-electron/build-app.sh

# .gitignore
cat > glitter-hue-electron/.gitignore << 'EOL'
node_modules/
build/
dist/
.DS_Store
.env
*.log
EOL

# README.md
cat > glitter-hue-electron/README.md << 'EOL'
# GlitterHue Electron App

Desktop-Version der GlitterHue Web-App zur Steuerung von Philips Hue-Lampen mit Musik-Visualisierung und Disco-Modus.

## Voraussetzungen

- Node.js (Version 16+)
- npm (Version 8+)
- Eine Philips Hue Bridge im lokalen Netzwerk
- Philips Hue-Lampen (Color-Modelle empfohlen)
- Ein Gerät mit Mikrofon für den Disco-Modus

## Installation und Build

### 1. Installiere die Abhängigkeiten:

```bash
npm install
```

### 2. Baue die App:

```bash
npm run build
```

Dieses Kommando führt das `build-app.sh` Skript aus, das automatisch die React-App baut und in das Electron-Verzeichnis kopiert.

### 3. Starte die Electron-App:

```bash
npm start
```

## Paketierung

Die App kann für verschiedene Plattformen paketiert werden:

- **macOS**: `npm run package-mac`
- **Windows**: `npm run package-win`
- **Linux**: `npm run package-linux`

Die erstellten Pakete werden im Verzeichnis `dist/` abgelegt.

## Entwicklung

Für die Entwicklung kann die App im Dev-Modus gestartet werden:

```bash
npm run dev
```

Dieses Kommando startet die React-App im Entwicklungsmodus und öffnet die Electron-App, sobald der Dev-Server bereit ist.

## Plattformspezifische Hinweise

### macOS

- Für den Zugriff auf das Mikrofon wird eine Berechtigungsabfrage angezeigt
- Empfohlenes Format: DMG

### Windows

- Empfohlenes Format: NSIS Installer

### Linux

- Je nach Distribution können zusätzliche Abhängigkeiten erforderlich sein
- Empfohlenes Format: AppImage

## Lizenz

MIT
EOL

# 3. Mache setup-Skript ausführbar
chmod +x setup-electron-app.sh

echo -e "${GREEN}Setup abgeschlossen!${NC}"
echo -e "${YELLOW}Das Electron-Projekt wurde in 'glitter-hue-electron' erstellt.${NC}"
echo -e "${YELLOW}Wechsle in das Verzeichnis und führe das Build-Skript aus:${NC}"
echo -e "${BLUE}cd glitter-hue-electron${NC}"
echo -e "${BLUE}npm install${NC}"
echo -e "${BLUE}./build-app.sh${NC}"
