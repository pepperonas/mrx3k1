# GlitterHue

Eine moderne, mobiloptimierte Web-App zur Steuerung von Philips Hue-Lampen mit Musik-Visualisierung und Disco-Modus.

![GlitterHue Logo](public/logo192.png)

## Features

- **Intuitive Steuerung**: Ein-/Ausschalten, Helligkeit und Farbwahl für alle Hue-Lampen
- **Disco-Modus**: Synchronisiere deine Lampen mit der Musik in Echtzeit
- **Musikvisualisierung**: Sieh die Klangwellen direkt in der App
- **Anpassbare Effekte**:
   - Fokus auf Bass, Mitteltöne, Höhen oder Gesang
   - Einstellbare Intensität und Geschwindigkeit
   - Verschiedene Farbschemata (Regenbogen, Warm, Kühl, Einfarbig)
- **Mobile-First Design**: Optimiert für Smartphones und Tablets
- **Automatische Bridge-Erkennung**: Findet deine Hue Bridge automatisch im Netzwerk
- **Speicherbare Einstellungen**: Alle Einstellungen werden für die nächste Sitzung gespeichert

## Voraussetzungen

- Node.js (Version 16+)
- Python 3.6+ (für den CORS-Proxy)
- Eine Philips Hue Bridge im lokalen Netzwerk
- Philips Hue-Lampen (für vollständige Farberlebnisse empfehlen wir Color-Modelle)
- Ein Gerät mit Mikrofon für den Disco-Modus

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/yourusername/glitterhue.git
cd glitterhue
```

### 2. Abhängigkeiten installieren

```bash
# Node.js Abhängigkeiten
npm install

# Python Abhängigkeiten (falls noch nicht installiert)
pip install http.server urllib3
```

### 3. Konfiguration

Die App speichert alle Einstellungen automatisch im localStorage des Browsers. Eine separate Konfigurationsdatei ist nicht erforderlich.

## Verwendung

### Starten der Anwendung

1. **Starte den Python-Proxy** (erforderlich für CORS-Unterstützung):

```bash
python3 hue-proxy.py
```

2. **Starte die React-App**:

```bash
npm start
```

3. **Öffne die App** im Browser: [http://localhost:3000](http://localhost:3000)

### Verbindung mit der Hue Bridge

1. Klicke auf "Bridge finden" oder gib die IP-Adresse deiner Hue Bridge manuell ein
2. Drücke den physischen Link-Button auf deiner Hue Bridge
3. Klicke in der App auf "Neuen Benutzer erstellen"
4. Warte, bis die Verbindung hergestellt ist

### Verwendung des Disco-Modus

1. Wechsle zum "Disco Light" Tab
2. Konfiguriere deine Vorlieben:
   - Wähle den **Fokus** (Bass, Mitteltöne, Höhen, Gesang oder ausgewogen)
   - Stelle **Intensität** und **Geschwindigkeit** ein
   - Wähle ein **Farbschema**
   - Wähle die **Lampen** aus, die im Disco-Modus gesteuert werden sollen
3. Aktiviere den Disco-Modus mit dem Schalter
4. Erlaube den Mikrofonzugriff, wenn dein Browser danach fragt
5. Spiele Musik in der Nähe deines Geräts ab

## Wie es funktioniert

GlitterHue nutzt die Web Audio API, um Musik über dein Mikrofon zu analysieren. Die App analysiert verschiedene Frequenzbereiche:

- **Bass**: 20-250 Hz
- **Mitteltöne**: 250-2000 Hz
- **Höhen**: 2000-20000 Hz
- **Gesang**: 300-3400 Hz (überschneidet sich mit Mitteltönen)

Basierend auf deinen Einstellungen werden diese Audiodaten in Echtzeit analysiert und in entsprechende Farbänderungen und Helligkeitswerte für deine Hue-Lampen umgewandelt.

## Fehlerbehebung

- **Die Bridge wird nicht gefunden**: Gib die IP-Adresse manuell ein oder stelle sicher, dass sich dein Gerät im selben Netzwerk befindet
- **CORS-Fehler**: Stelle sicher, dass der Python-Proxy läuft
- **Kein Mikrofonzugriff**: Überprüfe die Berechtigungen in deinem Browser
- **Keine Reaktion auf Musik**: Passe die Intensität an oder stelle sicher, dass die Musik laut genug ist

## CORS-Proxy erklären

Die Philips Hue Bridge sendet keine CORS-Header, was direkten Zugriff vom Browser verhindert. Unser Python-Proxy löst dieses Problem durch:

1. Weiterleitung aller API-Anfragen an die Hue Bridge
2. Hinzufügen der erforderlichen CORS-Header zu den Antworten
3. Bereitstellung einer lokalen Discovery-Funktion

## Technologie-Stack

- **Frontend**: React.js 19+
- **Styling**: CSS mit Variables für Theming
- **Audio-Analyse**: Web Audio API
- **Proxy-Server**: Python 3.6+ mit http.server
- **API-Kommunikation**: Fetch API

## Datenschutz

GlitterHue verarbeitet alle Daten lokal:
- Audiodaten werden nur für die Analyse verwendet und niemals gespeichert oder übertragen
- Verbindungsdaten werden nur lokal im Browser gespeichert
- Der Python-Proxy kommuniziert nur mit deiner Hue Bridge im lokalen Netzwerk

## Lizenz

MIT

## Danksagung

- Philips Hue API-Dokumentation
- React.js Team
- Web Audio API-Entwickler

## Mitwirken

Beiträge sind willkommen! Erstelle einfach einen Pull Request oder öffne ein Issue, um Verbesserungsvorschläge einzubringen.