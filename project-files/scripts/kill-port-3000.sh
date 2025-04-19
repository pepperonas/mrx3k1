#!/bin/bash

# Finde die Prozess-ID, die Port 3000 verwendet
PID=$(lsof -ti :3000)

if [ -z "$PID" ]; then
  echo "Kein Prozess auf Port 3000 gefunden."
else
  echo "Beende Prozess mit PID $PID, der Port 3000 verwendet..."
  kill -9 $PID
  echo "Prozess beendet."
fi