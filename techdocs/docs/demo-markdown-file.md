# Docker Befehle Cheat Sheet

Hier ist eine Übersicht der wichtigsten Docker-Befehle für den täglichen Gebrauch.

## Container-Befehle

### Container erstellen und ausführen
```bash
# Container starten
docker run [OPTIONS] IMAGE [COMMAND] [ARG...]

# Container im Hintergrund starten
docker run -d IMAGE

# Container mit interaktiver Shell starten
docker run -it IMAGE bash

# Container mit Namen starten
docker run --name my-container IMAGE

# Container mit Portmapping starten (Host-Port:Container-Port)
docker run -p 8080:80 IMAGE

# Container mit Volumenmapping starten (Host-Pfad:Container-Pfad)
docker run -v /host/path:/container/path IMAGE
```

### Container verwalten
```bash
# Alle laufenden Container anzeigen
docker ps

# Alle Container anzeigen (auch gestoppte)
docker ps -a

# Container stoppen
docker stop CONTAINER_ID_OR_NAME

# Container starten
docker start CONTAINER_ID_OR_NAME

# Container neustarten
docker restart CONTAINER_ID_OR_NAME

# In einen laufenden Container einsteigen
docker exec -it CONTAINER_ID_OR_NAME bash

# Container-Logs anzeigen
docker logs CONTAINER_ID_OR_NAME

# Container-Logs kontinuierlich anzeigen
docker logs -f CONTAINER_ID_OR_NAME

# Container löschen (muss gestoppt sein)
docker rm CONTAINER_ID_OR_NAME

# Laufenden Container löschen (forciert)
docker rm -f CONTAINER_ID_OR_NAME
```

## Image-Befehle

```bash
# Alle Images anzeigen
docker images

# Image aus Dockerfile bauen
docker build -t IMAGE_NAME:TAG .

# Image aus Registry (z.B. Docker Hub) herunterladen
docker pull IMAGE_NAME:TAG

# Image in Registry hochladen
docker push IMAGE_NAME:TAG

# Image löschen
docker rmi IMAGE_ID_OR_NAME

# Nicht verwendete Images löschen
docker image prune
```

## Docker Compose

```bash
# Container gemäß docker-compose.yml starten
docker-compose up

# Container im Hintergrund starten
docker-compose up -d

# Container stoppen
docker-compose down

# Container neu bauen und starten
docker-compose up --build

# Services und deren Status anzeigen
docker-compose ps
```

## Netzwerk-Befehle

```bash
# Alle Netzwerke anzeigen
docker network ls

# Neues Netzwerk erstellen
docker network create NETWORK_NAME

# Container mit Netzwerk verbinden
docker network connect NETWORK_NAME CONTAINER_NAME

# Netzwerkdetails anzeigen
docker network inspect NETWORK_NAME
```

## Volume-Befehle

```bash
# Alle Volumes anzeigen
docker volume ls

# Neues Volume erstellen
docker volume create VOLUME_NAME

# Volume löschen
docker volume rm VOLUME_NAME

# Nicht verwendete Volumes löschen
docker volume prune
```

## System-Befehle

```bash
# Docker-Systeminfo anzeigen
docker info

# Speichernutzung anzeigen
docker system df

# Nicht verwendete Ressourcen bereinigen (Container, Images, Netzwerke, Volumes)
docker system prune

# Alle ungenutzten Ressourcen bereinigen, einschließlich nicht verwendeter Volumes
docker system prune -a --volumes
```

---

**Hinweis:** Diese Übersicht enthält die grundlegenden Befehle. Weitere Optionen und detaillierte Informationen sind in der [offiziellen Docker-Dokumentation](https://docs.docker.com/) zu finden.
