# TechDocs API Dokumentation

## Einführung

TechDocs ist ein Node.js-Framework zur Erstellung und Verwaltung von IT-Dokumentationen und Cheat Sheets. Diese API-Dokumentation beschreibt die verfügbaren Endpunkte, Parameter und Rückgabewerte.

## Basis-URL

```
http://localhost:5007/api
```

## Authentifizierung

Für geschützte Routen ist eine Authentifizierung mittels Bearer-Token erforderlich. Der Token wird bei der Anmeldung generiert und kann in den HTTP-Header eingefügt werden:

```
Authorization: Bearer <token>
```

Alternativ wird der Token auch als Cookie gespeichert.

### Authentifizierungsendpunkte

#### Registrierung

```
POST /auth/register
```

**Request-Body:**
```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "password": "sicheres_passwort",
  "role": "user"  // Optional, Standardwert ist "user"
}
```

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

#### Anmeldung

```
POST /auth/login
```

**Request-Body:**
```json
{
  "email": "max@example.com",
  "password": "sicheres_passwort"
}
```

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

#### Aktueller Benutzer

```
GET /auth/me
```

**Erforderliche Header:** `Authorization: Bearer <token>`

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "role": "user",
    "createdAt": "2023-01-01T12:00:00.000Z"
  }
}
```

#### Abmeldung

```
GET /auth/logout
```

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {}
}
```

## Dokumentation

### Alle Dokumente abrufen

```
GET /docs
```

**Abfrageparameter:**
- `select`: Kommagetrennte Liste von Feldern (z.B. `title,slug,content`)
- `sort`: Kommagetrennte Liste von Feldern (z.B. `-createdAt` für absteigende Sortierung)
- `page`: Seitennummer (Standard: 1)
- `limit`: Anzahl der Einträge pro Seite (Standard: 10)

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "next": {
      "page": 2,
      "limit": 10
    }
  },
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "title": "Git Cheat Sheet",
      "slug": "git-cheat-sheet",
      "content": "# Git Befehle\n\n...",
      "contentType": "markdown",
      "category": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Versionskontrolle",
        "slug": "versionskontrolle"
      },
      "tags": ["git", "vcs"],
      "createdAt": "2023-01-01T12:00:00.000Z",
      "updatedAt": "2023-01-01T12:00:00.000Z"
    },
    // ...
  ]
}
```

### Einzelnes Dokument abrufen

```
GET /docs/:id
```

**Parameter:**
- `id`: Dokument-ID

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "title": "Git Cheat Sheet",
    "slug": "git-cheat-sheet",
    "content": "# Git Befehle\n\n...",
    "contentType": "markdown",
    "category": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Versionskontrolle",
      "slug": "versionskontrolle"
    },
    "tags": ["git", "vcs"],
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  }
}
```

### Dokument per Slug abrufen

```
GET /docs/slug/:slug
```

**Parameter:**
- `slug`: Dokument-Slug

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "title": "Git Cheat Sheet",
    "slug": "git-cheat-sheet",
    "content": "# Git Befehle\n\n...",
    "contentType": "markdown",
    "renderedContent": "<h1>Git Befehle</h1><p>...</p>",
    "category": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Versionskontrolle",
      "slug": "versionskontrolle"
    },
    "tags": ["git", "vcs"],
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  }
}
```

### Neues Dokument erstellen

```
POST /docs
```

**Erforderliche Header:** `Authorization: Bearer <token>`  
**Erforderliche Rolle:** `admin`

**Request-Body:**
```json
{
  "title": "Docker Cheat Sheet",
  "content": "# Docker Befehle\n\n...",
  "contentType": "markdown",
  "category": "60d21b4667d0d8992e610c85",
  "tags": ["docker", "container"],
  "isPublic": true
}
```

**Erfolgreiche Antwort (201):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c86",
    "title": "Docker Cheat Sheet",
    "slug": "docker-cheat-sheet",
    "content": "# Docker Befehle\n\n...",
    "contentType": "markdown",
    "category": "60d21b4667d0d8992e610c85",
    "tags": ["docker", "container"],
    "isPublic": true,
    "createdBy": "60d21b4667d0d8992e610c87",
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  }
}
```

