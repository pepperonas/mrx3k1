#!/bin/bash

# Farben für Terminal-Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Philips Hue Controller - Starter${NC}"
echo -e "==============================="

# Prüfen, ob Python installiert ist
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 ist nicht installiert. Bitte installiere Python 3.${NC}"
    echo "https://www.python.org/downloads/"
    exit 1
fi

# Prüfen, ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js ist nicht installiert. Bitte installiere Node.js.${NC}"
    echo "https://nodejs.org/en/download/"
    exit 1
fi

# Prüfe, ob npm installiert ist
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm ist nicht installiert. Bitte installiere npm.${NC}"
    exit 1
fi

# Verzeichnisstruktur
APP_DIR=$(pwd) # Aktuelles Verzeichnis

# Proxy-Process-ID speichern
PROXY_PID=""

# Funktion zum Beenden des Proxys beim Script-Ende
cleanup() {
    echo -e "\n${YELLOW}Beende Anwendungen...${NC}"

    if [ ! -z "$PROXY_PID" ]; then
        echo -e "Beende Python-Proxy (PID: $PROXY_PID)..."
        kill $PROXY_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}Aufräumen abgeschlossen. Auf Wiedersehen!${NC}"
    exit 0
}

# Registriere Cleanup-Funktion für Programm-Beendigung
trap cleanup EXIT INT TERM

# Starte Python-Proxy
echo -e "\n${BLUE}Starte Python-Proxy...${NC}"
python3 hue-proxy.py &
PROXY_PID=$!

# Kurz warten und prüfen, ob der Proxy gestartet ist
sleep 2

if ! ps -p $PROXY_PID > /dev/null; then
    echo -e "${RED}Fehler beim Starten des Python-Proxys.${NC}"
    echo -e "Versuche, den Proxy manuell zu starten: ${YELLOW}python3 hue-proxy.py${NC}"
    exit 1
fi

echo -e "${GREEN}Python-Proxy läuft auf http://localhost:80${NC}"

# Starte React-App, wenn bereits gebaut
if [ -d "build" ]; then
    echo -e "\n${BLUE}Starte Entwicklungsserver für die React-App...${NC}"
    echo -e "${YELLOW}Drücke Ctrl+C, um beide Anwendungen zu beenden.${NC}"

    # Starte einen einfachen HTTP-Server zum Hosten der Build-Dateien
    npx serve -s build
else
    # Starte die React-App im Entwicklungsmodus
    echo -e "\n${BLUE}Starte React-App im Entwicklungsmodus...${NC}"
    echo -e "${YELLOW}Drücke Ctrl+C, um beide Anwendungen zu beenden.${NC}"

    npm start
fi