import React, {useRef, useState} from 'react';
import axios from 'axios';
import {useDropzone} from 'react-dropzone';
import './App.css';

function App() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [model, setModel] = useState('htdemucs');
    const [format, setFormat] = useState('mp3');

    const cancelTokenRef = useRef(null);

    // API URL Helper-Funktion
    const getApiUrl = (path) => {
        // Im Produktionsmodus brauchen wir den vollen Pfad mit /voice-extract
        return process.env.NODE_ENV === 'production'
            ? `/voice-extract/api${path}`
            : `/api${path}`;
    };

    const {getRootProps, getInputProps} = useDropzone({
        accept: {
            'audio/*': ['.mp3', '.wav', '.flac', '.ogg', '.m4a']
        },
        onDrop: acceptedFiles => {
            setFiles(acceptedFiles.map(file => Object.assign(file, {
                preview: URL.createObjectURL(file)
            })));
            setResults(null);
            setError(null);
        }
    });

    const handleSubmit = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setProcessing(false);
        setProgress(0);
        setError(null);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('model', model);
        formData.append('format', format);

        cancelTokenRef.current = axios.CancelToken.source();

        try {
            // Upload files using the helper function
            const uploadResponse = await axios.post(getApiUrl('/upload'), formData, {
                cancelToken: cancelTokenRef.current.token,
                onUploadProgress: progressEvent => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            setUploading(false);
            setProcessing(true);

            // Start processing task
            const taskId = uploadResponse.data.taskId;

            // Poll for results using the helper function
            const pollInterval = setInterval(async () => {
                try {
                    const statusResponse = await axios.get(getApiUrl(`/status/${taskId}`));
                    const status = statusResponse.data;

                    if (status.state === 'completed') {
                        clearInterval(pollInterval);
                        setProcessing(false);
                        setResults(status.results);
                    } else if (status.state === 'error') {
                        clearInterval(pollInterval);
                        setProcessing(false);
                        setError(status.error || 'An error occurred during processing');
                    } else if (status.state === 'processing') {
                        setProgress(status.progress || 0);
                    }
                } catch (err) {
                    clearInterval(pollInterval);
                    setProcessing(false);
                    setError('Failed to check processing status');
                    console.error(err);
                }
            }, 2000);

        } catch (err) {
            setUploading(false);
            setProcessing(false);
            if (axios.isCancel(err)) {
                setError('Upload cancelled');
            } else {
                setError('Error uploading files: ' + (err.response?.data?.message || err.message));
                console.error(err);
            }
        }
    };

    const cancelUpload = () => {
        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancel('Upload cancelled by user');
        }
    };

    const handleDownload = (filePath) => {
        console.log("Download-Pfad:", filePath);

        // Direkter Download statt über Link
        const downloadUrl = getApiUrl(`/download/${encodeURIComponent(filePath)}`);
        console.log("Download-URL:", downloadUrl);

        // Führe einen fetch aus und lade die Datei als Blob
        fetch(downloadUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                // Erstelle eine URL für den Blob
                const url = window.URL.createObjectURL(blob);

                // Erstelle ein temporäres a-Element
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                // Setze den Dateinamen aus dem Pfad
                const fileName = filePath.split('/').pop();
                a.download = fileName;

                // Füge das Element zum DOM hinzu, klicke es und entferne es wieder
                document.body.appendChild(a);
                a.click();

                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error('Download fehlgeschlagen:', error);
                setError(`Fehler beim Herunterladen: ${error.message}`);
            });
    };

    return (
        <div className="app">
            <header className="header">
                <h1>VoiceXtract</h1>
                <p>Extract vocals from music using state-of-the-art audio source separation</p>
            </header>

            <main className="main">
                <section className="upload-section">
                    <div {...getRootProps({className: 'dropzone'})}>
                        <input {...getInputProps()} />
                        <p>Drag & drop audio files here, or click to select files</p>
                        <small>Supported formats: MP3, WAV, FLAC, OGG, M4A</small>
                    </div>

                    {files.length > 0 && (
                        <div className="file-list">
                            <h3>Selected Files ({files.length})</h3>
                            <ul>
                                {files.map(file => (
                                    <li key={file.name}>
                                        {file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="options">
                        <div className="option-group">
                            <label>
                                Model:
                                <select value={model} onChange={e => setModel(e.target.value)}>
                                    <option value="htdemucs">htdemucs (recommended)</option>
                                    <option value="htdemucs_ft">htdemucs_ft (fine-tuned)</option>
                                    <option value="mdx_extra">mdx_extra (best quality)</option>
                                </select>
                            </label>

                            <label>
                                Output Format:
                                <select value={format} onChange={e => setFormat(e.target.value)}>
                                    <option value="mp3">MP3</option>
                                    <option value="wav">WAV</option>
                                </select>
                            </label>
                        </div>

                        <div className="buttons">
                            <button
                                className="process-button"
                                onClick={handleSubmit}
                                disabled={files.length === 0 || uploading || processing}
                            >
                                Process Files
                            </button>

                            {uploading && (
                                <button className="cancel-button" onClick={cancelUpload}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {(uploading || processing) && (
                    <section className="progress-section">
                        <h3>{uploading ? 'Uploading...' : 'Processing...'}</h3>
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{width: `${progress}%`}}
                            ></div>
                        </div>
                        <p>{progress}%</p>
                    </section>
                )}

                {error && (
                    <section className="error-section">
                        <h3>Error</h3>
                        <p>{error}</p>
                    </section>
                )}

                {results && (
                    <section className="results-section">
                        <h3>Extraction Complete</h3>
                        <div className="results-grid">
                            {Object.entries(results).map(([file, paths]) => (
                                <div className="result-card" key={file}>
                                    <h4>{file}</h4>
                                    <div className="result-links">
                                        {paths.vocals && (
                                            <button
                                                className="download-button"
                                                onClick={() => handleDownload(paths.vocals)}
                                            >
                                                Download Vocals
                                            </button>
                                        )}
                                        {paths.accompaniment && (
                                            <button
                                                className="download-button"
                                                onClick={() => handleDownload(paths.accompaniment)}
                                            >
                                                Download Accompaniment
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <footer className="footer">
                <p>Made with ❤️ by Martin Pfeffer</p>
            </footer>
        </div>
    );
}

export default App;