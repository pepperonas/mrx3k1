// src/components/DevView.jsx - Entwickleransicht für Hue Bridge Konfiguration
import React, { useState, useEffect } from 'react';
import '../styles/dev.css';

// Farbkonstanten für die Anzeige
const STATUS_COLORS = {
    active: '#4CAF50',   // Grün
    inactive: '#F44336', // Rot
    unknown: '#9e9e9e',  // Grau
};

// Effekttypen und ihre nutzerfreundlichen Namen
const EFFECT_TYPES = {
    'none': 'Kein Effekt',
    'colorloop': 'Farbschleife',
    'breathe': 'Pulsieren',
    'candle': 'Kerzenlicht',
    'fireplace': 'Kaminfeuer',
    'sunrise': 'Sonnenaufgang',
    'alert': 'Blinken',
    'select': 'Einmaliges Blinken',
    'lselect': 'Mehrfaches Blinken',
    'dynamic_animation': 'Dynamische Animation',
    'smooth_transition': 'Sanfter Übergang',
    'entertainment_sync': 'Entertainment Sync',
    'transition': 'Übergangseffekt',
    'dynamic': 'Dynamischer Effekt',
    'entertainment': 'Unterhaltungseffekt'
};

const DevView = ({ username, bridgeIP }) => {
    const [bridgeConfig, setBridgeConfig] = useState(null);
    const [lights, setLights] = useState(null);
    const [groups, setGroups] = useState(null);
    const [scenes, setScenes] = useState(null);
    const [rules, setRules] = useState(null);
    const [schedules, setSchedules] = useState(null);
    const [sensors, setSensors] = useState(null);
    const [activeSceneData, setActiveSceneData] = useState([]);
    const [activeEffectsData, setActiveEffectsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('effects-status'); // Standardmäßig Effekte anzeigen
    const [refreshInterval, setRefreshInterval] = useState(5000); // 5 Sekunden
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);
    const [logData, setLogData] = useState([]);
    const [isLoggingEnabled, setIsLoggingEnabled] = useState(false);
    const [logFilename, setLogFilename] = useState('hue-bridge-log.txt');
    const [logFileHandle, setLogFileHandle] = useState(null);

    // Funktion zum Erstellen eines Log-Eintrags
    const addLogEntry = (entry) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${entry}`;

        setLogData(prevLogs => {
            // Maximal 1000 Einträge aufbewahren, um Speicher zu sparen
            const updatedLogs = [...prevLogs, logEntry].slice(-1000);

            // Wenn Logging aktiviert ist, auch in Datei schreiben
            if (isLoggingEnabled) {
                saveLogToFile(logEntry);
            }

            return updatedLogs;
        });
    };

    // Datei für das Logging auswählen/erstellen
    const selectLogFile = async () => {
        try {
            // Prüfen, ob File System Access API verfügbar ist
            if ('showSaveFilePicker' in window) {
                const options = {
                    suggestedName: logFilename,
                    types: [{
                        description: 'Text Files',
                        accept: {'text/plain': ['.txt']}
                    }],
                    excludeAcceptAllOption: false
                };

                const fileHandle = await window.showSaveFilePicker(options);
                setLogFileHandle(fileHandle);

                // Dateinamen aktualisieren
                const file = await fileHandle.getFile();
                setLogFilename(file.name);

                // Logging aktivieren
                setIsLoggingEnabled(true);

                // Initialen Header in die Datei schreiben
                const now = new Date().toISOString();
                const header = `=== HUE BRIDGE LOG START (${now}) ===\nBridge: ${bridgeIP}\nUsername: ${username}\n\n`;
                await appendToLogFile(header);

                addLogEntry("Logging gestartet: " + file.name);
            } else {
                // Fallback für Browser ohne File System Access API
                alert("Dein Browser unterstützt keine persistente Dateiauswahl. Logs werden im Speicher gehalten und können später heruntergeladen werden.");
                setIsLoggingEnabled(true);
                addLogEntry("Logging gestartet (im Speicher)");
            }
        } catch (err) {
            console.error("Fehler beim Auswählen der Log-Datei:", err);
            setError("Log-Datei konnte nicht erstellt werden: " + err.message);
        }
    };

    // Logging stoppen
    const stopLogging = async () => {
        if (isLoggingEnabled) {
            const now = new Date().toISOString();
            const footer = `\n=== HUE BRIDGE LOG END (${now}) ===\n`;

            if (logFileHandle) {
                await appendToLogFile(footer);
            }

            setIsLoggingEnabled(false);
            addLogEntry("Logging gestoppt");
        }
    };

    // Anhängen an die Log-Datei (wenn File Handle vorhanden)
    const appendToLogFile = async (text) => {
        if (!logFileHandle) return;

        try {
            const writable = await logFileHandle.createWritable({ keepExistingData: true });

            // An das Ende der Datei gehen
            await writable.seek((await logFileHandle.getFile()).size);

            // Text anhängen
            await writable.write(text + '\n');

            // Datei schließen
            await writable.close();
        } catch (err) {
            console.error("Fehler beim Schreiben in die Log-Datei:", err);
            setError("Log-Datei konnte nicht aktualisiert werden: " + err.message);
        }
    };

    // Log-Eintrag in Datei speichern
    const saveLogToFile = async (logEntry) => {
        if (logFileHandle) {
            await appendToLogFile(logEntry);
        }
    };

    // Log-Daten herunterladen (für Browser ohne File System Access API)
    const downloadLogs = () => {
        const logText = logData.join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = logFilename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    // Funktion zum Abrufen der Daten von der Hue Bridge
    const fetchData = async () => {
        if (!username || !bridgeIP) {
            setError('Bridge-IP oder Username fehlt');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const baseUrl = `http://${bridgeIP}/api/${username}`;

            // Hole Konfiguration
            const configResponse = await fetch(`${baseUrl}/config`);
            const configData = await configResponse.json();

            // Hole Lichter
            const lightsResponse = await fetch(`${baseUrl}/lights`);
            const lightsData = await lightsResponse.json();

            // Hole Gruppen
            const groupsResponse = await fetch(`${baseUrl}/groups`);
            const groupsData = await groupsResponse.json();

            // Hole Szenen
            const scenesResponse = await fetch(`${baseUrl}/scenes`);
            const scenesData = await scenesResponse.json();

            // Hole Regeln
            const rulesResponse = await fetch(`${baseUrl}/rules`);
            const rulesData = await rulesResponse.json();

            // Hole Zeitpläne
            const schedulesResponse = await fetch(`${baseUrl}/schedules`);
            const schedulesData = await schedulesResponse.json();

            // Hole Sensoren
            const sensorsResponse = await fetch(`${baseUrl}/sensors`);
            const sensorsData = await sensorsResponse.json();

            // Hole Ressourcenlinks für erweiterte Funktionalität
            const resourcelinksResponse = await fetch(`${baseUrl}/resourcelinks`);
            const resourcelinksData = await resourcelinksResponse.json();

            // Untersuche aktive Szenen in den Gruppen
            const activeScenes = {};

            if (groupsData) {
                // Durchlaufe alle Gruppen und prüfe auf aktive Szenen
                Object.entries(groupsData).forEach(([groupId, group]) => {
                    if (group.state && group.state.all_on && group.scenes && group.action && group.action.scene) {
                        const activeSceneId = group.action.scene;

                        if (!activeScenes[activeSceneId]) {
                            // Neue aktive Szene gefunden
                            activeScenes[activeSceneId] = {
                                id: activeSceneId,
                                name: scenesData[activeSceneId]?.name || 'Unbekannte Szene',
                                groups: [{
                                    id: groupId,
                                    name: group.name
                                }],
                                lights: scenesData[activeSceneId]?.lights || []
                            };
                        } else {
                            // Szene bereits gefunden, füge Gruppe hinzu
                            activeScenes[activeSceneId].groups.push({
                                id: groupId,
                                name: group.name
                            });
                        }
                    }
                });
            }

            // Suche aktive Effekte in den Lichtern
            const activeEffects = [];

            if (lightsData) {
                // Durchlaufe alle Lichter und prüfe auf aktive Effekte
                Object.entries(lightsData).forEach(([lightId, light]) => {
                    if (light.state && light.state.on) {
                        let effectType = null;
                        let effectName = null;

                        // Prüfe auf explizite Effekte
                        if (light.state.effect && light.state.effect !== 'none') {
                            effectType = 'effect';
                            effectName = light.state.effect;
                        }
                        // Prüfe auf Alerting (Blinken)
                        else if (light.state.alert && light.state.alert !== 'none') {
                            effectType = 'alert';
                            effectName = light.state.alert;
                        }
                        // Prüfe auf Farbveränderungen in kurzer Zeit (vermutlich durch Automatisierung/Animation)
                        else if (light.state.reachable && light.state.transitiontime && light.state.transitiontime < 5) {
                            effectType = 'transition';
                            effectName = 'smooth_transition';
                        }
                        // Schaue nach dynamischer Änderung (heuristisch)
                        else {
                            // Prüfe die Regeln für Hinweise auf aktive Animationen für dieses Licht
                            let hasActiveAnimation = false;

                            if (rulesData) {
                                Object.values(rulesData).forEach(rule => {
                                    if (rule.status === 'enabled' && rule.actions) {
                                        rule.actions.forEach(action => {
                                            // Prüfe, ob die Aktion auf dieses Licht abzielt
                                            if (action.address && action.address.includes(`/lights/${lightId}/`)) {
                                                hasActiveAnimation = true;
                                            }
                                        });
                                    }
                                });
                            }

                            if (hasActiveAnimation) {
                                effectType = 'dynamic';
                                effectName = 'dynamic_animation';
                            }
                        }

                        // Wenn ein Effekt gefunden wurde, füge ihn zur Liste hinzu
                        if (effectType && effectName) {
                            activeEffects.push({
                                lightId,
                                lightName: light.name,
                                effectType,
                                effectName,
                                state: { ...light.state }
                            });
                        }
                    }
                });
            }

            // Prüfe auf Hinweise auf Entertainmentbereich-Effekte
            // Diese nutzen normalerweise streaming_resources in der Bridge-API
            if (groupsData) {
                Object.entries(groupsData).forEach(([groupId, group]) => {
                    if (group.type === 'Entertainment' && group.state && group.stream && group.stream.active) {
                        // Entertainment mit Streaming = wahrscheinlich aktiver Entertainment-Bereich
                        const affectedLights = group.lights || [];

                        affectedLights.forEach(lightId => {
                            // Füge den Unterhaltungseffekt hinzu, wenn das Licht nicht bereits einen Effekt hat
                            if (!activeEffects.some(effect => effect.lightId === lightId)) {
                                const light = lightsData[lightId];
                                if (light && light.state && light.state.on) {
                                    activeEffects.push({
                                        lightId,
                                        lightName: light.name,
                                        effectType: 'entertainment',
                                        effectName: 'entertainment_sync',
                                        state: { ...light.state }
                                    });
                                }
                            }
                        });
                    }
                });
            }

            // Setze die Daten
            setBridgeConfig(configData);
            setLights(lightsData);
            setGroups(groupsData);
            setScenes(scenesData);
            setRules(rulesData);
            setSchedules(schedulesData);
            setSensors(sensorsData);

            // Speichere aktive Szenen in einem eigenen State
            const activeScenesArray = Object.values(activeScenes);

            // Sortiere Szenen nach Namen
            activeScenesArray.sort((a, b) => a.name.localeCompare(b.name));

            // Füge Lichtinformationen hinzu
            activeScenesArray.forEach(scene => {
                scene.lightDetails = scene.lights.map(lightId => {
                    const light = lightsData[lightId];
                    return light ? {
                        id: lightId,
                        name: light.name,
                        state: light.state
                    } : { id: lightId, name: 'Unbekannt', state: {} };
                });
            });

            setActiveSceneData(activeScenesArray);

            // Sortiere aktive Effekte nach Lichtname
            activeEffects.sort((a, b) => a.lightName.localeCompare(b.lightName));
            setActiveEffectsData(activeEffects);

            // Log-Einträge für aktive Szenen und Effekte erstellen
            const currentTime = new Date().toISOString();
            if (isLoggingEnabled) {
                // Log aktive Szenen
                if (activeScenesArray.length > 0) {
                    addLogEntry(`Aktive Szenen (${activeScenesArray.length}): ${activeScenesArray.map(scene => scene.name).join(', ')}`);
                }

                // Log aktive Effekte
                if (activeEffects.length > 0) {
                    addLogEntry(`Aktive Effekte (${activeEffects.length}): ${activeEffects.map(effect =>
                        `${effect.lightName}: ${EFFECT_TYPES[effect.effectName] || effect.effectName}`).join(', ')}`);
                }

                // Detail-Logs für Parameter
                activeEffects.forEach(effect => {
                    const params = [];
                    if (effect.state.bri !== undefined) params.push(`bri: ${Math.round(effect.state.bri / 254 * 100)}%`);
                    if (effect.state.hue !== undefined) params.push(`hue: ${Math.round(effect.state.hue / 65535 * 360)}°`);
                    if (effect.state.sat !== undefined) params.push(`sat: ${Math.round(effect.state.sat / 254 * 100)}%`);
                    if (effect.state.ct !== undefined) params.push(`ct: ${effect.state.ct} mired`);

                    if (params.length > 0) {
                        addLogEntry(`  - ${effect.lightName} Parameter: ${params.join(', ')}`);
                    }
                });
            }

            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            console.error('Fehler beim Abrufen der Bridge-Daten:', err);
            setError(`Fehler beim Abrufen der Daten: ${err.message}`);

            if (isLoggingEnabled) {
                addLogEntry(`FEHLER: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Erstmalige Datenabfrage beim Laden der Komponente
    useEffect(() => {
        fetchData();
    }, [username, bridgeIP]);

    // Auto-Refresh-Mechanismus
    useEffect(() => {
        let intervalId;

        if (isAutoRefresh && refreshInterval > 0) {
            intervalId = setInterval(() => {
                fetchData();
            }, refreshInterval);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isAutoRefresh, refreshInterval, username, bridgeIP]);

    // Funktion zum Ändern des Aktualisierungsintervalls
    const handleIntervalChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setRefreshInterval(value);
    };

    // Funktion zum Umschalten der automatischen Aktualisierung
    const toggleAutoRefresh = () => {
        setIsAutoRefresh(!isAutoRefresh);
    };

    // Funktion zum manuellen Aktualisieren
    const handleManualRefresh = () => {
        fetchData();
    };

    // Format-Funktion für JSON mit Einrückung
    const formatJSON = (data) => {
        return JSON.stringify(data, null, 2);
    };

    // Render-Funktion für die Logs-Ansicht
    const renderLogsView = () => {
        return (
            <div className="data-container">
                <div className="data-header">
                    <h3>Logs</h3>
                    {loading && <div className="refresh-indicator">Aktualisiere...</div>}

                    <div className="log-controls">
                        {!isLoggingEnabled ? (
                            <button
                                className="log-button start-log"
                                onClick={selectLogFile}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                Logging starten
                            </button>
                        ) : (
                            <button
                                className="log-button stop-log"
                                onClick={stopLogging}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
                                </svg>
                                Logging stoppen
                            </button>
                        )}

                        <button
                            className="log-button download-log"
                            onClick={downloadLogs}
                            disabled={logData.length === 0}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Logs herunterladen
                        </button>

                        <button
                            className="log-button clear-log"
                            onClick={() => setLogData([])}
                            disabled={logData.length === 0}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Logs löschen
                        </button>
                    </div>
                </div>

                <div className="logs-container">
                    {logData.length === 0 ? (
                        <div className="no-logs">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                                <line x1="9" y1="9" x2="10" y2="9" />
                                <line x1="9" y1="13" x2="15" y2="13" />
                                <line x1="9" y1="17" x2="15" y2="17" />
                            </svg>
                            <p>Keine Logs vorhanden.</p>
                            <p className="hint">Klicke auf "Logging starten", um Änderungen an der Bridge zu protokollieren.</p>
                        </div>
                    ) : (
                        <pre className="logs-display">
              {logData.join('\n')}
            </pre>
                    )}
                </div>

                {isLoggingEnabled && logFileHandle && (
                    <div className="log-status">
                        <span className="log-status-indicator" style={{ backgroundColor: STATUS_COLORS.active }}></span>
                        Logging aktiv: {logFilename}
                    </div>
                )}

                {isLoggingEnabled && !logFileHandle && (
                    <div className="log-status">
                        <span className="log-status-indicator" style={{ backgroundColor: STATUS_COLORS.active }}></span>
                        Logging aktiv (im Speicher)
                    </div>
                )}
            </div>
        );
    };

    // Render-Funktion für die Effekte-Status-Ansicht
    const renderEffectsStatusView = () => {
        return (
            <div className="data-container">
                <div className="data-header">
                    <h3>Aktive Effekte</h3>
                    {loading && <div className="refresh-indicator">Aktualisiere...</div>}
                </div>

                <div className="effects-status-container">
                    {activeEffectsData.length === 0 ? (
                        <div className="no-active-effects">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>Keine aktiven Effekte gefunden.</p>
                            <p className="hint">
                                Effekte werden angezeigt, wenn sie auf Lampen aktiviert sind.<br/>
                                Hinweis: Falls deine Lampen Effekte zeigen, aber hier nichts angezeigt wird,
                                schau in den "Lichter"-Tab für detaillierte Informationen.
                            </p>
                        </div>
                    ) : (
                        <div className="active-effects-list">
                            {activeEffectsData.map(effect => (
                                <div key={effect.lightId} className="effect-card">
                                    <div className="effect-header">
                                        <div className="effect-status-indicator" style={{ backgroundColor: STATUS_COLORS.active }}></div>
                                        <h4 className="effect-name">{EFFECT_TYPES[effect.effectName] || effect.effectName}</h4>
                                        <div className="effect-light-name">{effect.lightName}</div>
                                    </div>

                                    <div className="effect-details">
                                        <div className="effect-section">
                                            <h5 className="section-title">Lampe:</h5>
                                            <div className="effect-light-info">
                                                <div className="light-color-preview" style={{
                                                    backgroundColor: effect.state.on
                                                        ? `hsl(${effect.state.hue ? (effect.state.hue / 65535 * 360) : 0}, ${effect.state.sat ? (effect.state.sat / 254 * 100) : 0}%, ${effect.state.bri ? (effect.state.bri / 254 * 50) : 0}%)`
                                                        : '#333'
                                                }}></div>
                                                <div className="light-detail-container">
                                                    <div className="light-name-row">
                                                        <span className="light-name">{effect.lightName}</span>
                                                        <span className="light-id">ID: {effect.lightId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="effect-section">
                                            <h5 className="section-title">Effektparameter:</h5>
                                            <div className="effect-parameters">
                                                <div className="effect-parameter-item">
                                                    <span className="parameter-label">Effekttyp:</span>
                                                    <span className="parameter-value effect-type">
                            {EFFECT_TYPES[effect.effectName] || effect.effectName}
                                                        <span className="effect-source">({effect.effectType})</span>
                          </span>
                                                </div>

                                                {effect.state.bri !== undefined && (
                                                    <div className="effect-parameter-item">
                                                        <span className="parameter-label">Helligkeit:</span>
                                                        <span className="parameter-value">{Math.round(effect.state.bri / 254 * 100)}%</span>
                                                        <div className="parameter-bar-container">
                                                            <div className="parameter-bar" style={{ width: `${Math.round(effect.state.bri / 254 * 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {effect.state.hue !== undefined && (
                                                    <div className="effect-parameter-item">
                                                        <span className="parameter-label">Farbton:</span>
                                                        <span className="parameter-value">{Math.round(effect.state.hue / 65535 * 360)}°</span>
                                                        <div className="hue-spectrum">
                                                            <div className="hue-marker" style={{ left: `${Math.round(effect.state.hue / 65535 * 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {effect.state.sat !== undefined && (
                                                    <div className="effect-parameter-item">
                                                        <span className="parameter-label">Sättigung:</span>
                                                        <span className="parameter-value">{Math.round(effect.state.sat / 254 * 100)}%</span>
                                                        <div className="parameter-bar-container saturation">
                                                            <div className="parameter-bar" style={{ width: `${Math.round(effect.state.sat / 254 * 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {effect.state.ct !== undefined && (
                                                    <div className="effect-parameter-item">
                                                        <span className="parameter-label">Farbtemperatur:</span>
                                                        <span className="parameter-value">{effect.state.ct} mired (~{Math.round(1000000 / effect.state.ct)}K)</span>
                                                        <div className="parameter-bar-container temperature">
                                                            <div className="parameter-bar" style={{
                                                                width: `${Math.max(0, Math.min(100, (500 - effect.state.ct) / 3))}%`
                                                            }}></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {effect.state.xy !== undefined && (
                                                    <div className="effect-parameter-item">
                                                        <span className="parameter-label">XY-Koordinaten:</span>
                                                        <span className="parameter-value">[{effect.state.xy[0].toFixed(3)}, {effect.state.xy[1].toFixed(3)}]</span>
                                                    </div>
                                                )}

                                                {effect.state.alert !== undefined && effect.state.alert !== "none" && (
                                                    <div className="effect-parameter-item">
                                                        <span className="parameter-label">Alert-Modus:</span>
                                                        <span className="parameter-value">{effect.state.alert}</span>
                                                    </div>
                                                )}

                                                {effect.state.transitiontime !== undefined && (
                                                    <div className="effect-parameter-item">
                                                        <span className="parameter-label">Übergangszeit:</span>
                                                        <span className="parameter-value">{effect.state.transitiontime / 10} Sekunden</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render-Funktion für die Szenen-Status-Ansicht
    const renderScenesStatusView = () => {
        return (
            <div className="data-container">
                <div className="data-header">
                    <h3>Szenen-Status</h3>
                    {loading && <div className="refresh-indicator">Aktualisiere...</div>}
                </div>

                <div className="scenes-status-container">
                    {activeSceneData.length === 0 ? (
                        <div className="no-active-scenes">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>Keine aktiven Szenen gefunden.</p>
                            <p className="hint">Szenen werden angezeigt, wenn sie in einer Gruppe aktiviert sind.</p>
                        </div>
                    ) : (
                        <div className="active-scenes-list">
                            {activeSceneData.map(scene => (
                                <div key={scene.id} className="scene-card">
                                    <div className="scene-header">
                                        <div className="scene-status-indicator" style={{ backgroundColor: STATUS_COLORS.active }}></div>
                                        <h4 className="scene-name">{scene.name}</h4>
                                        <div className="scene-id">{scene.id}</div>
                                    </div>

                                    <div className="scene-details">
                                        <div className="scene-section">
                                            <h5 className="section-title">Aktiviert in Gruppen:</h5>
                                            <div className="scene-groups">
                                                {scene.groups.map(group => (
                                                    <div key={group.id} className="scene-group-item">
                                                        <span className="group-name">{group.name}</span>
                                                        <span className="group-id">({group.id})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="scene-section">
                                            <h5 className="section-title">Enthaltene Lichter:</h5>
                                            <div className="scene-lights">
                                                {scene.lightDetails.map(light => (
                                                    <div key={light.id} className="scene-light-item">
                                                        <div className="light-color-preview" style={{
                                                            backgroundColor: light.state.on
                                                                ? `hsl(${light.state.hue ? (light.state.hue / 65535 * 360) : 0}, ${light.state.sat ? (light.state.sat / 254 * 100) : 0}%, ${light.state.bri ? (light.state.bri / 254 * 50) : 0}%)`
                                                                : '#333'
                                                        }}></div>
                                                        <div className="light-detail-container">
                                                            <div className="light-name-row">
                                                                <span className="light-name">{light.name}</span>
                                                                <span className={`light-status ${light.state.on ? 'on' : 'off'}`}>
                                  {light.state.on ? 'Ein' : 'Aus'}
                                </span>
                                                            </div>
                                                            {light.state.on && (
                                                                <div className="light-properties">
                                                                    {light.state.bri !== undefined && (
                                                                        <span className="light-property">
                                      <strong>Helligkeit:</strong> {Math.round(light.state.bri / 254 * 100)}%
                                    </span>
                                                                    )}
                                                                    {light.state.hue !== undefined && (
                                                                        <span className="light-property">
                                      <strong>Farbton:</strong> {Math.round(light.state.hue / 65535 * 360)}°
                                    </span>
                                                                    )}
                                                                    {light.state.sat !== undefined && (
                                                                        <span className="light-property">
                                      <strong>Sättigung:</strong> {Math.round(light.state.sat / 254 * 100)}%
                                    </span>
                                                                    )}
                                                                    {light.state.ct !== undefined && (
                                                                        <span className="light-property">
                                      <strong>Farbtemperatur:</strong> {light.state.ct} mired
                                    </span>
                                                                    )}
                                                                    {light.state.xy !== undefined && (
                                                                        <span className="light-property">
                                      <strong>XY:</strong> [{light.state.xy[0].toFixed(3)}, {light.state.xy[1].toFixed(3)}]
                                    </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render-Funktion für die verschiedenen Datenabschnitte
    const renderDataSection = () => {
        if (loading && !lastUpdated) {
            return <div className="loading">Lade Daten...</div>;
        }

        if (error) {
            return <div className="error-message">{error}</div>;
        }

        // Logs-Ansicht
        if (activeSection === 'logs') {
            return renderLogsView();
        }

        // Effekte-Status-Ansicht
        if (activeSection === 'effects-status') {
            return renderEffectsStatusView();
        }

        // Szenen-Status-Ansicht
        if (activeSection === 'scenes-status') {
            return renderScenesStatusView();
        }

        let data = null;
        let title = '';

        switch (activeSection) {
            case 'config':
                data = bridgeConfig;
                title = 'Bridge-Konfiguration';
                break;
            case 'lights':
                data = lights;
                title = 'Lichter';
                break;
            case 'groups':
                data = groups;
                title = 'Gruppen';
                break;
            case 'scenes':
                data = scenes;
                title = 'Szenen';
                break;
            case 'rules':
                data = rules;
                title = 'Regeln';
                break;
            case 'schedules':
                data = schedules;
                title = 'Zeitpläne';
                break;
            case 'sensors':
                data = sensors;
                title = 'Sensoren';
                break;
            default:
                data = bridgeConfig;
                title = 'Bridge-Konfiguration';
        }

        return (
            <div className="data-container">
                <div className="data-header">
                    <h3>{title}</h3>
                    {loading && <div className="refresh-indicator">Aktualisiere...</div>}
                </div>
                <pre className="json-display">{data ? formatJSON(data) : 'Keine Daten'}</pre>
            </div>
        );
    };

    return (
        <div className="dev-view">
            <div className="dev-header">
                <h2 className="section-title">Entwickler-Ansicht</h2>
                <div className="refresh-controls">
                    <div className="refresh-interval">
                        <label htmlFor="refreshInterval">Aktualisieren alle:</label>
                        <select
                            id="refreshInterval"
                            value={refreshInterval}
                            onChange={handleIntervalChange}
                            disabled={!isAutoRefresh}
                        >
                            <option value="1000">1 Sekunde</option>
                            <option value="5000">5 Sekunden</option>
                            <option value="10000">10 Sekunden</option>
                            <option value="30000">30 Sekunden</option>
                            <option value="60000">1 Minute</option>
                        </select>
                    </div>

                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={isAutoRefresh}
                            onChange={toggleAutoRefresh}
                        />
                        <span className="slider"></span>
                    </label>
                    <span className="auto-refresh-label">Auto-Refresh</span>

                    <button
                        className="refresh-button"
                        onClick={handleManualRefresh}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Jetzt aktualisieren
                    </button>
                </div>
            </div>

            {lastUpdated && (
                <div className="last-updated">
                    Zuletzt aktualisiert: {lastUpdated.toLocaleTimeString()}
                </div>
            )}

            <div className="dev-content">
                <div className="dev-navigation">
                    <button
                        className={activeSection === 'effects-status' ? 'active' : ''}
                        onClick={() => setActiveSection('effects-status')}
                    >
                        Aktive Effekte
                    </button>
                    <button
                        className={activeSection === 'scenes-status' ? 'active' : ''}
                        onClick={() => setActiveSection('scenes-status')}
                    >
                        Aktive Szenen
                    </button>
                    <button
                        className={activeSection === 'logs' ? 'active' : ''}
                        onClick={() => setActiveSection('logs')}
                    >
                        Logs
                    </button>
                    <button
                        className={activeSection === 'config' ? 'active' : ''}
                        onClick={() => setActiveSection('config')}
                    >
                        Konfiguration
                    </button>
                    <button
                        className={activeSection === 'lights' ? 'active' : ''}
                        onClick={() => setActiveSection('lights')}
                    >
                        Lichter
                    </button>
                    <button
                        className={activeSection === 'groups' ? 'active' : ''}
                        onClick={() => setActiveSection('groups')}
                    >
                        Gruppen
                    </button>
                    <button
                        className={activeSection === 'scenes' ? 'active' : ''}
                        onClick={() => setActiveSection('scenes')}
                    >
                        Szenen
                    </button>
                    <button
                        className={activeSection === 'rules' ? 'active' : ''}
                        onClick={() => setActiveSection('rules')}
                    >
                        Regeln
                    </button>
                    <button
                        className={activeSection === 'schedules' ? 'active' : ''}
                        onClick={() => setActiveSection('schedules')}
                    >
                        Zeitpläne
                    </button>
                    <button
                        className={activeSection === 'sensors' ? 'active' : ''}
                        onClick={() => setActiveSection('sensors')}
                    >
                        Sensoren
                    </button>
                </div>

                {renderDataSection()}
            </div>
        </div>
    );
};

export default DevView;