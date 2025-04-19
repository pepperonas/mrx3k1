// src/components/SensorControlView.jsx - Verwaltung von Schaltern und Bewegungsmeldern
import React, { useEffect, useState } from 'react';
import '../styles/sensors.css';

// Karte für einen einzelnen Sensor
const SensorCard = ({ sensor, onEditRules, onDelete, onToggle }) => {
    const isButton = sensor.type === 'ZLLSwitch' || sensor.type === 'ZGPSwitch';
    const isMotion = sensor.type === 'ZLLPresence';
    const isLightLevel = sensor.type === 'ZLLLightLevel';
    const isTemperature = sensor.type === 'ZLLTemperature';
    const isDaylight = sensor.type === 'Daylight';
    const isGeneric = sensor.type === 'CLIPGenericStatus' || sensor.type === 'Geofence';

    // Typ-spezifisches Icon
    const SensorIcon = () => (
        <div className="sensor-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isButton ? (
                    // Button Icon
                    <>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="12" cy="12" r="3"></circle>
                    </>
                ) : isMotion ? (
                    // Motion Sensor Icon
                    <>
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                        <circle cx="12" cy="13" r="3"></circle>
                    </>
                ) : isTemperature ? (
                    // Temperature Icon
                    <>
                        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                    </>
                ) : isLightLevel ? (
                    // Light Sensor Icon
                    <>
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </>
                ) : isDaylight ? (
                    // Daylight Icon
                    <>
                        <circle cx="12" cy="12" r="4"></circle>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="M5 5l1.5 1.5"></path>
                        <path d="M17.5 17.5l1.5 1.5"></path>
                        <path d="M2 12h2"></path>
                        <path d="M20 12h2"></path>
                        <path d="M5 19l1.5-1.5"></path>
                        <path d="M17.5 6.5l1.5-1.5"></path>
                    </>
                ) : (
                    // Default/Generic Sensor Icon
                    <>
                        <path d="M5 12h14"></path>
                        <path d="M12 5v14"></path>
                    </>
                )}
            </svg>
        </div>
    );

    // Status-Badge
    const StatusBadge = () => {
        // Status basierend auf Typ bestimmen
        let statusText = 'Unbekannt';
        let statusClass = 'unknown';

        if (isButton) {
            if (!sensor.state.lastupdated || sensor.state.lastupdated === 'none') {
                statusText = 'Inaktiv';
                statusClass = 'inactive';
            } else {
                const lastUpdated = new Date(sensor.state.lastupdated);
                const now = new Date();
                const diffMinutes = Math.round((now - lastUpdated) / (1000 * 60));

                if (diffMinutes < 60) {
                    statusText = 'Aktiv';
                    statusClass = 'active';
                } else if (diffMinutes < 24 * 60) {
                    statusText = 'Standby';
                    statusClass = 'standby';
                } else {
                    statusText = 'Inaktiv';
                    statusClass = 'inactive';
                }
            }
        } else if (isMotion) {
            if (sensor.state.presence) {
                statusText = 'Bewegung';
                statusClass = 'motion-detected';
            } else if (sensor.state.presence === false) {
                statusText = 'Keine Bewegung';
                statusClass = 'no-motion';
            } else {
                statusText = 'Unbekannt';
                statusClass = 'unknown';
            }

            if (sensor.state.lastupdated && sensor.state.lastupdated !== 'none') {
                const lastUpdated = new Date(sensor.state.lastupdated);
                const now = new Date();
                const diffMinutes = Math.round((now - lastUpdated) / (1000 * 60));

                if (diffMinutes > 60 * 24) {
                    statusText = 'Prüfen';
                    statusClass = 'check';
                }
            }
        } else if (isTemperature && sensor.state.temperature !== undefined) {
            // Temperatur wird in Hundertstel Grad Celsius gespeichert
            const temp = sensor.state.temperature / 100;
            statusText = `${temp.toFixed(1)}°C`;
            statusClass = temp < 10 ? 'cold' : temp > 25 ? 'hot' : 'normal';
        } else if (isLightLevel && sensor.state.lightlevel !== undefined) {
            if (sensor.state.dark) {
                statusText = 'Dunkel';
                statusClass = 'dark';
            } else if (sensor.state.daylight) {
                statusText = 'Tageslicht';
                statusClass = 'daylight';
            } else {
                statusText = 'Gedämpft';
                statusClass = 'dim';
            }
        } else if (isDaylight) {
            if (sensor.state.daylight) {
                statusText = 'Tag';
                statusClass = 'daylight';
            } else {
                statusText = 'Nacht';
                statusClass = 'dark';
            }
        } else if (isGeneric && sensor.state.status !== undefined) {
            statusText = `Status: ${sensor.state.status}`;
            statusClass = 'normal';
        }

        // Batteriestatus, falls vorhanden
        const hasBattery = sensor.config && sensor.config.battery !== undefined;
        const batteryLow = hasBattery && sensor.config.battery < 20;

        return (
            <div className={`sensor-status ${statusClass}`}>
                <span>{statusText}</span>
                {hasBattery && (
                    <div className={`battery-indicator ${batteryLow ? 'low' : ''}`}>
                        <div className="battery-level" style={{ width: `${sensor.config.battery}%` }}></div>
                        <span className="battery-text">{sensor.config.battery}%</span>
                    </div>
                )}
            </div>
        );
    };

    // Prüfen, ob letzte Aktualisierung verfügbar ist
    const hasLastUpdated = sensor.state &&
        sensor.state.lastupdated &&
        sensor.state.lastupdated !== 'none';

    return (
        <div className={`sensor-card ${sensor.config?.on ? 'active' : 'inactive'}`}>
            <div className="sensor-header">
                <SensorIcon />
                <div className="sensor-info">
                    <h3>{sensor.name}</h3>
                    <p className="sensor-type">{getSensorTypeName(sensor.type)}</p>
                    {sensor.modelid && <p className="model-id">{sensor.modelid}</p>}
                </div>
                <StatusBadge />
            </div>

            <div className="sensor-details">
                {isButton && sensor.state.buttonevent && (
                    <div className="last-button-event">
                        <span>Letzter Knopfdruck: {formatButtonEvent(sensor.state.buttonevent)}</span>
                        {hasLastUpdated && (
                            <span className="timestamp">{formatTimestamp(sensor.state.lastupdated)}</span>
                        )}
                    </div>
                )}

                {isMotion && (
                    <div className="motion-info">
                        <span>Empfindlichkeit: {sensor.config?.sensitivity || "Standard"}</span>
                        {sensor.config?.ledindication !== undefined && (
                            <span>LED-Anzeige: {sensor.config.ledindication ? "An" : "Aus"}</span>
                        )}
                        {hasLastUpdated && (
                            <span className="timestamp">Letzte Aktualisierung: {formatTimestamp(sensor.state.lastupdated)}</span>
                        )}
                    </div>
                )}

                {isTemperature && sensor.state.temperature !== undefined && (
                    <div className="temperature-info">
                        <span>Temperatur: {(sensor.state.temperature / 100).toFixed(1)}°C</span>
                        {hasLastUpdated && (
                            <span className="timestamp">Gemessen: {formatTimestamp(sensor.state.lastupdated)}</span>
                        )}
                    </div>
                )}

                {isLightLevel && sensor.state.lightlevel !== undefined && (
                    <div className="light-level-info">
                        <span>Lichtstärke: {sensor.state.lightlevel} lux</span>
                        <span>Zustand: {sensor.state.dark ? "Dunkel" : sensor.state.daylight ? "Tageslicht" : "Gedämpft"}</span>
                        {hasLastUpdated && (
                            <span className="timestamp">Gemessen: {formatTimestamp(sensor.state.lastupdated)}</span>
                        )}
                    </div>
                )}

                <div className="sensor-actions">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={sensor.config?.on || false}
                            onChange={() => onToggle(sensor.id, !sensor.config?.on)}
                        />
                        <span className="slider"></span>
                    </label>

                    <button
                        className="edit-rules-btn"
                        onClick={() => onEditRules(sensor.id)}
                        disabled={!isButton && !isMotion}
                    >
                        Regeln bearbeiten
                    </button>

                    {/* CLIP-Sensoren können gelöscht werden, Hardware-Sensoren nicht */}
                    {sensor.type.startsWith('CLIP') && (
                        <button
                            className="delete-btn"
                            onClick={() => onDelete(sensor.id)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Regelformular für Sensor-Aktionen
const RuleFormModal = ({ sensor, lights, rules, onSave, onCancel }) => {
    const [formRules, setFormRules] = useState([]);

    // Regeln beim Öffnen laden
    useEffect(() => {
        const sensorRules = rules.filter(rule =>
                rule.conditions && rule.conditions.some(condition =>
                    condition.address && condition.address.includes(`/sensors/${sensor.id}/`)
                )
        );
        setFormRules(sensorRules);
    }, [sensor, rules]);

    const handleAddRule = () => {
        // Bestimme Standard-Bedingung basierend auf Sensortyp
        let defaultCondition;
        if (sensor.type === 'ZLLSwitch') {
            defaultCondition = {
                address: `/sensors/${sensor.id}/state/buttonevent`,
                operator: "eq",
                value: "1000"
            };
        } else if (sensor.type === 'ZLLPresence') {
            defaultCondition = {
                address: `/sensors/${sensor.id}/state/presence`,
                operator: "eq",
                value: "true"
            };
        } else {
            defaultCondition = {
                address: `/sensors/${sensor.id}/state/status`,
                operator: "eq",
                value: "1"
            };
        }

        // Erstelle neue Regel
        const newRule = {
            id: `new-${Date.now()}`,
            name: `${sensor.name} Regel`,
            conditions: [defaultCondition],
            actions: [
                {
                    address: `/lights/${Object.keys(lights)[0]}/state`,
                    method: "PUT",
                    body: { on: true }
                }
            ]
        };

        setFormRules([...formRules, newRule]);
    };

    const handleDeleteRule = (ruleId) => {
        setFormRules(formRules.filter(rule => rule.id !== ruleId));
    };

    const handleSave = () => {
        onSave(formRules);
    };

    // Generiere Optionen für Ereignisse basierend auf Sensortyp
    const getEventOptions = () => {
        if (sensor.type === 'ZLLSwitch') {
            return [
                <option key="1000" value="1000">Ein/Heller - Drücken</option>,
                <option key="1001" value="1001">Ein/Heller - Halten</option>,
                <option key="1002" value="1002">Ein/Heller - Kurz loslassen</option>,
                <option key="1003" value="1003">Ein/Heller - Lang loslassen</option>,
                <option key="2000" value="2000">Dunkler - Drücken</option>,
                <option key="2001" value="2001">Dunkler - Halten</option>,
                <option key="2002" value="2002">Dunkler - Kurz loslassen</option>,
                <option key="2003" value="2003">Dunkler - Lang loslassen</option>,
                <option key="3000" value="3000">Szene wechseln - Drücken</option>,
                <option key="3001" value="3001">Szene wechseln - Halten</option>,
                <option key="3002" value="3002">Szene wechseln - Kurz loslassen</option>,
                <option key="3003" value="3003">Szene wechseln - Lang loslassen</option>,
                <option key="4000" value="4000">Aus - Drücken</option>,
                <option key="4001" value="4001">Aus - Halten</option>,
                <option key="4002" value="4002">Aus - Kurz loslassen</option>,
                <option key="4003" value="4003">Aus - Lang loslassen</option>
            ];
        } else if (sensor.type === 'ZLLPresence') {
            return [
                <option key="true" value="true">Bewegung erkannt</option>,
                <option key="false" value="false">Keine Bewegung</option>
            ];
        } else {
            return [
                <option key="1" value="1">Status 1</option>,
                <option key="0" value="0">Status 0</option>
            ];
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Regeln für {sensor.name}</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <div className="rules-container">
                    {formRules.length === 0 ? (
                        <div className="empty-rules">
                            <p>Keine Regeln für diesen Sensor definiert.</p>
                        </div>
                    ) : (
                        formRules.map(rule => (
                            <div key={rule.id} className="rule-item">
                                <div className="rule-header">
                                    <h3>{rule.name}</h3>
                                    <button
                                        className="delete-rule"
                                        onClick={() => handleDeleteRule(rule.id)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>

                                <div className="rule-condition">
                                    <label>Wenn</label>
                                    <select>
                                        {getEventOptions()}
                                    </select>
                                </div>

                                <div className="rule-action">
                                    <label>Dann</label>
                                    <div className="action-row">
                                        <select>
                                            {Object.entries(lights).map(([id, light]) => (
                                                <option key={id} value={id}>{light.name}</option>
                                            ))}
                                        </select>

                                        <select>
                                            <option value="on-true">Einschalten</option>
                                            <option value="on-false">Ausschalten</option>
                                            <option value="on-toggle">Umschalten</option>
                                            <option value="bri-set">Helligkeit</option>
                                            <option value="scene">Szene aktivieren</option>
                                        </select>

                                        <input type="text" placeholder="Wert" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <button className="add-rule-btn" onClick={handleAddRule}>
                        Regel hinzufügen
                    </button>
                </div>

                <div className="modal-actions">
                    <button onClick={onCancel} className="cancel-btn">Abbrechen</button>
                    <button onClick={handleSave}>Speichern</button>
                </div>
            </div>
        </div>
    );
};

// Hilfsfunktionen
const getSensorTypeName = (type) => {
    const types = {
        'ZLLSwitch': 'Hue Dimmer Schalter',
        'ZGPSwitch': 'Hue Tap Schalter',
        'ZLLPresence': 'Bewegungssensor',
        'ZLLLightLevel': 'Lichtsensor',
        'ZLLTemperature': 'Temperatursensor',
        'CLIPGenericStatus': 'Generischer Sensor',
        'Daylight': 'Tageslicht-Sensor',
        'Geofence': 'Standort-Sensor'
    };

    return types[type] || type;
};

const formatButtonEvent = (buttonEvent) => {
    if (!buttonEvent) return 'Unbekannt';

    const button = Math.floor(buttonEvent / 1000);
    const action = buttonEvent % 1000;

    let buttonName = '';
    switch (button) {
        case 1: buttonName = 'Ein/Heller'; break;
        case 2: buttonName = 'Dunkler'; break;
        case 3: buttonName = 'Szene wechseln'; break;
        case 4: buttonName = 'Aus'; break;
        default: buttonName = `Knopf ${button}`; break;
    }

    let actionName = '';
    switch (action) {
        case 0: actionName = 'Drücken'; break;
        case 1: actionName = 'Halten'; break;
        case 2: actionName = 'Kurz loslassen'; break;
        case 3: actionName = 'Lang loslassen'; break;
        case 4: actionName = 'Lang drücken'; break;
        default: actionName = `Aktion ${action}`; break;
    }

    return `${buttonName} - ${actionName}`;
};

const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === 'none') return 'Nie';

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Ungültiges Datum';

        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins < 1) return 'Gerade eben';
        if (diffMins < 60) return `Vor ${diffMins} Min.`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Vor ${diffHours} Std.`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `Vor ${diffDays} Tagen`;

        // Bei älteren Zeitstempeln formatiertes Datum zurückgeben
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        console.error("Fehler beim Formatieren des Zeitstempels:", e);
        return 'Unbekannt';
    }
};

// Hauptkomponente
const SensorControlView = ({ username, bridgeIP }) => {
    const [sensors, setSensors] = useState({});
    const [rules, setRules] = useState([]);
    const [lights, setLights] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingSensor, setEditingSensor] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    // Sensoren beim Komponenten-Mount laden
    useEffect(() => {
        const loadResources = async () => {
            try {
                setLoading(true);
                setError(null);

                // Basierte URL für API-Anfragen
                const baseUrl = `http://${bridgeIP}/api/${username}`;

                // Lade Sensoren
                const sensorsResponse = await fetch(`${baseUrl}/sensors`);
                const sensorsData = await sensorsResponse.json();

                if (sensorsData.error) {
                    throw new Error(sensorsData.error.description || 'Fehler beim Laden der Sensoren');
                }

                // Lade Regeln
                const rulesResponse = await fetch(`${baseUrl}/rules`);
                const rulesData = await rulesResponse.json();

                // Lade Lichter (für Regeln)
                const lightsResponse = await fetch(`${baseUrl}/lights`);
                const lightsData = await lightsResponse.json();

                setSensors(sensorsData);
                setRules(Object.entries(rulesData).map(([id, rule]) => ({ id, ...rule })));
                setLights(lightsData);
                setLoading(false);
            } catch (err) {
                console.error("Fehler beim Laden der Sensoren:", err);
                setError("Sensoren konnten nicht geladen werden: " + err.message);
                setLoading(false);
            }
        };

        if (username && bridgeIP) {
            loadResources();
        }
    }, [username, bridgeIP]);

    // Sensor aktivieren/deaktivieren
    const toggleSensor = async (sensorId, newState) => {
        try {
            const baseUrl = `http://${bridgeIP}/api/${username}`;
            const response = await fetch(`${baseUrl}/sensors/${sensorId}/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ on: newState })
            });

            const data = await response.json();

            if (data[0]?.success) {
                // UI aktualisieren
                setSensors(prev => ({
                    ...prev,
                    [sensorId]: {
                        ...prev[sensorId],
                        config: {
                            ...prev[sensorId].config,
                            on: newState
                        }
                    }
                }));
            } else {
                throw new Error(data[0]?.error?.description || 'Fehler beim Aktualisieren des Sensors');
            }
        } catch (err) {
            console.error("Fehler beim Ändern des Sensorstatus:", err);
            setError(`Status konnte nicht geändert werden: ${err.message}`);
        }
    };

    // Sensor löschen
    const deleteSensor = async (sensorId) => {
        // Prüfen, ob der Sensor gelöscht werden kann (nur CLIP-Sensoren)
        const sensor = sensors[sensorId];
        if (!sensor || !sensor.type.startsWith('CLIP')) {
            setError("Nur CLIP-Sensoren können gelöscht werden.");
            return;
        }

        if (!window.confirm(`Möchtest du diesen Sensor wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) {
            return;
        }

        try {
            const baseUrl = `http://${bridgeIP}/api/${username}`;
            const response = await fetch(`${baseUrl}/sensors/${sensorId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data[0]?.success) {
                // UI aktualisieren
                setSensors(prev => {
                    const updated = {...prev};
                    delete updated[sensorId];
                    return updated;
                });
            } else {
                throw new Error(data[0]?.error?.description || 'Fehler beim Löschen des Sensors');
            }
        } catch (err) {
            console.error("Fehler beim Löschen des Sensors:", err);
            setError(`Sensor konnte nicht gelöscht werden: ${err.message}`);
        }
    };

    // Regeln für einen Sensor öffnen
    const editRules = (sensorId) => {
        const sensor = sensors[sensorId];

        // Prüfen, ob der Sensor Regeln unterstützt
        if (sensor.type !== 'ZLLSwitch' && sensor.type !== 'ZGPSwitch' && sensor.type !== 'ZLLPresence') {
            setError("Regeln können nur für Schalter und Bewegungssensoren erstellt werden.");
            return;
        }

        setEditingSensor({id: sensorId, ...sensor});
    };

    // Regeln für einen Sensor speichern
    const saveRules = async (updatedRules) => {
        try {
            const baseUrl = `http://${bridgeIP}/api/${username}`;

            // Für jede Regel die entsprechende API-Anfrage ausführen
            for (const rule of updatedRules) {
                if (rule.id.startsWith('new-')) {
                    // Neue Regel erstellen
                    const newRule = {...rule};
                    delete newRule.id;

                    const response = await fetch(`${baseUrl}/rules`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newRule)
                    });

                    const data = await response.json();

                    if (!data[0]?.success) {
                        throw new Error(data[0]?.error?.description || 'Fehler beim Erstellen der Regel');
                    }
                } else {
                    // Bestehende Regel aktualisieren
                    const { id, ...ruleData } = rule;

                    const response = await fetch(`${baseUrl}/rules/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(ruleData)
                    });

                    const data = await response.json();

                    if (!data[0]?.success) {
                        throw new Error(data[0]?.error?.description || 'Fehler beim Aktualisieren der Regel');
                    }
                }
            }

            // Regeln neu laden
            const rulesResponse = await fetch(`${baseUrl}/rules`);
            const rulesData = await rulesResponse.json();
            setRules(Object.entries(rulesData).map(([id, rule]) => ({ id, ...rule })));

            setEditingSensor(null);
        } catch (err) {
            console.error("Fehler beim Speichern der Regeln:", err);
            setError(`Regeln konnten nicht gespeichert werden: ${err.message}`);
        }
    };

    // Sensoren nach Typ filtern
    const filteredSensors = Object.entries(sensors).filter(([_, sensor]) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'buttons') return sensor.type === 'ZLLSwitch' || sensor.type === 'ZGPSwitch';
        if (activeFilter === 'motion') return sensor.type === 'ZLLPresence';
        if (activeFilter === 'other') {
            return sensor.type !== 'ZLLSwitch' &&
                sensor.type !== 'ZGPSwitch' &&
                sensor.type !== 'ZLLPresence';
        }
        return true;
    });

    // Sensoren nach neuem Status sortieren
    const sortedSensors = filteredSensors.sort((a, b) => {
        // Zuerst nach Typ sortieren
        const typeA = a[1].type;
        const typeB = b[1].type;

        // Physische Sensoren (ZLL*) vor generischen Sensoren (CLIP*)
        if (typeA.startsWith('ZLL') && !typeB.startsWith('ZLL')) return -1;
        if (!typeA.startsWith('ZLL') && typeB.startsWith('ZLL')) return 1;

        // Dann nach letzter Aktualisierung sortieren
        const lastUpdatedA = a[1].state?.lastupdated;
        const lastUpdatedB = b[1].state?.lastupdated;

        // Sensoren mit gültigem Datum zuerst
        if (lastUpdatedA && lastUpdatedA !== 'none' && (!lastUpdatedB || lastUpdatedB === 'none')) return -1;
        if ((!lastUpdatedA || lastUpdatedA === 'none') && lastUpdatedB && lastUpdatedB !== 'none') return 1;

        // Wenn beide ein gültiges Datum haben, nach Zeit sortieren
        if (lastUpdatedA && lastUpdatedA !== 'none' && lastUpdatedB && lastUpdatedB !== 'none') {
            const dateA = new Date(lastUpdatedA);
            const dateB = new Date(lastUpdatedB);
            if (!isNaN(dateA) && !isNaN(dateB)) {
                return dateB - dateA; // Neuere zuerst
            }
        }

        // Fallback: Nach Name sortieren
        return a[1].name.localeCompare(b[1].name);
    });

    return (
        <div className="sensors-view">
            <div className="sensors-header">
                <h2 className="section-title">Schalter &amp; Sensoren</h2>

                <div className="sensor-filters">
                    <button
                        className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        Alle
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'buttons' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('buttons')}
                    >
                        Schalter
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'motion' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('motion')}
                    >
                        Bewegung
                    </button>
                    <button
                        className={`filter-btn ${activeFilter === 'other' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('other')}
                    >
                        Andere
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">
                    <p>Lade Sensoren...</p>
                </div>
            ) : error ? (
                <div className="status-message status-error">{error}</div>
            ) : sortedSensors.length === 0 ? (
                <div className="empty-state">
                    <p>Keine Sensoren gefunden. Füge Sensoren zur Hue Bridge hinzu, um sie hier zu verwalten.</p>
                </div>
            ) : (
                <div className="sensors-grid">
                    {sortedSensors.map(([id, sensor]) => (
                        <SensorCard
                            key={id}
                            sensor={{id, ...sensor}}
                            onEditRules={editRules}
                            onDelete={deleteSensor}
                            onToggle={toggleSensor}
                        />
                    ))}
                </div>
            )}

            {editingSensor && (
                <RuleFormModal
                    sensor={editingSensor}
                    lights={lights}
                    rules={rules}
                    onSave={saveRules}
                    onCancel={() => setEditingSensor(null)}
                />
            )}
        </div>
    );
};

export default SensorControlView;