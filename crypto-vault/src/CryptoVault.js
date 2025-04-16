import React, { useState, useEffect, useRef } from 'react';
import { Lock, Key, Shield, Menu, X, Save, ChevronRight, Upload } from 'lucide-react';

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
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const importFileRef = useRef(null);

  // Finde den aktuell ausgewählten Algorithmus
  const currentAlgorithm = algorithms.find(algo => algo.id === selectedAlgorithm);

  // Dynamisches Laden der Komponente basierend auf der Auswahl
  const AlgorithmComponent = currentAlgorithm?.component || (() => <div>Algorithmus nicht gefunden</div>);

  // Export aller Schlüssel
  const exportAllKeys = () => {
    try {
      // AES-Schlüssel laden
      const aesKeys = JSON.parse(localStorage.getItem('aesKeys') || '[]');

      // RSA-Schlüsselpaare laden
      const rsaKeys = JSON.parse(localStorage.getItem('rsaKeyPairs') || '[]');

      // Prüfen, ob Schlüssel vorhanden sind
      if (aesKeys.length === 0 && rsaKeys.length === 0) {
        setError('Keine Schlüssel zum Exportieren vorhanden');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Daten für den Export vorbereiten
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        aesKeys,
        rsaKeys
      };

      // In JSON umwandeln und herunterladen
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'cryptovault_keys_export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setInfo('Schlüssel wurden erfolgreich exportiert');
      setTimeout(() => setInfo(''), 3000);
    } catch (err) {
      setError(`Fehler beim Exportieren der Schlüssel: ${err.message}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Import aller Schlüssel
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const importedData = JSON.parse(content);

        // Validierung
        if (!importedData.aesKeys && !importedData.rsaKeys) {
          throw new Error('Ungültiges Dateiformat. Keine Schlüssel gefunden.');
        }

        // AES-Schlüssel importieren, wenn vorhanden
        if (Array.isArray(importedData.aesKeys) && importedData.aesKeys.length > 0) {
          const existingAesKeys = JSON.parse(localStorage.getItem('aesKeys') || '[]');
          const existingIds = new Set(existingAesKeys.map(key => key.id));
          const newAesKeys = importedData.aesKeys.filter(key => !existingIds.has(key.id));

          if (newAesKeys.length > 0) {
            const updatedAesKeys = [...existingAesKeys, ...newAesKeys];
            localStorage.setItem('aesKeys', JSON.stringify(updatedAesKeys));
          }
        }

        // RSA-Schlüssel importieren, wenn vorhanden
        if (Array.isArray(importedData.rsaKeys) && importedData.rsaKeys.length > 0) {
          const existingRsaKeys = JSON.parse(localStorage.getItem('rsaKeyPairs') || '[]');
          const existingIds = new Set(existingRsaKeys.map(key => key.id));
          const newRsaKeys = importedData.rsaKeys.filter(key => !existingIds.has(key.id));

          if (newRsaKeys.length > 0) {
            const updatedRsaKeys = [...existingRsaKeys, ...newRsaKeys];
            localStorage.setItem('rsaKeyPairs', JSON.stringify(updatedRsaKeys));
          }
        }

        setInfo('Schlüssel erfolgreich importiert');
        setTimeout(() => setInfo(''), 3000);
      } catch (err) {
        setError(`Fehler beim Importieren der Schlüssel: ${err.message}`);
        setTimeout(() => setError(''), 3000);
      }

      // Zurücksetzen des Datei-Inputs
      event.target.value = null;
    };

    reader.onerror = () => {
      setError('Fehler beim Lesen der Datei');
      setTimeout(() => setError(''), 3000);
      // Zurücksetzen des Datei-Inputs
      event.target.value = null;
    };

    reader.readAsText(file);
  };

  return (
      <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden flex flex-col`} style={{ backgroundColor: '#2C2E3B' }}>
          <div className="p-4 flex items-center justify-between border-b border-gray-700">
            <h1 className="text-xl font-bold text-white flex items-center">
              <Lock size={24} className="mr-2" />
              CryptoVault
            </h1>
            <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <p className="px-4 text-sm text-gray-300 mb-2">Algorithmen</p>
            {algorithms.map(algo => (
                <button
                    key={algo.id}
                    onClick={() => setSelectedAlgorithm(algo.id)}
                    className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-700 transition-colors ${selectedAlgorithm === algo.id ? 'bg-gray-700' : ''}`}
                >
                  <div className="w-6 mr-3 text-gray-300">
                    {algo.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-100">{algo.name}</p>
                    <p className="text-xs text-gray-300">{algo.description}</p>
                  </div>
                  {selectedAlgorithm === algo.id && (
                      <ChevronRight size={16} className="ml-auto text-gray-300" />
                  )}
                </button>
            ))}
          </div>

          <div className="border-t border-gray-700 p-4 space-y-2">
            <button
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center justify-center"
                onClick={exportAllKeys}
            >
              <Save size={18} className="mr-2" />
              Schlüssel exportieren
            </button>

            <button
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium flex items-center justify-center"
                onClick={() => importFileRef.current.click()}
            >
              <Upload size={18} className="mr-2" />
              Schlüssel importieren
            </button>
            <input
                type="file"
                ref={importFileRef}
                onChange={handleFileUpload}
                accept=".json"
                style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow flex items-center`}>
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className={`mr-4 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Menu size={24} />
                </button>
            )}
            <h2 className="text-xl font-semibold">{currentAlgorithm?.name || 'Verschlüsselung'}</h2>

            <div className="ml-auto">
              <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`px-3 py-1 rounded ${isDarkMode ? 'bg-gray-600 text-gray-100' : 'bg-gray-200 text-gray-700'}`}
              >
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-4">
            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                  {error}
                </div>
            )}

            {info && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                  {info}
                </div>
            )}

            <AlgorithmComponent />
          </main>

          {/* Footer */}
          <footer className={`py-3 px-4 text-center text-sm ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            Build 🔒 by Martin Pfeffer
          </footer>
        </div>
      </div>
  );
}