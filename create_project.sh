#!/bin/bash

# Projektverzeichnis erstellen
PROJECT_DIR="objectcut-react"

# Hauptverzeichnis anlegen
mkdir -p "$PROJECT_DIR"

# Verzeichnisstruktur und leere Dateien erstellen
mkdir -p "$PROJECT_DIR/public"
touch "$PROJECT_DIR/public/index.html"
touch "$PROJECT_DIR/public/favicon.ico"

mkdir -p "$PROJECT_DIR/src/components"
mkdir -p "$PROJECT_DIR/src/services"
mkdir -p "$PROJECT_DIR/src/styles"
touch "$PROJECT_DIR/src/App.js"
touch "$PROJECT_DIR/src/index.js"
touch "$PROJECT_DIR/src/components/ImageCanvas.js"
touch "$PROJECT_DIR/src/components/Header.js"
touch "$PROJECT_DIR/src/components/Controls.js"
touch "$PROJECT_DIR/src/services/imageProcessing.js"
touch "$PROJECT_DIR/src/styles/App.css"

touch "$PROJECT_DIR/package.json"

mkdir -p "$PROJECT_DIR/server"
touch "$PROJECT_DIR/server/server.js"
touch "$PROJECT_DIR/server/imageProcessingAPI.js"

# Bestätigung ausgeben
echo "Projektstruktur für '$PROJECT_DIR' erfolgreich erstellt:"
tree "$PROJECT_DIR" || echo "(tree-Befehl nicht verfügbar, Struktur wurde dennoch erstellt)"