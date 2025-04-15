#!/bin/bash

# CryptoVault - Vollständiges Installationsskript
# Erstellt eine React-App mit Verschlüsselungsfunktionen (AES, RSA, Caesar)

echo "=========================================="
echo "   CryptoVault Installation"
echo "   Verschlüsselungs-App"
echo "=========================================="

# Erstelle ein neues React-Projekt
echo ""
echo "[1/8] Erstelle ein neues React-Projekt..."
npx create-react-app crypto-vault
cd crypto-vault

# Installiere zusätzliche Abhängigkeiten
echo ""
echo "[2/8] Installiere Abhängigkeiten..."
npm install lucide-react tailwindcss autoprefixer postcss

# Initialisiere Tailwind CSS
echo ""
echo "[3/8] Konfiguriere Tailwind CSS..."
npx tailwindcss init -p

# Erstelle Ordnerstruktur
echo ""
echo "[4/8] Erstelle Ordnerstruktur..."
mkdir -p src/crypto

# Erstelle die Tailwind-Konfiguration
echo "/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    \"./src/**/*.{js,jsx,ts,tsx}\",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C2E3B',
        secondary: '#4a5568',
      },
    },
  },
  plugins: [],
}" > tailwind.config.js

# Erstelle die Hauptkomponente
echo ""
echo "[5/8] Erstelle Hauptkomponente und Algorithmen..."
echo "import React, { useState, useEffect } from 'react';
import { Lock, Key, Shield, Menu, X, Save, ChevronRight } from 'lucide-react';

// Crypto-Algorithmen
import { AESEncryption } from './crypto/AES';
import { RSAEncryption } from './crypto/RSA';
import { CaesarCipher } from './crypto/Caesar';

const algorithms = [
  {
    id: 'aes',
    name: 'AES',
    description: 'Advanced Encryption Standard mit IV',
    icon: <Shield size={20} />,
    component: AESEncryption
  },
  {
    id: 'rsa',
    name: 'RSA',
    description: 'Asymmetrische Verschlüsselung',
    icon: <Key size={20} />,
    component: RSAEncryption
  },
  {
    id: 'caesar',
    name: 'Caesar',
    description: 'Einfache Verschiebungs-Chiffre',
    icon: <Lock size={20} />,
    component: CaesarCipher
  }
];

