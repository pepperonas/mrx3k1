import React, {useEffect, useState} from 'react';
import {Copy, Download, Key, RefreshCw} from 'lucide-react';

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
                    setError(`Die Nachricht ist zu lang für RSA-OAEP mit ${keySize} Bit (max. ${(keySize / 8) - 42} Bytes). Verwende kürzeren Text oder hybrid encryption.`);
                    return;
                }

                const encoded = new TextEncoder().encode(inputText);
                const encrypted = await window.crypto.subtle.encrypt(
                    {name: "RSA-OAEP"},
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
                <h3 className="text-lg font-semibold mb-4">RSA Verschlüsselung</h3>

                <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        RSA ist ein asymmetrisches Verschlüsselungsverfahren, das mit zwei
                        Schlüsseln arbeitet: einem öffentlichen zum
                        Verschlüsseln und einem privaten zum Entschlüsseln. RSA eignet sich
                        besonders für den sicheren
                        Schlüsselaustausch oder für digitale Signaturen.
                    </p>
                </div>

                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setMode('encrypt')}
                        className={`px-4 py-2 rounded-md ${mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        Verschlüsseln (mit öffentlichem Schlüssel)
                    </button>
                    <button
                        onClick={() => setMode('decrypt')}
                        className={`px-4 py-2 rounded-md ${mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        Entschlüsseln (mit privatem Schlüssel)
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 font-medium">
                            {mode === 'encrypt' ? 'Zu verschlüsselnder Text' : 'Zu entschlüsselnder Text (Base64)'}
                        </label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                            placeholder={mode === 'encrypt' ? 'Text eingeben...' : 'Verschlüsselten Text eingeben...'}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">Ergebnis</label>
                        <div className="relative">
              <textarea
                  value={outputText}
                  readOnly
                  className="w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              />
                            {outputText && (
                                <button
                                    onClick={() => copyToClipboard(outputText)}
                                    className="absolute top-2 right-2 p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300"
                                    title="In Zwischenablage kopieren"
                                >
                                    <Copy size={16}/>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Schlüsselpaar</h4>
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
                                    className="block mb-2 text-sm font-medium">Schlüsselgröße:</label>
                                <select
                                    value={keySize}
                                    onChange={(e) => setKeySize(Number(e.target.value))}
                                    className="p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 w-full"
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
                                        <label className="block mb-1 text-sm font-medium">Öffentlicher
                                            Schlüssel:</label>
                                        <div className="relative">
                      <textarea
                          value={keyPair.publicKey}
                          readOnly
                          rows={3}
                          className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs font-mono"
                      />
                                            <div className="absolute top-2 right-2 flex">
                                                <button
                                                    onClick={() => copyToClipboard(keyPair.publicKey)}
                                                    className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 mr-1"
                                                    title="In Zwischenablage kopieren"
                                                >
                                                    <Copy size={14}/>
                                                </button>
                                                <button
                                                    onClick={() => exportKeys('public')}
                                                    className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300"
                                                    title="Als .pem-Datei exportieren"
                                                >
                                                    <Download size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-sm font-medium">Privater
                                            Schlüssel:</label>
                                        <div className="relative">
                      <textarea
                          value="*** Privater Schlüssel (aus Sicherheitsgründen ausgeblendet) ***"
                          readOnly
                          rows={3}
                          className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs font-mono"
                      />
                                            <div className="absolute top-2 right-2">
                                                <button
                                                    onClick={() => exportKeys('private')}
                                                    className="p-1 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300"
                                                    title="Als .pem-Datei exportieren"
                                                >
                                                    <Download size={14}/>
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
                        disabled={!keyPair}
                        className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md ${!keyPair ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
                    </button>
                </div>
            </div>

            {/* Gespeicherte Schlüsselpaare */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Gespeicherte Schlüsselpaare</h3>

                <div className="flex mb-4">
                    <input
                        type="text"
                        value={keyPairName}
                        onChange={(e) => setKeyPairName(e.target.value)}
                        className="flex-1 p-2 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
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
                                    <p className="font-medium">{keyPair.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {keyPair.keySize || 2048} Bit • Erstellt
                                        am {new Date(keyPair.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <button
                                        onClick={() => loadKeyPair(keyPair)}
                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md mr-2"
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
        </div>
    );
}