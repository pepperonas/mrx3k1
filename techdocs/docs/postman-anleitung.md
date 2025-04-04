# TechDocs Postman Konfiguration und Anleitung

## Komponenten

1. **TechDocs Postman Collection**
   * Enthält alle API-Anfragen gruppiert nach Kategorien:
      * Auth: Registrierung, Login, Benutzerinfo, Logout
      * Categories: Erstellen, Abrufen, Aktualisieren und Löschen von Kategorien
      * Documents: Erstellen, Abrufen, Aktualisieren und Löschen von Dokumenten
      * Search: Volltextsuche

2. **TechDocs Postman Environment**
   * Enthält Umgebungsvariablen wie:
      * baseUrl: http://localhost:5007
      * authToken: Wird beim Login automatisch gesetzt
      * categoryId: Wird beim Erstellen einer Kategorie automatisch gesetzt
      * documentId: Wird beim Erstellen eines Dokuments automatisch gesetzt

3. **Postman Test Scripts**
   * Automatisierte Tests für die Anfragen, die auch Variablen setzen

4. **Demo-Markdown-Datei**
   * Eine Beispiel-Markdown-Datei "Docker-Befehle.md" zum Importieren in das System

## Verwendung in Postman

1. **Importiere beide JSON-Dateien (Collection und Environment) in Postman:**
   * Klicke auf "Import" in Postman
   * Füge den JSON-Code ein oder importiere die gespeicherten Dateien

2. **Wähle die "TechDocs Environment" aus der Umgebungsauswahl in Postman**

3. **Verwende die Collection in dieser Reihenfolge:**
   * Registriere den Benutzer "Martin Pfeffer" mit "Register"
   * Melde dich mit "Login" an (speichert automatisch den Token)
   * Erstelle eine Kategorie mit "Create Category" (speichert die Kategorie-ID)
   * Erstelle ein Dokument mit "Create Document" (speichert die Dokument-ID)
   * Teste die weiteren Endpunkte wie Suche, Aktualisierung usw.

4. **Für den Import der Markdown-Datei:**
   * Speichere die bereitgestellte "Docker-Befehle.md" auf deinem Computer
   * Wähle die Datei im "Import Markdown File" Request aus

Die Test-Scripts überprüfen automatisch die Antworten und setzen die benötigten Variablen, sodass aufeinanderfolgende Requests korrekt funktionieren.
