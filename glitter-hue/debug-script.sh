#!/bin/bash
# debug-glitterhue.sh - Diagnose-Tool für GlitterHue App
# Ausführen als: sudo ./debug-glitterhue.sh

# Farben für Terminal-Ausgabe
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}GlitterHue - Diagnose-Tool${NC}"
echo "=========================="

# Überprüfe, ob das Skript als root ausgeführt wird
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Hinweis: Einige Überprüfungen benötigen root-Rechte${NC}"
fi

# 1. Verzeichnisstruktur überprüfen
echo -e "\n${BLUE}1. Überprüfe Verzeichnisstruktur...${NC}"

if [ -d "/var/www/html/glitter-hue" ]; then
  echo -e "${GREEN}✓ Hauptverzeichnis existiert${NC}"
  
  # Unterverzeichnisse prüfen
  if [ -d "/var/www/html/glitter-hue/build" ]; then
    echo -e "${GREEN}✓ Build-Verzeichnis existiert${NC}"
    
    # Prüfe, ob index.html vorhanden ist
    if [ -f "/var/www/html/glitter-hue/build/index.html" ]; then
      echo -e "${GREEN}✓ index.html vorhanden${NC}"
    else
      echo -e "${RED}✗ index.html fehlt!${NC}"
    fi
    
    # Prüfe Berechtigungen
    OWNER=$(stat -c '%U:%G' /var/www/html/glitter-hue/build)
    if [ "$OWNER" = "www-data:www-data" ]; then
      echo -e "${GREEN}✓ Berechtigungen korrekt: $OWNER${NC}"
    else
      echo -e "${RED}✗ Falsche Berechtigungen: $OWNER (sollte www-data:www-data sein)${NC}"
    fi
  else
    echo -e "${RED}✗ Build-Verzeichnis fehlt!${NC}"
  fi
  
  if [ -d "/var/www/html/glitter-hue/proxy" ]; then
    echo -e "${GREEN}✓ Proxy-Verzeichnis existiert${NC}"
    
    # Prüfe, ob hue-proxy.js vorhanden ist
    if [ -f "/var/www/html/glitter-hue/proxy/hue-proxy.js" ]; then
      echo -e "${GREEN}✓ hue-proxy.js vorhanden${NC}"
    else
      echo -e "${RED}✗ hue-proxy.js fehlt!${NC}"
    fi
    
    # Prüfe Berechtigungen
    OWNER=$(stat -c '%U:%G' /var/www/html/glitter-hue/proxy)
    if [ "$OWNER" = "www-data:www-data" ]; then
      echo -e "${GREEN}✓ Berechtigungen korrekt: $OWNER${NC}"
    else
      echo -e "${RED}✗ Falsche Berechtigungen: $OWNER (sollte www-data:www-data sein)${NC}"
    fi
  else
    echo -e "${RED}✗ Proxy-Verzeichnis fehlt!${NC}"
  fi
else
  echo -e "${RED}✗ Hauptverzeichnis fehlt!${NC}"
fi

# 2. Proxy-Service überprüfen
echo -e "\n${BLUE}2. Überprüfe Proxy-Service...${NC}"

if systemctl list-unit-files | grep -q "hue-proxy.service"; then
  echo -e "${GREEN}✓ Service ist installiert${NC}"
  
  # Prüfe, ob der Service aktiv ist
  if systemctl is-active --quiet hue-proxy.service; then
    echo -e "${GREEN}✓ Service läuft${NC}"
  else
    echo -e "${RED}✗ Service ist nicht aktiv!${NC}"
    echo -e "${YELLOW}Status-Details:${NC}"
    systemctl status hue-proxy.service --no-pager | head -n 15
  fi
  
  # Prüfe, ob der Port geöffnet ist
  if command -v netstat &> /dev/null; then
    if netstat -tulpn | grep -q ":8080"; then
      echo -e "${GREEN}✓ Port 8080 ist geöffnet${NC}"
    else
      echo -e "${RED}✗ Port 8080 ist nicht geöffnet!${NC}"
    fi
  elif command -v ss &> /dev/null; then
    if ss -tulpn | grep -q ":8080"; then
      echo -e "${GREEN}✓ Port 8080 ist geöffnet${NC}"
    else
      echo -e "${RED}✗ Port 8080 ist nicht geöffnet!${NC}"
    fi
  else
    echo -e "${YELLOW}? Kann Port-Status nicht überprüfen (netstat/ss nicht verfügbar)${NC}"
  fi
else
  echo -e "${RED}✗ Service ist nicht installiert!${NC}"
fi

# 3. Nginx-Konfiguration überprüfen
echo -e "\n${BLUE}3. Überprüfe Nginx-Konfiguration...${NC}"

