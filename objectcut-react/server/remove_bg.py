#!/usr/bin/env python3
import sys
import os
from rembg import remove
from PIL import Image
import io

def remove_background(input_path, output_path):
    """
    Entfernt den Hintergrund eines Bildes mit dem rembg-Paket
    
    Args:
        input_path: Pfad zum Eingabebild
        output_path: Pfad für das Ausgabebild mit transparentem Hintergrund
    """
    try:
        # Bildpfad aus Befehlszeilenargumenten lesen
        print(f"Processing image: {input_path}", file=sys.stderr)
        
        # Bild einlesen
        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()
            
        # Hintergrund mit rembg entfernen
        output_data = remove(input_data)
        
        # Ausgabe speichern
        with open(output_path, 'wb') as output_file:
            output_file.write(output_data)
            
        print(f"Background removed successfully. Output saved to: {output_path}", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"Error removing background: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    # Überprüfen, ob genügend Befehlszeilenargumente vorhanden sind
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input_image_path> <output_image_path>", file=sys.stderr)
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    # Überprüfen, ob die Eingabedatei existiert
    if not os.path.isfile(input_path):
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)
        
    # Hintergrund entfernen
    success = remove_background(input_path, output_path)
    
    # Exitcode basierend auf Erfolg
    sys.exit(0 if success else 1)