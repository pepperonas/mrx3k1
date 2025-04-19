// src/components/TimeControlView.jsx - Vereinheitlichte Komponente für alle Zeitsteuerungen
import React, { useState, useEffect } from 'react';
import TimeControlService, { TIME_CONTROL_TYPES } from '../services/TimeControlService';
import '../styles/timeControl.css';

// Icon-Komponente für verschiedene Zeitsteuerungstypen
const TimeControlIcon = ({ type }) => {
    return (
        <div className="time-control-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* Bridge-Zeitpläne */}
                {(type === TIME_CONTROL_TYPES.FIXED_SCHEDULE) && (
                    // Wöchentlicher Zeitplan
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </>
                )}
                {(type === TIME_CONTROL_TYPES.SUNRISE_SCHEDULE || type === TIME_CONTROL_TYPES.SUNSET_SCHEDULE) && (
                    // Sonnenauf-/untergang-Zeitplan
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
                )}

                {/* Countdown-Timer */}
                {(type === TIME_CONTROL_TYPES.COUNTDOWN_ON || type === TIME_CONTROL_TYPES.COUNTDOWN_OFF) && (
                    // Countdown-Timer
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 15.5 14" />
                        <path d="M16 18h2" />
                        <path d="M6 18h2" />
                        <path d="M17 14l1 4" />
                        <path d="M6 14l1 4" />
                    </>
                )}

                {/* Zyklischer Timer */}
                {type === TIME_CONTROL_TYPES.CYCLE && (
                    // Zyklischer Timer
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M22 12A10 10 0 0 0 12 2v10h10" />
                        <path d="M14 9l3 3-3 3" />
                    </>
                )}
            </svg>
        </div>
    );
};

