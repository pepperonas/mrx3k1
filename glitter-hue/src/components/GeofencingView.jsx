// src/components/GeofencingView.jsx - Standortbasierte Steuerung für Hue-Lampen
import React, { useState, useEffect } from 'react';
import '../styles/geofencing.css';

/**
 * GeofencingView - Ermöglicht standortbasierte Automatisierungen für Philips Hue Lampen
 * Lichter können automatisch ein-/ausgeschaltet werden, wenn Benutzer nach Hause kommen oder das Haus verlassen
 */
const GeofencingView = ({ lights, username, bridgeIP }) => {
    // Geofencing-Zonen
    const [zones, setZones] = useState([]);
    // Benutzer-Liste
    const [users, setUsers] = useState([]);
    // Aktuelle Bearbeitung
    const [editingZone, setEditingZone] = useState(null);
    // Status-Nachricht
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });
    // Simulations-Modus zum Testen
    const [simulationMode, setSimulationMode] = useState(false);
    // Aktiver Tab
    const [activeTab, setActiveTab] = useState('zones');

    // Lade gespeicherte Zonen und Benutzer bei Komponenten-Mount
    useEffect(() => {
        loadZones();
        loadUsers();
    }, []);

    // Lade Zonen aus dem localStorage
    const loadZones = () => {
        try {
            const savedZones = localStorage.getItem('hue-geofencing-zones');
            if (savedZones) {
                setZones(JSON.parse(savedZones));
            } else {
                // Erstelle eine Standard-Heimzone, wenn keine vorhanden
                const defaultZone = {
                    id: '1',
                    name: 'Zuhause',
                    type: 'home',
                    radius: 100,
                    latitude: 52.520008, // Berlin als Standardwert
                    longitude: 13.404954,
                    actions: {
                        enter: {
                            active: true,
                            sceneName: 'Willkommen',
                            sceneId: '',
                            customAction: true,
                            lights: Object.keys(lights).slice(0, 3),
                            state: { on: true, bri: 254 }
                        },
                        exit: {
                            active: true,
                            sceneName: '',
                            sceneId: '',
                            customAction: true,
                            lights: Object.keys(lights),
                            state: { on: false }
                        }
                    },
                    rules: {
                        whenLastPersonLeaves: true,
                        whenFirstPersonArrives: true,
                        delayExitMinutes: 2
                    },
                    created: Date.now(),
                    lastTriggered: null
                };

                setZones([defaultZone]);
                saveZones([defaultZone]);
            }
        } catch (error) {
            console.error("Fehler beim Laden der Geofencing-Zonen:", error);
            setStatusMessage({
                message: "Zonen konnten nicht geladen werden: " + error.message,
                type: "error"
            });
        }
    };

    // Lade Benutzer aus dem localStorage
    const loadUsers = () => {
        try {
            const savedUsers = localStorage.getItem('hue-geofencing-users');
            if (savedUsers) {
                setUsers(JSON.parse(savedUsers));
            } else {
                // Erstelle einen Standard-Benutzer, wenn keiner vorhanden
                const defaultUser = {
                    id: '1',
                    name: 'Hauptbenutzer',
                    deviceName: 'Smartphone',
                    isHome: true,
                    trackingEnabled: true,
                    created: Date.now(),
                    lastLocationUpdate: Date.now()
                };

                setUsers([defaultUser]);
                saveUsers([defaultUser]);
            }
        } catch (error) {
            console.error("Fehler beim Laden der Geofencing-Benutzer:", error);
            setStatusMessage({
                message: "Benutzer konnten nicht geladen werden: " + error.message,
                type: "error"
            });
        }
    };

    // Speichere Zonen im localStorage
    const saveZones = (updatedZones) => {
        try {
            localStorage.setItem('hue-geofencing-zones', JSON.stringify(updatedZones));
        } catch (error) {
            console.error("Fehler beim Speichern der Geofencing-Zonen:", error);
            setStatusMessage({
                message: "Zonen konnten nicht gespeichert werden: " + error.message,
                type: "error"
            });
        }
    };

    // Speichere Benutzer im localStorage
    const saveUsers = (updatedUsers) => {
        try {
            localStorage.setItem('hue-geofencing-users', JSON.stringify(updatedUsers));
        } catch (error) {
            console.error("Fehler beim Speichern der Geofencing-Benutzer:", error);
            setStatusMessage({
                message: "Benutzer konnten nicht gespeichert werden: " + error.message,
                type: "error"
            });
        }
    };

    // Hole den aktuellen Standort
    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation wird von diesem Browser nicht unterstützt."));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(new Error(`Standort konnte nicht ermittelt werden: ${error.message}`));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    // Berechne Distanz zwischen zwei Koordinaten (Haversine-Formel)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Erdradius in Metern
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Entfernung in Metern
    };

    // Prüfe ob ein Benutzer innerhalb einer Zone ist
    const isUserInZone = (user, zone) => {
        // Im Simulations-Modus können wir den Status manuell ändern
        if (simulationMode) {
            return user.isHome;
        }

        // Für tatsächliche Implementierung müssten wir den zuletzt gespeicherten Standort des Benutzers verwenden
        // und die Distanz zur Zone berechnen
        if (user.lastLatitude && user.lastLongitude) {
            const distance = calculateDistance(
                user.lastLatitude,
                user.lastLongitude,
                zone.latitude,
                zone.longitude
            );

            return distance <= zone.radius;
        }

        return false;
    };

    // Führe Aktionen basierend auf Standortänderungen aus
    const executeZoneActions = async (user, zone, actionType) => {
        const action = zone.actions[actionType];
        if (!action || !action.active) return;

        try {
            if (action.customAction && action.lights && action.lights.length > 0) {
                // Wende benutzerdefinierten Lichtzustand auf ausgewählte Lampen an
                for (const lightId of action.lights) {
                    await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(action.state)
                    });
                }
            }
            else if (action.sceneId) {
                // Aktiviere eine Szene
                await fetch(`http://${bridgeIP}/api/${username}/groups/0/action`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ scene: action.sceneId })
                });
            }

            // Aktualisiere den letzten Auslösezeitpunkt der Zone
            const updatedZones = zones.map(z =>
                z.id === zone.id ? { ...z, lastTriggered: Date.now() } : z
            );
            setZones(updatedZones);
            saveZones(updatedZones);

            setStatusMessage({
                message: `${actionType === 'enter' ? 'Ankommen' : 'Verlassen'} erkannt: Aktion für "${zone.name}" ausgeführt.`,
                type: "success"
            });

            // Status-Nachricht nach 3 Sekunden ausblenden
            setTimeout(() => setStatusMessage({ message: '', type: '' }), 3000);
        } catch (error) {
            console.error(`Fehler beim Ausführen der ${actionType}-Aktion:`, error);
            setStatusMessage({
                message: `Aktion konnte nicht ausgeführt werden: ${error.message}`,
                type: "error"
            });
        }
    };

    // Aktualisiere den Benutzerstatus und führe Aktionen aus
    const updateUserStatus = async (userId, isHome) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Aktualisiere den Benutzer
        const updatedUsers = users.map(u =>
            u.id === userId ? {
                ...u,
                isHome,
                lastLocationUpdate: Date.now()
            } : u
        );

        setUsers(updatedUsers);
        saveUsers(updatedUsers);

        // Prüfe ob wir Aktionen ausführen müssen
        for (const zone of zones) {
            if (zone.type === 'home') {
                const isFirstArrival = isHome &&
                    !users.some(u => u.id !== userId && u.isHome) &&
                    zone.rules.whenFirstPersonArrives;

                const isLastDeparture = !isHome &&
                    !updatedUsers.some(u => u.isHome) &&
                    zone.rules.whenLastPersonLeaves;

                if (isFirstArrival) {
                    // Erster Benutzer kommt nach Hause
                    await executeZoneActions(user, zone, 'enter');
                } else if (isLastDeparture) {
                    // Letzter Benutzer verlässt das Haus
                    // Optional: Verzögerung
                    if (zone.rules.delayExitMinutes > 0) {
                        setStatusMessage({
                            message: `Aktion "Haus verlassen" wird in ${zone.rules.delayExitMinutes} Minuten ausgeführt...`,
                            type: "info"
                        });

                        setTimeout(async () => {
                            // Nochmal prüfen, ob immer noch alle weg sind
                            const currentUsers = JSON.parse(localStorage.getItem('hue-geofencing-users') || '[]');
                            if (!currentUsers.some(u => u.isHome)) {
                                await executeZoneActions(user, zone, 'exit');
                            }
                        }, zone.rules.delayExitMinutes * 60 * 1000);
                    } else {
                        await executeZoneActions(user, zone, 'exit');
                    }
                }
            }
        }
    };

    // Aktualisiere den Standort eines Benutzers
    const updateUserLocation = async (userId) => {
        try {
            const location = await getCurrentLocation();

            // Aktualisiere den Benutzer mit dem neuen Standort
            const updatedUsers = users.map(u =>
                u.id === userId ? {
                    ...u,
                    lastLatitude: location.latitude,
                    lastLongitude: location.longitude,
                    lastLocationUpdate: Date.now()
                } : u
            );

            setUsers(updatedUsers);
            saveUsers(updatedUsers);

            // Prüfe, ob der Benutzer in einer Heimzone ist
            const homeZone = zones.find(zone => zone.type === 'home');
            if (homeZone) {
                const user = updatedUsers.find(u => u.id === userId);
                const wasHome = user.isHome;
                const isHome = isUserInZone(user, homeZone);

                if (wasHome !== isHome) {
                    // Status hat sich geändert - aktualisiere und führe Aktionen aus
                    await updateUserStatus(userId, isHome);
                }
            }

            setStatusMessage({
                message: "Standort wurde erfolgreich aktualisiert.",
                type: "success"
            });

            // Status-Nachricht nach 3 Sekunden ausblenden
            setTimeout(() => setStatusMessage({ message: '', type: '' }), 3000);
        } catch (error) {
            console.error("Fehler beim Aktualisieren des Standorts:", error);
            setStatusMessage({
                message: error.message,
                type: "error"
            });
        }
    };

    // Erstelle eine neue Zone
    const createZone = () => {
        setEditingZone({
            id: null,
            name: 'Neue Zone',
            type: 'home',
            radius: 100,
            latitude: 52.520008, // Berlin als Standardwert
            longitude: 13.404954,
            actions: {
                enter: {
                    active: true,
                    sceneName: '',
                    sceneId: '',
                    customAction: true,
                    lights: Object.keys(lights).slice(0, 3),
                    state: { on: true, bri: 254 }
                },
                exit: {
                    active: true,
                    sceneName: '',
                    sceneId: '',
                    customAction: true,
                    lights: Object.keys(lights),
                    state: { on: false }
                }
            },
            rules: {
                whenLastPersonLeaves: true,
                whenFirstPersonArrives: true,
                delayExitMinutes: 2
            }
        });
    };

    // Bearbeite eine Zone
    const editZone = (zoneId) => {
        const zone = zones.find(z => z.id === zoneId);
        if (zone) {
            setEditingZone({...zone});
        }
    };

    // Lösche eine Zone
    const deleteZone = (zoneId) => {
        if (window.confirm('Möchtest du diese Zone wirklich löschen?')) {
            const updatedZones = zones.filter(z => z.id !== zoneId);
            setZones(updatedZones);
            saveZones(updatedZones);
        }
    };

    // Aktiviere/Deaktiviere eine Zone
    const toggleZone = (zoneId) => {
        const updatedZones = zones.map(z =>
            z.id === zoneId ? { ...z, active: !z.active } : z
        );
        setZones(updatedZones);
        saveZones(updatedZones);
    };

    // Speichere eine Zone
    const saveZone = (zoneData) => {
        if (zoneData.id) {
            // Aktualisiere bestehende Zone
            const updatedZones = zones.map(z =>
                z.id === zoneData.id ? zoneData : z
            );
            setZones(updatedZones);
            saveZones(updatedZones);
        } else {
            // Erstelle neue Zone
            const newZone = {
                ...zoneData,
                id: Date.now().toString(),
                created: Date.now()
            };
            const updatedZones = [...zones, newZone];
            setZones(updatedZones);
            saveZones(updatedZones);
        }

        setEditingZone(null);
    };

    // Erstelle einen neuen Benutzer
    const createUser = () => {
        const newUser = {
            id: Date.now().toString(),
            name: `Benutzer ${users.length + 1}`,
            deviceName: 'Neues Gerät',
            isHome: true,
            trackingEnabled: true,
            created: Date.now(),
            lastLocationUpdate: Date.now()
        };

        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
    };

    // Lösche einen Benutzer
    const deleteUser = (userId) => {
        if (window.confirm('Möchtest du diesen Benutzer wirklich löschen?')) {
            const updatedUsers = users.filter(u => u.id !== userId);
            setUsers(updatedUsers);
            saveUsers(updatedUsers);
        }
    };

    // Aktualisiere einen Benutzer
    const updateUser = (userId, data) => {
        const updatedUsers = users.map(u =>
            u.id === userId ? { ...u, ...data } : u
        );
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
    };

    // Zonen-Form-Komponente für das Erstellen/Bearbeiten von Zonen
    const ZoneForm = ({ zone, onSave, onCancel }) => {
        const [formData, setFormData] = useState(zone);
        const [activeActionTab, setActiveActionTab] = useState('enter');

        // Aktualisiere die Formularfelder
        const handleInputChange = (e) => {
            const { name, value, type } = e.target;

            // Für numerische Felder konvertieren
            if (type === 'number') {
                setFormData(prev => ({
                    ...prev,
                    [name]: parseFloat(value)
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: value
                }));
            }
        };

        // Aktualisiere verschachtelte Felder
        const handleNestedChange = (group, key, value) => {
            setFormData(prev => ({
                ...prev,
                [group]: {
                    ...prev[group],
                    [key]: value
                }
            }));
        };

        // Aktualisiere Aktionen
        const handleActionChange = (actionType, key, value) => {
            setFormData(prev => ({
                ...prev,
                actions: {
                    ...prev.actions,
                    [actionType]: {
                        ...prev.actions[actionType],
                        [key]: value
                    }
                }
            }));
        };

        // Aktualisiere Aktion-Lichtzustand
        const handleStateChange = (actionType, stateKey, value) => {
            setFormData(prev => ({
                ...prev,
                actions: {
                    ...prev.actions,
                    [actionType]: {
                        ...prev.actions[actionType],
                        state: {
                            ...prev.actions[actionType].state,
                            [stateKey]: stateKey === 'bri' || stateKey === 'ct' ? parseInt(value) : value
                        }
                    }
                }
            }));
        };

        // Lampe zur Aktionsauswahl hinzufügen/entfernen
        const toggleLightForAction = (actionType, lightId) => {
            const currentLights = formData.actions[actionType].lights || [];

            if (currentLights.includes(lightId)) {
                handleActionChange(
                    actionType,
                    'lights',
                    currentLights.filter(id => id !== lightId)
                );
            } else {
                handleActionChange(
                    actionType,
                    'lights',
                    [...currentLights, lightId]
                );
            }
        };

        // Alle Lampen auswählen
        const selectAllLights = (actionType) => {
            handleActionChange(
                actionType,
                'lights',
                Object.keys(lights)
            );
        };

        // Keine Lampen auswählen
        const selectNoLights = (actionType) => {
            handleActionChange(
                actionType,
                'lights',
                []
            );
        };

        // Aktuellen Standort abrufen
        const fetchCurrentLocation = async () => {
            try {
                const location = await getCurrentLocation();
                setFormData(prev => ({
                    ...prev,
                    latitude: location.latitude,
                    longitude: location.longitude
                }));

                setStatusMessage({
                    message: "Standort wurde erfolgreich aktualisiert.",
                    type: "success"
                });
            } catch (error) {
                setStatusMessage({
                    message: error.message,
                    type: "error"
                });
            }
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
                        <h2>{zone.id ? 'Zone bearbeiten' : 'Neue Zone erstellen'}</h2>
                        <button className="close-button" onClick={onCancel}>×</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Grundlegende Informationen */}
                        <div className="form-section">
                            <h3>Grundlegende Informationen</h3>

                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
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
                                    <option value="home">Zuhause</option>
                                    <option value="work">Arbeitsplatz</option>
                                    <option value="custom">Benutzerdefiniert</option>
                                </select>
                            </div>
                        </div>

                        {/* Standort */}
                        <div className="form-section">
                            <h3>Standort</h3>
                            <p className="form-hint">Definiere den Bereich, in dem Aktionen ausgelöst werden sollen.</p>

                            <div className="location-input-group">
                                <div className="form-row">
                                    <div className="form-group half">
                                        <label htmlFor="latitude">Breitengrad</label>
                                        <input
                                            type="number"
                                            id="latitude"
                                            name="latitude"
                                            value={formData.latitude}
                                            onChange={handleInputChange}
                                            step="0.000001"
                                            required
                                        />
                                    </div>

                                    <div className="form-group half">
                                        <label htmlFor="longitude">Längengrad</label>
                                        <input
                                            type="number"
                                            id="longitude"
                                            name="longitude"
                                            value={formData.longitude}
                                            onChange={handleInputChange}
                                            step="0.000001"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="location-button"
                                    onClick={fetchCurrentLocation}
                                >
                                    Aktuellen Standort verwenden
                                </button>
                            </div>

                            <div className="form-group">
                                <label htmlFor="radius">Radius (Meter)</label>
                                <div className="range-with-value">
                                    <input
                                        type="range"
                                        id="radius"
                                        name="radius"
                                        min="25"
                                        max="500"
                                        value={formData.radius}
                                        onChange={handleInputChange}
                                    />
                                    <span className="range-value">{formData.radius}m</span>
                                </div>
                            </div>
                        </div>

                        {/* Regeln */}
                        <div className="form-section">
                            <h3>Regeln</h3>
                            <p className="form-hint">Bestimme, wann Aktionen ausgelöst werden sollen.</p>

                            <div className="checkbox-group">
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.rules.whenFirstPersonArrives}
                                        onChange={e => handleNestedChange('rules', 'whenFirstPersonArrives', e.target.checked)}
                                    />
                                    <span>Aktion ausführen, wenn die erste Person ankommt</span>
                                </label>

                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={formData.rules.whenLastPersonLeaves}
                                        onChange={e => handleNestedChange('rules', 'whenLastPersonLeaves', e.target.checked)}
                                    />
                                    <span>Aktion ausführen, wenn die letzte Person geht</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label htmlFor="delayExitMinutes">Verzögerung beim Verlassen (Minuten)</label>
                                <div className="range-with-value">
                                    <input
                                        type="range"
                                        id="delayExitMinutes"
                                        min="0"
                                        max="30"
                                        value={formData.rules.delayExitMinutes}
                                        onChange={e => handleNestedChange('rules', 'delayExitMinutes', parseInt(e.target.value))}
                                    />
                                    <span className="range-value">{formData.rules.delayExitMinutes} min</span>
                                </div>
                                <p className="form-hint">Wartezeit, bevor Verlassen-Aktionen ausgeführt werden.</p>
                            </div>
                        </div>

                        {/* Aktionen */}
                        <div className="form-section">
                            <h3>Aktionen</h3>
                            <p className="form-hint">Lege fest, was passieren soll, wenn du die Zone betrittst oder verlässt.</p>

                            <div className="tabs-header">
                                <button
                                    type="button"
                                    className={`tab-button ${activeActionTab === 'enter' ? 'active' : ''}`}
                                    onClick={() => setActiveActionTab('enter')}
                                >
                                    Beim Betreten
                                </button>
                                <button
                                    type="button"
                                    className={`tab-button ${activeActionTab === 'exit' ? 'active' : ''}`}
                                    onClick={() => setActiveActionTab('exit')}
                                >
                                    Beim Verlassen
                                </button>
                            </div>

                            <div className="action-form">
                                {activeActionTab === 'enter' && (
                                    <div className="action-settings">
                                        <div className="form-group">
                                            <label className="checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.actions.enter.active}
                                                    onChange={e => handleActionChange('enter', 'active', e.target.checked)}
                                                />
                                                <span>Aktion beim Betreten aktivieren</span>
                                            </label>
                                        </div>

                                        <div className="form-group">
                                            <label>Art der Aktion</label>
                                            <div className="radio-group">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        checked={formData.actions.enter.customAction}
                                                        onChange={() => handleActionChange('enter', 'customAction', true)}
                                                    />
                                                    <span>Benutzerdefinierte Aktion</span>
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        checked={!formData.actions.enter.customAction}
                                                        onChange={() => handleActionChange('enter', 'customAction', false)}
                                                    />
                                                    <span>Szene aktivieren</span>
                                                </label>
                                            </div>
                                        </div>

                                        {formData.actions.enter.customAction ? (
                                            <>
                                                <div className="form-group">
                                                    <label>Lichtzustand</label>
                                                    <div className="light-state-controls">
                                                        <div className="control-row">
                                                            <label className="switch">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.actions.enter.state?.on}
                                                                    onChange={e => handleStateChange('enter', 'on', e.target.checked)}
                                                                />
                                                                <span className="slider"></span>
                                                            </label>
                                                            <span>Lichter einschalten</span>
                                                        </div>

                                                        {formData.actions.enter.state?.on && (
                                                            <>
                                                                <div className="control-row">
                                                                    <label>Helligkeit:</label>
                                                                    <div className="range-with-value">
                                                                        <input
                                                                            type="range"
                                                                            min="1"
                                                                            max="254"
                                                                            value={formData.actions.enter.state?.bri || 254}
                                                                            onChange={e => handleStateChange('enter', 'bri', e.target.value)}
                                                                        />
                                                                        <span className="range-value">
                                                                            {Math.round((formData.actions.enter.state?.bri || 254) / 254 * 100)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Lichter auswählen</label>
                                                    <div className="light-selection-buttons">
                                                        <button
                                                            type="button"
                                                            onClick={() => selectAllLights('enter')}
                                                        >
                                                            Alle auswählen
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectNoLights('enter')}
                                                        >
                                                            Keine auswählen
                                                        </button>
                                                    </div>

                                                    <div className="light-selection-grid">
                                                        {Object.entries(lights).map(([id, light]) => (
                                                            <div key={id} className="light-checkbox">
                                                                <label>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.actions.enter.lights?.includes(id) || false}
                                                                        onChange={() => toggleLightForAction('enter', id)}
                                                                    />
                                                                    {light.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="form-group">
                                                <label htmlFor="enterSceneId">Szene</label>
                                                <input
                                                    type="text"
                                                    id="enterSceneId"
                                                    placeholder="Szene ID oder Name"
                                                    value={formData.actions.enter.sceneName}
                                                    onChange={e => handleActionChange('enter', 'sceneName', e.target.value)}
                                                />
                                                <p className="form-hint">
                                                    Gib die ID oder den Namen einer gespeicherten Szene ein.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeActionTab === 'exit' && (
                                    <div className="action-settings">
                                        <div className="form-group">
                                            <label className="checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.actions.exit.active}
                                                    onChange={e => handleActionChange('exit', 'active', e.target.checked)}
                                                />
                                                <span>Aktion beim Verlassen aktivieren</span>
                                            </label>
                                        </div>

                                        <div className="form-group">
                                            <label>Art der Aktion</label>
                                            <div className="radio-group">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        checked={formData.actions.exit.customAction}
                                                        onChange={() => handleActionChange('exit', 'customAction', true)}
                                                    />
                                                    <span>Benutzerdefinierte Aktion</span>
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        checked={!formData.actions.exit.customAction}
                                                        onChange={() => handleActionChange('exit', 'customAction', false)}
                                                    />
                                                    <span>Szene aktivieren</span>
                                                </label>
                                            </div>
                                        </div>

                                        {formData.actions.exit.customAction ? (
                                            <>
                                                <div className="form-group">
                                                    <label>Lichtzustand</label>
                                                    <div className="light-state-controls">
                                                        <div className="control-row">
                                                            <label className="switch">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.actions.exit.state?.on === false}
                                                                    onChange={e => handleStateChange('exit', 'on', !e.target.checked)}
                                                                />
                                                                <span className="slider"></span>
                                                            </label>
                                                            <span>Lichter ausschalten</span>
                                                        </div>

                                                        {formData.actions.exit.state?.on !== false && (
                                                            <>
                                                                <div className="control-row">
                                                                    <label>Helligkeit:</label>
                                                                    <div className="range-with-value">
                                                                        <input
                                                                            type="range"
                                                                            min="1"
                                                                            max="254"
                                                                            value={formData.actions.exit.state?.bri || 254}
                                                                            onChange={e => handleStateChange('exit', 'bri', e.target.value)}
                                                                        />
                                                                        <span className="range-value">
                                                                            {Math.round((formData.actions.exit.state?.bri || 254) / 254 * 100)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Lichter auswählen</label>
                                                    <div className="light-selection-buttons">
                                                        <button
                                                            type="button"
                                                            onClick={() => selectAllLights('exit')}
                                                        >
                                                            Alle auswählen
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectNoLights('exit')}
                                                        >
                                                            Keine auswählen
                                                        </button>
                                                    </div>

                                                    <div className="light-selection-grid">
                                                        {Object.entries(lights).map(([id, light]) => (
                                                            <div key={id} className="light-checkbox">
                                                                <label>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.actions.exit.lights?.includes(id) || false}
                                                                        onChange={() => toggleLightForAction('exit', id)}
                                                                    />
                                                                    {light.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="form-group">
                                                <label htmlFor="exitSceneId">Szene</label>
                                                <input
                                                    type="text"
                                                    id="exitSceneId"
                                                    placeholder="Szene ID oder Name"
                                                    value={formData.actions.exit.sceneName}
                                                    onChange={e => handleActionChange('exit', 'sceneName', e.target.value)}
                                                />
                                                <p className="form-hint">
                                                    Gib die ID oder den Namen einer gespeicherten Szene ein.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="cancel-button" onClick={onCancel}>Abbrechen</button>
                            <button type="submit">Speichern</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // Zone-Karte-Komponente für die Anzeige von Zonen
    const ZoneCard = ({ zone, onEdit, onDelete, onToggle }) => {
        // Formatiere den letzten Auslösezeitpunkt
        const formatLastTriggered = (timestamp) => {
            if (!timestamp) return 'Nie';

            const date = new Date(timestamp);
            return date.toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        return (
            <div className="geofencing-zone-card">
                <div className="zone-icon">
                    {zone.type === 'home' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    )}
                    {zone.type === 'work' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                    )}
                    {zone.type === 'custom' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    )}
                </div>

                <div className="zone-details">
                    <h3>{zone.name}</h3>
                    <p className="zone-info">
                        Radius: {zone.radius}m •
                        Zuletzt ausgelöst: {formatLastTriggered(zone.lastTriggered)}
                    </p>
                    <div className="zone-actions">
                        <div className="zone-rule-icons">
                            {zone.rules.whenFirstPersonArrives && (
                                <span className="rule-icon arrive" title="Aktion bei Ankunft">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </span>
                            )}
                            {zone.rules.whenLastPersonLeaves && (
                                <span className="rule-icon leave" title="Aktion beim Verlassen">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                                        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                                        <line x1="6" y1="1" x2="6" y2="4"></line>
                                        <line x1="10" y1="1" x2="10" y2="4"></line>
                                        <line x1="14" y1="1" x2="14" y2="4"></line>
                                    </svg>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="zone-buttons">
                    <button className="icon-button edit" onClick={() => onEdit(zone.id)} title="Zone bearbeiten">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button className="icon-button delete" onClick={() => onDelete(zone.id)} title="Zone löschen">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
        );
    };

    // Benutzer-Karte-Komponente für die Anzeige von Benutzern
    const UserCard = ({ user, onDelete, onToggleStatus }) => {
        const lastUpdate = user.lastLocationUpdate ? new Date(user.lastLocationUpdate).toLocaleString('de-DE') : 'Nie';

        return (
            <div className="geofencing-user-card">
                <div className="user-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>

                <div className="user-details">
                    <h3>{user.name}</h3>
                    <p className="user-info">
                        Gerät: {user.deviceName} •
                        Zuletzt aktualisiert: {lastUpdate}
                    </p>
                </div>

                <div className="user-status">
                    <div className="status-indicator">
                        <span className={`status-dot ${user.isHome ? 'home' : 'away'}`}></span>
                        <span>{user.isHome ? 'Zuhause' : 'Unterwegs'}</span>
                    </div>

                    <div className="user-controls">
                        <div className="status-toggle">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={user.isHome}
                                    onChange={() => onToggleStatus(user.id, !user.isHome)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <button className="icon-button delete" onClick={() => onDelete(user.id)} title="Benutzer löschen">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Komponente zur Aktualisierung der Benutzerstandorte
    const LocationUpdater = ({ onUpdate }) => {
        return (
            <div className="location-updater">
                <button className="update-location-button" onClick={onUpdate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Standort aktualisieren
                </button>
                <p className="update-hint">
                    Aktualisiere deinen Standort, um automatische Aktionen auszulösen.
                </p>
            </div>
        );
    };

    return (
        <div className="geofencing-view">
            <div className="geofencing-header">
                <h2 className="section-title">Standortbasierte Steuerung</h2>

                {simulationMode && (
                    <div className="simulation-badge">Simulationsmodus</div>
                )}

                <div className="geofencing-actions">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={simulationMode}
                            onChange={() => setSimulationMode(!simulationMode)}
                        />
                        <span className="slider"></span>
                        <span className="switch-label">Simulationsmodus</span>
                    </label>
                </div>
            </div>

            <div className="tabs-container">
                <div className="tabs-header">
                    <button
                        className={`tab-button ${activeTab === 'zones' ? 'active' : ''}`}
                        onClick={() => setActiveTab('zones')}
                    >
                        Zonen
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Benutzer
                    </button>
                </div>

                <div className="tabs-body">
                    {activeTab === 'zones' && (
                        <div className="zones-tab">
                            <div className="tab-actions">
                                <button onClick={createZone}>Neue Zone erstellen</button>
                            </div>

                            {zones.length === 0 ? (
                                <div className="empty-state">
                                    <p>Keine Zonen definiert. Erstelle eine Zone, um standortbasierte Automatisierungen zu nutzen.</p>
                                </div>
                            ) : (
                                <div className="zones-list">
                                    {zones.map(zone => (
                                        <ZoneCard
                                            key={zone.id}
                                            zone={zone}
                                            onEdit={editZone}
                                            onDelete={deleteZone}
                                            onToggle={toggleZone}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="users-tab">
                            <div className="tab-actions">
                                <button onClick={createUser}>Neuen Benutzer hinzufügen</button>
                            </div>

                            <LocationUpdater
                                onUpdate={() => updateUserLocation(users[0]?.id)}
                            />

                            {users.length === 0 ? (
                                <div className="empty-state">
                                    <p>Keine Benutzer definiert. Füge einen Benutzer hinzu, um den Standort zu verfolgen.</p>
                                </div>
                            ) : (
                                <div className="users-list">
                                    {users.map(user => (
                                        <UserCard
                                            key={user.id}
                                            user={user}
                                            onDelete={deleteUser}
                                            onToggleStatus={updateUserStatus}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {statusMessage.message && (
                <div className={`status-message status-${statusMessage.type}`}>
                    {statusMessage.message}
                </div>
            )}

            {editingZone && (
                <ZoneForm
                    zone={editingZone}
                    onSave={saveZone}
                    onCancel={() => setEditingZone(null)}
                />
            )}
        </div>
    );
};

export default GeofencingView;