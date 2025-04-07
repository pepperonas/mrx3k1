# Dokumentation: Neue Beiträge im IT-Blog-Framework integrieren

Diese Anleitung beschreibt den Prozess, wie du neue Blogbeiträge in deinem IT-Blog-Framework
erstellst und integrierst.

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Dateisystem und Struktur](#dateisystem-und-struktur)
3. [Methode 1: Manuelles Erstellen eines Beitrags](#methode-1-manuelles-erstellen-eines-beitrags)
4. [Methode 2: Verwendung des Hilfsskripts](#methode-2-verwendung-des-hilfsskripts)
5. [Methode 3: KI-generierte Beiträge](#methode-3-ki-generierte-beiträge)
6. [Beiträge auf dem Server aktualisieren](#beiträge-auf-dem-server-aktualisieren)
7. [Fehlersuche und häufige Probleme](#fehlersuche-und-häufige-probleme)

## Voraussetzungen

- Zugriff auf dein Blog-Framework (lokal oder auf dem VPS)
- Grundkenntnisse in Markdown
- Optional: Node.js für die lokale Entwicklung

## Dateisystem und Struktur

Dein Blog-Framework verwendet folgende Struktur für Beiträge:

```
/blog-framework
  /posts
    /ai             # Kategorie "AI"
      beitrag1.md
      beitrag2.md
    /development    # Kategorie "Development" 
      beitrag1.md
    /it-security    # Kategorie "IT-Security"
      beitrag1.md
```

Jeder Blogbeitrag ist eine Markdown-Datei (`.md`) und wird in einem der drei Kategorieordner
abgelegt.

## Methode 1: Manuelles Erstellen eines Beitrags

### Schritt 1: Erstelle eine neue Markdown-Datei

Erstelle eine neue Datei mit der Endung `.md` im entsprechenden Kategorieordner. Der Dateiname
sollte:

- Nur Kleinbuchstaben enthalten
- Keine Umlaute oder Sonderzeichen enthalten
- Leerzeichen durch Bindestriche ersetzen
- Aussagekräftig sein

Beispiel: `docker-container-einfuehrung.md`

### Schritt 2: Frontmatter hinzufügen

Jeder Beitrag benötigt einen Frontmatter-Block am Anfang der Datei:

```markdown
---
title: "Einführung in Docker-Container"
date: "2025-04-05"
excerpt: "Eine kompakte Einführung in die Grundlagen von Docker-Containern und deren Vorteile."
tags: ["Docker", "Container", "DevOps", "Virtualisierung"]
---
```

Der Frontmatter muss folgende Felder enthalten:

- `title`: Der Titel des Beitrags (in Anführungszeichen)
- `date`: Das Datum im Format YYYY-MM-DD
- `excerpt`: Eine kurze Zusammenfassung (1-2 Sätze)
- `tags`: Eine Liste von Schlagwörtern in eckigen Klammern

### Schritt 3: Beitragsinhalt schreiben

Nach dem Frontmatter folgt der eigentliche Inhalt des Beitrags in Markdown-Format:

```markdown
# Einführung in Docker-Container

Docker ist eine Plattform zur Containerisierung von Anwendungen...

## Was sind Container?

Container sind isolierte Umgebungen...

## Code-Beispiel

```bash
docker run -d -p 80:80 nginx
```

## Fazit

Docker-Container bieten zahlreiche Vorteile...

```

## Methode 2: Verwendung des Hilfsskripts

Das Framework enthält ein Hilfsskript zur einfacheren Erstellung von Beiträgen.

### Schritt 1: Script ausführen

```bash
cd /pfad/zu/blog-framework
node utils/create-post.js
```

### Schritt 2: Angaben ausfüllen

Das Script fragt dich nach:

- Kategorie (ai, development, it-security)
- Titel des Beitrags
- Kurzbeschreibung (Excerpt)
- Tags (durch Komma getrennt)

### Schritt 3: Inhalt hinzufügen

Das Script erstellt eine Markdown-Datei mit dem Frontmatter. Öffne die erzeugte Datei und füge den
Beitragsinhalt hinzu.

## Methode 3: KI-generierte Beiträge

### Schritt 1: Promptvorlage verwenden

Verwende die bereitgestellte Promptvorlage und sende sie an eine KI (z.B. Claude):

```
## IT-Blog Beitragsvorlage

Erstelle einen ausführlichen und informativen Blogbeitrag im Markdown-Format für meine IT-Website zu folgendem Thema:

### Thema:
[THEMA_HIER_EINFÜGEN]

### Kategorie (eine auswählen):
- ai
- development
- it-security

### Format:
Erzeuge eine Markdown-Datei mit korrektem Frontmatter und strukturiertem Inhalt.

### Anforderungen:
- Der Beitrag sollte zwischen 1000-1500 Wörter umfassen
- Verwende Zwischenüberschriften für bessere Lesbarkeit
- Füge mindestens ein Codebeispiel ein (falls thematisch passend)
- Füge 3-5 relevante Tags hinzu
- Schreibe im informativ-sachlichen Stil, aber leicht verständlich

### Frontmatter-Beispiel:
---
title: "Aussagekräftiger Titel"
date: "YYYY-MM-DD" (aktuelles Datum)
excerpt: "Eine prägnante Zusammenfassung des Beitrags in 1-2 Sätzen."
tags: ["Tag1", "Tag2", "Tag3"]
---
### Beispiel für Struktur:
1. Einleitung zum Thema
2. Hauptteil mit verschiedenen Aspekten/Techniken (mehrere Überschriften)
3. Praxisbeispiel oder Tutorial-Abschnitt mit Code
4. Fazit mit Ausblick oder praktischen Tipps

Bitte erstelle den kompletten Markdown-Beitrag, den ich direkt in meinem Blog-System verwenden kann.
```

### Schritt 2: Beitrag überprüfen und speichern

- Kopiere den generierten Markdown-Inhalt
- Stelle sicher, dass das Frontmatter korrekt formatiert ist
- Speichere den Inhalt in einer neuen `.md`-Datei im passenden Kategorieordner

## Beiträge auf dem Server aktualisieren

### Variante 1: Direktes Bearbeiten auf dem Server

Wenn du direkten Zugriff auf den Server hast:

```bash
# Verbinde dich mit deinem Server
ssh user@dein-server.de

# Navigiere zum Blog-Verzeichnis
cd /var/www/html/blog/blog-framework

# Erstelle einen neuen Beitrag
nano posts/category/neuer-beitrag.md

# Oder verwende das Hilfsskript
node utils/create-post.js
```

### Variante 2: Lokale Entwicklung und Upload

Wenn du lokal arbeitest:

1. Erstelle oder bearbeite Beiträge lokal
2. Übertrage die Dateien auf den Server:

```bash
# Einzelne Datei übertragen
scp pfad/zu/lokaler/datei.md user@dein-server.de:/var/www/html/blog/blog-framework/posts/kategorie/

# Oder alle Beiträge synchronisieren
rsync -avz pfad/zu/lokalem/posts/ user@dein-server.de:/var/www/html/blog/blog-framework/posts/
```

## Fehlersuche und häufige Probleme

### Beitrag erscheint nicht auf der Website

- Überprüfe, ob die Markdown-Datei im richtigen Kategorieordner liegt
- Stelle sicher, dass das Frontmatter korrekt formatiert ist:
    - Drei Bindestriche (`---`) am Anfang und Ende
    - Keine zusätzlichen Leerzeichen beim Frontmatter
    - Das Datum im korrekten Format (YYYY-MM-DD)
- Prüfe die Berechtigungen der Datei auf dem Server

### Formatierung wird nicht korrekt angezeigt

- Überprüfe die Markdown-Syntax:
    - Überschriften mit # (und Leerzeichen danach)
    - Codeblöcke mit drei Backticks (```)
    - Listen mit - oder 1. (und Leerzeichen danach)

### Server-Neustart nach Änderungen

Falls Änderungen nicht sofort sichtbar sind, starte den Server neu:

```bash
# Mit PM2
pm2 restart it-blog

# Oder direkt
cd /var/www/html/blog/blog-framework
npm start
```

---

Mit dieser Anleitung solltest du problemlos neue Beiträge zu deinem IT-Blog hinzufügen können. Bei
weiteren Fragen oder Problemen konsultiere die Logs im `/logs`-Verzeichnis oder wende dich an den
Systemadministrator.