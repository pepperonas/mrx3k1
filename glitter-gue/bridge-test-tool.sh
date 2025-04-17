#!/bin/bash

# Dieses Skript testet die Verbindung zu einer Hue Bridge und prüft ihren Status

echo "Hue Bridge Test-Tool"
echo "===================="

# Frage nach der IP-Adresse
read -p "Gib die IP-Adresse deiner Hue Bridge ein: " BRIDGE_IP

echo -e "\nTeste Verbindung zur Bridge auf $BRIDGE_IP..."

# Ping-Test
ping -c 1 $BRIDGE_IP > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ FEHLER: Kann die Bridge nicht erreichen. Überprüfe die IP-Adresse und Netzwerkverbindung."
  exit 1
else
  echo "✅ Ping erfolgreich: Bridge ist erreichbar"
fi

# API-Verfügbarkeitstest
echo -e "\nTeste API-Verfügbarkeit..."
curl -s "http://$BRIDGE_IP/api/config" -o /dev/null
if [ $? -ne 0 ]; then
  echo "❌ FEHLER: Kann nicht auf die Bridge-API zugreifen."
  exit 1
else
  echo "✅ API-Test erfolgreich: Bridge-API antwortet"
fi

# Hole Informationen über die Bridge
echo -e "\nHole Bridge-Informationen..."
BRIDGE_INFO=$(curl -s "http://$BRIDGE_IP/api/config")

# Extrahiere Name, MAC-Adresse und Firmware-Version
NAME=$(echo $BRIDGE_INFO | grep -o '"name":"[^"]*"' | cut -d':' -f2 | tr -d '"')
MAC=$(echo $BRIDGE_INFO | grep -o '"mac":"[^"]*"' | cut -d':' -f2 | tr -d '"')
SW_VERSION=$(echo $BRIDGE_INFO | grep -o '"swversion":"[^"]*"' | cut -d':' -f2 | tr -d '"')

echo -e "\nBridge-Details:"
echo "  Name:             $NAME"
echo "  MAC-Adresse:      $MAC"
echo "  Firmware-Version: $SW_VERSION"

echo -e "\nBridge-Zustand:"
echo "  Um den Zustand der LEDs zu prüfen, schau auf deine Bridge:"
echo "  - Power LED (links): Sollte konstant leuchten"
echo "  - Netzwerk LED (mitte): Sollte konstant leuchten"
echo "  - Internet LED (rechts): Sollte konstant leuchten, wenn die Bridge Internet hat"
echo -e "\nDer Link-Button sollte beim Drücken das mittlere Symbol kurz aufleuchten lassen."

# Versuche, bekannte User zu finden
echo -e "\nSuche nach vorhandenen API-Verbindungen..."
curl -s -X GET "http://$BRIDGE_IP/api" | grep -o "unauthorized user" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Bridge erwartet Benutzerregistrierung - Link-Button sollte funktionieren"
else
  echo "⚠️ Ungewöhnliche Bridge-Antwort. Eventuell Firmware-Problem."
fi

echo -e "\nFehlersuche-Tipps:"
echo "1. Starte die Bridge neu (Stromkabel für 10 Sekunden entfernen)"
echo "2. Überprüfe die Bridge-Firmware auf Updates (in der Hue App)"
echo "3. Falls möglich, setze die Bridge auf Werkseinstellungen zurück"
echo "   (Halte den Link-Button 10 Sekunden lang gedrückt bis alle LEDs blinken)"