// Karte für eine einzelne Zeitsteuerung in der Liste
const TimeControlCard = ({ timeControl, onToggle, onEdit, onDelete, lights }) => {
    // Bei Countdown-Timern: verbleibende Zeit berechnen
    const [timeRemaining, setTimeRemaining] = useState(
        timeControl.managed === 'local' ? calculateRemaining(timeControl) : 0
    );

    // Timer-Fortschritt berechnen (0-100%)
    const calculateProgress = () => {
        if (timeControl.managed !== 'local') return 0;

        const elapsed = Date.now() - timeControl.startTime;
        const total = timeControl.duration * 60 * 1000; // Minuten zu Millisekunden
        return Math.min(100, Math.round((elapsed / total) * 100));
    };

    // Verbleibende Zeit für lokale Timer berechnen
    function calculateRemaining(timer) {
        if (!timer.startTime || !timer.duration) return 0;

        const endTime = timer.startTime + (timer.duration * 60 * 1000);
        const remaining = Math.max(0, endTime - Date.now());
        return remaining;
    }

    // Zeit formatieren (MM:SS)
    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Aktualisiere die verbleibende Zeit jede Sekunde bei lokalen Timern
    useEffect(() => {
        if (timeControl.managed !== 'local') return;

        const interval = setInterval(() => {
            const remaining = calculateRemaining(timeControl);
            setTimeRemaining(remaining);

            // Timer beendet?
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timeControl]);

    // Formatiere Tage für Zeitpläne
    const formatDays = (days) => {
        if (!days || !Array.isArray(days)) return '';
        if (days.length === 7) return 'Täglich';
        if (days.length === 5 && days.includes(1) && days.includes(2) && days.includes(3) && days.includes(4) && days.includes(5)) return 'Wochentags';
        if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Wochenende';

        const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        return days.sort().map(day => dayNames[day]).join(', ');
    };

    // Beschreibung der Zeitsteuerung generieren
    const getDescription = () => {
        switch (timeControl.type) {
            case TIME_CONTROL_TYPES.FIXED_SCHEDULE:
                return `${timeControl.schedule.time} Uhr • ${formatDays(timeControl.schedule.days)}`;

            case TIME_CONTROL_TYPES.SUNRISE_SCHEDULE: {
                const offsetText = timeControl.schedule.offset !== 0
                    ? `${timeControl.schedule.offset > 0 ? '+' : '-'} ${Math.abs(timeControl.schedule.offset)} Min.`
                    : '';
                return `Sonnenaufgang ${offsetText} • ${formatDays(timeControl.schedule.days)}`;
            }

            case TIME_CONTROL_TYPES.SUNSET_SCHEDULE: {
                const offsetText = timeControl.schedule.offset !== 0
                    ? `${timeControl.schedule.offset > 0 ? '+' : '-'} ${Math.abs(timeControl.schedule.offset)} Min.`
                    : '';
                return `Sonnenuntergang ${offsetText} • ${formatDays(timeControl.schedule.days)}`;
            }

            case TIME_CONTROL_TYPES.COUNTDOWN_ON:
            case TIME_CONTROL_TYPES.COUNTDOWN_OFF: {
                const targets = timeControl.lightIds?.map(id => lights[id]?.name || id).join(', ');
                const action = timeControl.type === TIME_CONTROL_TYPES.COUNTDOWN_ON ? 'ein' : 'aus';
                return `Schaltet ${targets} ${action} in ${formatTime(timeRemaining)}`;
            }

            case TIME_CONTROL_TYPES.CYCLE: {
                const targets = timeControl.lightIds?.map(id => lights[id]?.name || id).join(', ');
                return `Wechselt ${targets} alle ${timeControl.interval} Minuten`;
            }

            default:
                return 'Zeitsteuerung';
        }
    };

    // Aktionen beschreiben
    const getActionDescription = () => {
        if (!timeControl.actions || timeControl.actions.length === 0) {
            return '';
        }

        const action = timeControl.actions[0]; // Wir zeigen nur die erste Aktion an
        switch (action.type) {
            case 'light':
                return `Lampe: ${lights[action.target]?.name || action.target} ${action.state?.on ? 'Ein' : 'Aus'}`;
            case 'group':
                return `Gruppe: ${action.target} ${action.state?.on ? 'Ein' : 'Aus'}`;
            case 'scene':
                return `Szene: ${action.target}`;
            case 'sensor':
                return `Sensor: ${action.target} (Status: ${action.state?.status || 'unbekannt'})`;
            default:
                return `Aktion: ${action.type}`;
        }
    };

    return (
        <div className={`time-control-card ${timeControl.managed} ${!timeControl.enabled ? 'disabled' : ''}`}>
            <div className="time-control-header">
                <TimeControlIcon type={timeControl.type} />
                <div className="time-control-info">
                    <h3>{timeControl.name}</h3>
                    <p className="time-control-description">{getDescription()}</p>
                    {getActionDescription() && (
                        <p className="time-control-action">{getActionDescription()}</p>
                    )}

                    {/* Countdown-Timer mit Fortschrittsbalken */}
                    {(timeControl.managed === 'local' &&
                        (timeControl.type === TIME_CONTROL_TYPES.COUNTDOWN_ON ||
                            timeControl.type === TIME_CONTROL_TYPES.COUNTDOWN_OFF)) && (
                        <div className="timer-progress-container">
                            <div className="timer-progress">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${calculateProgress()}%` }}
                                ></div>
                            </div>
                            <div className="time-remaining">{formatTime(timeRemaining)}</div>
                        </div>
                    )}
                </div>

                <div className="time-control-actions">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={timeControl.enabled}
                            onChange={() => onToggle(timeControl.id, timeControl.type)}
                        />
                        <span className="slider"></span>
                    </label>

                    <button
                        className="icon-button edit"
                        onClick={() => onEdit(timeControl.id, timeControl.type)}
                        aria-label="Bearbeiten"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>

                    <button
                        className="icon-button delete"
                        onClick={() => onDelete(timeControl.id, timeControl.type)}
                        aria-label="Löschen"
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

// Formular zum Erstellen/Bearbeiten von Zeitsteuerungen
const TimeControlForm = ({ timeControl, onSave, onCancel, lights, sensors, scenes }) => {
    // Zeitpläne oder Timer Basis-Konfiguration
    const getInitialFormData = () => {
        if (timeControl) return timeControl;

        // Standard-Konfiguration für neuen Zeitplan
        return {
            name: '',
            type: TIME_CONTROL_TYPES.FIXED_SCHEDULE,
            enabled: true,
            actions: [],
            schedule: {
                time: '08:00',
                days: [0, 1, 2, 3, 4, 5, 6], // Alle Tage standardmäßig auswählen
                offset: 0
            }
        };
    };

    const [formData, setFormData] = useState(getInitialFormData());
    const [controlType, setControlType] = useState(
        timeControl ? timeControl.type : TIME_CONTROL_TYPES.FIXED_SCHEDULE
    );
    const [selectedTab, setSelectedTab] = useState(
        timeControl?.managed === 'local' ? 'timer' : 'schedule'
    );

    // Aktions-Konfiguration
    const [actionType, setActionType] = useState('light');
    const [selectedTarget, setSelectedTarget] = useState('');
    const [actionState, setActionState] = useState({ on: true, bri: 254 });

    // Formular-Werte aktualisieren, wenn sich der controlType ändert
    useEffect(() => {
        // Update formData wenn der Zeitsteuerungstyp geändert wird
        setFormData(prev => ({
            ...prev,
            type: controlType,
            // Zusätzliche Felder für Timer
            ...(isTimerType(controlType) ? {
                duration: prev.duration || 30,
                lightIds: prev.lightIds || [],
                interval: prev.interval || 30
            } : {}),
            // Schedule-Felder löschen für Timer
            ...(isTimerType(controlType) ? { schedule: undefined } : {}),
            // Lightids löschen für Zeitpläne
            ...(!isTimerType(controlType) ? { lightIds: undefined } : {})
        }));
    }, [controlType]);

    // Prüfen, ob ein Typ ein lokaler Timer ist
    const isTimerType = (type) => {
        return [
            TIME_CONTROL_TYPES.COUNTDOWN_ON,
            TIME_CONTROL_TYPES.COUNTDOWN_OFF,
            TIME_CONTROL_TYPES.CYCLE
        ].includes(type);
    };

    // Allgemeine Eingabefeld-Änderung
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Numerische Eingabe
    const handleNumberChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };

    // Zeitplan-Einstellungen ändern
    const handleScheduleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [field]: value
            }
        }));
    };

    // Wochentag ein-/ausschalten
    const toggleDay = (day) => {
        const days = [...(formData.schedule?.days || [])];
        const index = days.indexOf(day);

        if (index >= 0) {
            days.splice(index, 1);
        } else {
            days.push(day);
            days.sort();
        }

        handleScheduleChange('days', days);
    };

    // Lampe zur Auswahl hinzufügen/entfernen (für Timer)
    const toggleLight = (lightId) => {
        setFormData(prev => {
            const lightIds = [...(prev.lightIds || [])];
            const index = lightIds.indexOf(lightId);

            if (index >= 0) {
                lightIds.splice(index, 1);
            } else {
                lightIds.push(lightId);
            }

            return { ...prev, lightIds };
        });
    };

    // Alle Lampen auswählen (für Timer)
    const selectAllLights = () => {
        setFormData(prev => ({
            ...prev,
            lightIds: Object.keys(lights)
        }));
    };

    // Keine Lampen auswählen (für Timer)
    const clearLightSelection = () => {
        setFormData(prev => ({
            ...prev,
            lightIds: []
        }));
    };

    // Dauer-Voreinstellung auswählen (für Timer)
    const selectDurationPreset = (minutes) => {
        setFormData(prev => ({
            ...prev,
            duration: minutes
        }));
    };

    // Aktion zum Formular hinzufügen (für Zeitpläne)
    const addAction = () => {
        let newAction;

        switch (actionType) {
            case 'light':
                newAction = {
                    type: 'light',
                    target: selectedTarget,
                    state: { ...actionState }
                };
                break;
            case 'group':
                newAction = {
                    type: 'group',
                    target: selectedTarget,
                    state: { ...actionState }
                };
                break;
            case 'scene':
                newAction = {
                    type: 'scene',
                    target: selectedTarget,
                    state: {}
                };
                break;
            case 'sensor':
                newAction = {
                    type: 'sensor',
                    target: selectedTarget,
                    state: { status: actionState.status || 1 }
                };
                break;
            default:
                return;
        }

        // Aktion zum Formular hinzufügen (ersetze alle vorherigen Aktionen)
        setFormData(prev => ({
            ...prev,
            actions: [newAction]
        }));

        // Reset Auswahl
        setSelectedTarget('');
    };

    // Aktion aus dem Formular entfernen
    const removeAction = (index) => {
        setFormData(prev => ({
            ...prev,
            actions: prev.actions.filter((_, i) => i !== index)
        }));
    };

    // Formular absenden
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validierung für Timer
        if (isTimerType(formData.type) && (!formData.lightIds || formData.lightIds.length === 0)) {
            alert('Bitte wähle mindestens eine Lampe aus.');
            return;
        }

        // Validierung für Zeitpläne
        if (!isTimerType(formData.type) && (!formData.actions || formData.actions.length === 0)) {
            alert('Bitte füge mindestens eine Aktion hinzu.');
            return;
        }

        onSave(formData);
    };

    // Timer-Presets (in Minuten)
    const TIMER_PRESETS = [5, 15, 30, 60, 120];

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{timeControl ? 'Zeitsteuerung bearbeiten' : 'Neue Zeitsteuerung'}</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <div className="time-control-tabs">
                    <button
                        className={`tab-button ${selectedTab === 'schedule' ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedTab('schedule');
                            setControlType(TIME_CONTROL_TYPES.FIXED_SCHEDULE);
                        }}
                    >
                        Zeitpläne
                    </button>
                    <button
                        className={`tab-button ${selectedTab === 'timer' ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedTab('timer');
                            setControlType(TIME_CONTROL_TYPES.COUNTDOWN_OFF);
                        }}
                    >
                        Timer
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Gemeinsame Felder */}
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Name der Zeitsteuerung"
                            required
                        />
                    </div>

                    {/* Zeitplan-Typen */}
                    {selectedTab === 'schedule' && (
                        <>
                            <div className="form-group">
                                <label>Zeitplan-Typ</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="controlType"
                                            checked={controlType === TIME_CONTROL_TYPES.FIXED_SCHEDULE}
                                            onChange={() => setControlType(TIME_CONTROL_TYPES.FIXED_SCHEDULE)}
                                        />
                                        Feste Uhrzeit
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="controlType"
                                            checked={controlType === TIME_CONTROL_TYPES.SUNRISE_SCHEDULE}
                                            onChange={() => setControlType(TIME_CONTROL_TYPES.SUNRISE_SCHEDULE)}
                                        />
                                        Sonnenaufgang
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="controlType"
                                            checked={controlType === TIME_CONTROL_TYPES.SUNSET_SCHEDULE}
                                            onChange={() => setControlType(TIME_CONTROL_TYPES.SUNSET_SCHEDULE)}
                                        />
                                        Sonnenuntergang
                                    </label>
                                </div>
                            </div>

                            {/* Feste Zeit */}
                            {controlType === TIME_CONTROL_TYPES.FIXED_SCHEDULE && (
                                <div className="form-group">
                                    <label htmlFor="time">Uhrzeit</label>
                                    <input
                                        type="time"
                                        id="time"
                                        value={formData.schedule?.time || ''}
                                        onChange={(e) => handleScheduleChange('time', e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {/* Sonnenauf/-untergang Offset */}
                            {(controlType === TIME_CONTROL_TYPES.SUNRISE_SCHEDULE ||
                                controlType === TIME_CONTROL_TYPES.SUNSET_SCHEDULE) && (
                                <div className="form-group">
                                    <label htmlFor="offset">Versatz (Minuten)</label>
                                    <div className="input-with-buttons">
                                        <button
                                            type="button"
                                            onClick={() => handleScheduleChange('offset', (formData.schedule?.offset || 0) - 15)}
                                        >-</button>
                                        <input
                                            type="number"
                                            id="offset"
                                            value={formData.schedule?.offset || 0}
                                            onChange={(e) => handleScheduleChange('offset', parseInt(e.target.value) || 0)}
                                            step="15"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleScheduleChange('offset', (formData.schedule?.offset || 0) + 15)}
                                        >+</button>
                                    </div>
                                    <p className="hint-text">Negative Werte: vor Sonnenauf-/untergang, Positive Werte: nach Sonnenauf-/untergang</p>
                                </div>
                            )}

                            {/* Wochentage (für alle Zeitplan-Typen) */}
                            <div className="form-group">
                                <label>Tage</label>
                                <div className="days-selection">
                                    {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`day-button ${formData.schedule?.days?.includes(index) ? 'selected' : ''}`}
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

                            {/* Aktionen für Zeitpläne */}
                            <div className="form-group">
                                <label>Aktionen</label>
                                <div className="actions-list">
                                    {(!formData.actions || formData.actions.length === 0) ? (
                                        <p className="empty-state">Keine Aktionen definiert.</p>
                                    ) : (
                                        formData.actions.map((action, index) => (
                                            <div key={index} className="action-item">
                                                <div className="action-details">
                          <span className="action-type">
                            {action.type === 'light' ? 'Lampe:' :
                                action.type === 'group' ? 'Gruppe:' :
                                    action.type === 'scene' ? 'Szene:' :
                                        action.type === 'sensor' ? 'Sensor:' : 'Aktion:'}
                          </span>
                                                    <span className="action-target">
                            {action.target}
                          </span>
                                                    {(action.type === 'light' || action.type === 'group') && (
                                                        <span className="action-state">
                              {action.state?.on !== undefined ? (action.state.on ? 'Ein' : 'Aus') : ''}
                                                            {action.state?.on && action.state?.bri && ` • ${Math.round(action.state.bri / 254 * 100)}%`}
                            </span>
                                                    )}
                                                    {action.type === 'sensor' && (
                                                        <span className="action-state">
                              Status: {action.state?.status || 1}
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
                                    <h4>Aktion hinzufügen</h4>

                                    <div className="action-type-selector">
                                        <label>Aktionstyp:</label>
                                        <select
                                            value={actionType}
                                            onChange={(e) => {
                                                setActionType(e.target.value);
                                                setSelectedTarget('');
                                                if (e.target.value === 'sensor') {
                                                    setActionState({ status: 1 });
                                                } else if (e.target.value === 'scene') {
                                                    setActionState({});
                                                } else {
                                                    setActionState({ on: true, bri: 254 });
                                                }
                                            }}
                                        >
                                            <option value="light">Lampe schalten</option>
                                            <option value="group">Gruppe schalten</option>
                                            <option value="scene">Szene aktivieren</option>
                                            <option value="sensor">Sensor-Status setzen</option>
                                        </select>
                                    </div>

                                    <div className="action-target-selector">
                                        <label>Ziel:</label>
                                        <select
                                            value={selectedTarget}
                                            onChange={(e) => setSelectedTarget(e.target.value)}
                                            disabled={
                                                (actionType === 'light' && Object.keys(lights).length === 0) ||
                                                (actionType === 'scene' && (!scenes || scenes.length === 0)) ||
                                                (actionType === 'sensor' && Object.keys(sensors || {}).length === 0)
                                            }
                                        >
                                            <option value="">Bitte wählen...</option>

                                            {actionType === 'light' && Object.entries(lights).map(([id, light]) => (
                                                <option key={id} value={id}>{light.name}</option>
                                            ))}

                                            {actionType === 'group' && [
                                                <option key="0" value="0">Alle Lampen</option>,
                                                <option key="1" value="1">Wohnzimmer</option>,
                                                <option key="2" value="2">Küche</option>
                                            ]}

                                            {actionType === 'scene' && (scenes || []).map(scene => (
                                                <option key={scene.id} value={scene.id}>{scene.name}</option>
                                            ))}

                                            {actionType === 'sensor' && Object.entries(sensors || {}).map(([id, sensor]) => (
                                                <option key={id} value={id}>{sensor.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {(actionType === 'light' || actionType === 'group') && (
                                        <div className="action-state-selector">
                                            <label>Zustand:</label>
                                            <div className="action-state-options">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        checked={actionState.on === true}
                                                        onChange={() => setActionState({ ...actionState, on: true })}
                                                    />
                                                    Ein
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        checked={actionState.on === false}
                                                        onChange={() => setActionState({ ...actionState, on: false })}
                                                    />
                                                    Aus
                                                </label>
                                            </div>

                                            {actionState.on && (
                                                <div className="brightness-selector">
                                                    <label>Helligkeit: {Math.round(actionState.bri / 254 * 100)}%</label>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="254"
                                                        value={actionState.bri}
                                                        onChange={(e) => setActionState({ ...actionState, bri: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {actionType === 'sensor' && (
                                        <div className="sensor-status-selector">
                                            <label>Status-Wert:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="255"
                                                value={actionState.status || 1}
                                                onChange={(e) => setActionState({ ...actionState, status: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="add-action-btn"
                                        onClick={addAction}
                                        disabled={!selectedTarget}
                                    >
                                        Aktion hinzufügen
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Timer-Typen */}
                    {selectedTab === 'timer' && (
                        <>
                            <div className="form-group">
                                <label>Timer-Typ</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="controlType"
                                            checked={controlType === TIME_CONTROL_TYPES.COUNTDOWN_OFF}
                                            onChange={() => setControlType(TIME_CONTROL_TYPES.COUNTDOWN_OFF)}
                                        />
                                        Ausschalten nach Zeit
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="controlType"
                                            checked={controlType === TIME_CONTROL_TYPES.COUNTDOWN_ON}
                                            onChange={() => setControlType(TIME_CONTROL_TYPES.COUNTDOWN_ON)}
                                        />
                                        Einschalten nach Zeit
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="controlType"
                                            checked={controlType === TIME_CONTROL_TYPES.CYCLE}
                                            onChange={() => setControlType(TIME_CONTROL_TYPES.CYCLE)}
                                        />
                                        Zyklisches Ein-/Ausschalten
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="duration">Dauer (Minuten)</label>
                                <div className="presets-container">
                                    <div className="duration-input">
                                        <input
                                            type="number"
                                            id="duration"
                                            min="1"
                                            max="1440" // 24 Stunden
                                            value={formData.duration || 30}
                                            onChange={(e) => handleNumberChange('duration', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="presets-buttons">
                                        {TIMER_PRESETS.map(preset => (
                                            <button
                                                key={preset}
                                                type="button"
                                                className={formData.duration === preset ? 'preset-active' : ''}
                                                onClick={() => selectDurationPreset(preset)}
                                            >{preset}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {controlType === TIME_CONTROL_TYPES.CYCLE && (
                                <div className="form-group">
                                    <label htmlFor="interval">Intervall (Minuten)</label>
                                    <input
                                        type="number"
                                        id="interval"
                                        min="1"
                                        max="120"
                                        value={formData.interval || 30}
                                        onChange={(e) => handleNumberChange('interval', e.target.value)}
                                        required
                                    />
                                    <p className="hint-text">Zeitintervall zwischen Ein- und Ausschalten.</p>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Lampen für diesen Timer</label>
                                <div className="light-selection-buttons">
                                    <button type="button" onClick={selectAllLights}>Alle auswählen</button>
                                    <button type="button" onClick={clearLightSelection}>Keine auswählen</button>
                                </div>
                                <div className="light-selection-grid">
                                    {Object.entries(lights).map(([id, light]) => (
                                        <div key={id} className="light-checkbox">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.lightIds?.includes(id) || false}
                                                    onChange={() => toggleLight(id)}
                                                />
                                                {light.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="secondary-button">Abbrechen</button>
                        <button type="submit">{timeControl ? 'Speichern' : 'Erstellen'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Filter-Komponente für Zeitsteuerungen
const TimeControlFilter = ({ activeFilter, onFilterChange }) => {
    return (
        <div className="time-control-filter">
            <button
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => onFilterChange('all')}
            >
                Alle
            </button>
            <button
                className={`filter-btn ${activeFilter === 'schedules' ? 'active' : ''}`}
                onClick={() => onFilterChange('schedules')}
            >
                Zeitpläne
            </button>
            <button
                className={`filter-btn ${activeFilter === 'timers' ? 'active' : ''}`}
                onClick={() => onFilterChange('timers')}
            >
                Timer
            </button>
            <button
                className={`filter-btn ${activeFilter === 'sun' ? 'active' : ''}`}
                onClick={() => onFilterChange('sun')}
            >
                Sonne
            </button>
        </div>
    );
};

// Hauptkomponente für die Zeitsteuerungsansicht
const TimeControlView = ({ username, bridgeIP, lights, sensors }) => {
    const [timeControls, setTimeControls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTimeControl, setEditingTimeControl] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });
    const [activeFilter, setActiveFilter] = useState('all');
    const [service, setService] = useState(null);

    // TimeControlService initialisieren
    useEffect(() => {
        if (username && bridgeIP) {
            const timeControlService = new TimeControlService(bridgeIP, username);
            setService(timeControlService);

            // Callback für Timer-Aktionen
            const handleTimerExecute = async (timer, newState) => {
                try {
                    // Aktionen für den Timer ausführen
                    for (const lightId of timer.lightIds) {
                        await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(newState)
                        });
                    }

                    // Status-Nachricht anzeigen
                    const action = newState.on ? 'eingeschaltet' : 'ausgeschaltet';
                    setStatusMessage({
                        message: `Timer "${timer.name}" wurde ausgeführt: Lichter wurden ${action}.`,
                        type: "success"
                    });

                    // Status-Nachricht nach 3 Sekunden ausblenden
                    setTimeout(() => setStatusMessage({ message: '', type: '' }), 3000);
                } catch (error) {
                    console.error("Fehler beim Ausführen des Timers:", error);
                    setStatusMessage({
                        message: "Timer konnte nicht ausgeführt werden: " + error.message,
                        type: "error"
                    });
                }
            };

            // Service initialisieren und Zeitsteuerungen laden
            timeControlService.initialize(handleTimerExecute)
                .then(allTimeControls => {
                    setTimeControls(allTimeControls);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Fehler beim Initialisieren des TimeControlService:", error);
                    setError(`Zeitsteuerungen konnten nicht geladen werden: ${error.message}`);
                    setLoading(false);
                });

            // Service bei Komponenten-Unmount beenden
            return () => {
                timeControlService.dispose();
            };
        }
    }, [username, bridgeIP]);

    // Zeitsteuerungen neu laden
    const refreshTimeControls = async () => {
        if (!service) return;

        try {
            setLoading(true);
            const allTimeControls = await service.getAllTimeControls();
            setTimeControls(allTimeControls);
            setLoading(false);
        } catch (error) {
            console.error("Fehler beim Laden der Zeitsteuerungen:", error);
            setError(`Zeitsteuerungen konnten nicht geladen werden: ${error.message}`);
            setLoading(false);
        }
    };

    // Filter anwenden
    const getFilteredTimeControls = () => {
        // Basis-Sortierung: Bridge-Zeitpläne zuerst, dann lokale Timer
        const sortedTimeControls = [...timeControls].sort((a, b) => {
            // Zuerst nach Managed-Typ (bridge vor local)
            if (a.managed !== b.managed) {
                return a.managed === 'bridge' ? -1 : 1;
            }

            // Dann nach Namen
            return a.name.localeCompare(b.name);
        });

        // Filtern nach Typ
        switch (activeFilter) {
            case 'schedules':
                return sortedTimeControls.filter(tc =>
                    tc.type === TIME_CONTROL_TYPES.FIXED_SCHEDULE);
            case 'timers':
                return sortedTimeControls.filter(tc =>
                    tc.type === TIME_CONTROL_TYPES.COUNTDOWN_ON ||
                    tc.type === TIME_CONTROL_TYPES.COUNTDOWN_OFF ||
                    tc.type === TIME_CONTROL_TYPES.CYCLE);
            case 'sun':
                return sortedTimeControls.filter(tc =>
                    tc.type === TIME_CONTROL_TYPES.SUNRISE_SCHEDULE ||
                    tc.type === TIME_CONTROL_TYPES.SUNSET_SCHEDULE);
            case 'all':
            default:
                return sortedTimeControls;
        }
    };

    // Zeitsteuerung umschalten (aktivieren/deaktivieren)
    const toggleTimeControl = async (id, type) => {
        if (!service) return;

        try {
            const timeControl = timeControls.find(tc => tc.id === id);
            if (!timeControl) return;

            // Optimistisches UI-Update
            setTimeControls(timeControls.map(tc =>
                tc.id === id ? { ...tc, enabled: !tc.enabled } : tc
            ));

            // Status auf der Bridge oder lokal aktualisieren
            await service.setTimeControlStatus(id, type, !timeControl.enabled);

            // Zeitsteuerungen aktualisieren, um den aktuellen Status zu erhalten
            refreshTimeControls();
        } catch (error) {
            console.error("Fehler beim Umschalten der Zeitsteuerung:", error);
            setError(`Zeitsteuerung konnte nicht umgeschaltet werden: ${error.message}`);

            // UI auf vorherigen Zustand zurücksetzen
            setTimeControls(timeControls.map(tc =>
                tc.id === id ? { ...tc, enabled: tc.enabled } : tc
            ));
        }
    };

    // Neue Zeitsteuerung erstellen
    const createTimeControl = () => {
        setEditingTimeControl(null);
        setShowForm(true);
    };

    // Zeitsteuerung bearbeiten
    const editTimeControl = (id, type) => {
        const timeControl = timeControls.find(tc => tc.id === id);
        if (timeControl) {
            setEditingTimeControl(timeControl);
            setShowForm(true);
        }
    };

    // Zeitsteuerung löschen
    const deleteTimeControl = async (id, type) => {
        if (!service) return;

        if (window.confirm("Möchtest du diese Zeitsteuerung wirklich löschen?")) {
            try {
                await service.deleteTimeControl(id, type);

                // Aus Liste entfernen
                setTimeControls(timeControls.filter(tc => tc.id !== id));

                setStatusMessage({
                    message: "Zeitsteuerung erfolgreich gelöscht.",
                    type: "success"
                });

                // Status-Nachricht nach 3 Sekunden ausblenden
                setTimeout(() => setStatusMessage({ message: '', type: '' }), 3000);
            } catch (error) {
                console.error("Fehler beim Löschen der Zeitsteuerung:", error);
                setError(`Zeitsteuerung konnte nicht gelöscht werden: ${error.message}`);
            }
        }
    };

    // Zeitsteuerung speichern
    const saveTimeControl = async (timeControlData) => {
        if (!service) return;

        try {
            if (editingTimeControl) {
                // Bestehende Zeitsteuerung aktualisieren
                await service.updateTimeControl(editingTimeControl.id, timeControlData);
            } else {
                // Neue Zeitsteuerung erstellen
                await service.createTimeControl(timeControlData);
            }

            // Zeitsteuerungen neu laden
            await refreshTimeControls();

            // Formular schließen
            setShowForm(false);
            setEditingTimeControl(null);

            setStatusMessage({
                message: editingTimeControl ? "Zeitsteuerung aktualisiert." : "Zeitsteuerung erstellt.",
                type: "success"
            });

            // Status-Nachricht nach 3 Sekunden ausblenden
            setTimeout(() => setStatusMessage({ message: '', type: '' }), 3000);
        } catch (error) {
            console.error("Fehler beim Speichern der Zeitsteuerung:", error);
            setError(`Zeitsteuerung konnte nicht gespeichert werden: ${error.message}`);
        }
    };

    // Beispiel-Szenen (Diese sollten eigentlich von der App bezogen werden)
    const mockScenes = [
        { id: "SJcJC4nrIGNMABi", name: "Entspanntes Lesen" },
        { id: "e3zpOy6ajd0L8jD", name: "Filmabend" },
        { id: "FqgP4PQMFV7yFHR", name: "Fokussiertes Arbeiten" }
    ];

    return (
        <div className="time-control-view">
            <div className="time-control-header">
                <h2 className="section-title">Zeitsteuerung</h2>

                <div className="time-control-header-actions">
                    <TimeControlFilter
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                    />

                    <button onClick={createTimeControl} className="create-button">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Neu
                    </button>
                </div>
            </div>

            {statusMessage.message && (
                <div className={`status-message status-${statusMessage.type}`}>
                    {statusMessage.message}
                </div>
            )}

            {error && (
                <div className="status-message status-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="loading">
                    <p>Lade Zeitsteuerungen...</p>
                </div>
            ) : (
                <div className="time-controls-container">
                    {getFilteredTimeControls().length === 0 ? (
                        <div className="empty-state">
                            <p>Keine Zeitsteuerungen gefunden. Erstelle eine neue Zeitsteuerung, um deine Lampen automatisch zu steuern.</p>
                            <button onClick={createTimeControl}>Zeitsteuerung erstellen</button>
                        </div>
                    ) : (
                        <div className="time-control-list">
                            {getFilteredTimeControls().map(timeControl => (
                                <TimeControlCard
                                    key={timeControl.id}
                                    timeControl={timeControl}
                                    onToggle={toggleTimeControl}
                                    onEdit={editTimeControl}
                                    onDelete={deleteTimeControl}
                                    lights={lights}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showForm && (
                <TimeControlForm
                    timeControl={editingTimeControl}
                    onSave={saveTimeControl}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingTimeControl(null);
                    }}
                    lights={lights}
                    sensors={sensors || {}}
                    scenes={mockScenes}
                />
            )}
        </div>
    );
};

export default TimeControlView;