import React, { useState, useEffect } from 'react';
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
    <div className={`flex h-screen bg-gray-100 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-gray-800 transition-all duration-300 overflow-hidden flex flex-col`} style={{ backgroundColor: '#2C2E3B' }}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <h1 className="text-xl font-bold text-white flex items-center">
            <Lock size={24} className="mr-2" />
            CryptoVault
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <p className="px-4 text-sm text-gray-400 mb-2">Algorithmen</p>
          {algorithms.map(algo => (
            <button
              key={algo.id}
              onClick={() => setSelectedAlgorithm(algo.id)}
              className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-700 transition-colors ${selectedAlgorithm === algo.id ? 'bg-gray-700' : ''}`}
            >
              <div className="w-6 mr-3 text-gray-400">
                {algo.icon}
              </div>
              <div>
                <p className="font-medium">{algo.name}</p>
                <p className="text-xs text-gray-400">{algo.description}</p>
              </div>
              {selectedAlgorithm === algo.id && (
                <ChevronRight size={16} className="ml-auto text-gray-400" />
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-700 p-4">
          <button
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center justify-center"
            onClick={() => {/* Export/Import-Funktion */}}
          >
            <Save size={18} className="mr-2" />
            Schlüssel exportieren
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow flex items-center`}>
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`mr-4 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Menu size={24} />
            </button>
          )}
          <h2 className="text-xl font-semibold">{currentAlgorithm?.name || 'Verschlüsselung'}</h2>

          <div className="ml-auto">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-3 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4">
          <AlgorithmComponent />
        </main>
      </div>
    </div>
  );
}
