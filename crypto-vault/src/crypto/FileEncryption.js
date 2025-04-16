import React, { useState, useRef, useCallback } from 'react';
import { File, Upload, Download, Trash2, Save, RefreshCw, Archive, FileText, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

// FileEncryption Komponente für CryptoVault
export function FileEncryption() {
    const [files, setFiles] = useState([]);
    const [encryptedFiles, setEncryptedFiles] = useState([]);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState('encrypt');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [keySize, setKeySize] = useState(256);
    const [savedKeys, setSavedKeys] = useState([]);
    const [keyName, setKeyName] = useState('');
    const [processingProgress, setProcessingProgress] = useState({});
    const [expandedSettings, setExpandedSettings] = useState(false);

    const fileInputRef = useRef(null);
    const dropAreaRef = useRef(null);

    // Lade gespeicherte Schlüssel beim Start
    React.useEffect(() => {
        const keys = JSON.parse(localStorage.getItem('aesKeys') || '[]');
        setSavedKeys(keys);
    }, []);

    // Drag & Drop Handler
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropAreaRef.current) {
            dropAreaRef.current.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600');
        }
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropAreaRef.current) {
            dropAreaRef.current.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600');
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (dropAreaRef.current) {
            dropAreaRef.current.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600');
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            if (mode === 'encrypt') {
                handleNewFiles(newFiles);
            } else {
                handleEncryptedFiles(newFiles);
            }
        }
    }, [mode]);

    // Dateien für Verschlüsselung hinzufügen
    const handleNewFiles = (newFiles) => {
        // Größenbeschränkung und Format-Check könnten hier implementiert werden

        // Dateien mit eindeutigen IDs hinzufügen
        const filesWithIds = newFiles.map(file => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            file,
            size: file.size,
            name: file.name,
            type: file.type,
            status: 'ready'
        }));

        setFiles(currentFiles => [...currentFiles, ...filesWithIds]);
        setInfo(`${newFiles.length} Datei(en) hinzugefügt`);
        setTimeout(() => setInfo(''), 3000);
    };

    // Dateien für Entschlüsselung hinzufügen
    const handleEncryptedFiles = (newFiles) => {
        // Bei der Entschlüsselung nur .enc Dateien akzeptieren
        const validFiles = newFiles.filter(file =>
            file.name.endsWith('.enc') || file.type === 'application/octet-stream'
        );

        if (validFiles.length !== newFiles.length) {
            setError(`${newFiles.length - validFiles.length} Datei(en) wurden ignoriert. Bitte nur .enc Dateien für die Entschlüsselung hochladen.`);
            setTimeout(() => setError(''), 5000);
        }

        // Dateien mit eindeutigen IDs hinzufügen
        const filesWithIds = validFiles.map(file => ({
            id: `encrypted-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            file,
            size: file.size,
            name: file.name,
            type: file.type,
            status: 'ready'
        }));

        setEncryptedFiles(currentFiles => [...currentFiles, ...filesWithIds]);

        if (validFiles.length > 0) {
            setInfo(`${validFiles.length} verschlüsselte Datei(en) hinzugefügt`);
            setTimeout(() => setInfo(''), 3000);
        }
    };

    // Manueller Datei-Upload
    const handleFileUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            if (mode === 'encrypt') {
                handleNewFiles(newFiles);
            } else {
                handleEncryptedFiles(newFiles);
            }
            // Zurücksetzen des Datei-Inputs
            e.target.value = null;
        }
    };

    // Datei entfernen
    const removeFile = (id, isEncrypted = false) => {
        if (isEncrypted) {
            setEncryptedFiles(currentFiles => currentFiles.filter(file => file.id !== id));
        } else {
            setFiles(currentFiles => currentFiles.filter(file => file.id !== id));
        }
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

    // Verschlüssele eine einzelne Datei
    const encryptFile = async (fileObj) => {
        try {
            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 0, status: 'processing' }
            }));

            const fileData = await fileObj.file.arrayBuffer();

            // Passwort in Schlüssel umwandeln
            const passwordBuffer = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(password)
            );

            // IV für AES-GCM (zufällig)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Schlüssel aus Passwort ableiten
            const key = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'AES-GCM', length: keySize },
                false,
                ['encrypt']
            );

            // Datei-Daten verschlüsseln
            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 30, status: 'processing' }
            }));

            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                fileData
            );

            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 70, status: 'processing' }
            }));

            // Verschlüsselte Daten und IV zusammenführen
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const result = new Uint8Array(iv.length + encryptedArray.length);
            result.set(iv);
            result.set(encryptedArray, iv.length);

            // Verschlüsselte Datei erstellen
            const encryptedBlob = new Blob([result], { type: 'application/octet-stream' });
            // File-Konstruktor vermeiden, stattdessen Blob verwenden

            // URL für den Download erstellen
            const url = URL.createObjectURL(encryptedBlob);

            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 100, status: 'completed' }
            }));

            return {
                id: `encrypted-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                file: encryptedBlob,  // Direkt den Blob verwenden
                originalName: fileObj.name,
                name: `${fileObj.name}.enc`,
                size: encryptedBlob.size,
                type: 'application/octet-stream',
                url: url,
                status: 'completed'
            };
        } catch (err) {
            console.error('Fehler beim Verschlüsseln:', err);
            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 0, status: 'error' }
            }));
            throw err;
        }
    };

    // Entschlüssele eine einzelne Datei
    const decryptFile = async (fileObj) => {
        try {
            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 0, status: 'processing' }
            }));

            const fileData = await fileObj.file.arrayBuffer();
            const dataView = new Uint8Array(fileData);

            // IV und verschlüsselte Daten trennen
            const iv = dataView.slice(0, 12);
            const encryptedData = dataView.slice(12);

            // Passwort in Schlüssel umwandeln
            const passwordBuffer = await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(password)
            );

            // Schlüssel aus Passwort ableiten
            const key = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'AES-GCM', length: keySize },
                false,
                ['decrypt']
            );

            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 30, status: 'processing' }
            }));

            // Daten entschlüsseln
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                encryptedData
            );

            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 70, status: 'processing' }
            }));

            // Originalnamen extrahieren
            let originalName = fileObj.name;
            if (originalName.endsWith('.enc')) {
                originalName = originalName.slice(0, -4);
            }

            // MIME-Typ schätzen oder auf Binärdaten setzen
            let mimeType = 'application/octet-stream';

            // Entschlüsselte Datei erstellen
            const decryptedBlob = new Blob([decryptedBuffer], { type: mimeType });

            // URL für den Download erstellen
            const url = URL.createObjectURL(decryptedBlob);

            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 100, status: 'completed' }
            }));

            return {
                id: `decrypted-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                file: decryptedBlob,
                name: originalName,
                size: decryptedBlob.size,
                type: mimeType,
                url: url,
                status: 'completed'
            };
        } catch (err) {
            console.error('Fehler beim Entschlüsseln:', err);
            setProcessingProgress(prev => ({
                ...prev,
                [fileObj.id]: { progress: 0, status: 'error' }
            }));
            throw err;
        }
    };

    // Dateien in Batch verarbeiten
    const processBatch = async () => {
        try {
            setError('');
            if (!password) {
                setError('Bitte ein Passwort oder Schlüssel eingeben');
                return;
            }

            const filesToProcess = mode === 'encrypt' ? files : encryptedFiles;

            if (filesToProcess.length === 0) {
                setError(`Bitte zuerst Dateien hinzufügen, die ${mode === 'encrypt' ? 'verschlüsselt' : 'entschlüsselt'} werden sollen`);
                return;
            }

            setIsProcessing(true);

            const processedFiles = [];
            const errors = [];

            // Sequentiell verarbeiten, um Speicherprobleme zu vermeiden
            for (const fileObj of filesToProcess) {
                try {
                    if (mode === 'encrypt') {
                        const encryptedFileObj = await encryptFile(fileObj);
                        processedFiles.push(encryptedFileObj);
                    } else {
                        const decryptedFileObj = await decryptFile(fileObj);
                        processedFiles.push(decryptedFileObj);
                    }
                } catch (err) {
                    errors.push({ file: fileObj.name, error: err.message });
                }
            }

            if (errors.length > 0) {
                const errorMsg = `Fehler bei ${errors.length} Datei(en): ${errors.map(e => e.file).join(', ')}`;
                setError(errorMsg);
                setTimeout(() => setError(''), 5000);
            }

            if (processedFiles.length > 0) {
                if (mode === 'encrypt') {
                    setEncryptedFiles(prevFiles => [...prevFiles, ...processedFiles]);
                    setInfo(`${processedFiles.length} Datei(en) erfolgreich verschlüsselt`);
                } else {
                    // Für entschlüsselte Dateien bieten wir die unmittelbare Download-Möglichkeit
                    setInfo(`${processedFiles.length} Datei(en) erfolgreich entschlüsselt`);

                    // Download-Links erstellen
                    processedFiles.forEach(file => {
                        const link = document.createElement('a');
                        link.href = file.url;
                        link.download = file.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    });
                }
                setTimeout(() => setInfo(''), 3000);
            }
        } catch (err) {
            setError(`Verarbeitung fehlgeschlagen: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Herunterladen einer einzelnen Datei
    const downloadFile = (fileObj) => {
        // URL direkt aus dem fileObj verwenden oder neu erstellen
        const url = fileObj.url || URL.createObjectURL(fileObj.file);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileObj.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Nur aufräumen, wenn wir eine neue URL erstellt haben
        if (!fileObj.url) {
            URL.revokeObjectURL(url);
        }
    };

    // Mehrere Dateien als ZIP herunterladen
    const downloadAsZip = async () => {
        if (encryptedFiles.length === 0) {
            setError('Keine verschlüsselten Dateien zum Herunterladen vorhanden');
            return;
        }

        setIsProcessing(true);
        setInfo('Erzeuge Downloads...');

        try {
            // Als Alternative zu JSZip: Alle Dateien einzeln herunterladen
            for (let i = 0; i < encryptedFiles.length; i++) {
                const fileObj = encryptedFiles[i];
                downloadFile(fileObj);
                setInfo(`Datei ${i+1}/${encryptedFiles.length} wird heruntergeladen...`);

                // Kleine Pause zwischen Downloads, damit der Browser Zeit hat, zu reagieren
                if (i < encryptedFiles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            setInfo(`${encryptedFiles.length} Datei(en) erfolgreich zum Download bereitgestellt.`);
            setInfo('Hinweis: Für ZIP-Funktionalität bitte "npm install jszip" ausführen.');
            setTimeout(() => setInfo(''), 5000);
        } catch (err) {
            setError(`Fehler beim Herunterladen der Dateien: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Dateiverschlüsselung</h3>

                <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Diese Funktion ermöglicht es Ihnen, Dateien mit AES-GCM zu verschlüsseln und entschlüsseln.
                        Verschlüsselte Dateien haben die Dateiendung .enc und können später mit dem gleichen Passwort wieder entschlüsselt werden.
                    </p>
                </div>

                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setMode('encrypt')}
                        className={`px-4 py-2 rounded-md ${mode === 'encrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Dateien verschlüsseln
                    </button>
                    <button
                        onClick={() => setMode('decrypt')}
                        className={`px-4 py-2 rounded-md ${mode === 'decrypt' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                        Dateien entschlüsseln
                    </button>
                </div>

                {/* Passwort/Schlüssel Bereich */}
                <div className="mt-6 mb-6">
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

                    <div className="flex items-center mt-2 justify-between">
                        <div className="flex items-center">
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

                        <button
                            onClick={() => setExpandedSettings(!expandedSettings)}
                            className="flex items-center text-blue-600 dark:text-blue-400 text-sm"
                        >
                            {expandedSettings ? (
                                <>
                                    <ChevronUp size={16} className="mr-1" />
                                    Gespeicherte Schlüssel ausblenden
                                </>
                            ) : (
                                <>
                                    <ChevronDown size={16} className="mr-1" />
                                    Gespeicherte Schlüssel anzeigen
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Gespeicherte Schlüssel */}
                {expandedSettings && (
                    <div className="mb-6 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        <h4 className="font-medium mb-3 dark:text-gray-100">Gespeicherte Schlüssel</h4>

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
                            <p className="text-gray-500 dark:text-gray-400 text-center py-2">
                                Keine gespeicherten Schlüssel vorhanden
                            </p>
                        )}
                    </div>
                )}

                {/* Drag & Drop Bereich */}
                <div
                    ref={dropAreaRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center transition-colors duration-200 mb-6"
                >
                    <div className="flex flex-col items-center">
                        <Upload size={36} className="text-gray-400 dark:text-gray-500 mb-3" />
                        <p className="mb-2 text-lg font-medium dark:text-gray-200">
                            Dateien per Drag & Drop hinzufügen
                        </p>
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            oder klicken Sie zum Auswählen
                        </p>
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                        >
                            Dateien auswählen
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            multiple
                            className="hidden"
                            accept={mode === 'decrypt' ? '.enc,application/octet-stream' : '*'}
                        />
                    </div>
                </div>

                {/* Liste der zu verarbeitenden Dateien */}
                {(mode === 'encrypt' && files.length > 0) || (mode === 'decrypt' && encryptedFiles.length > 0) ? (
                    <div className="mb-6">
                        <h4 className="font-medium mb-3 dark:text-gray-100">
                            {mode === 'encrypt'
                                ? `Zu verschlüsselnde Dateien (${files.length})`
                                : `Zu entschlüsselnde Dateien (${encryptedFiles.length})`}
                        </h4>

                        <div className="border rounded-md divide-y dark:divide-gray-700 dark:border-gray-600">
                            {(mode === 'encrypt' ? files : encryptedFiles).map(fileObj => (
                                <div key={fileObj.id} className="p-3 flex items-center">
                                    <FileText size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate dark:text-gray-100" title={fileObj.name}>
                                            {fileObj.name}
                                        </p>
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <span>{(fileObj.size / 1024).toFixed(1)} KB</span>
                                            {processingProgress[fileObj.id] && (
                                                <div className="ml-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${processingProgress[fileObj.id].status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${processingProgress[fileObj.id].progress}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(fileObj.id, mode === 'decrypt')}
                                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                        disabled={isProcessing}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={processBatch}
                                disabled={isProcessing}
                                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw size={18} className="mr-2 animate-spin" />
                                        Verarbeite...
                                    </>
                                ) : (
                                    <>
                                        {mode === 'encrypt' ? 'Verschlüsseln' : 'Entschlüsseln'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : null}

                {/* Liste der verschlüsselten Dateien (nur im Verschlüsselungsmodus) */}
                {mode === 'encrypt' && encryptedFiles.length > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium dark:text-gray-100">
                                Verschlüsselte Dateien ({encryptedFiles.length})
                            </h4>

                            <div className="flex space-x-2">
                                <button
                                    onClick={downloadAsZip}
                                    disabled={encryptedFiles.length === 0 || isProcessing}
                                    className={`px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center text-sm ${(encryptedFiles.length === 0 || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Archive size={16} className="mr-1" />
                                    Als ZIP herunterladen
                                </button>
                            </div>
                        </div>

                        <div className="border rounded-md divide-y dark:divide-gray-700 dark:border-gray-600">
                            {encryptedFiles.map(fileObj => (
                                <div key={fileObj.id} className="p-3 flex items-center">
                                    <File size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate dark:text-gray-100" title={fileObj.name}>
                                            {fileObj.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {(fileObj.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => downloadFile(fileObj)}
                                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 mr-1"
                                        title="Herunterladen"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button
                                        onClick={() => removeFile(fileObj.id, true)}
                                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                        disabled={isProcessing}
                                        title="Entfernen"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Hinweise zur Dateiverschlüsselung</h3>

                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <li>• Die Dateiverschlüsselung verwendet <strong className="dark:text-white">AES-GCM mit 256-Bit</strong> Schlüsseln und einen sicheren Initialization Vector (IV).</li>
                    <li>• Verschlüsselte Dateien erhalten die Dateiendung <strong className="dark:text-white">.enc</strong> und können nur mit dem gleichen Passwort entschlüsselt werden.</li>
                    <li>• Es gibt keine Möglichkeit, das Passwort wiederherzustellen. Bewahren Sie Ihre Passwörter oder Schlüssel sicher auf!</li>
                    <li>• Um verschlüsselte Dateien zu entschlüsseln, wechseln Sie zum "Dateien entschlüsseln"-Modus und laden Sie die .enc-Dateien hoch.</li>
                    <li>• Für maximale Sicherheit sollten Sie einen zufällig generierten Schlüssel verwenden und diesen sicher speichern.</li>
                </ul>
            </div>
        </div>
    );
}