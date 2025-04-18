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
        const onCount = groupLights.filter(light => light.state.on).length;
        const allOn = onCount === groupLights.length;
        const someOn = onCount > 0 && onCount < groupLights.length;

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
                                            lightId: Object.keys(lights).find(key => lights[key] === light),
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
    const StatusWidget = () => {
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
                        <span className="status-value">{Object.keys(lights).length} gefunden</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Aktiv:</span>
                        <span className="status-value">{Object.values(lights).filter(l => l.state.on).length} eingeschaltet</span>
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
    const EnergyWidget = () => {
        // Berechne geschätzten Stromverbrauch basierend auf Lampentyp und Helligkeit
        const calculateEstimatedUsage = () => {
            return Object.values(lights).reduce((total, light) => {
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
                    <h4>Aktive Lichter: {Object.values(lights).filter(l => l.state.on).length}</h4>
                    {expanded && (
                        <div className="energy-details">
                            {Object.entries(lights)
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
                return <StatusWidget />;
            case WIDGET_TYPES.SCHEDULE:
                return <ScheduleWidget />;
            case WIDGET_TYPES.ENERGY:
                return <EnergyWidget />;
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
const DashboardView = ({ lights, scenes = [], bridgeIP, username }) => {
    const [widgets, setWidgets] = useState([]);
    const [editingWidget, setEditingWidget] = useState(null);
    const [showWidgetModal, setShowWidgetModal] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Lade gespeicherte Widgets beim ersten Rendern
    useEffect(() => {
        if (!initialized && Object.keys(lights).length > 0) {
            loadWidgets();
            setInitialized(true);
        }
    }, [lights, initialized]);

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
        Object.entries(lights).slice(0, 3).forEach(([id, light], index) => {
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
                    const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${params.lightId}/state`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ on: params.on })
                    });

                    await response.json();
                } catch (error) {
                    console.error(`Fehler beim Schalten von Licht ${params.lightId}:`, error);
                }
                break;

            case 'setBrightness':
                try {
                    const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${params.lightId}/state`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ bri: parseInt(params.brightness) })
                    });

                    await response.json();
                } catch (error) {
                    console.error(`Fehler beim Einstellen der Helligkeit von Licht ${params.lightId}:`, error);
                }
                break;

            case 'setColor':
                // Konvertiere Hex zu Hue/Sat und sende an die Bridge
                try {
                    // Funktion zur Konvertierung von Hex zu HSV für die API
                    const hexToHsv = (hex) => {
                        // Implementierung hier
                        // Diese sollte den Hex-Wert in Hue/Sat-Werte für die API umwandeln
                        // Platzhalter-Implementierung
                        return { hue: 0, sat: 254 };
                    };

                    const hsv = hexToHsv(params.color);

                    const response = await fetch(`http://${bridgeIP}/api/${username}/lights/${params.lightId}/state`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(hsv)
                    });

                    await response.json();
                } catch (error) {
                    console.error(`Fehler beim Einstellen der Farbe von Licht ${params.lightId}:`, error);
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

                        // Aktiviere die Szene (Lichter entsprechend setzen)
                        console.log("Aktiviere Szene:", scene.name);
                    }
                } catch (error) {
                    console.error(`Fehler beim Aktivieren der Szene:`, error);
                }
                break;

            case 'toggleGroup':
                // Alle Lichter in der Gruppe ein- oder ausschalten
                try {
                    const widget = widgets.find(w => w.id === params.widgetId);
                    if (widget && widget.lightIds) {
                        // Setze alle Lichter in der Gruppe auf den gewünschten Zustand
                        widget.lightIds.forEach(async (lightId) => {
                            await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ on: params.on })
                            });
                        });
                    }
                } catch (error) {
                    console.error(`Fehler beim Umschalten der Lichtergruppe:`, error);
                }
                break;

            case 'setGroupBrightness':
                // Helligkeit aller Lichter in der Gruppe einstellen
                try {
                    const widget = widgets.find(w => w.id === params.widgetId);
                    if (widget && widget.lightIds) {
                        // Setze die Helligkeit für alle Lichter in der Gruppe
                        widget.lightIds.forEach(async (lightId) => {
                            await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ bri: parseInt(params.brightness) })
                            });
                        });
                    }
                } catch (error) {
                    console.error(`Fehler beim Einstellen der Gruppenhelligkeit:`, error);
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
                    }
                } catch (error) {
                    console.error(`Fehler beim Umschalten des Zeitplans:`, error);
                }
                break;

            case 'manageSchedules':
                // Öffne Zeitplan-Verwaltung
                console.log("Öffne Zeitplan-Verwaltung");
                // Hier würde eine Navigation oder ein Modal geöffnet werden
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
                            lights={lights}
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
                    lights={lights}
                    scenes={scenes}
                />
            )}
        </div>
    );
};

export default DashboardView;