# CryptoVault

Eine moderne React-Anwendung zur sicheren Verschlüsselung und Entschlüsselung von Daten mit verschiedenen Algorithmen.

## Funktionen

- **AES-Verschlüsselung** mit IV (Initialization Vector) für hohe Sicherheit
- **RSA-Verschlüsselung** mit asymmetrischem Schlüsselpaar (public/private)
- **Caesar-Chiffre** als einfaches Beispiel für Verschiebungsverschlüsselung
- Sicheres Speichern von Schlüsseln im Browser
- Modernes UI mit Dark Mode

## Installation

1. Repository klonen oder Dateien herunterladen
2. Abhängigkeiten installieren:

```bash
npm install
```

3. Entwicklungsserver starten:

```bash
npm start
```

Die Anwendung öffnet sich automatisch im Browser unter [http://localhost:3000](http://localhost:3000).

## Algorithmen

### AES (Advanced Encryption Standard)

AES ist ein symmetrischer Verschlüsselungsalgorithmus, der den früheren Standard DES ersetzt hat. Die Implementierung verwendet:

- AES-GCM-Modus mit Initialization Vector (IV)
- Unterstützung für 128, 192 und 256 Bit Schlüssellängen
- Automatische Schlüsselgenerierung
- Lokale Speicherung von Schlüsseln

### RSA (Rivest–Shamir–Adleman)

RSA ist ein asymmetrisches Kryptosystem, das mit zwei Schlüsseln arbeitet:

- Ein öffentlicher Schlüssel für die Verschlüsselung
- Ein privater Schlüssel für die Entschlüsselung
- Unterstützung für 1024, 2048 und 4096 Bit Schlüssellängen
- Export von Schlüsseln im PEM-Format

### Caesar-Verschlüsselung

Die Caesar-Verschlüsselung ist eine der ältesten und einfachsten Verschlüsselungstechniken:

- Verschiebung von Buchstaben im Alphabet um einen bestimmten Wert
- Brute-Force-Funktion zum Anzeigen aller möglichen Entschlüsselungen
- Hauptsächlich zu Demonstrationszwecken

## Sicherheit

Die Anwendung verwendet die Web Crypto API für kryptografische Operationen und speichert Schlüssel nur lokal im Browser (localStorage). Der private RSA-Schlüssel wird niemals übertragen und kann als Datei exportiert werden.

## Technologien

- React.js
- Tailwind CSS
- Web Crypto API
- localStorage für die Schlüsselverwaltung