if [ -f "/etc/nginx/sites-available/default" ]; then
  echo -e "${GREEN}✓ Nginx-Konfigurationsdatei existiert${NC}"
  
  # Prüfe, ob Location-Block für GlitterHue vorhanden ist
  if grep -q "/glitter-hue" /etc/nginx/sites-available/default; then
    echo -e "${GREEN}✓ Location-Block für GlitterHue gefunden${NC}"
  else
    echo -e "${RED}✗ Location-Block für GlitterHue fehlt!${NC}"
  fi
  
  # Prüfe, ob Proxy-Location-Block vorhanden ist
  if grep -q "/glitter-hue/hue/" /etc/nginx/sites-available/default; then
    echo -e "${GREEN}✓ Proxy-Location-Block gefunden${NC}"
  else
    echo -e "${RED}✗ Proxy-Location-Block fehlt!${NC}"
  fi
  
  # Prüfe Nginx-Konfiguration
  echo -e "${YELLOW}Überprüfe Nginx-Syntax...${NC}"
  if nginx -t &> /tmp/nginx_test.log; then
    echo -e "${GREEN}✓ Nginx-Syntax ist gültig${NC}"
  else
    echo -e "${RED}✗ Nginx-Syntax ist ungültig!${NC}"
    cat /tmp/nginx_test.log
  fi
  
  # Prüfe Nginx-Service
  if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx-Service läuft${NC}"
  else
    echo -e "${RED}✗ Nginx-Service ist nicht aktiv!${NC}"
  fi
else
  echo -e "${RED}✗ Nginx-Konfigurationsdatei fehlt!${NC}"
fi

# 4. Verbindungstest
echo -e "\n${BLUE}4. Führe Verbindungstests durch...${NC}"

# Test der Web-App
echo -e "${YELLOW}Teste Zugriff auf die Web-App...${NC}"
if curl -s -I http://localhost/glitter-hue/ | grep -q "200 OK"; then
  echo -e "${GREEN}✓ Web-App ist über localhost erreichbar${NC}"
else
  echo -e "${RED}✗ Web-App ist nicht über localhost erreichbar!${NC}"
fi

# Test des Proxy-Servers
echo -e "${YELLOW}Teste Zugriff auf den Proxy-Server...${NC}"
if curl -s -I http://localhost:8080/hue/discovery 2>/dev/null | grep -q "200 OK"; then
  echo -e "${GREEN}✓ Proxy-Server ist direkt erreichbar${NC}"
else
  echo -e "${RED}✗ Proxy-Server ist nicht direkt erreichbar!${NC}"
fi

# Test der Proxy-Weiterleitung
echo -e "${YELLOW}Teste Proxy-Weiterleitung über Nginx...${NC}"
if curl -s -I http://localhost/glitter-hue/hue/discovery 2>/dev/null | grep -q "200 OK"; then
  echo -e "${GREEN}✓ Proxy-Weiterleitung funktioniert${NC}"
else
  echo -e "${RED}✗ Proxy-Weiterleitung funktioniert nicht!${NC}"
fi

# 5. Logs überprüfen
echo -e "\n${BLUE}5. Überprüfe Logs...${NC}"

# Nginx-Fehlerlog
echo -e "${YELLOW}Die letzten 10 Zeilen aus dem Nginx-Fehlerlog:${NC}"
if [ -f "/var/log/nginx/error.log" ]; then
  tail -n 10 /var/log/nginx/error.log
else
  echo -e "${RED}✗ Nginx-Fehlerlog nicht gefunden!${NC}"
fi

# GlitterHue-Proxy-Log
echo -e "\n${YELLOW}Die letzten 10 Zeilen aus dem GlitterHue-Proxy-Log:${NC}"
if [ -f "/var/log/nginx/glitterhue-proxy-error.log" ]; then
  tail -n 10 /var/log/nginx/glitterhue-proxy-error.log
else
  echo -e "${YELLOW}GlitterHue-Proxy-Log nicht gefunden - möglicherweise noch nicht angelegt${NC}"
fi

# Service-Logs
echo -e "\n${YELLOW}Die letzten 10 Zeilen aus den Service-Logs:${NC}"
if command -v journalctl &> /dev/null; then
  journalctl -u hue-proxy.service --no-pager | tail -n 10
else
  echo -e "${RED}✗ journalctl nicht verfügbar!${NC}"
fi

# 6. Zusammenfassung und Empfehlungen
echo -e "\n${BLUE}6. Zusammenfassung und Empfehlungen${NC}"
echo -e "===================================="
echo -e "${YELLOW}Häufige Probleme und Lösungen:${NC}"
echo -e "1. Falsche Berechtigungen: sudo chown -R www-data:www-data /var/www/html/glitter-hue"
echo -e "2. Proxy-Service startet nicht: sudo journalctl -u hue-proxy.service -f"
echo -e "3. Nginx-Routing-Probleme: sudo nginx -t"
echo -e "4. CORS-Fehler: Überprüfe, ob der Proxy korrekt läuft"
echo -e "5. Proxy kann Bridge nicht finden: Stelle sicher, dass die Bridge und der Server im selben Netzwerk sind"
echo -e "\n${GREEN}Diagnose abgeschlossen!${NC}"