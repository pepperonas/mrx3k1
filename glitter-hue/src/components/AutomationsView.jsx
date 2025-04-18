// src/components/AutomationsView.jsx - Automatisierungen im BrainBuster-Stil
import React, { useState, useEffect } from 'react';
import { Automation, ScheduleAutomation, AUTOMATION_TYPES } from '../models/types';
import '../styles/automations.css';

// Icon-Komponente für verschiedene Automatisierungstypen
const AutomationIcon = ({ type }) => {
    return (
        <div className="automation-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {type === AUTOMATION_TYPES.SCHEDULE && (
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </>
                )}
                {type === AUTOMATION_TYPES.GEOFENCE && (
                    <>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </>
                )}
                {type === AUTOMATION_TYPES.PRESENCE && (
                    <>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </>
                )}
                {type === AUTOMATION_TYPES.SENSOR && (
                    <>
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 5V3" />
                        <path d="M12 21v-2" />
                        <path d="M5 12H3" />
                        <path d="M21 12h-2" />
                    </>
                )}
                {type === AUTOMATION_TYPES.WEBHOOK && (
                    <>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </>
                )}
            </svg>
        </div>
    );
};

// Karte für eine einzelne Automatisierung in der Liste
const AutomationCard = ({ automation, onToggle, onEdit, onDelete }) => {
    const formatSchedule = (schedule) => {
        if (schedule.sunEvent) {
            const event = schedule.sunEvent === 'sunrise' ? 'Sonnenaufgang' : 'Sonnenuntergang';
            const offsetText = schedule.offset !== 0
                ? `${schedule.offset > 0 ? '+' : ''}${schedule.offset} Minuten`
                : '';
            return `${event} ${offsetText}`;
        } else if (schedule.time) {
            return `${schedule.time} Uhr`;
        }
        return 'Zeitplan';
    };

    const formatDays = (days) => {
        if (days.length === 7) return 'Täglich';
        if (days.length === 5 && days.includes(1) && days.includes(5)) return 'Wochentags';
        if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Wochenende';

        const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        return days.map(day => dayNames[day]).join(', ');
    };

    const getDescription = () => {
        switch (automation.type) {
            case AUTOMATION_TYPES.SCHEDULE:
                return `${formatSchedule(automation.schedule)} • ${formatDays(automation.schedule.days)}`;
            case AUTOMATION_TYPES.GEOFENCE:
                return 'Standortbasiert • Automatisch bei An-/Abwesenheit';
            case AUTOMATION_TYPES.PRESENCE:
                return 'Anwesenheitssimulation • Zufälliges Schalten';
            case AUTOMATION_TYPES.SENSOR:
                return 'Sensor-gesteuert • Bei Bewegung/Aktivierung';
            case AUTOMATION_TYPES.WEBHOOK:
                return 'API-Trigger • Externe Steuerung';
            default:
                return '';
        }
    };

    return (
        <div className={`automation-card ${!automation.enabled ? 'disabled' : ''}`}>
            <div className="automation-card-content">
                <AutomationIcon type={automation.type} />
                <div className="automation-details">
                    <h3>{automation.name}</h3>
                    <p className="automation-info">{getDescription()}</p>
                    {automation.lastTriggered && (
                        <p className="automation-last-run">
                            Zuletzt ausgeführt: {new Date(automation.lastTriggered).toLocaleString()}
                        </p>
                    )}
                </div>

                <div className="automation-actions">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={automation.enabled}
                            onChange={() => onToggle(automation.id)}
                        />
                        <span className="slider"></span>
                    </label>

                    <button
                        className="icon-button edit"
                        onClick={() => onEdit(automation.id)}
                        aria-label="Automatisierung bearbeiten"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>

                    <button
                        className="icon-button delete"
                        onClick={() => onDelete(automation.id)}
                        aria-label="Automatisierung löschen"
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
        </div>
    );
};

