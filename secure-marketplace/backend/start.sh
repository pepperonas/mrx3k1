#!/bin/bash

# start.sh - Script zum Starten der Marketplace-Anwendung
# Stellt sicher, dass MongoDB und der Server auf den korrekten Ports laufen

# Farbdefinitionen für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starte Secure Marketplace Anwendung...${NC}"

# Prüfen, ob MongoDB-Datenverzeichnis existiert
MONGO_DATA_DIR="$HOME/data/mongodb"
if [ ! -d "$MONGO_DATA_DIR" ]; then
    echo -e "${YELLOW}Erstelle MongoDB-Datenverzeichnis: $MONGO_DATA_DIR${NC}"
    mkdir -p "$MONGO_DATA_DIR"
fi

# Prüfen, ob MongoDB bereits läuft
MONGO_RUNNING=$(pgrep -f "mongod.*--port 27018" || echo "")
if [ -z "$MONGO_RUNNING" ]; then
    echo -e "${YELLOW}Starte MongoDB auf Port 27018...${NC}"
    mongod --dbpath "$MONGO_DATA_DIR" --port 27018 --fork --logpath "$MONGO_DATA_DIR/mongodb.log"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}MongoDB erfolgreich gestartet auf Port 27018${NC}"
    else
        echo -e "${RED}Fehler beim Starten von MongoDB${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}MongoDB läuft bereits auf Port 27018${NC}"
fi

# Prüfen, ob Node.js-Server läuft
NODE_RUNNING=$(lsof -i:5005 | grep LISTEN || echo "")
if [ -n "$NODE_RUNNING" ]; then
    echo -e "${YELLOW}Beende vorherigen Node.js-Server auf Port 5005...${NC}"
    kill $(lsof -t -i:5005) 2>/dev/null || true
    sleep 2
fi

# Umgebungsvariablen setzen
export PORT=5005
export MONGO_URI="mongodb://localhost:27018/securemarket"
export JWT_SECRET="IhrSichererJWTSchluessel_$(date +%s)"

# Server starten
echo -e "${YELLOW}Starte Secure Marketplace Server auf Port 5005...${NC}"
cd $(dirname $0)
node server.js &
SERVER_PID=$!

# Warten bis Server bereit ist
for i in {1..10}; do
    if curl -s -k https://localhost:5005/api/health > /dev/null; then
        echo -e "${GREEN}Server erfolgreich gestartet auf Port 5005${NC}"
        echo -e "${GREEN}Server läuft mit PID: $SERVER_PID${NC}"
        echo -e "${GREEN}Mongodb läuft auf Port 27018${NC}"
        echo -e "${YELLOW}Zugriffsart: https://localhost:5005${NC}"
        exit 0
    fi
    sleep 1
done

echo -e "${RED}Timeout beim Starten des Servers${NC}"
exit 1
