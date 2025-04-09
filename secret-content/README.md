# Projekt-Setup und Installation

Diese Anleitung führt Sie durch die Einrichtung des React-Frontend und Node.js-Backend Projekts.

## Projektstruktur

```
secret-content/
├── client/                # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PasswordView.js
│   │   │   ├── OpenerView.js
│   │   │   ├── DatesView.js
│   │   │   ├── AccordionItem.js
│   │   │   └── Toast.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── data/                  # JSON-Dateien
│   ├── opener.json
│   └── dates.json
├── server.js              # Express Server
└── package.json           # Server-Abhängigkeiten
```

## Installation

### 1. Projekt initialisieren

```bash
# Projekt-Verzeichnis erstellen
mkdir secret-content
cd secret-content

# Server-Abhängigkeiten initialisieren
npm init -y
npm install express cors dotenv
```

### 2. React-Frontend erstellen

```bash
# React-App erstellen
npx create-react-app client
```

### 3. Dateien einrichten

1. Kopieren Sie die bereitgestellten React-Komponenten in die entsprechenden Dateien
2. Kopieren Sie die CSS-Datei in src/App.css
3. Erstellen Sie einen data-Ordner im Hauptverzeichnis und kopieren Sie dort Ihre JSON-Dateien
   hinein
4. Kopieren Sie den Server-Code in server.js im Hauptverzeichnis

### 4. package.json im Hauptverzeichnis anpassen

Fügen Sie folgende Scripts in der server package.json hinzu:

```json
"scripts": {
"start": "node server.js",
"dev": "nodemon server.js",
"client": "cd client && npm start",
"build": "cd client && npm run build",
"install-client": "cd client && npm install",
"heroku-postbuild": "npm run install-client && npm run build"
}
```

### 5. Für Entwicklung starten

```bash
# Terminal 1: Server starten
npm run dev

# Terminal 2: Client starten
npm run client
```

### 6. Für Produktion bauen

```bash
# React-App bauen
npm run build

# Server starten
npm start
```

## Sicherheitshinweise

1. Die Passwörter sind im Backend-Code gespeichert, was sicherer ist als im Frontend.
   Für noch mehr Sicherheit könnten Sie:
    - Umgebungsvariablen für die Passwörter verwenden
    - Eine Datenbank für Benutzerauthentifizierung implementieren
    - HTTPS für die Kommunikation zwischen Frontend und Backend erzwingen

2. Die JSON-Dateien werden erst nach erfolgreicher Passwortprüfung vom Server geladen

3. Im Frontend ist kein Passwort im Code sichtbar