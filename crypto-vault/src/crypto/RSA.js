import React, {useEffect, useState, useRef} from 'react';
import {Copy, Download, Key, RefreshCw, Upload, Save, FileText} from 'lucide-react';

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
    const [externalPublicKey, setExternalPublicKey] = useState('');
    const [useExternalKey, setUseExternalKey] = useState(false);
    const [externalKeyLoaded, setExternalKeyLoaded] = useState(false);
    const [externalKeyObj, setExternalKeyObj] = useState(null);

    // Refs für Datei-Upload
    const importFileRef = useRef(null);
    const importPemFileRef = useRef(null);

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
            setUseExternalKey(false);
            setExternalKeyLoaded(false);

            // RSA-Schlüsselpaar generieren
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: keySize, // 2048, 3072 oder 4096 Bit
                    publicExponent: new Uint8Array([1, 0, 1]), // 65537
                    hash: "SHA-256",
                },
                true, // exportierbar
                ["encrypt", "decrypt"]
            );

            // Öffentlichen Schlüssel exportieren
            const publicKey = await window.crypto.subtle.exportKey(
                "spki",
                keyPair.publicKey
            );

            // Privaten Schlüssel exportieren
            const privateKey = await window.crypto.subtle.exportKey(
                "pkcs8",
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
            setError(`Fehler beim Generieren des Schlüsselpaars: ${err.message}`);
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    // Importiere externen öffentlichen Schlüssel
    const importExternalPublicKey = async () => {
        if (!externalPublicKey.trim()) {
            setError('Bitte geben Sie einen öffentlichen Schlüssel ein');
            return;
        }

        try {
            setError('');

            // Der Schlüssel könnte im PEM-Format sein, wir extrahieren den Base64-Teil
            let base64Key = externalPublicKey;

            // PEM-Format entfernen, wenn vorhanden
            if (base64Key.includes('-----BEGIN PUBLIC KEY-----')) {
                base64Key = base64Key
                    .replace('-----BEGIN PUBLIC KEY-----', '')
                    .replace('-----END PUBLIC KEY-----', '')
                    .replace(/\s/g, '');
            }

            // Base64 zu Binär umwandeln
            const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));

            // Schlüssel importieren
            const publicKey = await window.crypto.subtle.importKey(
                "spki",
                binaryKey,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["encrypt"]
            );

            setExternalKeyObj(publicKey);
            setExternalKeyLoaded(true);
            setUseExternalKey(true);
            setInfo('Externer öffentlicher Schlüssel erfolgreich importiert');
            setTimeout(() => setInfo(''), 3000);
        } catch (err) {
            setError(`Fehler beim Importieren des öffentlichen Schlüssels: ${err.message}`);
            console.error(err);
            setExternalKeyLoaded(false);
            setUseExternalKey(false);
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
            setUseExternalKey(false);
            setExternalKeyLoaded(false);

            // Public Key importieren
            const publicKeyBinary = Uint8Array.from(atob(savedKeyPair.publicKey), c => c.charCodeAt(0));
            const publicKey = await window.crypto.subtle.importKey(
                "spki",
                publicKeyBinary,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["encrypt"]
            );

            // Private Key importieren
            const privateKeyBinary = Uint8Array.from(atob(savedKeyPair.privateKey), c => c.charCodeAt(0));
            const privateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                privateKeyBinary,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["decrypt"]
            );

            setKeyPair({
                publicKey: savedKeyPair.publicKey,
                privateKey: savedKeyPair.privateKey,
                subtle: {publicKey, privateKey}
            });

            setKeySize(savedKeyPair.keySize || 2048);
            setInfo('Schlüsselpaar erfolgreich geladen');
            setTimeout(() => setInfo(''), 3000);
        } catch (err) {
            setError(`Fehler beim Laden des Schlüsselpaars: ${err.message}`);
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
            ? '-----BEGIN PUBLIC KEY-----\n'
            : '-----BEGIN PRIVATE KEY-----\n';
        const pemFooter = type === 'public'
            ? '\n-----END PUBLIC KEY-----'
            : '\n-----END PRIVATE KEY-----';

        // Base64 in 64-Zeichen-Zeilen aufteilen
        let formattedKey = '';
        for (let i = 0; i < key.length; i += 64) {
            formattedKey += key.slice(i, i + 64) + '\n';
        }

        const pemContent = pemHeader + formattedKey + pemFooter;

        // Download-Link erstellen
        const blob = new Blob([pemContent], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Exportiere alle Schlüsselpaare als JSON
    const exportAllKeys = () => {
        if (savedKeyPairs.length === 0) {
            setError('Keine Schlüsselpaare zum Exportieren vorhanden');
            return;
        }

        // Schlüsselpaare in JSON umwandeln
        const keyPairsData = JSON.stringify(savedKeyPairs, null, 2);

        // Download-Link erstellen
        const blob = new Blob([keyPairsData], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cryptovault_rsa_keys.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setInfo('Alle Schlüsselpaare wurden erfolgreich exportiert');
        setTimeout(() => setInfo(''), 3000);
    };

    // Datei-Upload-Handler für JSON-Import
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const importedKeys = JSON.parse(content);

                // Validierung der importierten Daten
                if (!Array.isArray(importedKeys)) {
                    throw new Error('Ungültiges Dateiformat. Erwartet ein Array von Schlüsselpaaren.');
                }

                // Prüfe, ob jeder Schlüssel die erforderlichen Eigenschaften hat
                importedKeys.forEach(key => {
                    if (!key.id || !key.name || !key.publicKey || !key.privateKey || !key.createdAt) {
                        throw new Error('Ungültiges Schlüsselpaar-Format in der Datei.');
                    }
                });

                // Importierte Schlüssel zu vorhandenen hinzufügen, Duplikate vermeiden
                const existingIds = new Set(savedKeyPairs.map(key => key.id));
                const newKeys = importedKeys.filter(key => !existingIds.has(key.id));

                if (newKeys.length === 0) {
                    setInfo('Keine neuen Schlüsselpaare zum Importieren gefunden');
                } else {
                    const updatedKeyPairs = [...savedKeyPairs, ...newKeys];
                    localStorage.setItem('rsaKeyPairs', JSON.stringify(updatedKeyPairs));
                    setSavedKeyPairs(updatedKeyPairs);
                    setInfo(`${newKeys.length} Schlüsselpaare erfolgreich importiert`);
                }

                setTimeout(() => setInfo(''), 3000);
            } catch (err) {
                setError(`Fehler beim Importieren der Schlüsselpaare: ${err.message}`);
                console.error(err);
            }

            // Zurücksetzen des Datei-Inputs
            event.target.value = null;
        };

        reader.onerror = () => {
            setError('Fehler beim Lesen der Datei');
            // Zurücksetzen des Datei-Inputs
            event.target.value = null;
        };

        reader.readAsText(file);
    };

    // Datei-Upload-Handler für PEM-Import
    const handlePemFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;

                // Prüfen, ob es sich um einen öffentlichen oder privaten Schlüssel handelt
                if (content.includes('-----BEGIN PUBLIC KEY-----')) {
                    setExternalPublicKey(content);
                    importExternalPublicKey(); // Importiere den Schlüssel direkt
                } else if (content.includes('-----BEGIN PRIVATE KEY-----')) {
                    setError('Private Schlüssel können nicht als externe Schlüssel verwendet werden. Bitte importieren Sie einen öffentlichen Schlüssel.');
                } else {
                    setError('Die Datei enthält keinen gültigen PEM-Schlüssel.');
                }
            } catch (err) {
                setError(`Fehler beim Importieren des Schlüssels: ${err.message}`);
                console.error(err);
            }

            // Zurücksetzen des Datei-Inputs
            event.target.value = null;
        };

        reader.onerror = () => {
            setError('Fehler beim Lesen der Datei');
            // Zurücksetzen des Datei-Inputs
            event.target.value = null;
        };

        reader.readAsText(file);
    };

    // Ver- oder Entschlüsseln mit RSA
    const processText = async () => {
        try {
            setError('');
            if (!inputText) {
                setError('Bitte Text eingeben');
                return;
            }

            if (mode === 'encrypt') {
                // Für Verschlüsselung brauchen wir entweder den eigenen oder externen öffentlichen Schlüssel
                if (!useExternalKey && (!keyPair || !keyPair.subtle)) {
                    setError('Bitte zuerst ein Schlüsselpaar generieren oder laden');
                    return;
                }

                if (useExternalKey && !externalKeyLoaded) {
                    setError('Bitte zuerst einen externen öffentlichen Schlüssel importieren');
                    return;
                }

                const publicKey = useExternalKey ? externalKeyObj : keyPair.subtle.publicKey;
                const actualKeySize = useExternalKey ? 2048 : keySize; // Annahme für externen Schlüssel

                // Text mit öffentlichem Schlüssel verschlüsseln
                // Da RSA beschränkt ist in der Größe des zu verschlüsselnden Texts,
                // ist es besser für kleine Nachrichten oder für hybride Verschlüsselung
                if (new TextEncoder().encode(inputText).length > ((actualKeySize / 8) - 42)) {
                    setError(`Die Nachricht ist zu lang für RSA-OAEP mit ${actualKeySize} Bit (max. ${(actualKeySize / 8) - 42} Bytes). Verwende kürzeren Text oder hybrid encryption.`);
                    return;
                }

                const encoded = new TextEncoder().encode(inputText);
                const encrypted = await window.crypto.subtle.encrypt(
                    {name: "RSA-OAEP"},
                    publicKey,
                    encoded
                );

                // Als Base64 ausgeben
                const base64Result = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
                setOutputText(base64Result);
            } else {
                // Entschlüsselung funktioniert nur mit eigenem privaten Schlüssel
                if (!keyPair || !keyPair.subtle) {
                    setError('Bitte zuerst ein Schlüsselpaar generieren oder laden');
                    return;
                }

                try {
                    // Base64 decodieren
                    const binaryString = atob(inputText);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Text mit privatem Schlüssel entschlüsseln
                    const decrypted = await window.crypto.subtle.decrypt(
                        {name: "RSA-OAEP"},
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
            setError(`Fehler: ${error.message}`);
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
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">RSA Verschlüsselung</h3>

                <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        RSA ist ein asymmetrisches Verschlüsselungsverfahren, das mit zwei
                        Schlüsseln arbeitet: einem öffentlichen zum
                        Verschlüsseln und einem privaten zum Entschlüsseln. RSA eignet sich
                        besonders für den sicheren
                        Schlüsselaustausch oder für digitale Signaturen.
                    </p>
                </div>

                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => {
                            setMode('encrypt');
                        }}
                        className={`px-4 py-2 rounded-md ${mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Verschlüsseln (mit öffentlichem Schlüssel)
                    </button>
                    <button
                        onClick={() => {
                            setMode('decrypt');
                            setUseExternalKey(false); // Deaktiviere externen Schlüssel bei Entschlüsselung
                        }}
                        className={`px-4 py-2 rounded-md ${mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Entschlüsseln (mit privatem Schlüssel)
                    </button>
                </div>

                {mode === 'encrypt' && (
                    <div className="mb-4 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                id="useExternalKey"
                                checked={useExternalKey}
                                onChange={(e) => setUseExternalKey(e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor="useExternalKey" className="font-medium dark:text-gray-200">
                                Mit fremdem öffentlichen Schlüssel verschlüsseln
                            </label>
                        </div>

                        {useExternalKey && (
                            <div className="mt-2">
                                <label className="block mb-1 text-sm font-medium dark:text-gray-200">
                                    Öffentlicher Schlüssel (PEM oder Base64):
                                </label>
                                <div className="flex mb-2">
                                    <textarea
                                        value={externalPublicKey}
                                        onChange={(e) => setExternalPublicKey(e.target.value)}
                                        rows={4}
                                        className="flex-1 p-2 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-xs font-mono"
                                        placeholder="-----BEGIN PUBLIC KEY----- ... oder Base64-Format"
                                    />
                                    <button
                                        onClick={importExternalPublicKey}
                                        disabled={!externalPublicKey.trim()}
                                        className="px-3 bg-blue-600 text-white rounded-r-md flex items-center justify-center"
                                    >
                                        <Upload size={18} className="mr-1" />
                                        Importieren
                                    </button>
                                </div>

                                {/* PEM-Datei hochladen */}
                                <div className="flex items-center">
                                    <button
                                        onClick={() => importPemFileRef.current.click()}
                                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md flex items-center text-sm"
                                    >
                                        <FileText size={16} className="mr-1" />
                                        PEM-Datei importieren
                                    </button>
                                    <input
                                        type="file"
                                        ref={importPemFileRef}
                                        onChange={handlePemFileUpload}
                                        accept=".pem,.key,.cert"
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {externalKeyLoaded && (
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        Externer öffentlicher Schlüssel wurde geladen ✓
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

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
                                    <Copy size={16} className="dark:text-gray-200"/>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {!useExternalKey && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium dark:text-gray-100">Schlüsselpaar</h4>
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-blue-600 dark:text-blue-400 text-sm"
                            >
                                {showAdvanced ? 'Weniger anzeigen' : 'Erweiterte Optionen'}
                            </button>
                        </div>

                        {showAdvanced && (
                            <div
                                className="mb-4 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                <div className="mb-4">
                                    <label
                                        className="block mb-2 text-sm font-medium dark:text-gray-200">Schlüsselgröße:</label>
                                    <select
                                        value={keySize}
                                        onChange={(e) => setKeySize(Number(e.target.value))}
                                        className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 w-full"
                                        disabled={keyPair !== null}
                                    >
                                        <option value={1024}>1024 Bit (weniger sicher, schneller)
                                        </option>
                                        <option value={2048}>2048 Bit (empfohlen)</option>
                                        <option value={4096}>4096 Bit (sicherer, langsamer)</option>
                                    </select>
                                </div>

                                {keyPair && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block mb-1 text-sm font-medium dark:text-gray-200">Öffentlicher
                                                Schlüssel:</label>
                                            <div className="relative">
                                              <textarea
                                                  value={keyPair.publicKey}
                                                  readOnly
                                                  rows={3}
                                                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-xs font-mono"
                                              />
                                                <div className="absolute top-2 right-2 flex">
                                                    <button
                                                        onClick={() => copyToClipboard(keyPair.publicKey)}
                                                        className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 mr-1"
                                                        title="In Zwischenablage kopieren"
                                                    >
                                                        <Copy size={14} className="dark:text-gray-200"/>
                                                    </button>
                                                    <button
                                                        onClick={() => exportKeys('public')}
                                                        className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                                                        title="Als .pem-Datei exportieren"
                                                    >
                                                        <Download size={14} className="dark:text-gray-200"/>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-1 text-sm font-medium dark:text-gray-200">Privater
                                                Schlüssel:</label>
                                            <div className="relative">
                                              <textarea
                                                  value="*** Privater Schlüssel (aus Sicherheitsgründen ausgeblendet) ***"
                                                  readOnly
                                                  rows={3}
                                                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-xs font-mono"
                                              />
                                                <div className="absolute top-2 right-2">
                                                    <button
                                                        onClick={() => exportKeys('private')}
                                                        className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                                                        title="Als .pem-Datei exportieren"
                                                    >
                                                        <Download size={14} className="dark:text-gray-200"/>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                Der private Schlüssel sollte sicher aufbewahrt und
                                                niemals weitergegeben werden!
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex">
                            <button
                                onClick={generateKeyPair}
                                disabled={isGenerating}
                                className={`flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw size={18} className="mr-2 animate-spin"/>
                                        Generiere Schlüsselpaar...
                                    </>
                                ) : (
                                    <>
                                        <Key size={18} className="mr-2"/>
                                        Neues RSA-Schlüsselpaar generieren
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div
                        className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                        {error}
                    </div>
                )}

                {info && (
                    <div
                        className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                        {info}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={processText}
                        disabled={mode === 'encrypt' ? (useExternalKey && !externalKeyLoaded) || (!useExternalKey && !keyPair) : !keyPair}
                        className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md ${(mode === 'encrypt' ? (useExternalKey && !externalKeyLoaded) || (!useExternalKey && !keyPair) : !keyPair) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
                    </button>
                </div>
            </div>

            {/* Gespeicherte Schlüsselpaare - nur anzeigen, wenn nicht im externen Schlüssel-Modus */}
            {!useExternalKey && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold dark:text-gray-100">Gespeicherte Schlüsselpaare</h3>

                        {/* Export/Import Buttons */}
                        <div className="flex space-x-2">
                            <button
                                onClick={exportAllKeys}
                                disabled={savedKeyPairs.length === 0}
                                className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center text-sm ${savedKeyPairs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Save size={16} className="mr-1" />
                                Alle exportieren
                            </button>

                            <button
                                onClick={() => importFileRef.current.click()}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center text-sm"
                            >
                                <Upload size={16} className="mr-1" />
                                Importieren
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

                    <div className="flex mb-4">
                        <input
                            type="text"
                            value={keyPairName}
                            onChange={(e) => setKeyPairName(e.target.value)}
                            className="flex-1 p-2 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            placeholder="Schlüsselpaarname"
                            disabled={!keyPair}
                        />
                        <button
                            onClick={saveKeyPair}
                            disabled={!keyPair}
                            className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md ${!keyPair ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Aktuelles Schlüsselpaar speichern
                        </button>
                    </div>

                    {savedKeyPairs.length > 0 ? (
                        <div
                            className="border rounded-md divide-y dark:divide-gray-700 dark:border-gray-700">
                            {savedKeyPairs.map(keyPair => (
                                <div key={keyPair.id} className="p-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium dark:text-gray-100">{keyPair.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {keyPair.keySize || 2048} Bit • Erstellt
                                            am {new Date(keyPair.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => loadKeyPair(keyPair)}
                                            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-md mr-2 hover:bg-gray-300 dark:hover:bg-gray-600"
                                        >
                                            Laden
                                        </button>
                                        <button
                                            onClick={() => deleteKeyPair(keyPair.id)}
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
                            Keine gespeicherten Schlüsselpaare vorhanden
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}