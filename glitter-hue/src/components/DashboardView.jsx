// src/components/DashboardView.jsx - Anpassbares Dashboard mit Widgets
import React, { useState, useEffect, useRef } from 'react';
import '../styles/dashboard.css';

// Widget-Typen
const WIDGET_TYPES = {
    QUICK_SCENE: 'quick_scene',
    LIGHT_GROUP: 'light_group',
    SINGLE_LIGHT: 'single_light',
    STATUS: 'status',
    SCHEDULE: 'schedule',
    ENERGY: 'energy'
};

// Widget-Komponente
const Widget = ({ type, data, onEdit, onRemove, onAction, lights, scenes }) => {
    const [expanded, setExpanded] = useState(false);

    // Handler für verschiedene Widget-Aktionen
    const handleAction = (action, params = {}) => {
        onAction(action, { ...params, widgetId: data.id });
    };

    // Widget-Controls ist ein eingebettetes Menü mit Bearbeiten/Entfernen-Optionen
    const WidgetControls = () => (
        <div className="widget-controls">
            <button className="widget-control-button" onClick={() => onEdit(data.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button className="widget-control-button remove" onClick={() => onRemove(data.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    );

    // Szenen-Widget für schnellen Zugriff auf gespeicherte Szenen
    const QuickSceneWidget = () => {
        const scene = scenes.find(s => s.id === data.sceneId);

        if (!scene) {
            return (
                <div className="widget-error">
                    Szene nicht gefunden
                </div>
            );
        }

        return (
            <div
                className={`quick-scene-widget ${data.active ? 'active' : ''}`}
                style={data.bgColor ? { backgroundColor: data.bgColor } : {}}
                onClick={() => handleAction('activateScene', { sceneId: data.sceneId })}
            >
                <h3>{data.title || scene.name}</h3>
                {data.showDetails && (
                    <div className="scene-details">
                        <p>{scene.lights.length} Lampen</p>
                    </div>
                )}
            </div>
        );
    };

    // Lichtergruppen-Widget zur Steuerung mehrerer Lichter
    const LightGroupWidget = () => {
        const groupLights = data.lightIds
            .map(id => lights[id])
            .filter(light => light !== undefined);

        if (groupLights.length === 0) {
            return (
                <div className="widget-error">
                    Keine Lichter in dieser Gruppe
                </div>
            );
        }

        // Zähle ein- und ausgeschaltete Lichter
        // Füge zusätzliche Prüfung hinzu, um sicherzustellen, dass wir nur gültige Lichter zählen
        const validLights = groupLights.filter(light => light && light.state !== undefined);
        const onCount = validLights.filter(light => light.state.on === true).length;
        const allOn = validLights.length > 0 && onCount === validLights.length;
        const someOn = onCount > 0 && onCount < validLights.length;

        return (
            <div className="light-group-widget">
                <div className="light-group-header">
                    <h3>{data.title || 'Lichtgruppe'}</h3>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={allOn}
                            onChange={() => handleAction('toggleGroup', { on: !allOn })}
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                {expanded && (
                    <div className="group-lights">
                        {groupLights.map(light => (
                            <div key={light.uniqueid} className="group-light-item">
                                <span
                                    className="light-indicator"
                                    style={{ backgroundColor: light.state.on ?
                                            calculateColor(light.state) : '#444' }}
                                ></span>
                                <span className="light-name">{light.name}</span>
                                <label className="switch small">
                                    <input
                                        type="checkbox"
                                        checked={light.state.on}
                                        onChange={() => handleAction('toggleLight', {
                                            lightId: Object.keys(lights).find(key => lights[key].uniqueid === light.uniqueid),
                                            on: !light.state.on
                                        })}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        ))}

                        {allOn && (
                            <div className="group-brightness">
                                <input
                                    type="range"
                                    min="1"
                                    max="254"
                                    value={calculateAverageBrightness(groupLights)}
                                    onChange={(e) => handleAction('setGroupBrightness', { brightness: parseInt(e.target.value) })}
                                />
                            </div>
                        )}
                    </div>
                )}

                <button
                    className={`expand-button ${expanded ? 'expanded' : ''}`}
                    onClick={() => setExpanded(!expanded)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points={expanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                    </svg>
                </button>
            </div>
        );
    };

    // Widget für ein einzelnes Licht mit Helligkeitsregelung
    const SingleLightWidget = () => {
        const light = lights[data.lightId];

        if (!light) {
            return (
                <div className="widget-error">
                    Licht nicht gefunden
                </div>
            );
        }

        return (
            <div className="single-light-widget">
                <div className="light-header">
                    <div
                        className="color-indicator"
                        style={{ backgroundColor: light.state.on ?
                                calculateColor(light.state) : '#444' }}
                    ></div>
                    <h3>{data.title || light.name}</h3>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={light.state.on}
                            onChange={() => handleAction('toggleLight', {
                                lightId: data.lightId,
                                on: !light.state.on
                            })}
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                {light.state.on && (
                    <div className="light-controls">
                        <div className="brightness-control">
                            <span className="control-label">Helligkeit</span>
                            <input
                                type="range"
                                min="1"
                                max="254"
                                value={light.state.bri || 254}
                                onChange={(e) => handleAction('setBrightness', {
                                    lightId: data.lightId,
                                    brightness: parseInt(e.target.value)
                                })}
                            />
                        </div>

                        {light.state.hue !== undefined && (
                            <div className="color-control">
                                <span className="control-label">Farbe</span>
                                <div className="color-presets">
                                    {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(color => (
                                        <button
                                            key={color}
                                            className="color-preset"
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleAction('setColor', {
                                                lightId: data.lightId,
                                                color
                                            })}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Status-Widget zeigt den aktuellen Zustand der Bridge und der Lichter
    const StatusWidget = ({ lightsData }) => {
        // Sicherstellen, dass nur gültige Lichtdaten gezählt werden
        const validLights = Object.values(lightsData || {}).filter(l => l && l.state);
        const activeLights = validLights.filter(l => l.state.on === true).length;

        return (
            <div className="status-widget">
                <h3>{data.title || 'System-Status'}</h3>
                <div className="status-items">
                    <div className="status-item">
                        <span className="status-label">Bridge:</span>
                        <span className="status-value connected">Verbunden</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Lichter:</span>
                        <span className="status-value">{validLights.length} gefunden</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Aktiv:</span>
                        <span className="status-value">{activeLights} eingeschaltet</span>
                    </div>
                </div>
            </div>
        );
    };

    // Zeitplan-Widget zeigt aktive Automatisierungen
    const ScheduleWidget = () => {
        return (
            <div className="schedule-widget">
                <h3>{data.title || 'Zeitpläne'}</h3>
                <div className="schedule-preview">
                    {data.schedules && data.schedules.length > 0 ? (
                        data.schedules.map((schedule, index) => (
                            <div key={index} className="schedule-item">
                                <div className="schedule-time">{schedule.time}</div>
                                <div className="schedule-name">{schedule.name}</div>
                                <label className="switch small">
                                    <input
                                        type="checkbox"
                                        checked={schedule.enabled}
                                        onChange={() => handleAction('toggleSchedule', {
                                            scheduleIndex: index,
                                            enabled: !schedule.enabled
                                        })}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        ))
                    ) : (
                        <p className="no-data">Keine Zeitpläne konfiguriert</p>
                    )}
                </div>
                <button
                    className="widget-action-button"
                    onClick={() => handleAction('manageSchedules')}
                >
                    Zeitpläne verwalten
                </button>
            </div>
        );
    };

    // Energie-Widget zeigt Stromverbrauch der Lichter
    const EnergyWidget = ({ lightsData }) => {
        // Berechne geschätzten Stromverbrauch basierend auf Lampentyp und Helligkeit
        const calculateEstimatedUsage = () => {
            return Object.values(lightsData).reduce((total, light) => {
                if (!light.state.on) return total;

                // Durchschnittlicher Verbrauch verschiedener Lampentypen (in Watt)
                let basePower = 5; // Standard LED-Lampe

                // Multiplikator basierend auf Helligkeit
                const brightnessMultiplier = (light.state.bri || 254) / 254;

                return total + (basePower * brightnessMultiplier);
            }, 0);
        };

        const totalWattage = calculateEstimatedUsage();

        return (
            <div className="energy-widget">
                <h3>{data.title || 'Energieverbrauch'}</h3>
                <div className="energy-stats">
                    <div className="energy-stat">
                        <div className="energy-value">{totalWattage.toFixed(1)}</div>
                        <div className="energy-unit">Watt</div>
                        <div className="energy-label">Aktuell</div>
                    </div>

                    {data.showDaily && (
                        <div className="energy-stat">
                            <div className="energy-value">{(totalWattage * 6 / 1000).toFixed(2)}</div>
                            <div className="energy-unit">kWh</div>
                            <div className="energy-label">Geschätzt Täglich</div>
                        </div>
                    )}
                </div>

                <div className="active-lights">
                    <h4>Aktive Lichter: {Object.values(lightsData).filter(l => l.state.on).length}</h4>
                    {expanded && (
                        <div className="energy-details">
                            {Object.entries(lightsData)
                                .filter(([_, light]) => light.state.on)
                                .slice(0, 5) // Begrenze die Anzeige auf 5 Lichter
                                .map(([id, light]) => (
                                    <div key={id} className="energy-light-item">
                                        <span className="light-name">{light.name}</span>
                                        <span className="light-power">
                                          {((light.state.bri || 254) / 254 * 5).toFixed(1)} W
                                        </span>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>

                <button
                    className={`expand-button ${expanded ? 'expanded' : ''}`}
                    onClick={() => setExpanded(!expanded)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points={expanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                    </svg>
                </button>
            </div>
        );
    };

    // Rendern des entsprechenden Widget-Typs
    const renderWidget = () => {
        switch (type) {
            case WIDGET_TYPES.QUICK_SCENE:
                return <QuickSceneWidget />;
            case WIDGET_TYPES.LIGHT_GROUP:
                return <LightGroupWidget />;
            case WIDGET_TYPES.SINGLE_LIGHT:
                return <SingleLightWidget />;
            case WIDGET_TYPES.STATUS:
                return <StatusWidget lightsData={lights} />;
            case WIDGET_TYPES.SCHEDULE:
                return <ScheduleWidget />;
            case WIDGET_TYPES.ENERGY:
                return <EnergyWidget lightsData={lights} />;
            default:
                return <div>Unbekannter Widget-Typ</div>;
        }
    };

    return (
        <div className={`widget ${type}`} style={{ gridArea: `span ${data.height || 1} / span ${data.width || 1}` }}>
            <WidgetControls />
            {renderWidget()}
        </div>
    );
};

// Widget-Einrichtungsdialog
const WidgetSetupModal = ({ widget, onSave, onCancel, lights, scenes }) => {
    const [formData, setFormData] = useState(
        widget || {
            type: WIDGET_TYPES.SINGLE_LIGHT,
            title: '',
            width: 1,
            height: 1
        }
    );

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle checkbox changes for light selection
    const handleLightSelection = (lightId) => {
        let lightIds = formData.lightIds || [];

        if (lightIds.includes(lightId)) {
            lightIds = lightIds.filter(id => id !== lightId);
        } else {
            lightIds = [...lightIds, lightId];
        }

        setFormData(prev => ({
            ...prev,
            lightIds
        }));
    };

    // Handler für das Formular
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{widget ? 'Widget bearbeiten' : 'Neues Widget'}</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="type">Widget-Typ</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                        >
                            <option value={WIDGET_TYPES.SINGLE_LIGHT}>Einzelnes Licht</option>
                            <option value={WIDGET_TYPES.LIGHT_GROUP}>Lichtergruppe</option>
                            <option value={WIDGET_TYPES.QUICK_SCENE}>Schnellzugriff Szene</option>
                            <option value={WIDGET_TYPES.STATUS}>System-Status</option>
                            <option value={WIDGET_TYPES.SCHEDULE}>Zeitpläne</option>
                            <option value={WIDGET_TYPES.ENERGY}>Energieverbrauch</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="title">Titel (optional)</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title || ''}
                            onChange={handleInputChange}
                            placeholder={getDefaultTitle(formData.type)}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label htmlFor="width">Breite</label>
                            <select
                                id="width"
                                name="width"
                                value={formData.width || 1}
                                onChange={handleInputChange}
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                            </select>
                        </div>

                        <div className="form-group half">
                            <label htmlFor="height">Höhe</label>
                            <select
                                id="height"
                                name="height"
                                value={formData.height || 1}
                                onChange={handleInputChange}
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                            </select>
                        </div>
                    </div>

                    {/* Typ-spezifische Einstellungen */}
                    {formData.type === WIDGET_TYPES.SINGLE_LIGHT && (
                        <div className="form-group">
                            <label htmlFor="lightId">Licht auswählen</label>
                            <select
                                id="lightId"
                                name="lightId"
                                value={formData.lightId || ''}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="" disabled>Licht auswählen...</option>
                                {Object.entries(lights).map(([id, light]) => (
                                    <option key={id} value={id}>{light.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {formData.type === WIDGET_TYPES.LIGHT_GROUP && (
                        <div className="form-group">
                            <label>Lichter für Gruppe auswählen</label>
                            <div className="lights-grid">
                                {Object.entries(lights).map(([id, light]) => (
                                    <div key={id} className="light-checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={(formData.lightIds || []).includes(id)}
                                                onChange={() => handleLightSelection(id)}
                                            />
                                            {light.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.type === WIDGET_TYPES.QUICK_SCENE && (
                        <>
                            <div className="form-group">
                                <label htmlFor="sceneId">Szene auswählen</label>
                                <select
                                    id="sceneId"
                                    name="sceneId"
                                    value={formData.sceneId || ''}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>Szene auswählen...</option>
                                    {scenes.map(scene => (
                                        <option key={scene.id} value={scene.id}>{scene.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="bgColor">Hintergrundfarbe (optional)</label>
                                <input
                                    type="color"
                                    id="bgColor"
                                    name="bgColor"
                                    value={formData.bgColor || '#2C2E3B'}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="showDetails"
                                        checked={formData.showDetails || false}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            showDetails: e.target.checked
                                        }))}
                                    />
                                    Details anzeigen
                                </label>
                            </div>
                        </>
                    )}

                    {formData.type === WIDGET_TYPES.ENERGY && (
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="showDaily"
                                    checked={formData.showDaily || false}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        showDaily: e.target.checked
                                    }))}
                                />
                                Täglichen Verbrauch anzeigen
                            </label>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" onClick={onCancel} className="reset-button">Abbrechen</button>
                        <button type="submit">Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Hilfsfunktion zur Berechnung der Farbe aus dem Lichtzustand
const calculateColor = (state) => {
    if (state.hue === undefined || state.sat === undefined) {
        // Weißes Licht
        return '#FFFFFF';
    }

    // Umrechnung von Hue API-Werten zu HSL
    const h = (state.hue / 65535) * 360;
    const s = (state.sat / 254) * 100;
    const l = 50; // Helligkeit für die Farbdarstellung

    return `hsl(${h}, ${s}%, ${l}%)`;
};

// Hilfsfunktion zur Berechnung der durchschnittlichen Helligkeit
const calculateAverageBrightness = (lights) => {
    if (lights.length === 0) return 254;

    const onLights = lights.filter(light => light.state.on);
    if (onLights.length === 0) return 254;

    const totalBrightness = onLights.reduce((sum, light) => sum + (light.state.bri || 254), 0);
    return Math.round(totalBrightness / onLights.length);
};

// Hilfsfunktion für Standardtitel basierend auf Widget-Typ
const getDefaultTitle = (type) => {
    switch (type) {
        case WIDGET_TYPES.SINGLE_LIGHT:
            return 'Lichtsteuerung';
        case WIDGET_TYPES.LIGHT_GROUP:
            return 'Lichtergruppe';
        case WIDGET_TYPES.QUICK_SCENE:
            return 'Schnellzugriff';
        case WIDGET_TYPES.STATUS:
            return 'System-Status';
        case WIDGET_TYPES.SCHEDULE:
            return 'Zeitpläne';
        case WIDGET_TYPES.ENERGY:
            return 'Energieverbrauch';
        default:
            return 'Neues Widget';
    }
};

// Hauptkomponente für das Dashboard
const DashboardView = ({ lights: initialLights, scenes = [], bridgeIP, username, onLightsUpdate }) => {
    const [widgets, setWidgets] = useState([]);
    const [editingWidget, setEditingWidget] = useState(null);
    const [showWidgetModal, setShowWidgetModal] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [localLights, setLocalLights] = useState({});
    const isInitialRender = useRef(true);
    const [statusMessage, setStatusMessage] = useState({ message: '', type: 'info' });

    // Lade gespeicherte Widgets beim ersten Rendern
    useEffect(() => {
        if (!initialized && Object.keys(initialLights).length > 0) {
            setLocalLights(initialLights);
            loadWidgets();
            setInitialized(true);
        }
    }, [initialLights, initialized]);

    // Synchronisiere den lokalen Zustand mit externen Updates
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        if (Object.keys(initialLights).length > 0) {
            setLocalLights(initialLights);
        }
    }, [initialLights]);

    // Status setzen mit Timeout
    const setStatus = (message, type = 'info') => {
        setStatusMessage({ message, type });
        setTimeout(() => {
            setStatusMessage({ message: '', type: 'info' });
        }, 3000);
    };

    // Lade Widgets aus dem lokalen Speicher
    const loadWidgets = () => {
        try {
            const savedWidgets = localStorage.getItem('hue-dashboard-widgets');

            if (savedWidgets) {
                setWidgets(JSON.parse(savedWidgets));
            } else {
                // Erstelle Standard-Widgets, wenn keine gespeichert sind
                createDefaultWidgets();
            }
        } catch (error) {
            console.error("Fehler beim Laden der Dashboard-Widgets:", error);
            setStatus("Fehler beim Laden der Widgets", "error");
        }
    };

    // Erstelle Standard-Widgets für das Dashboard
    const createDefaultWidgets = () => {
        const defaultWidgets = [
            {
                id: Date.now().toString() + '1',
                type: WIDGET_TYPES.STATUS,
                title: 'System-Status',
                width: 1,
                height: 1
            },
            {
                id: Date.now().toString() + '2',
                type: WIDGET_TYPES.ENERGY,
                title: 'Energieverbrauch',
                width: 2,
                height: 1,
                showDaily: true
            }
        ];

        // Füge ein Widget für jedes Licht hinzu, maximal 3
        Object.entries(initialLights).slice(0, 3).forEach(([id, light], index) => {
            defaultWidgets.push({
                id: Date.now().toString() + (index + 3),
                type: WIDGET_TYPES.SINGLE_LIGHT,
                title: light.name,
                lightId: id,
                width: 1,
                height: 1
            });
        });

        setWidgets(defaultWidgets);
        saveWidgets(defaultWidgets);
    };

    // Speichere Widgets im lokalen Speicher
    const saveWidgets = (updatedWidgets) => {
        try {
            localStorage.setItem('hue-dashboard-widgets', JSON.stringify(updatedWidgets));
        } catch (error) {
            console.error("Fehler beim Speichern der Dashboard-Widgets:", error);
            setStatus("Fehler beim Speichern der Widgets", "error");
        }
    };

    // Füge ein neues Widget hinzu
    const addWidget = () => {
        setEditingWidget(null);
        setShowWidgetModal(true);
    };

    // Bearbeite ein bestehendes Widget
    const editWidget = (widgetId) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (widget) {
            setEditingWidget(widget);
            setShowWidgetModal(true);
        }
    };

    // Entferne ein Widget
    const removeWidget = (widgetId) => {
        if (window.confirm("Möchtest du dieses Widget wirklich entfernen?")) {
            const updatedWidgets = widgets.filter(w => w.id !== widgetId);
            setWidgets(updatedWidgets);
            saveWidgets(updatedWidgets);
        }
    };

    // Speichere ein Widget nach dem Bearbeiten oder Erstellen
    const saveWidget = (widgetData) => {
        let updatedWidgets;

        if (editingWidget) {
            // Aktualisiere bestehendes Widget
            updatedWidgets = widgets.map(w =>
                w.id === editingWidget.id ? { ...w, ...widgetData } : w
            );
        } else {
            // Erstelle neues Widget
            const newWidget = {
                ...widgetData,
                id: Date.now().toString()
            };
            updatedWidgets = [...widgets, newWidget];
        }

        setWidgets(updatedWidgets);
        saveWidgets(updatedWidgets);
        setShowWidgetModal(false);
        setEditingWidget(null);
    };

    // Führe Widget-Aktionen aus
    const handleWidgetAction = async (action, params) => {
        console.log(`Aktion: ${action}`, params);

        switch (action) {
            case 'toggleLight':
                try {
                    // Speichern des Originalzustands für mögliche Wiederherstellung
                    const originalState = {...localLights};
                    const originalLightState = originalState[params.lightId]?.state?.on;

                    // Update UI sofort für bessere UX
                    setLocalLights(prevLights => {
                        const newLights = { ...prevLights };
                        if (newLights[params.lightId] && newLights[params.lightId].state) {
                            newLights[params.lightId] = {
                                ...newLights[params.lightId],
                                state: {
                                    ...newLights[params.lightId].state,
                                    on: params.on
                                }
                            };
                        }
                        return newLights;
                    });

                    // Dann API-Aufruf
                    const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${params.lightId}/state`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ on: params.on })
                    });

                    const result = await response.json();

                    // Falls API-Fehler zurückgibt, State zurücksetzen
                    if (result[0] && result[0].error) {
                        console.error("API-Fehler:", result[0].error);
                        setStatus("Fehler beim Schalten des Lichts", "error");

                        // UI-Zustand zurück zum original
                        setLocalLights(originalState);
                    } else {
                        // Informiere übergeordnete Komponente über Änderung mit dem aktuellen Zustand
                        if (typeof onLightsUpdate === 'function') {
                            // Hole den aktuellen Zustand, nicht den veralteten localLights
                            onLightsUpdate(prev => ({...prev}));
                        }
                    }
                } catch (error) {
                    console.error(`Fehler beim Schalten von Licht ${params.lightId}:`, error);
                    setStatus("Verbindungsfehler zur Bridge", "error");

                    // UI-Zustand bei Netzwerkfehler zurücksetzen
                    setLocalLights(prevLights => {
                        const newLights = { ...prevLights };
                        if (newLights[params.lightId]) {
                            newLights[params.lightId] = {
                                ...newLights[params.lightId],
                                state: {
                                    ...newLights[params.lightId].state,
                                    on: !params.on // zurück zum vorherigen Zustand
                                }
                            };
                        }
                        return newLights;
                    });
                }
                break;

            case 'setBrightness':
                try {
                    // Update UI sofort
                    setLocalLights(prevLights => {
                        const newLights = { ...prevLights };
                        if (newLights[params.lightId]) {
                            newLights[params.lightId] = {
                                ...newLights[params.lightId],
                                state: {
                                    ...newLights[params.lightId].state,
                                    bri: parseInt(params.brightness)
                                }
                            };
                        }
                        return newLights;
                    });

                    // Dann API-Aufruf
                    const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${params.lightId}/state`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ bri: parseInt(params.brightness) })
                    });

                    const result = await response.json();

                    if (result[0] && result[0].error) {
                        console.error("API-Fehler:", result[0].error);
                        setStatus("Fehler beim Ändern der Helligkeit", "error");
                    } else {
                        // Informiere übergeordnete Komponente über Änderung
                        if (typeof onLightsUpdate === 'function') {
                            onLightsUpdate(localLights);
                        }
                    }
                } catch (error) {
                    console.error(`Fehler beim Einstellen der Helligkeit von Licht ${params.lightId}:`, error);
                    setStatus("Verbindungsfehler zur Bridge", "error");
                }
                break;

            case 'setColor':
                try {
                    // Funktion zur Konvertierung von Hex zu HSV für die API
                    const hexToHsv = (hex) => {
                        // Bessere Implementierung
                        const r = parseInt(hex.slice(1, 3), 16) / 255;
                        const g = parseInt(hex.slice(3, 5), 16) / 255;
                        const b = parseInt(hex.slice(5, 7), 16) / 255;

                        const max = Math.max(r, g, b);
                        const min = Math.min(r, g, b);
                        const v = max;
                        const d = max - min;
                        const s = max === 0 ? 0 : d / max;
                        let h = 0;

                        if (max !== min) {
                            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
                            else if (max === g) h = (b - r) / d + 2;
                            else if (max === b) h = (r - g) / d + 4;
                            h /= 6;
                        }

                        // Konvertierung zu Philips Hue-Werten
                        return {
                            hue: Math.round(h * 65535),
                            sat: Math.round(s * 254),
                            bri: Math.round(v * 254)
                        };
                    };

                    const hsvValues = hexToHsv(params.color);

                    // Update UI sofort
                    setLocalLights(prevLights => {
                        const newLights = { ...prevLights };
                        if (newLights[params.lightId]) {
                            newLights[params.lightId] = {
                                ...newLights[params.lightId],
                                state: {
                                    ...newLights[params.lightId].state,
                                    ...hsvValues
                                }
                            };
                        }
                        return newLights;
                    });

                    // Dann API-Aufruf
                    const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${params.lightId}/state`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(hsvValues)
                    });

                    const result = await response.json();

                    if (result[0] && result[0].error) {
                        console.error("API-Fehler:", result[0].error);
                        setStatus("Fehler beim Ändern der Farbe", "error");
                    } else {
                        // Informiere übergeordnete Komponente über Änderung
                        if (typeof onLightsUpdate === 'function') {
                            onLightsUpdate(localLights);
                        }
                    }
                } catch (error) {
                    console.error(`Fehler beim Einstellen der Farbe von Licht ${params.lightId}:`, error);
                    setStatus("Verbindungsfehler zur Bridge", "error");
                }
                break;

            case 'activateScene':
                // Aktiviere eine Szene
                try {
                    const scene = scenes.find(s => s.id === params.sceneId);
                    if (scene) {
                        // Aktualisiere die Widget-Daten für aktive Szenen
                        const updatedWidgets = widgets.map(w => ({
                            ...w,
                            active: w.type === WIDGET_TYPES.QUICK_SCENE &&
                                w.sceneId === params.sceneId
                        }));
                        setWidgets(updatedWidgets);
                        saveWidgets(updatedWidgets);

                        // Aktiviere die Szene über die API
                        const response = await fetch(`http://${bridgeIP}/api/${username}/groups/0/action`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ scene: params.sceneId })
                        });

                        const result = await response.json();

                        if (result[0] && result[0].error) {
                            console.error("API-Fehler:", result[0].error);
                            setStatus("Fehler beim Aktivieren der Szene", "error");
                        } else {
                            setStatus(`Szene "${scene.name}" aktiviert`, "success");
                        }
                    }
                } catch (error) {
                    console.error(`Fehler beim Aktivieren der Szene:`, error);
                    setStatus("Verbindungsfehler zur Bridge", "error");
                }
                break;

            case 'toggleGroup':
                try {
                    const widget = widgets.find(w => w.id === params.widgetId);
                    if (widget && widget.lightIds) {
                        // Speichere den Originalzustand für mögliche Rücksetzung
                        const originalLights = JSON.parse(JSON.stringify(localLights));

                        // Update UI sofort
                        setLocalLights(prevLights => {
                            const newLights = { ...prevLights };
                            widget.lightIds.forEach(lightId => {
                                if (newLights[lightId] && newLights[lightId].state) {
                                    newLights[lightId] = {
                                        ...newLights[lightId],
                                        state: {
                                            ...newLights[lightId].state,
                                            on: params.on
                                        }
                                    };
                                }
                            });
                            return newLights;
                        });

                        // Dann API-Aufrufe
                        const promises = widget.lightIds.map(async (lightId) => {
                            try {
                                const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ on: params.on })
                                });

                                return { lightId, result: await response.json() };
                            } catch (error) {
                                console.error(`Fehler beim Schalten von Licht ${lightId}:`, error);
                                return { lightId, error: true };
                            }
                        });

                        // Warte auf alle API-Aufrufe
                        const results = await Promise.all(promises);

                        // Prüfe auf API-Fehler
                        const failedLights = results.filter(item =>
                            item.error || (item.result[0] && item.result[0].error)
                        );

                        if (failedLights.length > 0) {
                            console.error("API-Fehler bei Gruppensteuerung:", failedLights);
                            setStatus(`Fehler beim Schalten von ${failedLights.length} Lichtern in der Gruppe`, "error");

                            // Bei Fehlern komplett auf original zurücksetzen
                            setLocalLights(originalLights);
                        } else {
                            // Informiere übergeordnete Komponente über Änderung
                            if (typeof onLightsUpdate === 'function') {
                                onLightsUpdate({...localLights});
                            }

                            setStatus(params.on ? "Gruppe eingeschaltet" : "Gruppe ausgeschaltet", "success");
                        }
                    }
                } catch (error) {
                    console.error(`Fehler beim Umschalten der Lichtergruppe:`, error);
                    setStatus("Verbindungsfehler zur Bridge", "error");
                }
                break;

            case 'setGroupBrightness':
                try {
                    const widget = widgets.find(w => w.id === params.widgetId);
                    if (widget && widget.lightIds) {
                        // Update UI sofort
                        setLocalLights(prevLights => {
                            const newLights = { ...prevLights };
                            widget.lightIds.forEach(lightId => {
                                if (newLights[lightId] && newLights[lightId].state.on) {
                                    newLights[lightId] = {
                                        ...newLights[lightId],
                                        state: {
                                            ...newLights[lightId].state,
                                            bri: parseInt(params.brightness)
                                        }
                                    };
                                }
                            });
                            return newLights;
                        });

                        // Dann API-Aufrufe
                        const promises = widget.lightIds.map(async (lightId) => {
                            if (localLights[lightId].state.on) {
                                const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ bri: parseInt(params.brightness) })
                                });

                                return response.json();
                            }
                            return Promise.resolve();
                        });

                        await Promise.all(promises);

                        // Informiere übergeordnete Komponente über Änderung
                        if (typeof onLightsUpdate === 'function') {
                            onLightsUpdate(localLights);
                        }
                    }
                } catch (error) {
                    console.error(`Fehler beim Einstellen der Gruppenhelligkeit:`, error);
                    setStatus("Verbindungsfehler zur Bridge", "error");
                }
                break;

            case 'toggleSchedule':
                // Aktiviere/Deaktiviere einen Zeitplan
                try {
                    const widget = widgets.find(w => w.id === params.widgetId);
                    if (widget && widget.schedules && widget.schedules[params.scheduleIndex]) {
                        // Aktualisiere den Zeitplan-Status im Widget
                        const updatedSchedules = [...widget.schedules];
                        updatedSchedules[params.scheduleIndex].enabled = params.enabled;

                        const updatedWidgets = widgets.map(w =>
                            w.id === params.widgetId ? { ...w, schedules: updatedSchedules } : w
                        );

                        setWidgets(updatedWidgets);
                        saveWidgets(updatedWidgets);
                        setStatus(params.enabled ? "Zeitplan aktiviert" : "Zeitplan deaktiviert", "success");
                    }
                } catch (error) {
                    console.error(`Fehler beim Umschalten des Zeitplans:`, error);
                    setStatus("Fehler beim Ändern des Zeitplans", "error");
                }
                break;

            case 'manageSchedules':
                // Öffne Zeitplan-Verwaltung
                console.log("Öffne Zeitplan-Verwaltung");
                setStatus("Zeitplanverwaltung ist noch nicht implementiert", "info");
                break;

            default:
                console.log(`Unbekannte Aktion: ${action}`);
        }
    };

    return (
        <div className="dashboard-view">
            <div className="dashboard-header">
                <h2 className="section-title">Dashboard</h2>
                <button onClick={addWidget}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Widget hinzufügen
                </button>
            </div>

            {widgets.length === 0 ? (
                <div className="empty-dashboard">
                    <p>Dein Dashboard ist leer. Füge Widgets hinzu, um deine Lichter zu steuern.</p>
                    <button onClick={addWidget}>Erstes Widget hinzufügen</button>
                </div>
            ) : (
                <div className="dashboard-grid">
                    {widgets.map(widget => (
                        <Widget
                            key={widget.id}
                            type={widget.type}
                            data={widget}
                            onEdit={editWidget}
                            onRemove={removeWidget}
                            onAction={handleWidgetAction}
                            lights={localLights}
                            scenes={scenes}
                        />
                    ))}
                </div>
            )}

            {showWidgetModal && (
                <WidgetSetupModal
                    widget={editingWidget}
                    onSave={saveWidget}
                    onCancel={() => {
                        setShowWidgetModal(false);
                        setEditingWidget(null);
                    }}
                    lights={localLights}
                    scenes={scenes}
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

export default DashboardView;