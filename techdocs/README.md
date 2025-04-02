# TechDocs

Ein Node.js-Framework für IT-Dokumentation und Cheat Sheets.

## Funktionen

- Markdown-basierte Dokumentationen und Cheat Sheets
- Kategorisierung und Tagging von Inhalten
- Volltextsuche
- Responsive Benutzeroberfläche
- Benutzerauthentifizierung und Rollenbasierte Zugriffskontrolle
- API-Endpunkte für alle Funktionen

## Installation

1. Repository klonen
   ```
   git clone https://github.com/yourusername/techdocs.git
   cd techdocs
   ```

2. Abhängigkeiten installieren
   ```
   npm install
   ```

3. Umgebungsvariablen konfigurieren
   ```
   cp .env.example .env
   ```
   Anschließend die Werte in der .env-Datei anpassen.

4. Datenbank starten
   Stellen Sie sicher, dass MongoDB auf Ihrem System läuft.

5. Server starten
   ```
   npm run dev
   ```

6. Öffnen Sie http://localhost:5000 in Ihrem Browser

## Verzeichnisstruktur

- server/ - Backend-Code
  - server.js - Hauptserver-Datei
  - routes/ - API-Routen
  - controllers/ - Controller-Logik
  - models/ - Datenbankmodelle
  - middleware/ - Middlewares
- client/ - Frontend-Code
  - public/ - Statische Dateien
  - src/ - React-Frontend
  - components/ - UI-Komponenten
  - styles/ - CSS/SCSS-Dateien
- content/ - Dokumentationsdateien (Markdown)

## API-Dokumentation

### Authentifizierung

- POST /api/auth/register - Neuen Benutzer registrieren
- POST /api/auth/login - Benutzer anmelden
- GET /api/auth/me - Aktuellen Benutzer abrufen
- GET /api/auth/logout - Benutzer abmelden

### Dokumente

- GET /api/docs - Alle Dokumente abrufen
- GET /api/docs/:id - Einzelnes Dokument abrufen
- GET /api/docs/slug/:slug - Dokument per Slug abrufen
- POST /api/docs - Neues Dokument erstellen
- PUT /api/docs/:id - Dokument aktualisieren
- DELETE /api/docs/:id - Dokument löschen
- POST /api/docs/import - Markdown-Datei importieren

### Kategorien

- GET /api/categories - Alle Kategorien abrufen
- GET /api/categories/:id - Einzelne Kategorie abrufen
- GET /api/categories/slug/:slug - Kategorie per Slug abrufen
- POST /api/categories - Neue Kategorie erstellen
- PUT /api/categories/:id - Kategorie aktualisieren
- DELETE /api/categories/:id - Kategorie löschen

### Suche

- GET /api/search?q=suchbegriff - Dokumente durchsuchen

## Lizenz

MIT
