// src/components/GroupsView.jsx - Gruppenverwaltung im BrainBuster-Stil
import React, { useState, useEffect, useRef } from 'react';
import { Group } from '../models/types';
import '../styles/groups.css';

// Raum-Icons
const RoomIcon = ({ type }) => {
    return (
        <div className="room-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {type === 'living' && (
                    <>
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <rect x="9" y="9" width="6" height="6" />
                        <line x1="9" y1="1" x2="9" y2="4" />
                        <line x1="15" y1="1" x2="15" y2="4" />
                        <line x1="9" y1="20" x2="9" y2="23" />
                        <line x1="15" y1="20" x2="15" y2="23" />
                        <line x1="20" y1="9" x2="23" y2="9" />
                        <line x1="20" y1="14" x2="23" y2="14" />
                        <line x1="1" y1="9" x2="4" y2="9" />
                        <line x1="1" y1="14" x2="4" y2="14" />
                    </>
                )}
                {type === 'bedroom' && (
                    <>
                        <path d="M2 9V5c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v4" />
                        <path d="M2 11v4c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-4" />
                        <path d="M4 21v-1" />
                        <path d="M20 21v-1" />
                        <path d="M4 15h16" />
                        <path d="M6 7h4" />
                        <path d="M14 7h4" />
                    </>
                )}
                {type === 'kitchen' && (
                    <>
                        <path d="M8 5h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                        <path d="M5 8v8" />
                        <path d="M19 8v8" />
                        <path d="M5 12h4" />
                        <path d="M15 12h4" />
                        <path d="M10 2v3" />
                        <path d="M14 2v3" />
                        <path d="M3 21h18" />
                    </>
                )}
                {type === 'dining' && (
                    <>
                        <path d="M5 9c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9Z" />
                        <path d="M9 20v-9" />
                        <path d="M15 20v-9" />
                        <path d="M9 8h6" />
                        <path d="M6 5l1-3h10l1 3" />
                    </>
                )}
                {type === 'bathroom' && (
                    <>
                        <path d="M6 12h12v3a6 6 0 0 1-6 6v0a6 6 0 0 1-6-6v-3Z" />
                        <path d="M6 12V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7" />
                        <path d="M2 12h20" />
                    </>
                )}
                {type === 'office' && (
                    <>
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <rect x="9" y="9" width="10" height="6" />
                        <path d="M8 15h2" />
                        <path d="M8 11h2" />
                    </>
                )}
                {type === 'outdoor' && (
                    <>
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                        <path d="M19 12c0 3.9-3.1 7-7 7s-7-3.1-7-7 3.1-7 7-7 7 3.1 7 7z" />
                        <circle cx="12" cy="12" r="3" />
                    </>
                )}
                {type === 'zone' && (
                    <>
                        <path d="M21 3H3v7h18V3z" />
                        <path d="M21 14H3v7h18v-7z" />
                    </>
                )}
                {(type === 'other' || !type) && (
                    <>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M3 15h18" />
                        <path d="M9 3v18" />
                        <path d="M15 3v18" />
                    </>
                )}
            </svg>
        </div>
    );
};