// Komponente für die Erstellung/Bearbeitung einer Zeitplan-Automatisierung
const ScheduleForm = ({ automation, onSave, onCancel, scenes, lights }) => {
    const [formData, setFormData] = useState(
        automation || {
            name: '',
            type: AUTOMATION_TYPES.SCHEDULE,
            enabled: true,
            actions: [],
            schedule: {
                time: '08:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                sunEvent: null,
                offset: 0
            }
        }
    );

    const [usesSunEvents, setUsesSunEvents] = useState(
        automation ? !!automation.schedule.sunEvent : false
    );

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle schedule changes
    const handleScheduleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [field]: value
            }
        }));
    };

    // Toggle day selection in schedule
    const toggleDay = (day) => {
        const days = [...formData.schedule.days];
        const index = days.indexOf(day);

        if (index >= 0) {
            days.splice(index, 1);
        } else {
            days.push(day);
            days.sort();
        }

        handleScheduleChange('days', days);
    };

    // Toggle between time and sun events
    const handleTimeTypeChange = (e) => {
        const useSun = e.target.value === 'sun';
        setUsesSunEvents(useSun);

        if (useSun) {
            handleScheduleChange('sunEvent', 'sunrise');
            handleScheduleChange('time', null);
        } else {
            handleScheduleChange('sunEvent', null);
            handleScheduleChange('time', '08:00');
        }
    };

    // Add a new action to the automation
    const addAction = (type, target, state) => {
        const newAction = { type, target, state };
        setFormData(prev => ({
            ...prev,
            actions: [...prev.actions, newAction]
        }));
    };

    // Remove an action from the automation
    const removeAction = (index) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.filter((_, i) => i !== index)
        }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{automation ? 'Automatisierung bearbeiten' : 'Neue Automatisierung'}</h2>
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
                            placeholder="Automatisierungsname"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Zeittyp</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="timeType"
                                    value="time"
                                    checked={!usesSunEvents}
                                    onChange={handleTimeTypeChange}
                                />
                                Feste Uhrzeit
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="timeType"
                                    value="sun"
                                    checked={usesSunEvents}
                                    onChange={handleTimeTypeChange}
                                />
                                Sonnenauf-/untergang
                            </label>
                        </div>
                    </div>

                    {usesSunEvents ? (
                        <div className="form-group">
                            <label htmlFor="sunEvent">Sonnenereignis</label>
                            <select
                                id="sunEvent"
                                value={formData.schedule.sunEvent}
                                onChange={(e) => handleScheduleChange('sunEvent', e.target.value)}
                            >
                                <option value="sunrise">Sonnenaufgang</option>
                                <option value="sunset">Sonnenuntergang</option>
                            </select>

                            <label htmlFor="offset">Versatz (Minuten)</label>
                            <div className="input-with-buttons">
                                <button
                                    type="button"
                                    onClick={() => handleScheduleChange('offset', formData.schedule.offset - 15)}
                                >-</button>
                                <input
                                    type="number"
                                    id="offset"
                                    value={formData.schedule.offset}
                                    onChange={(e) => handleScheduleChange('offset', parseInt(e.target.value))}
                                    step="15"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleScheduleChange('offset', formData.schedule.offset + 15)}
                                >+</button>
                            </div>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label htmlFor="time">Uhrzeit</label>
                            <input
                                type="time"
                                id="time"
                                value={formData.schedule.time}
                                onChange={(e) => handleScheduleChange('time', e.target.value)}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Tage</label>
                        <div className="days-selection">
                            {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`day-button ${formData.schedule.days.includes(index) ? 'selected' : ''}`}
                                    onClick={() => toggleDay(index)}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                        <div className="day-presets">
                            <button type="button" onClick={() => handleScheduleChange('days', [0, 1, 2, 3, 4, 5, 6])}>
                                Alle
                            </button>
                            <button type="button" onClick={() => handleScheduleChange('days', [1, 2, 3, 4, 5])}>
                                Wochentags
                            </button>
                            <button type="button" onClick={() => handleScheduleChange('days', [0, 6])}>
                                Wochenende
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Aktionen</label>
                        <div className="actions-list">
                            {formData.actions.length === 0 ? (
                                <p className="empty-state">Keine Aktionen definiert.</p>
                            ) : (
                                formData.actions.map((action, index) => (
                                    <div key={index} className="action-item">
                                        <div className="action-details">
                      <span className="action-type">
                        {action.type === 'scene' ? 'Szene aktivieren' : 'Lampe schalten'}
                      </span>
                                            <span className="action-target">
                        {action.type === 'scene'
                            ? scenes.find(s => s.id === action.target)?.name || 'Unbekannte Szene'
                            : lights[action.target]?.name || 'Unbekannte Lampe'
                        }
                      </span>
                                            {action.type === 'light' && (
                                                <span className="action-state">
                          {action.state.on ? 'Ein' : 'Aus'}
                                                    {action.state.on && action.state.bri && ` • ${Math.round(action.state.bri / 254 * 100)}%`}
                        </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="icon-button delete small"
                                            onClick={() => removeAction(index)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="add-action-section">
                            <h4>Neue Aktion hinzufügen</h4>
                            <div className="action-options">
                                <div className="action-option">
                                    <h5>Szene aktivieren</h5>
                                    <select
                                        id="sceneSelect"
                                        disabled={scenes.length === 0}
                                        defaultValue=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addAction('scene', e.target.value, {});
                                                e.target.value = "";
                                            }
                                        }}
                                    >
                                        <option value="" disabled>Szene auswählen...</option>
                                        {scenes.map(scene => (
                                            <option key={scene.id} value={scene.id}>{scene.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="action-option">
                                    <h5>Lampe schalten</h5>
                                    <select
                                        id="lightSelect"
                                        disabled={Object.keys(lights).length === 0}
                                        defaultValue=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addAction('light', e.target.value, { on: true, bri: 254 });
                                                e.target.value = "";
                                            }
                                        }}
                                    >
                                        <option value="" disabled>Lampe auswählen...</option>
                                        {Object.entries(lights).map(([id, light]) => (
                                            <option key={id} value={id}>{light.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onCancel} className="reset-button">Abbrechen</button>
                        <button type="submit">Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Hauptkomponente für die Automatisierungen-Ansicht
const AutomationsView = ({ lights, scenes = [] }) => {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingAutomation, setEditingAutomation] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [automationType, setAutomationType] = useState(AUTOMATION_TYPES.SCHEDULE);

    // Lade Automatisierungen beim Komponenten-Mount
    useEffect(() => {
        const loadAutomations = async () => {
            try {
                setLoading(true);

                // In einer echten Implementierung würden wir die Automatisierungen von der Bridge oder
                // aus dem lokalen Speicher laden

                // Simuliere das Laden mit einem Timeout
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Beispiel-Automatisierungen
                const morningSchedule = new ScheduleAutomation('1', 'Morgenlicht');
                morningSchedule.schedule = {
                    time: '07:30',
                    days: [1, 2, 3, 4, 5], // Montag bis Freitag
                    sunEvent: null,
                    offset: 0
                };
                morningSchedule.actions = [
                    { type: 'light', target: Object.keys(lights)[0], state: { on: true, bri: 254 } }
                ];

                const eveningSchedule = new ScheduleAutomation('2', 'Abendlicht');
                eveningSchedule.schedule = {
                    time: null,
                    days: [0, 1, 2, 3, 4, 5, 6], // Täglich
                    sunEvent: 'sunset',
                    offset: -15 // 15 Minuten vor Sonnenuntergang
                };
                eveningSchedule.actions = [
                    { type: 'scene', target: '1', state: {} } // Verknüpfung mit Szene 1
                ];
                eveningSchedule.lastTriggered = Date.now() - 86400000; // Gestern

                setAutomations([morningSchedule, eveningSchedule]);
                setLoading(false);
            } catch (err) {
                console.error("Fehler beim Laden der Automatisierungen:", err);
                setError("Automatisierungen konnten nicht geladen werden. " + err.message);
                setLoading(false);
            }
        };

        if (Object.keys(lights).length > 0) {
            loadAutomations();
        }
    }, [lights]);

    // Aktiviere/Deaktiviere eine Automatisierung
    const toggleAutomation = (automationId) => {
        setAutomations(automations.map(auto =>
            auto.id === automationId ? { ...auto, enabled: !auto.enabled } : auto
        ));
    };

    // Bearbeite eine Automatisierung
    const editAutomation = (automationId) => {
        const automation = automations.find(a => a.id === automationId);
        if (automation) {
            setEditingAutomation(automation);
            setAutomationType(automation.type);
            setShowFormModal(true);
        }
    };

    // Lösche eine Automatisierung
    const deleteAutomation = (automationId) => {
        if (window.confirm("Möchtest du diese Automatisierung wirklich löschen?")) {
            setAutomations(automations.filter(a => a.id !== automationId));
        }
    };

    // Speichere eine neue oder bearbeitete Automatisierung
    const saveAutomation = (automationData) => {
        if (editingAutomation) {
            // Aktualisiere bestehende Automatisierung
            setAutomations(automations.map(a =>
                a.id === editingAutomation.id ? { ...a, ...automationData, lastModified: Date.now() } : a
            ));
        } else {
            // Erstelle neue Automatisierung
            const newAutomation = {
                ...automationData,
                id: Date.now().toString(), // Einfache ID-Generierung
                created: Date.now(),
                lastModified: Date.now()
            };
            setAutomations([...automations, newAutomation]);
        }

        setShowFormModal(false);
        setEditingAutomation(null);
    };

    // Starte neue Automatisierung mit bestimmtem Typ
    const startNewAutomation = (type) => {
        setAutomationType(type);
        setEditingAutomation(null);
        setShowFormModal(true);
    };

    // Rendere das entsprechende Formular je nach Automatisierungstyp
    const renderAutomationForm = () => {
        switch (automationType) {
            case AUTOMATION_TYPES.SCHEDULE:
                return (
                    <ScheduleForm
                        automation={editingAutomation}
                        onSave={saveAutomation}
                        onCancel={() => { setShowFormModal(false); setEditingAutomation(null); }}
                        scenes={scenes}
                        lights={lights}
                    />
                );
            // Weitere Formulare für andere Automatisierungstypen
            default:
                return (
                    <div className="modal-backdrop">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Nicht unterstützt</h2>
                                <button className="close-button" onClick={() => setShowFormModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p>Dieser Automatisierungstyp wird noch nicht unterstützt.</p>
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => setShowFormModal(false)}>Schließen</button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="automations-view">
            <div className="automations-header">
                <h2 className="section-title">Automatisierungen</h2>
                <div className="dropdown">
                    <button className="dropdown-button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Neue Automatisierung
                    </button>
                    <div className="dropdown-content">
                        <button onClick={() => startNewAutomation(AUTOMATION_TYPES.SCHEDULE)}>
                            <AutomationIcon type={AUTOMATION_TYPES.SCHEDULE} />
                            <span>Zeitplan</span>
                        </button>
                        <button onClick={() => startNewAutomation(AUTOMATION_TYPES.GEOFENCE)}>
                            <AutomationIcon type={AUTOMATION_TYPES.GEOFENCE} />
                            <span>Standort</span>
                        </button>
                        <button onClick={() => startNewAutomation(AUTOMATION_TYPES.PRESENCE)}>
                            <AutomationIcon type={AUTOMATION_TYPES.PRESENCE} />
                            <span>Anwesenheitssimulation</span>
                        </button>
                        <button onClick={() => startNewAutomation(AUTOMATION_TYPES.SENSOR)}>
                            <AutomationIcon type={AUTOMATION_TYPES.SENSOR} />
                            <span>Sensor</span>
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading">
                    <p>Lade Automatisierungen...</p>
                </div>
            ) : error ? (
                <div className="status-message status-error">{error}</div>
            ) : (
                <div className="automations-list">
                    {automations.length === 0 ? (
                        <div className="empty-state">
                            <p>Keine Automatisierungen vorhanden. Erstelle deine erste Automatisierung!</p>
                        </div>
                    ) : (
                        automations.map(automation => (
                            <AutomationCard
                                key={automation.id}
                                automation={automation}
                                onToggle={toggleAutomation}
                                onEdit={editAutomation}
                                onDelete={deleteAutomation}
                            />
                        ))
                    )}
                </div>
            )}

            {showFormModal && renderAutomationForm()}
        </div>
    );
};

export default AutomationsView;