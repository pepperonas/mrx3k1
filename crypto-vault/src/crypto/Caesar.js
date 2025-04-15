import React, {useState} from 'react';
import {Copy, RefreshCw, RotateCw} from 'lucide-react';

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
            setError(`Fehler: ${error.message}`);
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
        const allPossibilities = Array.from({length: 25}, (_, i) => {
            const shiftValue = i + 1;
            const decrypted = caesarCipher(inputText, shiftValue, false);
            return `Shift ${shiftValue}: ${decrypted}`;
        }).join('\n');

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
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Caesar Verschlüsselung</h3>

                <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Die Caesar-Verschlüsselung ist eine der ältesten und einfachsten
                        Verschlüsselungstechniken.
                        Sie funktioniert durch Verschieben jedes Buchstabens im Alphabet um eine
                        feste Anzahl von Positionen.
                        Die Methode ist nach Julius Caesar benannt, der sie für seine private
                        Korrespondenz verwendete.
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        <strong className="dark:text-white">Wichtiger Hinweis:</strong> Die Caesar-Verschlüsselung ist sehr
                        einfach zu knacken und sollte
                        nicht für sensible Daten verwendet werden. Sie dient hier hauptsächlich zu
                        Demonstrationszwecken.
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
                    <button
                        onClick={bruteForce}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md flex items-center"
                    >
                        <RotateCw size={16} className="mr-1 dark:text-gray-200"/>
                        Brute Force
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 font-medium dark:text-gray-200">Eingabetext</label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            placeholder="Text eingeben..."
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

                <div className="mt-6">
                    <label className="block mb-2 font-medium dark:text-gray-200">Verschiebung (Shift)</label>
                    <div className="flex items-center">
                        <input
                            type="range"
                            min="1"
                            max="25"
                            value={shift}
                            onChange={(e) => setShift(parseInt(e.target.value))}
                            className="flex-1 mr-3"
                        />
                        <div className="flex items-center">
                            <input
                                type="number"
                                min="1"
                                max="25"
                                value={shift}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value >= 1 && value <= 25) {
                                        setShift(value);
                                    }
                                }}
                                className="w-16 p-2 border rounded-md text-center bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            />
                            <button
                                onClick={generateRandomShift}
                                className="ml-2 p-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                                title="Zufälligen Wert generieren"
                            >
                                <RefreshCw size={16} className="dark:text-gray-200"/>
                            </button>
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        Bei der Caesar-Verschlüsselung werden Buchstaben um einen festen Wert
                        (hier: {shift}) im Alphabet verschoben.
                        Beispiel (Shift {shift}): A → {String.fromCharCode(65 + shift % 26)}, B
                        → {String.fromCharCode(66 + shift % 26)}
                    </p>
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
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                        {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
                    </button>
                </div>

                <div
                    className="mt-6 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-medium mb-2 dark:text-gray-100">Wissenswertes zur Caesar-Verschlüsselung</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <li>• Die Caesar-Verschlüsselung ist eine <strong className="dark:text-white">monoalphabetische
                            Substitutionschiffre</strong>, bei der jeder Buchstabe durch einen
                            anderen ersetzt wird, der eine bestimmte Anzahl von Positionen später im
                            Alphabet folgt.
                        </li>
                        <li>• Mit nur 25 möglichen Schlüsseln (Verschiebungen) ist sie durch
                            einfaches Ausprobieren (Brute Force) leicht zu knacken.
                        </li>
                        <li>• Moderne Anwendungen: Obwohl nicht sicher, wird sie manchmal für
                            einfache Rätsel oder als grundlegendes Beispiel für Kryptographie
                            verwendet.
                        </li>
                        <li>• In der ROT13-Variante (Verschiebung um 13) wird sie für harmlose
                            Spoiler-Verschleierung im Internet eingesetzt.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}