### Dokument aktualisieren

```
PUT /docs/:id
```

**Erforderliche Header:** `Authorization: Bearer <token>`  
**Erforderliche Rolle:** `admin`

**Parameter:**
- `id`: Dokument-ID

**Request-Body:** (nur Felder, die aktualisiert werden sollen)
```json
{
  "title": "Docker-Befehle Referenz",
  "content": "# Docker Befehle\n\n...(aktualisierter Inhalt)"
}
```

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c86",
    "title": "Docker-Befehle Referenz",
    "slug": "docker-befehle-referenz",
    "content": "# Docker Befehle\n\n...(aktualisierter Inhalt)",
    "contentType": "markdown",
    "category": "60d21b4667d0d8992e610c85",
    "tags": ["docker", "container"],
    "isPublic": true,
    "createdBy": "60d21b4667d0d8992e610c87",
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-02T12:00:00.000Z"
  }
}
```

### Dokument löschen

```
DELETE /docs/:id
```

**Erforderliche Header:** `Authorization: Bearer <token>`  
**Erforderliche Rolle:** `admin`

**Parameter:**
- `id`: Dokument-ID

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {}
}
```

### Markdown-Datei importieren

```
POST /docs/import
```

**Erforderliche Header:** `Authorization: Bearer <token>`  
**Erforderliche Rolle:** `admin`

**Content-Type:** `multipart/form-data`

**Formular-Felder:**
- `file`: Markdown-Datei (*.md)
- `category`: Kategorie-ID
- `tags`: Kommagetrennte Liste von Tags (optional)

**Erfolgreiche Antwort (201):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c86",
    "title": "Importiertes Dokument",
    "slug": "importiertes-dokument",
    "content": "# Importierter Inhalt\n\n...",
    "contentType": "markdown",
    "category": "60d21b4667d0d8992e610c85",
    "tags": ["import", "markdown"],
    "createdBy": "60d21b4667d0d8992e610c87",
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  }
}
```

## Kategorien

### Alle Kategorien abrufen

```
GET /categories
```

**Abfrageparameter:**
- `populate`: Falls `true`, werden zugehörige Dokumente zurückgegeben
- `parentOnly`: Falls `true`, werden nur Hauptkategorien zurückgegeben

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Versionskontrolle",
      "slug": "versionskontrolle",
      "description": "Werkzeuge und Techniken zur Versionskontrolle",
      "parentCategory": null,
      "createdAt": "2023-01-01T12:00:00.000Z",
      "documents": [
        {
          "_id": "60d21b4667d0d8992e610c86",
          "title": "Git Cheat Sheet",
          "slug": "git-cheat-sheet",
          "updatedAt": "2023-01-01T12:00:00.000Z"
        }
      ]
    },
    // ...
  ]
}
```

### Einzelne Kategorie abrufen

```
GET /categories/:id
```

