#!/bin/bash

# Datei erstellen oder überschreiben
echo "Verzeichnisstruktur generiert am $(date)" > tree.txt
echo "Aktueller Pfad: $(pwd)" >> tree.txt
echo "" >> tree.txt

# Prüfen, ob tree installiert ist
if ! command -v tree &> /dev/null; then
  echo "Error: 'tree' ist nicht installiert." >> tree.txt
  echo "Installiere es mit 'brew install tree' (macOS) oder 'apt install tree' (Ubuntu)" >> tree.txt
  exit 1
fi

# Verzeichnisstruktur generieren und anhängen, ohne node_modules
tree -I "node_modules" >> tree.txt

echo "Verzeichnisstruktur wurde in tree.txt gespeichert."