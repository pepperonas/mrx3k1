const fs = require('fs');
const qrcode = require('qrcode');

// Die URL, für die ein QR-Code generiert werden soll
const url = process.argv[2] || 'http://localhost:3000';

// Generiere QR-Code
qrcode.toFile(
  'wifi-qr.png',
  url,
  {
    color: {
      dark: '#2C2E3B',
      light: '#FFFFFF'
    },
    width: 300,
    margin: 1
  },
  function(err) {
    if (err) {
      console.error('Fehler beim Erstellen des QR-Codes:', err);
      return;
    }
    console.log('✅ QR-Code wurde erstellt: wifi-qr.png');
    console.log(`Der QR-Code führt zu: ${url}`);
  }
);