// Gruppenkarte für die Anzeige in der Liste
const GroupCard = ({ group, onEdit, onDelete, onActivate, isActive }) => {
    return (
        <div className={`group-card ${isActive ? 'active' : ''}`} onClick={() => onActivate(group.id)}>
            <RoomIcon type={group.roomType || 'other'} />
            <div className="group-details">
                <h3>{group.name}</h3>
                <p className="group-info">
                    {group.lights.length} {group.lights.length === 1 ? 'Lampe' : 'Lampen'} •
                    {group.type === 'zone' ? ' Zone' : ' Raum'}
                </p>
            </div>
            <div className="group-actions">
                <button
                    className="icon-button edit"
                    onClick={(e) => { e.stopPropagation(); onEdit(group.id); }}
                    aria-label="Gruppe bearbeiten"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                <button
                    className="icon-button delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
                    aria-label="Gruppe löschen"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Bedienelemente für die aktive Gruppe
const GroupControls = ({ group, lights, onToggleAll, onSetBrightness, username, bridgeIP, onUpdateLights }) => {
    const [allOn, setAllOn] = useState(false);
    const [brightness, setBrightness] = useState(254);
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });

    // Berechne den Gruppenstatus basierend auf den enthaltenen Lichtern
    useEffect(() => {
        if (!group || !group.lights || !lights) return;

        const groupLights = group.lights
            .map(id => lights[id])
            .filter(light => light !== undefined);

        if (groupLights.length === 0) return;

        // Alle Lichter eingeschaltet?
        const allLightsOn = groupLights.every(light => light.state.on);
        setAllOn(allLightsOn);

        // Durchschnittliche Helligkeit der eingeschalteten Lichter
        const onLights = groupLights.filter(light => light.state.on);
        if (onLights.length > 0) {
            const avgBrightness = Math.round(
                onLights.reduce((sum, light) => sum + (light.state.bri || 254), 0) / onLights.length
            );
            setBrightness(avgBrightness);
        }
    }, [group, lights]);

    // Status anzeigen und nach Zeitraum ausblenden
    const setStatus = (message, type = 'info') => {
        setStatusMessage({ message, type });
        setTimeout(() => {
            setStatusMessage({ message: '', type: '' });
        }, 3000);
    };

    // Gruppe ein-/ausschalten
    const toggleGroup = async () => {
        try {
            // Sofort UI aktualisieren für bessere UX
            const newOn = !allOn;
            setAllOn(newOn);

            // Die Statusänderung für alle Lichter vorbereiten
            const updatedLights = { ...lights };
            const lightUpdates = [];

            for (const lightId of group.lights) {
                if (updatedLights[lightId]) {
                    // Lokalen Zustand aktualisieren
                    updatedLights[lightId] = {
                        ...updatedLights[lightId],
                        state: {
                            ...updatedLights[lightId].state,
                            on: newOn
                        }
                    };

                    // API-Anfrage vorbereiten
                    lightUpdates.push({
                        lightId,
                        request: fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ on: newOn })
                        })
                    });
                }
            }

            // An Callback zur Aktualisierung der Lichtzustände senden
            onUpdateLights(updatedLights);
            onToggleAll(newOn);

            // Direkter API-Aufruf für die Gruppe (wenn Bridge-API verwendet wird)
            let groupApiSuccess = true;
            if (group.bridgeGroupId) {
                try {
                    const groupResponse = await fetch(`http://${bridgeIP}/api/${username}/groups/${group.bridgeGroupId}/action`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ on: newOn })
                    });

                    const groupResult = await groupResponse.json();
                    if (groupResult[0] && groupResult[0].error) {
                        console.error("Fehler beim Gruppen-API-Aufruf:", groupResult);
                        groupApiSuccess = false;
                    }
                } catch (error) {
                    console.error("Fehler beim Gruppen-API-Aufruf:", error);
                    groupApiSuccess = false;
                }
            }

            // Einzelne Lichter schalten, wenn Gruppenaufruf fehlgeschlagen ist
            if (!groupApiSuccess || !group.bridgeGroupId) {
                // Alle API-Anfragen parallel durchführen
                const results = await Promise.all(
                    lightUpdates.map(async (update) => {
                        try {
                            const response = await update.request;
                            return { lightId: update.lightId, result: await response.json() };
                        } catch (error) {
                            return { lightId: update.lightId, error };
                        }
                    })
                );

                // Auf Fehler prüfen
                const errors = results.filter(result => result.error || (result.result[0] && result.result[0].error));

                if (errors.length > 0) {
                    console.error("Fehler beim Schalten einzelner Lichter:", errors);
                    setStatus(`Fehler beim Schalten von ${errors.length} Lichtern`, 'error');

                    // Licht-Status bei fehlgeschlagenen Anfragen zurücksetzen
                    const correctedLights = { ...updatedLights };
                    errors.forEach(error => {
                        const lightId = error.lightId;
                        if (correctedLights[lightId]) {
                            correctedLights[lightId] = {
                                ...correctedLights[lightId],
                                state: {
                                    ...correctedLights[lightId].state,
                                    on: !newOn // Zurück zum ursprünglichen Zustand
                                }
                            };
                        }
                    });

                    // Aktualisierte Lichter zurücksenden
                    onUpdateLights(correctedLights);
                } else {
                    setStatus(newOn ? 'Gruppe eingeschaltet' : 'Gruppe ausgeschaltet', 'success');
                }
            } else {
                setStatus(newOn ? 'Gruppe eingeschaltet' : 'Gruppe ausgeschaltet', 'success');
            }
        } catch (error) {
            console.error("Allgemeiner Fehler beim Schalten der Gruppe:", error);
            setStatus('Verbindungsfehler zur Bridge', 'error');

            // Status zurücksetzen
            setAllOn(!allOn);
        }
    };

    // Helligkeit der Gruppe einstellen
    const adjustBrightness = async (value) => {
        try {
            // Sofort UI aktualisieren für bessere UX
            const newBrightness = parseInt(value);
            setBrightness(newBrightness);

            // Die Helligkeitsänderung für alle Lichter vorbereiten
            const updatedLights = { ...lights };
            const lightUpdates = [];

            for (const lightId of group.lights) {
                if (updatedLights[lightId] && updatedLights[lightId].state.on) {
                    // Lokalen Zustand aktualisieren
                    updatedLights[lightId] = {
                        ...updatedLights[lightId],
                        state: {
                            ...updatedLights[lightId].state,
                            bri: newBrightness
                        }
                    };

                    // API-Anfrage vorbereiten
                    lightUpdates.push({
                        lightId,
                        request: fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ bri: newBrightness })
                        })
                    });
                }
            }

            // An Callback zur Aktualisierung der Lichtzustände senden
            onUpdateLights(updatedLights);
            onSetBrightness(newBrightness);

            // Direkter API-Aufruf für die Gruppe (wenn Bridge-API verwendet wird)
            let groupApiSuccess = true;
            if (group.bridgeGroupId) {
                try {
                    const groupResponse = await fetch(`http://${bridgeIP}/api/${username}/groups/${group.bridgeGroupId}/action`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bri: newBrightness })
                    });

                    const groupResult = await groupResponse.json();
                    if (groupResult[0] && groupResult[0].error) {
                        console.error("Fehler beim Gruppen-API-Aufruf:", groupResult);
                        groupApiSuccess = false;
                    }
                } catch (error) {
                    console.error("Fehler beim Gruppen-API-Aufruf:", error);
                    groupApiSuccess = false;
                }
            }

            // Einzelne Lichter anpassen, wenn Gruppenaufruf fehlgeschlagen ist
            if (!groupApiSuccess || !group.bridgeGroupId) {
                // Alle API-Anfragen parallel durchführen
                const results = await Promise.all(
                    lightUpdates.map(async (update) => {
                        try {
                            const response = await update.request;
                            return { lightId: update.lightId, result: await response.json() };
                        } catch (error) {
                            return { lightId: update.lightId, error };
                        }
                    })
                );

                // Auf Fehler prüfen
                const errors = results.filter(result => result.error || (result.result[0] && result.result[0].error));

                if (errors.length > 0) {
                    console.error("Fehler beim Ändern der Helligkeit einzelner Lichter:", errors);
                    setStatus(`Fehler beim Ändern der Helligkeit von ${errors.length} Lichtern`, 'error');
                } else {
                    setStatus('Helligkeit angepasst', 'success');
                }
            } else {
                setStatus('Helligkeit angepasst', 'success');
            }
        } catch (error) {
            console.error("Allgemeiner Fehler beim Einstellen der Gruppenhelligkeit:", error);
            setStatus('Verbindungsfehler zur Bridge', 'error');

            // Status zurücksetzen
            setBrightness(brightness);
        }
    };

    return (
        <div className="group-controls">
            <div className="control-header">
                <h3>Gruppensteuerung</h3>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={allOn}
                        onChange={toggleGroup}
                    />
                    <span className="slider"></span>
                </label>
            </div>

            {allOn && (
                <div className="brightness-control">
                    <label htmlFor="group-brightness">Helligkeit</label>
                    <div className="control-row">
                        <input
                            type="range"
                            id="group-brightness"
                            min="1"
                            max="254"
                            value={brightness}
                            onChange={(e) => adjustBrightness(e.target.value)}
                        />
                        <span className="brightness-value">{Math.round((brightness / 254) * 100)}%</span>
                    </div>
                </div>
            )}

            <div className="group-lights-list">
                <h4>Lichter in dieser Gruppe</h4>
                <div className="group-lights">
                    {group.lights.map(lightId => {
                        const light = lights[lightId];
                        if (!light) return null;

                        return (
                            <div key={lightId} className="group-light-item">
                                <div
                                    className="light-color-indicator"
                                    style={{
                                        backgroundColor: light.state.on ?
                                            (light.state.hue ? hsvToColor(light.state) : '#FFFFFF') :
                                            '#444'
                                    }}
                                ></div>
                                <span className="light-name">{light.name}</span>
                                <span className="light-status">
                                    {light.state.on ?
                                        `${Math.round((light.state.bri || 254) / 254 * 100)}%` :
                                        'Aus'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {statusMessage.message && (
                <div className={`status-message status-${statusMessage.type}`}>
                    {statusMessage.message}
                </div>
            )}
        </div>
    );
};

// Modaler Dialog zum Erstellen/Bearbeiten von Gruppen
const GroupFormModal = ({ group, lights, onSave, onCancel, bridgeGroups = [] }) => {
    const [formData, setFormData] = useState(
        group || {
            name: '',
            type: 'room',
            roomType: 'living',
            lights: []
        }
    );

    const [draggedLight, setDraggedLight] = useState(null);
    const dropZoneRef = useRef(null);

    // Handle Eingabeänderungen
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Licht zur Gruppe hinzufügen/entfernen
    const toggleLight = (lightId) => {
        setFormData(prev => {
            const lightIndex = prev.lights.indexOf(lightId);
            if (lightIndex >= 0) {
                // Licht entfernen
                const newLights = [...prev.lights];
                newLights.splice(lightIndex, 1);
                return { ...prev, lights: newLights };
            } else {
                // Licht hinzufügen
                return { ...prev, lights: [...prev.lights, lightId] };
            }
        });
    };

    // Drag & Drop Funktionen
    const handleDragStart = (e, lightId) => {
        setDraggedLight(lightId);
        e.dataTransfer.setData('text/plain', lightId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (dropZoneRef.current) {
            dropZoneRef.current.classList.add('active');
        }
    };

    const handleDragLeave = () => {
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.remove('active');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const lightId = e.dataTransfer.getData('text/plain');

        if (!formData.lights.includes(lightId)) {
            setFormData(prev => ({
                ...prev,
                lights: [...prev.lights, lightId]
            }));
        }

        setDraggedLight(null);

        if (dropZoneRef.current) {
            dropZoneRef.current.classList.remove('active');
        }
    };

    // Bridge-Gruppe importieren
    const importBridgeGroup = (groupId) => {
        const bridgeGroup = bridgeGroups.find(g => g.id === groupId);
        if (!bridgeGroup) return;

        setFormData(prev => ({
            ...prev,
            name: bridgeGroup.name,
            lights: bridgeGroup.lights,
            bridgeGroupId: bridgeGroup.id,
            type: bridgeGroup.type === 'Room' ? 'room' : 'zone',
            roomType: mapBridgeTypeToRoomType(bridgeGroup.class)
        }));
    };

    // Formular absenden
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{group ? 'Gruppe bearbeiten' : 'Neue Gruppe erstellen'}</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Gruppenname"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="type">Typ</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                        >
                            <option value="room">Raum</option>
                            <option value="zone">Zone</option>
                        </select>
                    </div>

                    {formData.type === 'room' && (
                        <div className="form-group">
                            <label htmlFor="roomType">Raumtyp</label>
                            <select
                                id="roomType"
                                name="roomType"
                                value={formData.roomType}
                                onChange={handleInputChange}
                            >
                                <option value="living">Wohnzimmer</option>
                                <option value="bedroom">Schlafzimmer</option>
                                <option value="kitchen">Küche</option>
                                <option value="dining">Esszimmer</option>
                                <option value="bathroom">Badezimmer</option>
                                <option value="office">Büro</option>
                                <option value="outdoor">Außenbereich</option>
                                <option value="other">Sonstiger Raum</option>
                            </select>
                        </div>
                    )}

                    {bridgeGroups.length > 0 && (
                        <div className="form-group">
                            <label htmlFor="importGroup">Von Bridge importieren (optional)</label>
                            <select
                                id="importGroup"
                                onChange={(e) => {
                                    if (e.target.value) importBridgeGroup(e.target.value);
                                    e.target.value = ''; // Reset nach Auswahl
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>Gruppe auswählen...</option>
                                {bridgeGroups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                            <p className="hint-text">Wähle eine existierende Gruppe von deiner Hue Bridge, um ihre Lichter zu importieren.</p>
                        </div>
                    )}

                    <div className="form-section">
                        <h3>Lichter zuweisen</h3>
                        <p className="hint-text">Ziehe Lichter in die Gruppe oder wähle sie direkt aus.</p>

                        <div className="drag-drop-container">
                            <div className="available-lights">
                                <h4>Verfügbare Lichter</h4>
                                <div className="lights-list">
                                    {Object.entries(lights).map(([id, light]) => {
                                        const isInGroup = formData.lights.includes(id);
                                        return (
                                            <div
                                                key={id}
                                                className={`light-item ${isInGroup ? 'in-group' : ''} ${draggedLight === id ? 'dragging' : ''}`}
                                                draggable={!isInGroup}
                                                onDragStart={(e) => handleDragStart(e, id)}
                                            >
                                                <div
                                                    className="light-color"
                                                    style={{
                                                        backgroundColor: light.state.on ?
                                                            (light.state.hue ? hsvToColor(light.state) : '#FFFFFF') :
                                                            '#444'
                                                    }}
                                                ></div>
                                                <span className="light-name">{light.name}</span>
                                                <button
                                                    type="button"
                                                    className={`light-toggle ${isInGroup ? 'remove' : 'add'}`}
                                                    onClick={() => toggleLight(id)}
                                                >
                                                    {isInGroup ? '–' : '+'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div
                                className="group-drop-zone"
                                ref={dropZoneRef}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <h4>Lichter in dieser Gruppe ({formData.lights.length})</h4>
                                {formData.lights.length === 0 ? (
                                    <div className="empty-group">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="16" />
                                            <line x1="8" y1="12" x2="16" y2="12" />
                                        </svg>
                                        <p>Lichter hierher ziehen</p>
                                    </div>
                                ) : (
                                    <div className="group-lights-list">
                                        {formData.lights.map(lightId => {
                                            const light = lights[lightId];
                                            if (!light) return null;

                                            return (
                                                <div key={lightId} className="group-light">
                                                    <div
                                                        className="light-color"
                                                        style={{
                                                            backgroundColor: light.state.on ?
                                                                (light.state.hue ? hsvToColor(light.state) : '#FFFFFF') :
                                                                '#444'
                                                        }}
                                                    ></div>
                                                    <span className="light-name">{light.name}</span>
                                                    <button
                                                        type="button"
                                                        className="light-toggle remove"
                                                        onClick={() => toggleLight(lightId)}
                                                    >
                                                        –
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onCancel} className="reset-button">Abbrechen</button>
                        <button
                            type="submit"
                            disabled={formData.lights.length === 0}
                        >
                            Speichern
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Hilfsfunktion zur Umwandlung von Bridge-Raumtypen in unsere Raumtypen
const mapBridgeTypeToRoomType = (bridgeClass) => {
    const mapping = {
        'Living room': 'living',
        'Kitchen': 'kitchen',
        'Dining': 'dining',
        'Bedroom': 'bedroom',
        'Bathroom': 'bathroom',
        'Office': 'office',
        'Outdoor': 'outdoor'
        // Für andere Typen wird 'other' verwendet
    };

    return mapping[bridgeClass] || 'other';
};

// Hilfsfunktion zur Umwandlung von HSV in Farbe für Anzeige
const hsvToColor = (state) => {
    const h = (state.hue / 65535) * 360;
    const s = (state.sat / 254) * 100;
    const l = 50; // Feste Helligkeit für Anzeige

    return `hsl(${h}, ${s}%, ${l}%)`;
};

// Hauptkomponente für die Gruppenverwaltung
const GroupsView = ({ lights, username, bridgeIP, onLightsUpdate }) => {
    const [groups, setGroups] = useState([]);
    const [bridgeGroups, setBridgeGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState(null);
    const [localLights, setLocalLights] = useState({});
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });

    // Initialisiere lokalen Lichtzustand
    useEffect(() => {
        setLocalLights(lights);
    }, [lights]);

    // Status setzen mit Timeout
    const setStatus = (message, type = 'info') => {
        setStatusMessage({ message, type });
        setTimeout(() => {
            setStatusMessage({ message: '', type: 'info' });
        }, 3000);
    };

    // Lade Gruppen beim Komponenten-Mount
    useEffect(() => {
        if (Object.keys(lights).length > 0) {
            loadGroups();
        }
    }, [lights, username, bridgeIP]);

    // Lade Gruppen
    const loadGroups = async () => {
        try {
            setLoading(true);

            // Lade gespeicherte Gruppen aus dem lokalen Speicher
            let localGroups = [];
            const savedGroups = localStorage.getItem('hue-groups');

            if (savedGroups) {
                localGroups = JSON.parse(savedGroups);
            }

            // Lade Gruppeninformationen von der Bridge
            try {
                const response = await fetch(`http://${bridgeIP}/api/${username}/groups`);
                const data = await response.json();

                if (data && !data.error) {
                    const mappedBridgeGroups = Object.entries(data).map(([id, group]) => ({
                        id,
                        name: group.name,
                        type: group.type,
                        class: group.class,
                        lights: group.lights
                    }));

                    setBridgeGroups(mappedBridgeGroups);

                    // Importiere Bridge-Gruppen, falls noch keine lokalen Gruppen vorhanden sind
                    if (localGroups.length === 0) {
                        localGroups = mappedBridgeGroups.map(bridgeGroup => ({
                            id: `bridge-${bridgeGroup.id}`,
                            name: bridgeGroup.name,
                            type: bridgeGroup.type === 'Room' ? 'room' : 'zone',
                            roomType: mapBridgeTypeToRoomType(bridgeGroup.class),
                            lights: bridgeGroup.lights,
                            bridgeGroupId: bridgeGroup.id
                        }));

                        // Speichere importierte Gruppen
                        localStorage.setItem('hue-groups', JSON.stringify(localGroups));
                    }
                }
            } catch (err) {
                console.warn("Konnte keine Gruppen von der Bridge laden:", err);
                setStatus("Konnte keine Gruppen von der Bridge laden", "warning");
            }

            setGroups(localGroups);

            // Setze erste Gruppe als aktiv, falls keine aktiv ist
            if (localGroups.length > 0 && !activeGroupId) {
                setActiveGroupId(localGroups[0].id);
            }

            setLoading(false);
        } catch (err) {
            console.error("Fehler beim Laden der Gruppen:", err);
            setError("Gruppen konnten nicht geladen werden: " + err.message);
            setLoading(false);
        }
    };

    // Speichere Gruppen im lokalen Speicher
    const saveGroups = (updatedGroups) => {
        try {
            localStorage.setItem('hue-groups', JSON.stringify(updatedGroups));
        } catch (err) {
            console.error("Fehler beim Speichern der Gruppen:", err);
            setStatus("Fehler beim Speichern der Gruppen", "error");
        }
    };

    // Aktiviere eine Gruppe
    const activateGroup = (groupId) => {
        setActiveGroupId(groupId);
    };

    // Bearbeite eine Gruppe
    const editGroup = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (group) {
            setEditingGroup(group);
            setShowFormModal(true);
        }
    };

    // Lösche eine Gruppe
    const deleteGroup = (groupId) => {
        if (window.confirm("Möchtest du diese Gruppe wirklich löschen?")) {
            const updatedGroups = groups.filter(g => g.id !== groupId);
            setGroups(updatedGroups);
            saveGroups(updatedGroups);

            // Falls die gelöschte Gruppe aktiv war, wähle eine andere
            if (activeGroupId === groupId) {
                setActiveGroupId(updatedGroups.length > 0 ? updatedGroups[0].id : null);
            }

            setStatus("Gruppe wurde gelöscht", "success");
        }
    };

    // Erstelle oder aktualisiere eine Gruppe
    const saveGroup = (groupData) => {
        let updatedGroups;

        if (editingGroup) {
            // Aktualisiere bestehende Gruppe
            updatedGroups = groups.map(g =>
                g.id === editingGroup.id ? { ...g, ...groupData } : g
            );
            setStatus(`Gruppe "${groupData.name}" wurde aktualisiert`, "success");
        } else {
            // Erstelle neue Gruppe
            const newGroup = {
                ...groupData,
                id: Date.now().toString()
            };
            updatedGroups = [...groups, newGroup];
            setStatus(`Gruppe "${groupData.name}" wurde erstellt`, "success");
        }

        setGroups(updatedGroups);
        saveGroups(updatedGroups);
        setShowFormModal(false);
        setEditingGroup(null);

        // Setze neue Gruppe als aktiv
        if (!editingGroup) {
            setActiveGroupId(updatedGroups[updatedGroups.length - 1].id);
        }
    };

    // Alle Lichter in der aktiven Gruppe ein-/ausschalten
    const toggleAllLights = async (on) => {
        // Implementation in GroupControls
        console.log("Alle Lichter in Gruppe:", on ? "ein" : "aus");
    };

    // Helligkeit aller Lichter in der aktiven Gruppe einstellen
    const setGroupBrightness = async (brightness) => {
        // Implementation in GroupControls
        console.log("Gruppenhelligkeit setzen:", brightness);
    };

    // Update der Lichtzustände
    const handleLightsUpdate = (updatedLights) => {
        setLocalLights(updatedLights);
        if (typeof onLightsUpdate === 'function') {
            onLightsUpdate(updatedLights);
        }
    };

    // Finde die aktive Gruppe
    const activeGroup = groups.find(g => g.id === activeGroupId);

    return (
        <div className="groups-view">
            <div className="groups-header">
                <h2 className="section-title">Räume & Zonen</h2>
                <button onClick={() => { setEditingGroup(null); setShowFormModal(true); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Neue Gruppe
                </button>
            </div>

            <div className="groups-layout">
                <div className="groups-sidebar">
                    {loading ? (
                        <div className="loading">
                            <p>Lade Gruppen...</p>
                        </div>
                    ) : error ? (
                        <div className="status-message status-error">{error}</div>
                    ) : groups.length === 0 ? (
                        <div className="empty-state">
                            <p>Keine Gruppen vorhanden. Erstelle deine erste Gruppe!</p>
                        </div>
                    ) : (
                        <div className="groups-list">
                            {groups.map(group => (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    onEdit={editGroup}
                                    onDelete={deleteGroup}
                                    onActivate={activateGroup}
                                    isActive={activeGroupId === group.id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="groups-content">
                    {activeGroup ? (
                        <GroupControls
                            group={activeGroup}
                            lights={localLights}
                            onToggleAll={toggleAllLights}
                            onSetBrightness={setGroupBrightness}
                            onUpdateLights={handleLightsUpdate}
                            username={username}
                            bridgeIP={bridgeIP}
                        />
                    ) : (
                        <div className="no-selection">
                            <p>Wähle eine Gruppe aus oder erstelle eine neue, um Lichter zu steuern.</p>
                        </div>
                    )}
                </div>
            </div>

            {showFormModal && (
                <GroupFormModal
                    group={editingGroup}
                    lights={localLights}
                    onSave={saveGroup}
                    onCancel={() => { setShowFormModal(false); setEditingGroup(null); }}
                    bridgeGroups={bridgeGroups}
                />
            )}

            {statusMessage.message && (
                <div className={`status-message status-${statusMessage.type}`}>
                    {statusMessage.message}
                </div>
            )}
        </div>
    );
};

export default GroupsView;