**Parameter:**
- `id`: Kategorie-ID

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Versionskontrolle",
    "slug": "versionskontrolle",
    "description": "Werkzeuge und Techniken zur Versionskontrolle",
    "parentCategory": null,
    "createdAt": "2023-01-01T12:00:00.000Z",
    "documents": [
      {
        "_id": "60d21b4667d0d8992e610c86",
        "title": "Git Cheat Sheet",
        "slug": "git-cheat-sheet",
        "updatedAt": "2023-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

### Kategorie per Slug abrufen

```
GET /categories/slug/:slug
```

**Parameter:**
- `slug`: Kategorie-Slug

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Versionskontrolle",
    "slug": "versionskontrolle",
    "description": "Werkzeuge und Techniken zur Versionskontrolle",
    "parentCategory": null,
    "createdAt": "2023-01-01T12:00:00.000Z",
    "documents": [
      {
        "_id": "60d21b4667d0d8992e610c86",
        "title": "Git Cheat Sheet",
        "slug": "git-cheat-sheet",
        "updatedAt": "2023-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

### Neue Kategorie erstellen

```
POST /categories
```

**Erforderliche Header:** `Authorization: Bearer <token>`  
**Erforderliche Rolle:** `admin`

**Request-Body:**
```json
{
  "name": "Datenbanken",
  "description": "Informationen zu verschiedenen Datenbanksystemen",
  "parentCategory": null
}
```

**Erfolgreiche Antwort (201):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "name": "Datenbanken",
    "slug": "datenbanken",
    "description": "Informationen zu verschiedenen Datenbanksystemen",
    "parentCategory": null,
    "createdAt": "2023-01-01T12:00:00.000Z"
  }
}
```

### Kategorie aktualisieren

```
PUT /categories/:id
```

**Erforderliche Header:** `Authorization: Bearer <token>`  
**Erforderliche Rolle:** `admin`

**Parameter:**
- `id`: Kategorie-ID

**Request-Body:** (nur Felder, die aktualisiert werden sollen)
```json
{
  "name": "Datenbankenverwaltung",
  "description": "Aktualisierte Beschreibung"
}
```

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "name": "Datenbankenverwaltung",
    "slug": "datenbankenverwaltung",
    "description": "Aktualisierte Beschreibung",
    "parentCategory": null,
    "createdAt": "2023-01-01T12:00:00.000Z"
  }
}
```

### Kategorie löschen

```
DELETE /categories/:id
```

**Erforderliche Header:** `Authorization: Bearer <token>`  
**Erforderliche Rolle:** `admin`

**Parameter:**
- `id`: Kategorie-ID

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "data": {}
}
```

## Suche

### Dokumente durchsuchen

```
GET /search?q=suchbegriff
```

**Abfrageparameter:**
- `q`: Suchbegriff

**Erfolgreiche Antwort (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c86",
      "title": "Git Cheat Sheet",
      "slug": "git-cheat-sheet",
      "category": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Versionskontrolle",
        "slug": "versionskontrolle"
      },
      "tags": ["git", "vcs"],
      "updatedAt": "2023-01-01T12:00:00.000Z"
    },
    // ...
  ]
}
```

## Fehler-Antworten

Bei Fehlern gibt die API einen entsprechenden HTTP-Statuscode und eine JSON-Antwort mit einem Fehlermessage zurück:

```json
{
  "success": false,
  "message": "Fehlerbeschreibung"
}
```

### Häufige Fehler-Statuscodes

- `400 Bad Request`: Ungültige Eingabedaten
- `401 Unauthorized`: Fehlende oder ungültige Authentifizierung
- `403 Forbidden`: Keine Berechtigung für die angeforderte Aktion
- `404 Not Found`: Ressource nicht gefunden
- `500 Internal Server Error`: Serverfehler

## Beispiele mit cURL

### Anmeldung

```bash
curl -X POST http://localhost:5007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"passwort123"}'
```

### Dokument erstellen (mit Token)

```bash
curl -X POST http://localhost:5007/api/docs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Docker Cheat Sheet",
    "content": "# Docker Befehle\n\n...",
    "contentType": "markdown",
    "category": "60d21b4667d0d8992e610c85",
    "tags": ["docker", "container"]
  }'
```

### Markdown-Datei importieren

```bash
curl -X POST http://localhost:5007/api/docs/import \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..." \
  -F "file=@/pfad/zur/datei.md" \
  -F "category=60d21b4667d0d8992e610c85" \
  -F "tags=import,markdown"
```

### Suche

```bash
curl "http://localhost:5007/api/search?q=docker"
```
