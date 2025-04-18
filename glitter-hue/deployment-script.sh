#!/bin/bash
# deployment-glitterhue.sh - Deployment-Skript für GlitterHue App
# Ausführen als: sudo ./deployment-glitterhue.sh

# Farben für Terminal-Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}GlitterHue - Deployment-Script${NC}"
echo "==============================="

# Überprüfe, ob das Skript als root ausgeführt wird
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Bitte führe das Skript als root aus: sudo $0${NC}"
  exit 1
fi

# 1. Verzeichnisstruktur vorbereiten
echo -e "\n${YELLOW}1. Verzeichnisstruktur vorbereiten...${NC}"

# Erstelle Hauptverzeichnis
mkdir -p /var/www/html/glitter-hue/{build,proxy}
chown -R www-data:www-data /var/www/html/glitter-hue

echo -e "${GREEN}✓ Verzeichnisse erstellt${NC}"

# 2. Proxy-Server installieren
echo -e "\n${YELLOW}2. Proxy-Server installieren...${NC}"

# Kopieren der package.json und hue-proxy.js Dateien
cp ./proxy/package.json ./proxy/hue-proxy.js /var/www/html/glitter-hue/proxy/

# In das Proxy-Verzeichnis wechseln und Abhängigkeiten installieren
cd /var/www/html/glitter-hue/proxy
npm install --production

# Berechtigung setzen
chown -R www-data:www-data /var/www/html/glitter-hue/proxy

echo -e "${GREEN}✓ Proxy-Server installiert${NC}"

# 3. systemd-Service installieren
echo -e "\n${YELLOW}3. systemd-Service installieren...${NC}"

# Service-Datei erstellen
cat > /etc/systemd/system/hue-proxy.service << 'EOL'
[Unit]
Description=Hue Proxy Server für GlitterHue
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/glitter-hue/proxy
ExecStart=/usr/bin/node /var/www/html/glitter-hue/proxy/hue-proxy.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOL

# Service aktivieren und starten
systemctl daemon-reload
systemctl enable hue-proxy.service
systemctl start hue-proxy.service

# Status prüfen
if systemctl is-active --quiet hue-proxy.service; then
  echo -e "${GREEN}✓ Proxy-Service erfolgreich gestartet${NC}"
else
  echo -e "${RED}✗ Proxy-Service konnte nicht gestartet werden. Überprüfe mit: systemctl status hue-proxy.service${NC}"
fi

# 4. React-App installieren
echo -e "\n${YELLOW}4. React-App installieren...${NC}"

# Wenn ein build-Verzeichnis im aktuellen Ordner vorhanden ist, kopiere es
if [ -d "./build" ]; then
  cp -r ./build/* /var/www/html/glitter-hue/build/
  echo -e "${GREEN}✓ Build-Dateien kopiert${NC}"
else
  echo -e "${YELLOW}Kein lokales Build-Verzeichnis gefunden.${NC}"
  echo -e "Bitte führe 'npm run build' auf deinem Entwicklungsrechner aus und kopiere den build-Ordner auf den Server."
fi

# 5. Nginx konfigurieren
echo -e "\n${YELLOW}5. Nginx-Konfiguration überprüfen...${NC}"

# Prüfen, ob der Location-Block bereits existiert
if grep -q "/glitter-hue" /etc/nginx/sites-available/default; then
  echo -e "${YELLOW}Location-Block für /glitter-hue bereits vorhanden. Bitte überprüfe die Konfiguration.${NC}"
else
  # Location-Block hinzufügen
  echo "Füge Location-Block zu Nginx-Konfiguration hinzu..."
  
  # Backup erstellen
  cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
  
  # Neue Konfiguration einfügen vor der schließenden Klammer des server-Blocks
  sed -i '/server_name mrx3k1.de/,/}/ s/.*}/# GlitterHue SPA und API\nlocation \/glitter-hue {\n    alias \/var\/www\/html\/glitter-hue\/build\/;\n    try_files \$uri \$uri\/ \/glitter-hue\/index.html;\n    \n    # Verhindert Caching von index.html um App-Updates sofort zu sehen\n    add_header Cache-Control "no-store, no-cache, must-revalidate";\n}\n\n# Proxy für die Hue API\nlocation \/glitter-hue\/hue\/ {\n    proxy_pass http:\/\/localhost:8080\/hue\/;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade \$http_upgrade;\n    proxy_set_header Connection '\''upgrade'\'';\n    proxy_set_header Host \$host;\n    proxy_set_header X-Real-IP \$remote_addr;\n    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto \$scheme;\n    proxy_cache_bypass \$http_upgrade;\n    \n    # Aktiviere Debug-Logging\n    access_log \/var\/log\/nginx\/glitterhue-proxy-access.log;\n    error_log \/var\/log\/nginx\/glitterhue-proxy-error.log debug;\n    \n    # Timeouts anpassen\n    proxy_connect_timeout 60s;\n    proxy_send_timeout 60s;\n    proxy_read_timeout 60s;\n}\n&/' /etc/nginx/sites-available/default
fi

# Nginx-Konfiguration testen
nginx -t
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Nginx-Konfiguration ist gültig${NC}"
  # Nginx neu starten
  systemctl reload nginx
  echo -e "${GREEN}✓ Nginx neu geladen${NC}"
else
  echo -e "${RED}✗ Nginx-Konfiguration ist ungültig. Bitte überprüfe die Konfiguration.${NC}"
  # Original-Konfiguration wiederherstellen
  if [ -f "/etc/nginx/sites-available/default.bak" ]; then
    mv /etc/nginx/sites-available/default.bak /etc/nginx/sites-available/default
    echo -e "${YELLOW}Original-Konfiguration wiederhergestellt.${NC}"
  fi
fi

# 6. Abschluss
echo -e "\n${GREEN}=============================${NC}"
echo -e "${GREEN}GlitterHue-Deployment abgeschlossen!${NC}"
echo -e "${BLUE}Die App ist nun unter https://mrx3k1.de/glitter-hue verfügbar.${NC}"
echo -e "\nBei Problemen überprüfe folgende Logs:"
echo -e "- Nginx: /var/log/nginx/error.log"
echo -e "- Proxy: /var/log/nginx/glitterhue-proxy-error.log"
echo -e "- Proxy-Service: journalctl -u hue-proxy.service -f"
echo -e "${GREEN}=============================${NC}"