// src/components/ScenesView.jsx - Szenen-Management im BrainBuster-Stil
import React, {useEffect, useState} from 'react';
import {Scene, SCENE_TYPES} from '../models/types';

// Szenen-Icons
const SceneIcon = ({type, name, isActive}) => {
    // Icon basierend auf Szenentyp oder Namen wählen
    const getIconPath = () => {
        // Default-Icons nach Typ
        if (type === SCENE_TYPES.DYNAMIC) return 'dynamic';
        if (type === SCENE_TYPES.SYNC) return 'sync';

        // Spezifische Icons für bestimmte Szenen-Namen
        if (name.toLowerCase().includes('sonnenuntergang')) return 'sunset';
        if (name.toLowerCase().includes('lesen')) return 'reading';
        if (name.toLowerCase().includes('konzentriert')) return 'concentrate';
        if (name.toLowerCase().includes('entspannt')) return 'relax';
        if (name.toLowerCase().includes('energie')) return 'energize';
        if (name.toLowerCase().includes('nacht')) return 'nightlight';

        // Standard-Icon
        return 'scene';
    };

    const iconPath = getIconPath();

    return (
        <div className={`scene-icon ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
                {iconPath === 'dynamic' && (
                    <>
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v12"/>
                        <path d="M16 10l-4-4-4 4"/>
                    </>
                )}
                {iconPath === 'sync' && (
                    <>
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </>
                )}
                {iconPath === 'sunset' && (
                    <>
                        <path
                            d="M12 9V2M4.2 15.2L5.6 13.8M19.8 15.2L18.4 13.8M2 21H22M5.6 18.8L4.2 17.4M19.8 17.4L18.4 18.8M12 13V9"/>
                        <path d="M7 13a5 5 0 0 1 10 0"/>
                    </>
                )}
                {iconPath === 'reading' && (
                    <>
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </>
                )}
                {iconPath === 'concentrate' && (
                    <>
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8L12 16"/>
                        <path d="M8 12H16"/>
                    </>
                )}
                {iconPath === 'scene' && (
                    <>
                        <path d="M5 9l5 3l-5 3z"/>
                        <path d="M19 9l-5 3l5 3z"/>
                    </>
                )}
            </svg>
        </div>
    );
};

// Szenen-Karte für die Anzeige in der Szenen-Liste
const SceneCard = ({scene, onActivate, onEdit, onDelete}) => {
    return (
        <div className={`scene-card ${scene.isActive ? 'active' : ''}`}
             onClick={() => onActivate(scene.id)}>
            <SceneIcon type={scene.type} name={scene.name} isActive={scene.isActive}/>
            <div className="scene-details">
                <h3>{scene.name}</h3>
                <p className="scene-info">
                    {scene.lights.length} {scene.lights.length === 1 ? 'Lampe' : 'Lampen'} •
                    {scene.type === SCENE_TYPES.DYNAMIC ? ' Dynamisch' : scene.type === SCENE_TYPES.SYNC ? ' Synchronisiert' : ' Statisch'}
                </p>
            </div>
            <div className="scene-actions">
                <button
                    className="icon-button edit"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(scene.id);
                    }}
                    aria-label="Szene bearbeiten"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button
                    className="icon-button delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(scene.id);
                    }}
                    aria-label="Szene löschen"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

// Modaler Dialog zum Erstellen/Bearbeiten von Szenen
const SceneFormModal = ({scene, lights, onSave, onCancel}) => {
    const [formData, setFormData] = useState(
        scene || {
            name: '',
            type: SCENE_TYPES.STATIC,
            lights: [],
            states: {}
        }
    );

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleLightToggle = (lightId) => {
        const newLights = formData.lights.includes(lightId)
            ? formData.lights.filter(id => id !== lightId)
            : [...formData.lights, lightId];

        setFormData(prev => ({...prev, lights: newLights}));
    };

    const handleLightStateChange = (lightId, property, value) => {
        setFormData(prev => ({
            ...prev,
            states: {
                ...prev.states,
                [lightId]: {
                    ...(prev.states[lightId] || {}),
                    [property]: value
                }
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{scene ? 'Szene bearbeiten' : 'Neue Szene erstellen'}</h2>
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
                            placeholder="Szenenname"
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
                            <option value={SCENE_TYPES.STATIC}>Statisch</option>
                            <option value={SCENE_TYPES.DYNAMIC}>Dynamisch</option>
                            <option value={SCENE_TYPES.SYNC}>Mediensynchronisiert</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Lampen</label>
                        <div className="lights-selection">
                            {Object.entries(lights).map(([id, light]) => (
                                <div key={id} className="light-checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.lights.includes(id)}
                                            onChange={() => handleLightToggle(id)}
                                        />
                                        {light.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {formData.lights.length > 0 && (
                        <div className="form-group">
                            <label>Lichteinstellungen</label>
                            <div className="light-states">
                                {formData.lights.map(lightId => (
                                    <div key={lightId} className="light-state-config">
                                        <h4>{lights[lightId].name}</h4>

                                        <label>
                                            <span>Helligkeit</span>
                                            <input
                                                type="range"
                                                min="1"
                                                max="254"
                                                value={(formData.states[lightId]?.bri || 254)}
                                                onChange={(e) => handleLightStateChange(lightId, 'bri', parseInt(e.target.value))}
                                            />
                                        </label>

                                        {lights[lightId].state.hue !== undefined && (
                                            <label>
                                                <span>Farbe</span>
                                                <input
                                                    type="color"
                                                    className="color-picker"
                                                    value={convertToHex(formData.states[lightId] || lights[lightId].state)}
                                                    onChange={(e) => {
                                                        const hsv = hexToHsv(e.target.value);
                                                        handleLightStateChange(lightId, 'hue', hsv.hue);
                                                        handleLightStateChange(lightId, 'sat', hsv.sat);
                                                    }}
                                                />
                                            </label>
                                        )}

                                        {formData.type === SCENE_TYPES.DYNAMIC && (
                                            <label>
                                                <span>Übergangszeit</span>
                                                <select
                                                    value={formData.states[lightId]?.transitiontime || 4}
                                                    onChange={(e) => handleLightStateChange(lightId, 'transitiontime', parseInt(e.target.value))}
                                                >
                                                    <option value="1">Sehr schnell (100ms)</option>
                                                    <option value="4">Normal (400ms)</option>
                                                    <option value="10">Langsam (1s)</option>
                                                    <option value="50">Sehr langsam (5s)</option>
                                                </select>
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.type === SCENE_TYPES.DYNAMIC && (
                        <div className="form-group">
                            <label htmlFor="speed">Animationsgeschwindigkeit</label>
                            <div className="setting-controls">
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={formData.speed || 50}
                                    onChange={(e) => handleInputChange({
                                        target: {name: 'speed', value: parseInt(e.target.value)}
                                    })}
                                />
                                <span className="setting-value">{formData.speed || 50}%</span>
                            </div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" onClick={onCancel}
                                className="reset-button">Abbrechen
                        </button>
                        <button type="submit">Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Hilfsfunktion zur Konvertierung von Hue/Sat zu Hex
const convertToHex = (state) => {
    // Implementierung der Konvertierung von Hue/Sat zu Hex
    // Dies wäre ähnlich zur hexToHsv Funktion in der App.jsx,
    // aber in die andere Richtung

    // Platzhalter-Implementierung
    return '#ffffff';
};

// Hilfsfunktion zur Konvertierung von Hex zu Hue/Sat
const hexToHsv = (hex) => {
    // Sollte die gleiche Funktion wie in App.jsx sein

    // Platzhalter-Implementierung
    return {hue: 0, sat: 0};
};

// Hauptkomponente für die Szenenansicht
const ScenesView = ({lights, username, bridgeIP}) => {
    const [scenes, setScenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingScene, setEditingScene] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);

    // Lade Szenen beim Komponenten-Mount
    useEffect(() => {
        const loadScenes = async () => {
            try {
                setLoading(true);
                // In einer echten Implementierung würden wir die Szenen von der Hue Bridge laden
                // oder aus dem lokalen Speicher (für benutzerdefinierte Szenen)

                // Simuliere das Laden mit einem Timeout
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Beispielszenen
                const demoScenes = [
                    new Scene('1', 'Entspannt Lesen', 'reading'),
                    new Scene('2', 'Konzentriert Arbeiten', 'concentrate'),
                    new Scene('3', 'Sonnenuntergang', 'sunset', SCENE_TYPES.DYNAMIC)
                ];

                // Setze Beispiel-Lichter
                demoScenes[0].lights = Object.keys(lights).slice(0, 2);
                demoScenes[1].lights = Object.keys(lights);
                demoScenes[2].lights = Object.keys(lights);

                setScenes(demoScenes);
                setLoading(false);
            } catch (err) {
                console.error("Fehler beim Laden der Szenen:", err);
                setError("Szenen konnten nicht geladen werden. " + err.message);
                setLoading(false);
            }
        };

        if (Object.keys(lights).length > 0) {
            loadScenes();
        }
    }, [lights]);

    // Aktiviere eine Szene
    const activateScene = async (sceneId) => {
        try {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene) return;

            // Deaktiviere alle anderen Szenen
            const updatedScenes = scenes.map(s => ({
                ...s,
                isActive: s.id === sceneId
            }));

            setScenes(updatedScenes);

            // In einer echten Implementierung würden wir die Szene auf der Bridge aktivieren
            // Für jede Lampe in der Szene, setze den entsprechenden Status
            scene.lights.forEach(async (lightId) => {
                const state = scene.states[lightId] || {on: true, bri: 254};

                // API-Aufruf zum Setzen des Lichtzustands
                await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(state)
                });
            });
        } catch (err) {
            console.error("Fehler beim Aktivieren der Szene:", err);
            setError("Szene konnte nicht aktiviert werden. " + err.message);
        }
    };

    // Bearbeite eine Szene
    const editScene = (sceneId) => {
        const scene = scenes.find(s => s.id === sceneId);
        if (scene) {
            setEditingScene(scene);
            setShowFormModal(true);
        }
    };

    // Lösche eine Szene
    const deleteScene = (sceneId) => {
        if (window.confirm("Möchtest du diese Szene wirklich löschen?")) {
            setScenes(scenes.filter(s => s.id !== sceneId));
        }
    };

    // Erstelle oder aktualisiere eine Szene
    const saveScene = (sceneData) => {
        if (editingScene) {
            // Aktualisiere bestehende Szene
            setScenes(scenes.map(s =>
                s.id === editingScene.id ? {...s, ...sceneData} : s
            ));
        } else {
            // Erstelle neue Szene
            const newScene = {
                ...sceneData,
                id: Date.now().toString(), // Einfache ID-Generierung
                created: Date.now(),
                lastModified: Date.now(),
                isActive: false
            };
            setScenes([...scenes, newScene]);
        }

        setShowFormModal(false);
        setEditingScene(null);
    };

    return (
        <div className="scenes-view">
            <div className="scenes-header">
                <h2 className="section-title">Szenen</h2>
                <button onClick={() => {
                    setEditingScene(null);
                    setShowFormModal(true);
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Neue Szene
                </button>
            </div>

            {loading ? (
                <div className="loading">
                    <p>Lade Szenen...</p>
                </div>
            ) : error ? (
                <div className="status-message status-error">{error}</div>
            ) : (
                <div className="scenes-grid">
                    {scenes.length === 0 ? (
                        <div className="empty-state">
                            <p>Keine Szenen vorhanden. Erstelle deine erste Szene!</p>
                        </div>
                    ) : (
                        scenes.map(scene => (
                            <SceneCard
                                key={scene.id}
                                scene={scene}
                                onActivate={activateScene}
                                onEdit={editScene}
                                onDelete={deleteScene}
                            />
                        ))
                    )}
                </div>
            )}

            {showFormModal && (
                <SceneFormModal
                    scene={editingScene}
                    lights={lights}
                    onSave={saveScene}
                    onCancel={() => {
                        setShowFormModal(false);
                        setEditingScene(null);
                    }}
                />
            )}
        </div>
    );
};

export default ScenesView;