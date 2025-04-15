import React, { useState, useEffect } from 'react';
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
      setError(`Fehler: ${error.message}`);
      console.error(error);
    }
  };

  return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">AES Verschlüsselung mit IV</h3>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              AES (Advanced Encryption Standard) ist ein symmetrischer Verschlüsselungsalgorithmus,
              der weltweit für sichere Kommunikation verwendet wird. Diese Implementierung nutzt AES-GCM mit IV
              (Initialization Vector) für zusätzliche Sicherheit.
            </p>
          </div>

          <div className="flex space-x-4 mb-4">
            <button
                onClick={() => setMode('encrypt')}
                className={`px-4 py-2 rounded-md ${mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              Verschlüsseln
            </button>
            <button
                onClick={() => setMode('decrypt')}
                className={`px-4 py-2 rounded-md ${mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
            >
              Entschlüsseln
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium dark:text-gray-200">
                {mode === 'encrypt' ? 'Zu verschlüsselnder Text' : 'Zu entschlüsselnder Text (Base64)'}
              </label>
              <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder={mode === 'encrypt' ? 'Text eingeben...' : 'Verschlüsselten Text eingeben...'}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium dark:text-gray-200">Ergebnis</label>
              <div className="relative">
              <textarea
                  value={outputText}
                  readOnly
                  className="w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
                {outputText && (
                    <button
                        onClick={() => copyToClipboard(outputText)}
                        className="absolute top-2 right-2 p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                        title="In Zwischenablage kopieren"
                    >
                      <Copy size={16} className="dark:text-gray-200" />
                    </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block mb-2 font-medium dark:text-gray-200">Passwort / Schlüssel</label>
            <div className="flex">
              <div className="relative flex-1">
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-10 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="Passwort oder Hex-Schlüssel eingeben..."
                />
                <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 dark:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                  onClick={generateKey}
                  className="ml-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center dark:text-gray-200"
                  title="Zufälligen Schlüssel generieren"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="mt-2 flex items-center">
              <span className="mr-2 text-sm dark:text-gray-300">Schlüsselgröße:</span>
              <select
                  value={keySize}
                  onChange={(e) => setKeySize(Number(e.target.value))}
                  className="p-1 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value={128}>128 Bit</option>
                <option value={192}>192 Bit</option>
                <option value={256}>256 Bit</option>
              </select>
            </div>
          </div>

          {error && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                {error}
              </div>
          )}

          {info && (
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                {info}
              </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
                onClick={processText}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
            </button>
          </div>
        </div>

        {/* Gespeicherte Schlüssel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Gespeicherte Schlüssel</h3>

          <div className="flex mb-4">
            <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="flex-1 p-2 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Schlüsselname"
            />
            <button
                onClick={saveKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md"
            >
              Aktuellen Schlüssel speichern
            </button>
          </div>

          {savedKeys.length > 0 ? (
              <div className="border rounded-md divide-y dark:divide-gray-700 dark:border-gray-600">
                {savedKeys.map(key => (
                    <div key={key.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium dark:text-gray-100">{key.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {key.keySize} Bit • Erstellt am {new Date(key.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <button
                            onClick={() => loadKey(key)}
                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-md mr-2"
                        >
                          Laden
                        </button>
                        <button
                            onClick={() => deleteKey(key.id)}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Keine gespeicherten Schlüssel vorhanden
              </p>
          )}
        </div>
      </div>
  );
}