export default function CryptoVault() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('aes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Finde den aktuell ausgewählten Algorithmus
  const currentAlgorithm = algorithms.find(algo => algo.id === selectedAlgorithm);

  // Dynamisches Laden der Komponente basierend auf der Auswahl
  const AlgorithmComponent = currentAlgorithm?.component || (() => <div>Algorithmus nicht gefunden</div>);

  return (
    <div className={\`flex h-screen bg-gray-100 \${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'}\`}>
      {/* Sidebar */}
      <div className={\`\${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-800 transition-all duration-300 overflow-hidden flex flex-col\`} style={{ backgroundColor: '#2C2E3B' }}>
        <div className=\"p-4 flex items-center justify-between border-b border-gray-700\">
          <h1 className=\"text-xl font-bold text-white flex items-center\">
            <Lock size={24} className=\"mr-2\" />
            CryptoVault
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className=\"text-gray-400 hover:text-white\"
          >
            <X size={20} />
          </button>
        </div>

        <div className=\"flex-1 overflow-y-auto py-4\">
          <p className=\"px-4 text-sm text-gray-400 mb-2\">Algorithmen</p>
          {algorithms.map(algo => (
            <button
              key={algo.id}
              onClick={() => setSelectedAlgorithm(algo.id)}
              className={\`w-full text-left px-4 py-3 flex items-center hover:bg-gray-700 transition-colors \${selectedAlgorithm === algo.id ? 'bg-gray-700' : ''}\`}
            >
              <div className=\"w-6 mr-3 text-gray-400\">
                {algo.icon}
              </div>
              <div>
                <p className=\"font-medium\">{algo.name}</p>
                <p className=\"text-xs text-gray-400\">{algo.description}</p>
              </div>
              {selectedAlgorithm === algo.id && (
                <ChevronRight size={16} className=\"ml-auto text-gray-400\" />
              )}
            </button>
          ))}
        </div>

        <div className=\"border-t border-gray-700 p-4\">
          <button
            className=\"w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center justify-center\"
            onClick={() => {/* Export/Import-Funktion */}}
          >
            <Save size={18} className=\"mr-2\" />
            Schlüssel exportieren
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className=\"flex-1 flex flex-col overflow-hidden\">
        {/* Header */}
        <header className={\`\${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow flex items-center\`}>
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={\`mr-4 \${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}\`}
            >
              <Menu size={24} />
            </button>
          )}
          <h2 className=\"text-xl font-semibold\">{currentAlgorithm?.name || 'Verschlüsselung'}</h2>

          <div className=\"ml-auto\">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={\`px-3 py-1 rounded \${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}\`}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className=\"flex-1 overflow-auto p-4\">
          <AlgorithmComponent />
        </main>
      </div>
    </div>
  );
}" > src/CryptoVault.js

# Erstelle die AES-Komponente
echo "import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';

// AES-Komponente für CryptoVault
export function AESEncryption() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('encrypt');
  const [keySize, setKeySize] = useState(256);
  const [savedKeys, setSavedKeys] = useState([]);
  const [keyName, setKeyName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Lade gespeicherte Schlüssel beim Start
  useEffect(() => {
    const keys = JSON.parse(localStorage.getItem('aesKeys') || '[]');
    setSavedKeys(keys);
  }, []);

  // Speichere Schlüssel in localStorage
  const saveKey = () => {
    if (!keyName.trim()) {
      setError('Bitte einen Namen für den Schlüssel eingeben');
      return;
    }

    if (!password) {
      setError('Bitte einen Schlüssel eingeben oder generieren');
      return;
    }

    const newKey = {
      id: Date.now().toString(),
      name: keyName,
      value: password,
      keySize: keySize,
      createdAt: new Date().toISOString()
    };

    const updatedKeys = [...savedKeys, newKey];
    localStorage.setItem('aesKeys', JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);
    setKeyName('');
    setInfo('Schlüssel erfolgreich gespeichert');

    setTimeout(() => setInfo(''), 3000);
  };

  // Lösche einen gespeicherten Schlüssel
  const deleteKey = (id) => {
    const updatedKeys = savedKeys.filter(key => key.id !== id);
    localStorage.setItem('aesKeys', JSON.stringify(updatedKeys));
    setSavedKeys(updatedKeys);
  };

  // Lade einen gespeicherten Schlüssel
  const loadKey = (key) => {
    setPassword(key.value);
    setKeySize(key.keySize);
  };

  // Generiere zufälligen AES Schlüssel
  const generateKey = () => {
    const array = new Uint8Array(keySize / 8);
    window.crypto.getRandomValues(array);
    const key = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setPassword(key);
  };

  // Kopiere Text in die Zwischenablage
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setInfo('In Zwischenablage kopiert');
    setTimeout(() => setInfo(''), 2000);
  };

  // Ver- oder Entschlüsseln mit AES
  const processText = async () => {
    try {
      setError('');
      if (!inputText) {
        setError('Bitte Text eingeben');
        return;
      }
      if (!password) {
        setError('Bitte Passwort eingeben oder generieren');
        return;
      }

      const passwordBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(password)
      );

      // IV für AES-GCM (zufällig)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      if (mode === 'encrypt') {
        // Schlüssel aus Passwort ableiten
        const key = await crypto.subtle.importKey(
          'raw',
          passwordBuffer,
          { name: 'AES-GCM', length: keySize },
          false,
          ['encrypt']
        );

        // Text verschlüsseln
        const encodedText = new TextEncoder().encode(inputText);
        const encryptedBuffer = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          encodedText
        );

        // Verschlüsselten Text und IV zusammen codieren
        const encryptedArray = new Uint8Array(encryptedBuffer);
        const result = new Uint8Array(iv.length + encryptedArray.length);
        result.set(iv);
        result.set(encryptedArray, iv.length);

        // Als Base64 ausgeben
        const base64Result = btoa(String.fromCharCode(...result));
        setOutputText(base64Result);
      } else {
        try {
          // Base64 decodieren
          const binaryString = atob(inputText);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // IV und verschlüsselten Text trennen
          const iv = bytes.slice(0, 12);
          const encryptedData = bytes.slice(12);

          // Schlüssel aus Passwort ableiten
          const key = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'AES-GCM', length: keySize },
            false,
            ['decrypt']
          );

          // Text entschlüsseln
          const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encryptedData
          );

          // Als Text ausgeben
          const decryptedText = new TextDecoder().decode(decryptedBuffer);
          setOutputText(decryptedText);
        } catch (error) {
          setError('Entschlüsselung fehlgeschlagen. Überprüfe den Text und das Passwort.');
          console.error(error);
        }
      }
    } catch (error) {
      setError(\`Fehler: \${error.message}\`);
      console.error(error);
    }
  };

  return (
    <div className=\"max-w-4xl mx-auto\">
      <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6\">
        <h3 className=\"text-lg font-semibold mb-4\">AES Verschlüsselung mit IV</h3>

        <div className=\"mb-6\">
          <p className=\"text-sm text-gray-500 dark:text-gray-400 mb-2\">
            AES (Advanced Encryption Standard) ist ein symmetrischer Verschlüsselungsalgorithmus,
            der weltweit für sichere Kommunikation verwendet wird. Diese Implementierung nutzt AES-GCM mit IV
            (Initialization Vector) für zusätzliche Sicherheit.
          </p>
        </div>

        <div className=\"flex space-x-4 mb-4\">
          <button
            onClick={() => setMode('encrypt')}
            className={\`px-4 py-2 rounded-md \${mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}\`}
          >
            Verschlüsseln
          </button>
          <button
            onClick={() => setMode('decrypt')}
            className={\`px-4 py-2 rounded-md \${mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}\`}
          >
            Entschlüsseln
          </button>
        </div>

        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
          <div>
            <label className=\"block mb-2 font-medium\">
              {mode === 'encrypt' ? 'Zu verschlüsselnder Text' : 'Zu entschlüsselnder Text (Base64)'}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className=\"w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
              placeholder={mode === 'encrypt' ? 'Text eingeben...' : 'Verschlüsselten Text eingeben...'}
            />
          </div>

          <div>
            <label className=\"block mb-2 font-medium\">Ergebnis</label>
            <div className=\"relative\">
              <textarea
                value={outputText}
                readOnly
                className=\"w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
              />
              {outputText && (
                <button
                  onClick={() => copyToClipboard(outputText)}
                  className=\"absolute top-2 right-2 p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300\"
                  title=\"In Zwischenablage kopieren\"
                >
                  <Copy size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className=\"mt-6\">
          <label className=\"block mb-2 font-medium\">Passwort / Schlüssel</label>
          <div className=\"flex\">
            <div className=\"relative flex-1\">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=\"w-full p-3 pr-10 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
                placeholder=\"Passwort oder Hex-Schlüssel eingeben...\"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className=\"absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500\"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              onClick={generateKey}
              className=\"ml-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center\"
              title=\"Zufälligen Schlüssel generieren\"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className=\"mt-2 flex items-center\">
            <span className=\"mr-2 text-sm\">Schlüsselgröße:</span>
            <select
              value={keySize}
              onChange={(e) => setKeySize(Number(e.target.value))}
              className=\"p-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
            >
              <option value={128}>128 Bit</option>
              <option value={192}>192 Bit</option>
              <option value={256}>256 Bit</option>
            </select>
          </div>
        </div>

        {error && (
          <div className=\"mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md\">
            {error}
          </div>
        )}

        {info && (
          <div className=\"mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md\">
            {info}
          </div>
        )}

        <div className=\"mt-6 flex justify-end\">
          <button
            onClick={processText}
            className=\"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md\"
          >
            {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
          </button>
        </div>
      </div>

      {/* Gespeicherte Schlüssel */}
      <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-md p-6\">
        <h3 className=\"text-lg font-semibold mb-4\">Gespeicherte Schlüssel</h3>

        <div className=\"flex mb-4\">
          <input
            type=\"text\"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className=\"flex-1 p-2 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
            placeholder=\"Schlüsselname\"
          />
          <button
            onClick={saveKey}
            className=\"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md\"
          >
            Aktuellen Schlüssel speichern
          </button>
        </div>

        {savedKeys.length > 0 ? (
          <div className=\"border rounded-md divide-y dark:divide-gray-700 dark:border-gray-700\">
            {savedKeys.map(key => (
              <div key={key.id} className=\"p-3 flex items-center justify-between\">
                <div>
                  <p className=\"font-medium\">{key.name}</p>
                  <p className=\"text-xs text-gray-500 dark:text-gray-400\">
                    {key.keySize} Bit • Erstellt am {new Date(key.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => loadKey(key)}
                    className=\"px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md mr-2\"
                  >
                    Laden
                  </button>
                  <button
                    onClick={() => deleteKey(key.id)}
                    className=\"px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md\"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className=\"text-gray-500 dark:text-gray-400 text-center py-4\">
            Keine gespeicherten Schlüssel vorhanden
          </p>
        )}
      </div>
    </div>
  );
}" > src/crypto/AES.js

# Erstelle die RSA-Komponente
echo "import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Download, Upload, Key } from 'lucide-react';

// RSA-Komponente für CryptoVault
export function RSAEncryption() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [keyPair, setKeyPair] = useState(null);
  const [savedKeyPairs, setSavedKeyPairs] = useState([]);
  const [keyPairName, setKeyPairName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [keySize, setKeySize] = useState(2048);
  const [mode, setMode] = useState('encrypt');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Lade gespeicherte Schlüssel beim Start
  useEffect(() => {
    const keys = JSON.parse(localStorage.getItem('rsaKeyPairs') || '[]');
    setSavedKeyPairs(keys);
  }, []);

  // Generiere neues RSA-Schlüsselpaar
  const generateKeyPair = async () => {
    try {
      setIsGenerating(true);
      setError('');

      // RSA-Schlüsselpaar generieren
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: \"RSA-OAEP\",
          modulusLength: keySize, // 2048, 3072 oder 4096 Bit
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: \"SHA-256\",
        },
        true, // exportierbar
        [\"encrypt\", \"decrypt\"]
      );

      // Öffentlichen Schlüssel exportieren
      const publicKey = await window.crypto.subtle.exportKey(
        \"spki\",
        keyPair.publicKey
      );

      // Privaten Schlüssel exportieren
      const privateKey = await window.crypto.subtle.exportKey(
        \"pkcs8\",
        keyPair.privateKey
      );

      // In Base64 umwandeln
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));

      setKeyPair({
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
        subtle: keyPair
      });

      setInfo('Neues Schlüsselpaar wurde erfolgreich generiert');
      setTimeout(() => setInfo(''), 3000);
    } catch (err) {
      setError(\`Fehler beim Generieren des Schlüsselpaars: \${err.message}\`);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Speichere Schlüsselpaar in localStorage
  const saveKeyPair = () => {
    if (!keyPairName.trim()) {
      setError('Bitte einen Namen für das Schlüsselpaar eingeben');
      return;
    }

    if (!keyPair) {
      setError('Bitte zuerst ein Schlüsselpaar generieren');
      return;
    }

    const newKeyPair = {
      id: Date.now().toString(),
      name: keyPairName,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      keySize: keySize,
      createdAt: new Date().toISOString()
    };

    const updatedKeyPairs = [...savedKeyPairs, newKeyPair];
    localStorage.setItem('rsaKeyPairs', JSON.stringify(updatedKeyPairs));
    setSavedKeyPairs(updatedKeyPairs);
    setKeyPairName('');
    setInfo('Schlüsselpaar erfolgreich gespeichert');
    setTimeout(() => setInfo(''), 3000);
  };

  // Lösche ein gespeichertes Schlüsselpaar
  const deleteKeyPair = (id) => {
    const updatedKeyPairs = savedKeyPairs.filter(key => key.id !== id);
    localStorage.setItem('rsaKeyPairs', JSON.stringify(updatedKeyPairs));
    setSavedKeyPairs(updatedKeyPairs);
  };

  // Lade ein gespeichertes Schlüsselpaar
  const loadKeyPair = async (savedKeyPair) => {
    try {
      setError('');

      // Public Key importieren
      const publicKeyBinary = Uint8Array.from(atob(savedKeyPair.publicKey), c => c.charCodeAt(0));
      const publicKey = await window.crypto.subtle.importKey(
        \"spki\",
        publicKeyBinary,
        {
          name: \"RSA-OAEP\",
          hash: \"SHA-256\",
        },
        true,
        [\"encrypt\"]
      );

      // Private Key importieren
      const privateKeyBinary = Uint8Array.from(atob(savedKeyPair.privateKey), c => c.charCodeAt(0));
      const privateKey = await window.crypto.subtle.importKey(
        \"pkcs8\",
        privateKeyBinary,
        {
          name: \"RSA-OAEP\",
          hash: \"SHA-256\",
        },
        true,
        [\"decrypt\"]
      );

      setKeyPair({
        publicKey: savedKeyPair.publicKey,
        privateKey: savedKeyPair.privateKey,
        subtle: { publicKey, privateKey }
      });

      setKeySize(savedKeyPair.keySize || 2048);
      setInfo('Schlüsselpaar erfolgreich geladen');
      setTimeout(() => setInfo(''), 3000);
    } catch (err) {
      setError(\`Fehler beim Laden des Schlüsselpaars: \${err.message}\`);
      console.error(err);
    }
  };

  // Exportiere Schlüssel als Datei
  const exportKeys = (type) => {
    if (!keyPair) {
      setError('Kein Schlüsselpaar vorhanden');
      return;
    }

    const key = type === 'public' ? keyPair.publicKey : keyPair.privateKey;
    const filename = type === 'public' ? 'public_key.pem' : 'private_key.pem';

    // PEM-Format erstellen
    const pemHeader = type === 'public'
      ? '-----BEGIN PUBLIC KEY-----\\n'
      : '-----BEGIN PRIVATE KEY-----\\n';
    const pemFooter = type === 'public'
      ? '\\n-----END PUBLIC KEY-----'
      : '\\n-----END PRIVATE KEY-----';

    // Base64 in 64-Zeichen-Zeilen aufteilen
    let formattedKey = '';
    for (let i = 0; i < key.length; i += 64) {
      formattedKey += key.slice(i, i + 64) + '\\n';
    }

    const pemContent = pemHeader + formattedKey + pemFooter;

    // Download-Link erstellen
    const blob = new Blob([pemContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Ver- oder Entschlüsseln mit RSA
  const processText = async () => {
    try {
      setError('');
      if (!inputText) {
        setError('Bitte Text eingeben');
        return;
      }

      if (!keyPair || !keyPair.subtle) {
        setError('Bitte zuerst ein Schlüsselpaar generieren oder laden');
        return;
      }

      if (mode === 'encrypt') {
        // Text mit öffentlichem Schlüssel verschlüsseln
        // Da RSA beschränkt ist in der Größe des zu verschlüsselnden Texts,
        // ist es besser für kleine Nachrichten oder für hybride Verschlüsselung
        if (new TextEncoder().encode(inputText).length > ((keySize / 8) - 42)) {
          setError(\`Die Nachricht ist zu lang für RSA-OAEP mit \${keySize} Bit (max. \${(keySize / 8) - 42} Bytes). Verwende kürzeren Text oder hybrid encryption.\`);
          return;
        }

        const encoded = new TextEncoder().encode(inputText);
        const encrypted = await window.crypto.subtle.encrypt(
          { name: \"RSA-OAEP\" },
          keyPair.subtle.publicKey,
          encoded
        );

        // Als Base64 ausgeben
        const base64Result = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        setOutputText(base64Result);
      } else {
        try {
          // Base64 decodieren
          const binaryString = atob(inputText);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Text mit privatem Schlüssel entschlüsseln
          const decrypted = await window.crypto.subtle.decrypt(
            { name: \"RSA-OAEP\" },
            keyPair.subtle.privateKey,
            bytes
          );

          // Als Text ausgeben
          const decryptedText = new TextDecoder().decode(decrypted);
          setOutputText(decryptedText);
        } catch (error) {
          setError('Entschlüsselung fehlgeschlagen. Überprüfe den Text und den Schlüssel.');
          console.error(error);
        }
      }
    } catch (error) {
      setError(\`Fehler: \${error.message}\`);
      console.error(error);
    }
  };

  // Kopiere Text in die Zwischenablage
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setInfo('In Zwischenablage kopiert');
    setTimeout(() => setInfo(''), 2000);
  };

  return (
    <div className=\"max-w-4xl mx-auto\">
      <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6\">
        <h3 className=\"text-lg font-semibold mb-4\">RSA Verschlüsselung</h3>

        <div className=\"mb-6\">
          <p className=\"text-sm text-gray-500 dark:text-gray-400 mb-2\">
            RSA ist ein asymmetrisches Verschlüsselungsverfahren, das mit zwei Schlüsseln arbeitet: einem öffentlichen zum
            Verschlüsseln und einem privaten zum Entschlüsseln. RSA eignet sich besonders für den sicheren
            Schlüsselaustausch oder für digitale Signaturen.
          </p>
        </div>

        <div className=\"flex space-x-4 mb-4\">
          <button
            onClick={() => setMode('encrypt')}
            className={\`px-4 py-2 rounded-md \${mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}\`}
          >
            Verschlüsseln (mit öffentlichem Schlüssel)
          </button>
          <button
            onClick={() => setMode('decrypt')}
            className={\`px-4 py-2 rounded-md \${mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}\`}
          >
            Entschlüsseln (mit privatem Schlüssel)
          </button>
        </div>

        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
          <div>
            <label className=\"block mb-2 font-medium\">
              {mode === 'encrypt' ? 'Zu verschlüsselnder Text' : 'Zu entschlüsselnder Text (Base64)'}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className=\"w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
              placeholder={mode === 'encrypt' ? 'Text eingeben...' : 'Verschlüsselten Text eingeben...'}
            />
          </div>

          <div>
            <label className=\"block mb-2 font-medium\">Ergebnis</label>
            <div className=\"relative\">
              <textarea
                value={outputText}
                readOnly
                className=\"w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
              />
              {outputText && (
                <button
                  onClick={() => copyToClipboard(outputText)}
                  className=\"absolute top-2 right-2 p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300\"
                  title=\"In Zwischenablage kopieren\"
                >
                  <Copy size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className=\"mt-6\">
          <div className=\"flex justify-between items-center mb-2\">
            <h4 className=\"font-medium\">Schlüsselpaar</h4>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className=\"text-blue-600 dark:text-blue-400 text-sm\"
            >
              {showAdvanced ? 'Weniger anzeigen' : 'Erweiterte Optionen'}
            </button>
          </div>

          {showAdvanced && (
            <div className=\"mb-4 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50\">
              <div className=\"mb-4\">
                <label className=\"block mb-2 text-sm font-medium\">Schlüsselgröße:</label>
                <select
                  value={keySize}
                  onChange={(e) => setKeySize(Number(e.target.value))}
                  className=\"p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 w-full\"
                  disabled={keyPair !== null}
                >
                  <option value={1024}>1024 Bit (weniger sicher, schneller)</option>
                  <option value={2048}>2048 Bit (empfohlen)</option>
                  <option value={4096}>4096 Bit (sicherer, langsamer)</option>
                </select>
              </div>

              {keyPair && (
                <>
                  <div className=\"mb-4\">
                    <label className=\"block mb-1 text-sm font-medium\">Öffentlicher Schlüssel:</label>
                    <div className=\"relative\">
                      <textarea
                        value={keyPair.publicKey}
                        readOnly
                        rows={3}
                        className=\"w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs font-mono\"
                      />
                      <div className=\"absolute top-2 right-2 flex\">
                        <button
                          onClick={() => copyToClipboard(keyPair.publicKey)}
                          className=\"p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 mr-1\"
                          title=\"In Zwischenablage kopieren\"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => exportKeys('public')}
                          className=\"p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300\"
                          title=\"Als .pem-Datei exportieren\"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className=\"block mb-1 text-sm font-medium\">Privater Schlüssel:</label>
                    <div className=\"relative\">
                      <textarea
                        value=\"*** Privater Schlüssel (aus Sicherheitsgründen ausgeblendet) ***\"
                        readOnly
                        rows={3}
                        className=\"w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs font-mono\"
                      />
                      <div className=\"absolute top-2 right-2\">
                        <button
                          onClick={() => exportKeys('private')}
                          className=\"p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300\"
                          title=\"Als .pem-Datei exportieren\"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                    <p className=\"mt-1 text-xs text-red-600 dark:text-red-400\">
                      Der private Schlüssel sollte sicher aufbewahrt und niemals weitergegeben werden!
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className=\"flex\">
            <button
              onClick={generateKeyPair}
              disabled={isGenerating}
              className={\`flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center \${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}\`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className=\"mr-2 animate-spin\" />
                  Generiere Schlüsselpaar...
                </>
              ) : (
                <>
                  <Key size={18} className=\"mr-2\" />
                  Neues RSA-Schlüsselpaar generieren
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className=\"mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md\">
            {error}
          </div>
        )}

        {info && (
          <div className=\"mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md\">
            {info}
          </div>
        )}

        <div className=\"mt-6 flex justify-end\">
          <button
            onClick={processText}
            disabled={!keyPair}
            className={\`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md \${!keyPair ? 'opacity-50 cursor-not-allowed' : ''}\`}
          >
            {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
          </button>
        </div>
      </div>

      {/* Gespeicherte Schlüsselpaare */}
      <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-md p-6\">
        <h3 className=\"text-lg font-semibold mb-4\">Gespeicherte Schlüsselpaare</h3>

        <div className=\"flex mb-4\">
          <input
            type=\"text\"
            value={keyPairName}
            onChange={(e) => setKeyPairName(e.target.value)}
            className=\"flex-1 p-2 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
            placeholder=\"Schlüsselpaarname\"
            disabled={!keyPair}
          />
          <button
            onClick={saveKeyPair}
            disabled={!keyPair}
            className={\`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md \${!keyPair ? 'opacity-50 cursor-not-allowed' : ''}\`}
          >
            Aktuelles Schlüsselpaar speichern
          </button>
        </div>

        {savedKeyPairs.length > 0 ? (
          <div className=\"border rounded-md divide-y dark:divide-gray-700 dark:border-gray-700\">
            {savedKeyPairs.map(keyPair => (
              <div key={keyPair.id} className=\"p-3 flex items-center justify-between\">
                <div>
                  <p className=\"font-medium\">{keyPair.name}</p>
                  <p className=\"text-xs text-gray-500 dark:text-gray-400\">
                    {keyPair.keySize || 2048} Bit • Erstellt am {new Date(keyPair.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => loadKeyPair(keyPair)}
                    className=\"px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md mr-2\"
                  >
                    Laden
                  </button>
                  <button
                    onClick={() => deleteKeyPair(keyPair.id)}
                    className=\"px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md\"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className=\"text-gray-500 dark:text-gray-400 text-center py-4\">
            Keine gespeicherten Schlüsselpaare vorhanden
          </p>
        )}
      </div>
    </div>
  );
}" > src/crypto/RSA.js

# Erstelle die Caesar-Komponente
echo "import React, { useState } from 'react';
import { Copy, RefreshCw, RotateCw } from 'lucide-react';

// Caesar Cipher Komponente für CryptoVault
export function CaesarCipher() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [shift, setShift] = useState(3);
  const [mode, setMode] = useState('encrypt');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Caesar Cipher Logik
  const caesarCipher = (text, shift, encrypt = true) => {
    // Bei Entschlüsselung den Shift umkehren
    const actualShift = encrypt ? shift : (26 - shift) % 26;

    return text.split('').map(char => {
      // Überprüfe, ob der Charakter ein Buchstabe ist
      if (/[a-zA-Z]/.test(char)) {
        const code = char.charCodeAt(0);
        let shiftedCode;

        // Großbuchstaben (A-Z: 65-90)
        if (code >= 65 && code <= 90) {
          shiftedCode = ((code - 65 + actualShift) % 26) + 65;
        }
        // Kleinbuchstaben (a-z: 97-122)
        else if (code >= 97 && code <= 122) {
          shiftedCode = ((code - 97 + actualShift) % 26) + 97;
        } else {
          return char;
        }

        return String.fromCharCode(shiftedCode);
      }

      // Nicht-Buchstaben bleiben unverändert
      return char;
    }).join('');
  };

  // Text verarbeiten
  const processText = () => {
    try {
      setError('');
      if (!inputText) {
        setError('Bitte Text eingeben');
        return;
      }

      const result = caesarCipher(inputText, shift, mode === 'encrypt');
      setOutputText(result);
    } catch (error) {
      setError(\`Fehler: \${error.message}\`);
      console.error(error);
    }
  };

  // Zufälligen Verschiebungswert generieren
  const generateRandomShift = () => {
    const randomShift = Math.floor(Math.random() * 25) + 1; // 1-25
    setShift(randomShift);
  };

  // Brute-Force-Ausgabe für alle möglichen Verschiebungen
  const bruteForce = () => {
    if (!inputText) {
      setError('Bitte Text eingeben');
      return;
    }

    setError('');

    // Generiere alle 25 möglichen Entschlüsselungen
    const allPossibilities = Array.from({ length: 25 }, (_, i) => {
      const shiftValue = i + 1;
      const decrypted = caesarCipher(inputText, shiftValue, false);
      return \`Shift \${shiftValue}: \${decrypted}\`;
    }).join('\\n');

    setOutputText(allPossibilities);
    setMode('decrypt'); // Wechsle in den Entschlüsselungsmodus
  };

  // Kopiere Text in die Zwischenablage
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setInfo('In Zwischenablage kopiert');
    setTimeout(() => setInfo(''), 2000);
  };

  return (
    <div className=\"max-w-4xl mx-auto\">
      <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-md p-6\">
        <h3 className=\"text-lg font-semibold mb-4\">Caesar Verschlüsselung</h3>

        <div className=\"mb-6\">
          <p className=\"text-sm text-gray-500 dark:text-gray-400 mb-2\">
            Die Caesar-Verschlüsselung ist eine der ältesten und einfachsten Verschlüsselungstechniken.
            Sie funktioniert durch Verschieben jedes Buchstabens im Alphabet um eine feste Anzahl von Positionen.
            Die Methode ist nach Julius Caesar benannt, der sie für seine private Korrespondenz verwendete.
          </p>
          <p className=\"text-sm text-gray-500 dark:text-gray-400\">
            <strong>Wichtiger Hinweis:</strong> Die Caesar-Verschlüsselung ist sehr einfach zu knacken und sollte
            nicht für sensible Daten verwendet werden. Sie dient hier hauptsächlich zu Demonstrationszwecken.
          </p>
        </div>

        <div className=\"flex space-x-4 mb-4\">
          <button
            onClick={() => setMode('encrypt')}
            className={\`px-4 py-2 rounded-md \${mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}\`}
          >
            Verschlüsseln
          </button>
          <button
            onClick={() => setMode('decrypt')}
            className={\`px-4 py-2 rounded-md \${mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}\`}
          >
            Entschlüsseln
          </button>
          <button
            onClick={bruteForce}
            className=\"px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-md flex items-center\"
          >
            <RotateCw size={16} className=\"mr-1\" />
            Brute Force
          </button>
        </div>

        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
          <div>
            <label className=\"block mb-2 font-medium\">Eingabetext</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className=\"w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
              placeholder=\"Text eingeben...\"
            />
          </div>

          <div>
            <label className=\"block mb-2 font-medium\">Ergebnis</label>
            <div className=\"relative\">
              <textarea
                value={outputText}
                readOnly
                className=\"w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
              />
              {outputText && (
                <button
                  onClick={() => copyToClipboard(outputText)}
                  className=\"absolute top-2 right-2 p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300\"
                  title=\"In Zwischenablage kopieren\"
                >
                  <Copy size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className=\"mt-6\">
          <label className=\"block mb-2 font-medium\">Verschiebung (Shift)</label>
          <div className=\"flex items-center\">
            <input
              type=\"range\"
              min=\"1\"
              max=\"25\"
              value={shift}
              onChange={(e) => setShift(parseInt(e.target.value))}
              className=\"flex-1 mr-3\"
            />
            <div className=\"flex items-center\">
              <input
                type=\"number\"
                min=\"1\"
                max=\"25\"
                value={shift}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 25) {
                    setShift(value);
                  }
                }}
                className=\"w-16 p-2 border rounded-md text-center bg-gray-50 dark:bg-gray-700 dark:border-gray-600\"
              />
              <button
                onClick={generateRandomShift}
                className=\"ml-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-md\"
                title=\"Zufälligen Wert generieren\"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <p className=\"mt-1 text-xs text-gray-500 dark:text-gray-400\">
            Bei der Caesar-Verschlüsselung werden Buchstaben um einen festen Wert (hier: {shift}) im Alphabet verschoben.
            Beispiel (Shift {shift}): A → {String.fromCharCode(65 + shift % 26)}, B → {String.fromCharCode(66 + shift % 26)}
          </p>
        </div>

        {error && (
          <div className=\"mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md\">
            {error}
          </div>
        )}

        {info && (
          <div className=\"mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md\">
            {info}
          </div>
        )}

        <div className=\"mt-6 flex justify-end\">
          <button
            onClick={processText}
            className=\"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md\"
          >
            {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
          </button>
        </div>

        <div className=\"mt-6 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50\">
          <h4 className=\"font-medium mb-2\">Wissenswertes zur Caesar-Verschlüsselung</h4>
          <ul className=\"text-sm text-gray-600 dark:text-gray-300 space-y-2\">
            <li>• Die Caesar-Verschlüsselung ist eine <strong>monoalphabetische Substitutionschiffre</strong>, bei der jeder Buchstabe durch einen anderen ersetzt wird, der eine bestimmte Anzahl von Positionen später im Alphabet folgt.</li>
            <li>• Mit nur 25 möglichen Schlüsseln (Verschiebungen) ist sie durch einfaches Ausprobieren (Brute Force) leicht zu knacken.</li>
            <li>• Moderne Anwendungen: Obwohl nicht sicher, wird sie manchmal für einfache Rätsel oder als grundlegendes Beispiel für Kryptographie verwendet.</li>
            <li>• In der ROT13-Variante (Verschiebung um 13) wird sie für harmlose Spoiler-Verschleierung im Internet eingesetzt.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}" > src/crypto/Caesar.js

# Erstelle die Index.css-Datei
echo ""
echo "[6/8] Erstelle Stylesheets und Basisdateien..."
echo "@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

/* Schönes Scrollbar-Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.dark ::-webkit-scrollbar-track {
  background: #2d3748;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4a5568;
}

::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #718096;
}

/* Weitere Styling-Anpassungen */
.dark textarea,
.dark input[type=\"text\"],
.dark input[type=\"number\"],
.dark select {
  color: #e2e8f0;
}

/* Focus Styling */
textarea:focus,
input:focus,
select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
}

/* Verbesserte Slider-Darstellung für alle Browser */
input[type=\"range\"] {
  -webkit-appearance: none;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
}

.dark input[type=\"range\"] {
  background: #4a5568;
}

input[type=\"range\"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #4299e1;
  border-radius: 50%;
  cursor: pointer;
}

input[type=\"range\"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #4299e1;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}" > src/index.css

# Erstelle die Index.js-Datei
echo "import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import CryptoVault from './CryptoVault';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CryptoVault />
  </React.StrictMode>
);" > src/index.js

# Erstelle README.md
echo ""
echo "[7/8] Erstelle Dokumentation und Hilfsskripte..."
echo "# CryptoVault

Eine moderne React-Anwendung zur sicheren Verschlüsselung und Entschlüsselung von Daten mit verschiedenen Algorithmen.

## Funktionen

- **AES-Verschlüsselung** mit IV (Initialization Vector) für hohe Sicherheit
- **RSA-Verschlüsselung** mit asymmetrischem Schlüsselpaar (public/private)
- **Caesar-Chiffre** als einfaches Beispiel für Verschiebungsverschlüsselung
- Sicheres Speichern von Schlüsseln im Browser
- Modernes UI mit Dark Mode

## Installation

1. Repository klonen oder Dateien herunterladen
2. Abhängigkeiten installieren:

\`\`\`bash
npm install
\`\`\`

3. Entwicklungsserver starten:

\`\`\`bash
npm start
\`\`\`

Die Anwendung öffnet sich automatisch im Browser unter [http://localhost:3000](http://localhost:3000).

## Algorithmen

### AES (Advanced Encryption Standard)

AES ist ein symmetrischer Verschlüsselungsalgorithmus, der den früheren Standard DES ersetzt hat. Die Implementierung verwendet:

- AES-GCM-Modus mit Initialization Vector (IV)
- Unterstützung für 128, 192 und 256 Bit Schlüssellängen
- Automatische Schlüsselgenerierung
- Lokale Speicherung von Schlüsseln

### RSA (Rivest–Shamir–Adleman)

RSA ist ein asymmetrisches Kryptosystem, das mit zwei Schlüsseln arbeitet:

- Ein öffentlicher Schlüssel für die Verschlüsselung
- Ein privater Schlüssel für die Entschlüsselung
- Unterstützung für 1024, 2048 und 4096 Bit Schlüssellängen
- Export von Schlüsseln im PEM-Format

### Caesar-Verschlüsselung

Die Caesar-Verschlüsselung ist eine der ältesten und einfachsten Verschlüsselungstechniken:

- Verschiebung von Buchstaben im Alphabet um einen bestimmten Wert
- Brute-Force-Funktion zum Anzeigen aller möglichen Entschlüsselungen
- Hauptsächlich zu Demonstrationszwecken

## Sicherheit

Die Anwendung verwendet die Web Crypto API für kryptografische Operationen und speichert Schlüssel nur lokal im Browser (localStorage). Der private RSA-Schlüssel wird niemals übertragen und kann als Datei exportiert werden.

## Technologien

- React.js
- Tailwind CSS
- Web Crypto API
- localStorage für die Schlüsselverwaltung" > README.md

# Erstelle App.js (leere Datei - wird nicht verwendet, aber verhindert Warnungen)
echo "// App.js wird nicht verwendet - CryptoVault.js ist die Hauptkomponente" > src/App.js

# Erstelle ein Skript zum Starten des Projekts
echo '#!/bin/bash
cd "$(dirname "$0")"
npm start' > start.sh
chmod +x start.sh

# Erstelle ein Skript zum Bauen des Projekts
echo '#!/bin/bash
cd "$(dirname "$0")"
npm run build' > build.sh
chmod +x build.sh

# Lösche die Standard-Dateien, die nicht benötigt werden
rm -f src/App.css src/App.test.js src/logo.svg src/reportWebVitals.js src/setupTests.js

# Erstelle eine Beispiel .env Datei
echo "# CryptoVault Umgebungsvariablen
REACT_APP_VERSION=1.0.0
# Diese Datei kann für Konfigurationseinstellungen verwendet werden, falls benötigt" > .env

# Aktualisiere öffentliches HTML-Template
echo "<!DOCTYPE html>
<html lang=\"de\">
  <head>
    <meta charset=\"utf-8\" />
    <link rel=\"icon\" href=\"%PUBLIC_URL%/favicon.ico\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <meta name=\"theme-color\" content=\"#2C2E3B\" />
    <meta
      name=\"description\"
      content=\"CryptoVault - Sicheres Verschlüsseln und Entschlüsseln von Daten\"
    />
    <link rel=\"apple-touch-icon\" href=\"%PUBLIC_URL%/logo192.png\" />
    <link rel=\"manifest\" href=\"%PUBLIC_URL%/manifest.json\" />
    <title>CryptoVault</title>
  </head>
  <body>
    <noscript>JavaScript muss aktiviert sein, um CryptoVault zu verwenden.</noscript>
    <div id=\"root\"></div>
  </body>
</html>" > public/index.html

# Aktualisiere manifest.json
echo "{
  \"short_name\": \"CryptoVault\",
  \"name\": \"CryptoVault - Sichere Verschlüsselung\",
  \"icons\": [
    {
      \"src\": \"favicon.ico\",
      \"sizes\": \"64x64 32x32 24x24 16x16\",
      \"type\": \"image/x-icon\"
    },
    {
      \"src\": \"logo192.png\",
      \"type\": \"image/png\",
      \"sizes\": \"192x192\"
    },
    {
      \"src\": \"logo512.png\",
      \"type\": \"image/png\",
      \"sizes\": \"512x512\"
    }
  ],
  \"start_url\": \".\",
  \"display\": \"standalone\",
  \"theme_color\": \"#2C2E3B\",
  \"background_color\": \"#ffffff\"
}" > public/manifest.json

# Erstelle einfache Logos (falls ImageMagick verfügbar)
echo ""
echo "[8/8] Erstelle App-Icons und finale Anpassungen..."
if command -v convert >/dev/null 2>&1; then
  echo "- Erstelle Logos mit ImageMagick..."
  # Erstelle Favicon
  convert -size 64x64 xc:#2C2E3B -font Arial -pointsize 40 -gravity center -fill white -annotate 0 "CV" public/favicon.ico || echo "- Konnte Favicon nicht erstellen. Ignoriere..."
  # Erstelle App-Icons
  convert -size 192x192 xc:#2C2E3B -font Arial -pointsize 100 -gravity center -fill white -annotate 0 "CV" public/logo192.png || echo "- Konnte logo192.png nicht erstellen. Ignoriere..."
  convert -size 512x512 xc:#2C2E3B -font Arial -pointsize 260 -gravity center -fill white -annotate 0 "CV" public/logo512.png || echo "- Konnte logo512.png nicht erstellen. Ignoriere..."
else
  echo "- ImageMagick nicht gefunden. Logos werden nicht erstellt."
fi

# Erstelle .gitignore
echo "# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*" > .gitignore

# Abschluss-Meldung
echo ""
echo "=========================================================="
echo "✅ CryptoVault wurde erfolgreich erstellt!"
echo "=========================================================="
echo ""
echo "Die Projektstruktur wurde im Verzeichnis 'crypto-vault' erstellt."
echo ""
echo "Um die App zu starten:"
echo "  cd crypto-vault"
echo "  npm start"
echo ""
echo "Oder einfach das Start-Skript ausführen:"
echo "  ./start.sh"
echo ""
echo "Die App wird dann unter http://localhost:3000 verfügbar sein."
echo ""
echo "Für eine Produktionsversion:"
echo "  ./build.sh"
echo ""
echo "Viel Spaß mit CryptoVault! 🔐"
echo "=========================================================="