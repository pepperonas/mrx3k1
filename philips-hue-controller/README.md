# Philips Hue Controller (Verbesserte Version)

Eine React-App zur Steuerung von Philips Hue-Lampen, die robuster und zuverlässiger funktioniert.

## Das Problem und die Lösung

Die ursprüngliche App hatte Probleme bei der Verbindung mit der Philips Hue Bridge aufgrund von CORS-Einschränkungen im Browser.
Diese verbesserte Version löst das Problem mit:

1. Einem speziellen Python-Proxy, der alle API-Anfragen an die Hue Bridge weiterleitet
2. Einem verbesserten Verbindungsprozess, der dem erfolgreichen Python-Skript ähnelt
3. Automatischen Wiederholungsversuchen für eine zuverlässigere Verbindung

## Features

- Automatische Bridge-Suche im lokalen Netzwerk
- Zuverlässiger Benutzer-Erstellungsprozess mit Fortschrittsanzeige
- Ein-/Ausschalten, Helligkeit und Farbsteuerung für alle Lampen
- CORS-Problem-Lösung durch Python-Proxy
- Verbesserte Fehlerbehandlung und Statusmeldungen

## Installation und Start

### 1. Python-Proxy installieren (erforderlich)

```bash
# Python 3.6+ muss installiert sein
cd hue-controller-improved
pip install http.server urllib3    # Falls nicht bereits installiert
```

### 2. Python-Proxy starten

```bash
python3 hue-proxy.py
```

Der Proxy läuft standardmäßig auf Port 8080 und bietet die Endpunkte:
- `http://localhost:8080/hue/{bridge-ip}/api/...` (für alle API-Anfragen)

### 3. React-App starten

In einem neuen Terminal:

```bash
cd hue-controller-improved
npm install
npm start
```

## Verwendung

1. Starte den Python-Proxy in einem Terminal
2. Starte die React-App in einem anderen Terminal
3. Im Browser:
    - Klicke auf "Bridge finden" oder gib die IP-Adresse deiner Hue Bridge ein
    - Drücke den physischen Link-Button auf deiner Hue Bridge
    - Klicke auf "Neuen Benutzer erstellen" und warte, bis der Prozess abgeschlossen ist
    - Die App verbindet sich automatisch mit der Bridge

## Technische Details

### Wie funktioniert der Python-Proxy?

Der Proxy löst das CORS-Problem, indem er als Vermittler zwischen deinem Browser und der Hue Bridge fungiert:

1. Die React-App sendet Anfragen an `http://localhost:8080/hue/{bridge-ip}/api/...`
2. Der Python-Proxy leitet diese Anfragen an `http://{bridge-ip}/api/...` weiter
3. Der Proxy erhält die Antwort von der Hue Bridge und sendet sie mit den erforderlichen CORS-Headern zurück an den Browser

### Verbindungsprozess

Der verbesserte Verbindungsprozess funktioniert ähnlich wie das Python-Skript:

1. Der Benutzer drückt den Link-Button auf der Hue Bridge
2. Die App sendet automatisch bis zu 5 Verbindungsversuche
3. Bei Erfolg wird der generierte API-Schlüssel gespeichert und die App verbindet sich sofort

### Fehlerbehandlung

Die App behandelt verschiedene Fehlerszenarien:

- Wenn die Bridge nicht gefunden werden kann
- Wenn der Link-Button nicht gedrückt wurde
- Wenn der Proxy nicht erreichbar ist
- Wenn die Bridge auf Anfragen nicht reagiert

## Fehlerbehebung

- **Der Proxy startet nicht**: Stelle sicher, dass Python 3.6+ installiert ist
- **Die App kann nicht auf den Proxy zugreifen**: Prüfe, ob der Proxy auf Port 8080 läuft
- **Die Bridge wird nicht gefunden**: Gib die IP-Adresse manuell ein
- **Die Verbindung schlägt fehl**: Drücke den Link-Button erneut und versuche es noch einmal

## Häufig gestellte Fragen

**F: Warum wird ein Python-Proxy benötigt?**
A: Die Philips Hue Bridge sendet keine CORS-Header, was direkten Zugriff vom Browser verhindert.

**F: Kann ich die App ohne Proxy verwenden?**
A: Nur wenn du einen Browser mit deaktivierten Sicherheitseinstellungen startest, was nicht empfohlen wird.

**F: Ist die Verbindung sicher?**
A: Ja, der Proxy läuft nur lokal auf deinem Computer und leitet Anfragen unverändert weiter.

**F: Funktioniert die App mit allen Hue Bridge Versionen?**
A: Die App wurde mit den aktuellen Hue Bridge Versionen getestet. Bei älteren Versionen könnte es zu Problemen kommen.