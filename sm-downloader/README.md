# Social Media Video Downloader - Aktualisierte Installationsanleitung

Diese Anleitung führt dich durch die Installation und Einrichtung des Social Media Video Downloaders auf deinem VPS.

## Voraussetzungen

- Node.js (v14 oder höher)
- npm (kommt mit Node.js)
- ffmpeg (für Audio-Extraktion)

## 1. Projektstruktur einrichten

Erstelle zunächst den Ordner für die Anwendung auf deinem VPS:

```bash
mkdir -p /var/www/html/stuff/sm-downloader
cd /var/www/html/stuff/sm-downloader
```

## 2. Dateien kopieren

### Backend-Dateien

Erstelle die Hauptdateien des Backends:

```bash
nano server.js
nano package.json
```

Füge den Code aus den bereitgestellten Dateien ein.

### Frontend-Struktur

Erstelle die Frontend-Ordnerstruktur:

```bash
mkdir -p public/icons
```

### Frontend-Dateien erstellen

```bash
nano public/index.html
nano public/style.css
nano public/app.js
```

Füge den jeweiligen Code aus den bereitgestellten Dateien ein.

### Icons erstellen

```bash
nano public/icons/youtube.svg
nano public/icons/instagram.svg
nano public/icons/tiktok.svg
nano public/icons/twitter.svg
nano public/icons/audio.svg
nano public/icons/hd.svg
nano public/icons/sd.svg
```

Füge den SVG-Code aus den bereitgestellten Dateien ein.

## 3. Abhängigkeiten installieren

Installiere die Node.js-Abhängigkeiten:

```bash
npm install
```

Dies wird einige Zeit dauern, da ytdl-core und andere Pakete installiert werden.

## 4. ffmpeg installieren

Installiere ffmpeg für die Audio-Extraktion:

```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

## 5. Anwendung als Service einrichten

Erstelle eine systemd-Service-Datei, um den Server als Dienst laufen zu lassen:

```bash
sudo nano /etc/systemd/system/sm-downloader.service
```

Füge folgenden Inhalt ein:

```
[Unit]
Description=Social Media Video Downloader
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/stuff/sm-downloader
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=PORT=3002
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Setze die korrekten Berechtigungen:

```bash
sudo chown -R www-data:www-data /var/www/html/stuff/sm-downloader
```

Aktiviere und starte den Service:

```bash
sudo systemctl enable sm-downloader
sudo systemctl start sm-downloader
```

## 6. Nginx-Konfiguration aktualisieren

Bearbeite deine Nginx-Konfiguration:

```bash
sudo nano /etc/nginx/sites-available/default
```

Füge folgende Location-Direktive hinzu (oder aktualisiere die bestehende):

```
location /stuff/sm-downloader/ {
    proxy_pass http://localhost:3002/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 120s;
    client_max_body_size 20M;
}
```

Überprüfe die Nginx-Konfiguration und lade sie neu:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Überprüfung

Öffne einen Webbrowser und gehe zu:

```
https://mrx3k1.de/stuff/sm-downloader
```

Du kannst den Status des Dienstes überprüfen mit:

```bash
sudo systemctl status sm-downloader
```

Und die Logs ansehen mit:

```bash
sudo journalctl -u sm-downloader -f
```

## 8. Wartung und Updates

Um den Service neu zu starten (z.B. nach Codeänderungen):

```bash
sudo systemctl restart sm-downloader
```

Um die Anwendung zu aktualisieren, ändere die entsprechenden Dateien und starte dann den Service neu.

## Fehlerbehebung

### Problem: Error 500 bei YouTube-Downloads

Dies kann mehrere Ursachen haben:
- Prüfe die ytdl-core Version in package.json (sollte aktuell sein)
- YouTube ändert manchmal seine API - Update von ytdl-core könnte helfen:
  ```bash
  npm update ytdl-core
  ```
- Überprüfe die Server-Logs für spezifische Fehler:
  ```bash
  sudo journalctl -u sm-downloader -f
  ```

### Problem: Downloadgröße ist zu klein

Wenn Downloads nur wenige Bytes groß sind:
- Prüfe, ob genügend Speicherplatz vorhanden ist: `df -h`
- Vergewissere dich, dass die Berechtigungen korrekt sind
- Prüfe die Logs auf Fehler beim Schreiben der Dateien

### Problem: Port 3002 ist bereits belegt

Falls der Port bereits verwendet wird:
1. Ändere den Port in der service-Datei
2. Aktualisiere den Port auch in der Nginx-Konfiguration
3. Starte beide Dienste neu