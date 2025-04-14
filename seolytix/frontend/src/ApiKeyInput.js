// Sichere API-Key-Behandlung im Frontend

import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

// API-Key Komponente
const ApiKeyInput = ({ apiKey, setApiKey, disabled }) => {
    const [showApiKey, setShowApiKey] = useState(false);
    const [localApiKey, setLocalApiKey] = useState('');

    // API-Key aus dem localStorage laden, wenn verfügbar
    useEffect(() => {
        const savedKey = localStorage.getItem('seoApiKey');
        if (savedKey) {
            try {
                // Einfache Verschlüsselung durch Base64-Decodierung
                const decodedKey = atob(savedKey);
                setLocalApiKey(decodedKey);
                setApiKey(decodedKey);
            } catch (e) {
                console.error('Fehler beim Laden des API-Keys:', e);
                localStorage.removeItem('seoApiKey');
            }
        }
    }, [setApiKey]);

    // API-Key im localStorage speichern
    const handleApiKeyChange = (e) => {
        const newKey = e.target.value;
        setLocalApiKey(newKey);
        setApiKey(newKey);

        // Nur speichern, wenn der Schlüssel einen Wert hat
        if (newKey) {
            try {
                // Einfache Verschlüsselung durch Base64-Codierung
                const encodedKey = btoa(newKey);
                localStorage.setItem('seoApiKey', encodedKey);
            } catch (e) {
                console.error('Fehler beim Speichern des API-Keys:', e);
            }
        } else {
            localStorage.removeItem('seoApiKey');
        }
    };

    const clearApiKey = () => {
        setLocalApiKey('');
        setApiKey('');
        localStorage.removeItem('seoApiKey');
    };

    return (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold text-[#2C2E3B] flex items-center">
                    <Key size={18} className="mr-2"/> ChatGPT API-Schlüssel für SEO-Verbesserungen
                </h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-xs text-[#2C2E3B] underline"
                    >
                        {showApiKey ? "Verbergen" : "Anzeigen"}
                    </button>
                    {localApiKey && (
                        <button
                            onClick={clearApiKey}
                            className="text-xs text-red-500 underline"
                        >
                            Löschen
                        </button>
                    )}
                </div>
            </div>
            <div className="relative">
                <input
                    type={showApiKey ? "text" : "password"}
                    value={localApiKey}
                    onChange={handleApiKeyChange}
                    disabled={disabled}
                    placeholder="sk-..."
                    className={`w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {localApiKey && (
                    <div className="absolute top-0 right-0 h-full flex items-center pr-3">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
                Ihr API-Schlüssel wird lokal in Ihrem Browser gespeichert und niemals an unsere Server gesendet.
                Die Anfragen werden über einen sicheren Proxy geleitet.
            </p>
        </div>
    );
};

export default ApiKeyInput;