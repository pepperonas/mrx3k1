// src/components/EnhancedAutomationView.jsx - Erweiterte Automatisierungen für GlitterHue
import React, { useState, useEffect, useRef } from 'react';
import '../styles/automation.css';

// Automatisierungstypen
const AUTOMATION_TYPES = {
    SCHEDULE: 'schedule',       // Zeitplan
    WAKE_UP: 'wake-up',         // Lichtwecker
    PRESENCE: 'presence',       // Anwesenheitssimulation
    GEO_FENCE: 'geo-fence',     // Standortbasiert
    SENSOR: 'sensor',           // Sensorbasiert
    SLEEP: 'sleep',             // Einschlafmodus
    SUNSET: 'sunset',           // Sonnenuntergang
    SUNRISE: 'sunrise'          // Sonnenaufgang
};

// Standard-Automatisierungseinstellungen
const DEFAULT_SETTINGS = {
    [AUTOMATION_TYPES.WAKE_UP]: {
        name: 'Lichtwecker',
        time: '07:00',
        days: [1, 2, 3, 4, 5], // Mo-Fr
        duration: 30, // Dauer in Minuten
        targetBrightness: 254,
        targetColor: 'warm',
        enabled: true
    },
    [AUTOMATION_TYPES.PRESENCE]: {
        name: 'Anwesenheitssimulation',
        active: {
            start: '18:00',
            end: '23:00'
        },
        rooms: [],
        randomness: 60, // 0-100%
        enabled: true
    },
    [AUTOMATION_TYPES.SLEEP]: {
        name: 'Einschlafmodus',
        time: '22:30',
        days: [0, 1, 2, 3, 4, 5, 6], // Täglich
        duration: 15, // Dauer in Minuten
        enabled: true
    },
    [AUTOMATION_TYPES.SUNSET]: {
        name: 'Sonnenuntergang',
        offset: -30, // Minuten vor Sonnenuntergang
        days: [0, 1, 2, 3, 4, 5, 6], // Täglich
        scene: null,
        rooms: [],
        enabled: true
    },
    [AUTOMATION_TYPES.SUNRISE]: {
        name: 'Sonnenaufgang',
        offset: 0, // Minuten nach Sonnenaufgang
        days: [0, 1, 2, 3, 4, 5, 6], // Täglich
        scene: null,
        action: 'off', // oder 'scene'
        rooms: [],
        enabled: true
    },
    [AUTOMATION_TYPES.GEO_FENCE]: {
        name: 'Willkommen zu Hause',
        action: 'scene',
        scene: null,
        radius: 100, // Meter
        delay: 0, // Verzögerung in Sekunden
        users: ['primary'],
        condition: 'anyone', // 'anyone', 'everyone', 'specific'
        enabled: true
    }
};

// Icon-Komponente für die Automatisierungstypen
const AutomationIcon = ({ type }) => {
    return (
        <div className="automation-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {type === AUTOMATION_TYPES.SCHEDULE && (
                    <>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </>
                )}
                {type === AUTOMATION_TYPES.WAKE_UP && (
                    <>
                        <path d="M12 2v8" />
                        <path d="M5.2 11.2l1.4 1.4" />
                        <path d="M2 18h20" />
                        <path d="M18.4 11.2l-1.4 1.4" />
                        <path d="M19 22H5" />
                        <path d="M12 18v4" />
                        <path d="M8 22h8" />
                        <path d="M12 6L4 14h16L12 6z" />
                    </>
                )}
                {type === AUTOMATION_TYPES.PRESENCE && (
                    <>
                        <path d="M5 5v14" />
                        <path d="M19 5v14" />
                        <rect x="1" y="5" width="22" height="14" rx="2" />
                        <circle cx="8" cy="12" r="2" />
                        <circle cx="16" cy="12" r="2" />
                    </>
                )}
                {type === AUTOMATION_TYPES.GEO_FENCE && (
                    <>
                        <circle cx="12" cy="10" r="3" />
                        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                    </>
                )}
                {type === AUTOMATION_TYPES.SENSOR && (
                    <>
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                        <path d="M6 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                        <path d="M18 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                        <path d="M8 6v16" />
                        <path d="M16 6v16" />
                    </>
                )}
                {(type === AUTOMATION_TYPES.SLEEP) && (
                    <>
                        <path d="M8 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                        <path d="M16 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                        <line x1="21" y1="3" x2="3" y2="21" />
                        <path d="M12 12a10 10 0 0 0 7.4-3.4M12 12a10 10 0 0 1-7.4 3.4" />
                    </>
                )}
                {type === AUTOMATION_TYPES.SUNSET && (
                    <>
                        <path d="M17 18a5 5 0 0 0-10 0" />
                        <line x1="12" y1="9" x2="12" y2="2" />
                        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
                        <line x1="1" y1="18" x2="3" y2="18" />
                        <line x1="21" y1="18" x2="23" y2="18" />
                        <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
                        <line x1="23" y1="22" x2="1" y2="22" />
                        <polyline points="8 6 12 2 16 6" />
                    </>
                )}
                {type === AUTOMATION_TYPES.SUNRISE && (
                    <>
                        <path d="M17 18a5 5 0 0 0-10 0" />
                        <line x1="12" y1="9" x2="12" y2="2" />
                        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
                        <line x1="1" y1="18" x2="3" y2="18" />
                        <line x1="21" y1="18" x2="23" y2="18" />
                        <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
                        <line x1="23" y1="22" x2="1" y2="22" />
                        <polyline points="16 6 12 10 8 6" />
                    </>
                )}
            </svg>
        </div>
    );
};

// Automatisierungs-Karte zur Anzeige in der Liste
const AutomationCard = ({ automation, onEdit, onToggle, onDelete }) => {
    // Je nach Automatisierungstyp passende Beschreibung erstellen
    const getDescription = () => {
        switch (automation.type) {
            case AUTOMATION_TYPES.WAKE_UP:
                return `${automation.time} • ${formatDays(automation.days)} • ${automation.duration} Min. Dauer`;
            case AUTOMATION_TYPES.PRESENCE:
                return `${automation.active.start}-${automation.active.end} • Zufälligkeit: ${automation.randomness}%`;
            case AUTOMATION_TYPES.SLEEP:
                return `${automation.time} • ${formatDays(automation.days)} • ${automation.duration} Min. Abdunkeln`;
            case AUTOMATION_TYPES.SUNSET:
                return `Sonnenuntergang ${formatOffset(automation.offset)} • ${formatDays(automation.days)}`;
            case AUTOMATION_TYPES.SUNRISE:
                return `Sonnenaufgang ${formatOffset(automation.offset)} • ${formatDays(automation.days)}`;
            case AUTOMATION_TYPES.GEO_FENCE:
                return `Radius: ${automation.radius}m • ${automation.condition === 'anyone' ? 'Bei Ankunft von jedem' : 'Bei Ankunft aller'}`;
            default:
                return '';
        }
    };

    // Formatiere Wochentage zur Anzeige
    const formatDays = (days) => {
        if (days.length === 7) return 'Täglich';
        if (days.length === 5 && days.includes(1) && days.includes(5)) return 'Wochentags';
        if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Wochenende';

        const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        return days.map(day => dayNames[day]).join(', ');
    };

    // Formatiere Zeitversatz für Sonnenauf-/untergang
    const formatOffset = (offset) => {
        if (offset === 0) return '';
        return offset > 0 ? `+${offset} Min.` : `${offset} Min.`;
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
                        onClick={() => onEdit(automation)}
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

// Formular für Lichtwecker-Einstellungen
const WakeUpForm = ({ automation, onSave, onCancel, lights, rooms, scenes }) => {
    const [formData, setFormData] = useState({
        ...DEFAULT_SETTINGS[AUTOMATION_TYPES.WAKE_UP],
        ...automation
    });

    // Formularänderungen verarbeiten
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Wochentag auswählen/abwählen
    const toggleDay = (day) => {
        const days = [...formData.days];
        const index = days.indexOf(day);

        if (index >= 0) {
            days.splice(index, 1);
        } else {
            days.push(day);
            days.sort();
        }

        setFormData(prev => ({ ...prev, days }));
    };

    // Lichter für den Wecker auswählen
    const toggleLight = (lightId) => {
        const lights = formData.lights || [];

        if (lights.includes(lightId)) {
            setFormData(prev => ({
                ...prev,
                lights: lights.filter(id => id !== lightId)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                lights: [...lights, lightId]
            }));
        }
    };

    // Formulareingabe abschicken
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            type: AUTOMATION_TYPES.WAKE_UP,
            enabled: true
        });
    };

    return (
        <form onSubmit={handleSubmit}>
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
                <label htmlFor="time">Uhrzeit</label>
                <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Wochentage</label>
                <div className="days-selection">
                    {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`day-button ${formData.days.includes(index) ? 'selected' : ''}`}
                            onClick={() => toggleDay(index)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
                <div className="day-presets">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, days: [0, 1, 2, 3, 4, 5, 6] }))}
                    >
                        Alle
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, days: [1, 2, 3, 4, 5] }))}
                    >
                        Wochentags
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, days: [0, 6] }))}
                    >
                        Wochenende
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="duration">Dauer des Sonnenaufgangs</label>
                <div className="range-with-value">
                    <input
                        type="range"
                        id="duration"
                        name="duration"
                        min="1"
                        max="60"
                        value={formData.duration}
                        onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.duration} Minuten</span>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="targetBrightness">Maximale Helligkeit</label>
                <div className="range-with-value">
                    <input
                        type="range"
                        id="targetBrightness"
                        name="targetBrightness"
                        min="50"
                        max="254"
                        value={formData.targetBrightness}
                        onChange={handleInputChange}
                    />
                    <span className="range-value">{Math.round((formData.targetBrightness / 254) * 100)}%</span>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="targetColor">Lichtfarbe</label>
                <select
                    id="targetColor"
                    name="targetColor"
                    value={formData.targetColor}
                    onChange={handleInputChange}
                >
                    <option value="warm">Warmes Licht (2200K)</option>
                    <option value="morning">Morgenlicht (3000K)</option>
                    <option value="neutral">Neutrales Weiß (4000K)</option>
                    <option value="daylight">Tageslicht (6500K)</option>
                    <option value="energize">Energetisierend (Blauton)</option>
                </select>
            </div>

            <div className="form-group">
                <label>Lichter für den Wecker</label>
                <div className="lights-selection">
                    {Object.entries(lights).map(([id, light]) => (
                        <div key={id} className="light-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={(formData.lights || []).includes(id)}
                                    onChange={() => toggleLight(id)}
                                />
                                {light.name}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>Abbrechen</button>
                <button type="submit">Speichern</button>
            </div>
        </form>
    );
};

// Formular für Anwesenheitssimulation
const PresenceForm = ({ automation, onSave, onCancel, lights, rooms }) => {
    const [formData, setFormData] = useState({
        ...DEFAULT_SETTINGS[AUTOMATION_TYPES.PRESENCE],
        ...automation
    });

    // Formularänderungen verarbeiten
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Zeit-Bereichsänderungen verarbeiten
    const handleTimeRangeChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            active: {
                ...prev.active,
                [name]: value
            }
        }));
    };

    // Raum auswählen/abwählen
    const toggleRoom = (roomId) => {
        const roomsList = formData.rooms || [];

        if (roomsList.includes(roomId)) {
            setFormData(prev => ({
                ...prev,
                rooms: roomsList.filter(id => id !== roomId)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                rooms: [...roomsList, roomId]
            }));
        }
    };

    // Formulareingabe abschicken
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            type: AUTOMATION_TYPES.PRESENCE,
            enabled: true
        });
    };

    return (
        <form onSubmit={handleSubmit}>
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

            <div className="form-row">
                <div className="form-group half">
                    <label htmlFor="start">Startzeit</label>
                    <input
                        type="time"
                        id="start"
                        name="start"
                        value={formData.active.start}
                        onChange={handleTimeRangeChange}
                        required
                    />
                </div>
                <div className="form-group half">
                    <label htmlFor="end">Endzeit</label>
                    <input
                        type="time"
                        id="end"
                        name="end"
                        value={formData.active.end}
                        onChange={handleTimeRangeChange}
                        required
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="randomness">Zufälligkeit</label>
                <div className="range-with-value">
                    <input
                        type="range"
                        id="randomness"
                        name="randomness"
                        min="10"
                        max="100"
                        value={formData.randomness}
                        onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.randomness}%</span>
                </div>
                <p className="form-hint">Höhere Werte bedeuten mehr Variation in den Schaltzeiten.</p>
            </div>

            <div className="form-group">
                <label>Räume für die Simulation</label>
                <div className="room-selection">
                    {rooms && rooms.length > 0 ? (
                        rooms.map(room => (
                            <div key={room.id} className="room-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={(formData.rooms || []).includes(room.id)}
                                        onChange={() => toggleRoom(room.id)}
                                    />
                                    {room.name}
                                </label>
                            </div>
                        ))
                    ) : (
                        <p className="form-note">Keine Räume konfiguriert. Die Simulation verwendet einzelne Lichter.</p>
                    )}
                </div>

                {(!rooms || rooms.length === 0) && (
                    <div className="lights-selection">
                        {Object.entries(lights).map(([id, light]) => (
                            <div key={id} className="light-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={(formData.lights || []).includes(id)}
                                        onChange={() => toggleLight(id)}
                                    />
                                    {light.name}
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="maxLights">Maximale Anzahl gleichzeitig aktiver Lichter</label>
                <div className="range-with-value">
                    <input
                        type="range"
                        id="maxLights"
                        name="maxLights"
                        min="1"
                        max={rooms
                            ? Math.max(5, rooms.reduce((count, room) => count + (room.lights ? room.lights.length : 0), 0))
                            : Object.keys(lights).length}
                        value={formData.maxLights || 3}
                        onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.maxLights || 3}</span>
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>Abbrechen</button>
                <button type="submit">Speichern</button>
            </div>
        </form>
    );
};

// Formular für Sonnenuntergangs- und Sonnenaufgangsautomatisierung
const SunEventForm = ({ automation, onSave, onCancel, lights, rooms, scenes, type }) => {
    const [formData, setFormData] = useState({
        ...DEFAULT_SETTINGS[type],
        ...automation
    });

    // Formularänderungen verarbeiten
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Wochentag auswählen/abwählen
    const toggleDay = (day) => {
        const days = [...formData.days];
        const index = days.indexOf(day);

        if (index >= 0) {
            days.splice(index, 1);
        } else {
            days.push(day);
            days.sort();
        }

        setFormData(prev => ({ ...prev, days }));
    };

    // Raum auswählen/abwählen
    const toggleRoom = (roomId) => {
        const roomsList = formData.rooms || [];

        if (roomsList.includes(roomId)) {
            setFormData(prev => ({
                ...prev,
                rooms: roomsList.filter(id => id !== roomId)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                rooms: [...roomsList, roomId]
            }));
        }
    };

    // Formulareingabe abschicken
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            type: type,
            enabled: true
        });
    };

    const eventName = type === AUTOMATION_TYPES.SUNRISE ? 'Sonnenaufgang' : 'Sonnenuntergang';

    return (
        <form onSubmit={handleSubmit}>
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
                <label htmlFor="offset">Zeitversatz zum {eventName}</label>
                <div className="input-with-buttons">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, offset: prev.offset - 15 }))}
                    >
                        -
                    </button>
                    <input
                        type="number"
                        id="offset"
                        name="offset"
                        value={formData.offset}
                        onChange={handleInputChange}
                        step="5"
                    />
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, offset: prev.offset + 15 }))}
                    >
                        +
                    </button>
                </div>
                <p className="form-hint">
                    {formData.offset > 0
                        ? `${formData.offset} Minuten nach ${eventName}`
                        : formData.offset < 0
                            ? `${Math.abs(formData.offset)} Minuten vor ${eventName}`
                            : `Genau zum ${eventName}`}
                </p>
            </div>

            <div className="form-group">
                <label>Wochentage</label>
                <div className="days-selection">
                    {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`day-button ${formData.days.includes(index) ? 'selected' : ''}`}
                            onClick={() => toggleDay(index)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
                <div className="day-presets">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, days: [0, 1, 2, 3, 4, 5, 6] }))}
                    >
                        Alle
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, days: [1, 2, 3, 4, 5] }))}
                    >
                        Wochentags
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, days: [0, 6] }))}
                    >
                        Wochenende
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="action">Aktion</label>
                <select
                    id="action"
                    name="action"
                    value={formData.action || 'scene'}
                    onChange={handleInputChange}
                >
                    <option value="scene">Szene aktivieren</option>
                    {type === AUTOMATION_TYPES.SUNRISE && (
                        <option value="off">Lichter ausschalten</option>
                    )}
                    <option value="custom">Benutzerdefiniert</option>
                </select>
            </div>

            {formData.action === 'scene' && (
                <div className="form-group">
                    <label htmlFor="scene">Szene</label>
                    <select
                        id="scene"
                        name="scene"
                        value={formData.scene || ''}
                        onChange={handleInputChange}
                        required={formData.action === 'scene'}
                    >
                        <option value="" disabled>Szene auswählen...</option>
                        {scenes.map(scene => (
                            <option key={scene.id} value={scene.id}>{scene.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="form-group">
                <label>Räume</label>
                <div className="room-selection">
                    {rooms && rooms.length > 0 ? (
                        rooms.map(room => (
                            <div key={room.id} className="room-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={(formData.rooms || []).includes(room.id)}
                                        onChange={() => toggleRoom(room.id)}
                                    />
                                    {room.name}
                                </label>
                            </div>
                        ))
                    ) : (
                        <p className="form-note">Keine Räume konfiguriert.</p>
                    )}
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>Abbrechen</button>
                <button type="submit">Speichern</button>
            </div>
        </form>
    );
};

// Formular für Geo-Fence (Standortbasierte Automatisierung)
const GeoFenceForm = ({ automation, onSave, onCancel, scenes }) => {
    const [formData, setFormData] = useState({
        ...DEFAULT_SETTINGS[AUTOMATION_TYPES.GEO_FENCE],
        ...automation
    });

    // Formularänderungen verarbeiten
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Benutzer hinzufügen/entfernen
    const toggleUser = (userId) => {
        const users = [...formData.users];
        const index = users.indexOf(userId);

        if (index >= 0) {
            users.splice(index, 1);
        } else {
            users.push(userId);
        }

        setFormData(prev => ({ ...prev, users }));
    };

    // Formulareingabe abschicken
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            type: AUTOMATION_TYPES.GEO_FENCE,
            enabled: true
        });
    };

    return (
        <form onSubmit={handleSubmit}>
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
                <label htmlFor="radius">Radius (in Metern)</label>
                <div className="range-with-value">
                    <input
                        type="range"
                        id="radius"
                        name="radius"
                        min="50"
                        max="300"
                        step="10"
                        value={formData.radius}
                        onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.radius} m</span>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="delay">Verzögerung (in Sekunden)</label>
                <div className="range-with-value">
                    <input
                        type="range"
                        id="delay"
                        name="delay"
                        min="0"
                        max="300"
                        step="5"
                        value={formData.delay}
                        onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.delay} s</span>
                </div>
                <p className="form-hint">Warte diese Zeit nach dem Betreten des Bereichs, bevor die Aktion ausgeführt wird.</p>
            </div>

            <div className="form-group">
                <label htmlFor="action">Aktion</label>
                <select
                    id="action"
                    name="action"
                    value={formData.action || 'scene'}
                    onChange={handleInputChange}
                >
                    <option value="scene">Szene aktivieren</option>
                    <option value="custom">Benutzerdefiniert</option>
                </select>
            </div>

            {formData.action === 'scene' && (
                <div className="form-group">
                    <label htmlFor="scene">Szene</label>
                    <select
                        id="scene"
                        name="scene"
                        value={formData.scene || ''}
                        onChange={handleInputChange}
                        required={formData.action === 'scene'}
                    >
                        <option value="" disabled>Szene auswählen...</option>
                        {scenes.map(scene => (
                            <option key={scene.id} value={scene.id}>{scene.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="form-group">
                <label htmlFor="condition">Bedingung</label>
                <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                >
                    <option value="anyone">Wenn irgendein Benutzer ankommt</option>
                    <option value="everyone">Wenn alle Benutzer angekommen sind</option>
                    <option value="specific">Nur für bestimmte Benutzer</option>
                </select>
            </div>

            {formData.condition === 'specific' && (
                <div className="form-group">
                    <label>Benutzer</label>
                    <div className="user-selection">
                        <div className="user-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.users.includes('primary')}
                                    onChange={() => toggleUser('primary')}
                                />
                                Hauptbenutzer
                            </label>
                        </div>
                        <div className="user-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.users.includes('family1')}
                                    onChange={() => toggleUser('family1')}
                                />
                                Familienmitglied 1
                            </label>
                        </div>
                        <div className="user-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.users.includes('family2')}
                                    onChange={() => toggleUser('family2')}
                                />
                                Familienmitglied 2
                            </label>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancel}>Abbrechen</button>
                <button type="submit">Speichern</button>
            </div>
        </form>
    );
};

// Modaler Dialog für die Auswahl des Automatisierungstyps
const SelectAutomationTypeModal = ({ onSelect, onCancel }) => {
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Neue Automatisierung</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>
                <div className="automation-type-selection">
                    <div className="automation-type-grid">
                        <div
                            className="automation-type-card"
                            onClick={() => onSelect(AUTOMATION_TYPES.WAKE_UP)}
                        >
                            <AutomationIcon type={AUTOMATION_TYPES.WAKE_UP} />
                            <h3>Lichtwecker</h3>
                            <p>Wache mit einem sanften Sonnenaufgang auf</p>
                        </div>

                        <div
                            className="automation-type-card"
                            onClick={() => onSelect(AUTOMATION_TYPES.PRESENCE)}
                        >
                            <AutomationIcon type={AUTOMATION_TYPES.PRESENCE} />
                            <h3>Anwesenheitssimulation</h3>
                            <p>Täusche Anwesenheit vor, wenn du nicht zu Hause bist</p>
                        </div>

                        <div
                            className="automation-type-card"
                            onClick={() => onSelect(AUTOMATION_TYPES.SLEEP)}
                        >
                            <AutomationIcon type={AUTOMATION_TYPES.SLEEP} />
                            <h3>Einschlafmodus</h3>
                            <p>Dimme die Lichter langsam zum Einschlafen</p>
                        </div>

                        <div
                            className="automation-type-card"
                            onClick={() => onSelect(AUTOMATION_TYPES.SUNSET)}
                        >
                            <AutomationIcon type={AUTOMATION_TYPES.SUNSET} />
                            <h3>Sonnenuntergang</h3>
                            <p>Aktiviere Lichter zum Sonnenuntergang</p>
                        </div>

                        <div
                            className="automation-type-card"
                            onClick={() => onSelect(AUTOMATION_TYPES.SUNRISE)}
                        >
                            <AutomationIcon type={AUTOMATION_TYPES.SUNRISE} />
                            <h3>Sonnenaufgang</h3>
                            <p>Führe Aktionen zum Sonnenaufgang aus</p>
                        </div>

                        <div
                            className="automation-type-card"
                            onClick={() => onSelect(AUTOMATION_TYPES.GEO_FENCE)}
                        >
                            <AutomationIcon type={AUTOMATION_TYPES.GEO_FENCE} />
                            <h3>Standortbasiert</h3>
                            <p>Steuere Lichter basierend auf deinem Standort</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modaler Dialog zum Bearbeiten einer Automatisierung
const EditAutomationModal = ({ automation, onSave, onCancel, lights, rooms, scenes }) => {
    if (!automation) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{automation.id ? 'Automatisierung bearbeiten' : 'Neue Automatisierung'}</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <div className="modal-body">
                    {automation.type === AUTOMATION_TYPES.WAKE_UP && (
                        <WakeUpForm
                            automation={automation}
                            onSave={onSave}
                            onCancel={onCancel}
                            lights={lights}
                            rooms={rooms}
                            scenes={scenes}
                        />
                    )}

                    {automation.type === AUTOMATION_TYPES.PRESENCE && (
                        <PresenceForm
                            automation={automation}
                            onSave={onSave}
                            onCancel={onCancel}
                            lights={lights}
                            rooms={rooms}
                        />
                    )}

                    {automation.type === AUTOMATION_TYPES.SUNSET && (
                        <SunEventForm
                            automation={automation}
                            onSave={onSave}
                            onCancel={onCancel}
                            lights={lights}
                            rooms={rooms}
                            scenes={scenes}
                            type={AUTOMATION_TYPES.SUNSET}
                        />
                    )}

                    {automation.type === AUTOMATION_TYPES.SUNRISE && (
                        <SunEventForm
                            automation={automation}
                            onSave={onSave}
                            onCancel={onCancel}
                            lights={lights}
                            rooms={rooms}
                            scenes={scenes}
                            type={AUTOMATION_TYPES.SUNRISE}
                        />
                    )}

                    {automation.type === AUTOMATION_TYPES.GEO_FENCE && (
                        <GeoFenceForm
                            automation={automation}
                            onSave={onSave}
                            onCancel={onCancel}
                            scenes={scenes}
                        />
                    )}

                    {/* Hier könnten weitere Formulartypen ergänzt werden */}
                </div>
            </div>
        </div>
    );
};

// Komponente für die Anzeige des Sonnenauf- und -untergangs
const SunEventInfo = () => {
    const [sunTimes, setSunTimes] = useState({
        sunrise: '06:00',
        sunset: '18:00'
    });

    // Koordinaten laden oder Standard verwenden
    useEffect(() => {
        // In einer echten App würden Koordinaten vom Gerät abgefragt oder aus den Einstellungen geladen
        // Hier verwenden wir Standardkoordinaten für Deutschland

        // Berechne Sonnenauf- und -untergangszeiten mithilfe einer Bibliothek oder API
        calculateSunTimes(50.1, 8.6); // Beispiel: Frankfurt am Main
    }, []);

    // Berechnet Sonnenauf- und -untergangszeiten für bestimmte Koordinaten
    const calculateSunTimes = (lat, lng) => {
        // Hier würde in einer echten App eine Berechnung oder API-Abfrage erfolgen

        // Verwende Beispiel-Sonnenzeiten basierend auf dem aktuellen Datum
        const now = new Date();
        const season = Math.sin((now.getMonth() + 9) / 12 * Math.PI);

        // Grobe Simulation der Jahreszeiten
        const sunriseHour = 7 - Math.round(season * 2);
        const sunsetHour = 17 + Math.round(season * 2);

        setSunTimes({
            sunrise: `${sunriseHour.toString().padStart(2, '0')}:${Math.round(Math.random() * 59).toString().padStart(2, '0')}`,
            sunset: `${sunsetHour.toString().padStart(2, '0')}:${Math.round(Math.random() * 59).toString().padStart(2, '0')}`
        });
    };

    return (
        <div className="sun-event-info">
            <div className="sun-event">
                <div className="sun-icon sunrise">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 18a5 5 0 0 0-10 0"></path>
                        <line x1="12" y1="2" x2="12" y2="9"></line>
                        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line>
                        <line x1="1" y1="18" x2="3" y2="18"></line>
                        <line x1="21" y1="18" x2="23" y2="18"></line>
                        <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line>
                        <line x1="23" y1="22" x2="1" y2="22"></line>
                        <polyline points="8 6 12 2 16 6"></polyline>
                    </svg>
                </div>
                <div className="sun-time">
                    <div className="label">Sonnenaufgang</div>
                    <div className="time">{sunTimes.sunrise}</div>
                </div>
            </div>

            <div className="sun-event">
                <div className="sun-icon sunset">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 18a5 5 0 0 0-10 0"></path>
                        <line x1="12" y1="9" x2="12" y2="2"></line>
                        <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line>
                        <line x1="1" y1="18" x2="3" y2="18"></line>
                        <line x1="21" y1="18" x2="23" y2="18"></line>
                        <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line>
                        <line x1="23" y1="22" x2="1" y2="22"></line>
                        <polyline points="16 6 12 10 8 6"></polyline>
                    </svg>
                </div>
                <div className="sun-time">
                    <div className="label">Sonnenuntergang</div>
                    <div className="time">{sunTimes.sunset}</div>
                </div>
            </div>
        </div>
    );
};

// Hauptkomponente für die erweiterte Automatisierungsansicht
const EnhancedAutomationView = ({ lights, rooms = [], scenes = [], username, bridgeIP }) => {
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState(null);

    // Automatisierungen laden
    useEffect(() => {
        const loadAutomations = async () => {
            try {
                setLoading(true);

                // Lade gespeicherte Automatisierungen aus dem localStorage
                const savedAutomations = localStorage.getItem('hue-automations');

                if (savedAutomations) {
                    setAutomations(JSON.parse(savedAutomations));
                } else {
                    // Erstelle Beispiel-Automatisierungen, wenn keine vorhanden sind
                    const demoAutomations = [
                        {
                            id: '1',
                            type: AUTOMATION_TYPES.WAKE_UP,
                            name: 'Morgenwecker',
                            time: '07:00',
                            days: [1, 2, 3, 4, 5], // Mo-Fr
                            duration: 20,
                            targetBrightness: 254,
                            targetColor: 'warm',
                            lights: Object.keys(lights).slice(0, 2),
                            enabled: true
                        },
                        {
                            id: '2',
                            type: AUTOMATION_TYPES.SUNSET,
                            name: 'Abendstimmung',
                            offset: -15, // 15 Minuten vor Sonnenuntergang
                            days: [0, 1, 2, 3, 4, 5, 6], // Täglich
                            scene: '1', // ID der ersten Szene
                            action: 'scene',
                            rooms: rooms.length > 0 ? [rooms[0].id] : [],
                            enabled: true
                        }
                    ];

                    setAutomations(demoAutomations);
                    saveAutomations(demoAutomations);
                }

                setLoading(false);
            } catch (err) {
                console.error("Fehler beim Laden der Automatisierungen:", err);
                setError("Automatisierungen konnten nicht geladen werden: " + err.message);
                setLoading(false);
            }
        };

        if (Object.keys(lights).length > 0) {
            loadAutomations();
        }
    }, [lights, rooms]);

    // Automatisierungen im localStorage speichern
    const saveAutomations = (updatedAutomations) => {
        try {
            localStorage.setItem('hue-automations', JSON.stringify(updatedAutomations));
        } catch (error) {
            console.error("Fehler beim Speichern der Automatisierungen:", error);
        }
    };

    // Neue Automatisierung erstellen
    const createAutomation = () => {
        setShowTypeSelector(true);
    };

    // Automatisierung bearbeiten
    const editAutomation = (automation) => {
        setEditingAutomation({...automation});
    };

    // Automatisierung löschen
    const deleteAutomation = (automationId) => {
        if (window.confirm("Möchtest du diese Automatisierung wirklich löschen?")) {
            const updatedAutomations = automations.filter(a => a.id !== automationId);
            setAutomations(updatedAutomations);
            saveAutomations(updatedAutomations);
        }
    };

    // Automatisierung aktivieren/deaktivieren
    const toggleAutomation = (automationId) => {
        const updatedAutomations = automations.map(a =>
            a.id === automationId ? {...a, enabled: !a.enabled} : a
        );

        setAutomations(updatedAutomations);
        saveAutomations(updatedAutomations);
    };

    // Callback für die Auswahl des Automatisierungstyps
    const handleTypeSelect = (type) => {
        const newAutomation = {
            type,
            ...DEFAULT_SETTINGS[type]
        };

        setShowTypeSelector(false);
        setEditingAutomation(newAutomation);
    };

    // Automatisierung speichern (neu oder bearbeitet)
    const saveAutomation = (automationData) => {
        if (automationData.id) {
            // Vorhandene Automatisierung aktualisieren
            const updatedAutomations = automations.map(a =>
                a.id === automationData.id ? {...automationData} : a
            );

            setAutomations(updatedAutomations);
            saveAutomations(updatedAutomations);
        } else {
            // Neue Automatisierung erstellen
            const newAutomation = {
                ...automationData,
                id: Date.now().toString(),
                created: Date.now()
            };

            const updatedAutomations = [...automations, newAutomation];
            setAutomations(updatedAutomations);
            saveAutomations(updatedAutomations);
        }

        setEditingAutomation(null);
    };

    // Automatisierungen nach Typ gruppieren
    const groupedAutomations = automations.reduce((groups, automation) => {
        const group = groups[automation.type] || [];
        group.push(automation);
        groups[automation.type] = group;
        return groups;
    }, {});

    return (
        <div className="enhanced-automation-view">
            <div className="automation-header">
                <h2 className="section-title">Erweiterte Automatisierungen</h2>
                <button onClick={createAutomation}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Neue Automatisierung
                </button>
            </div>

            <SunEventInfo />

            {loading ? (
                <div className="loading">
                    <p>Lade Automatisierungen...</p>
                </div>
            ) : error ? (
                <div className="status-message status-error">{error}</div>
            ) : automations.length === 0 ? (
                <div className="empty-state">
                    <p>Keine Automatisierungen vorhanden. Erstelle deine erste Automatisierung!</p>
                </div>
            ) : (
                <div className="automation-groups">
                    {/* Lichtwecker-Gruppe */}
                    {groupedAutomations[AUTOMATION_TYPES.WAKE_UP] && (
                        <div className="automation-group">
                            <h3 className="group-title">
                                <AutomationIcon type={AUTOMATION_TYPES.WAKE_UP} />
                                <span>Lichtwecker</span>
                            </h3>
                            <div className="automation-list">
                                {groupedAutomations[AUTOMATION_TYPES.WAKE_UP].map(automation => (
                                    <AutomationCard
                                        key={automation.id}
                                        automation={automation}
                                        onEdit={editAutomation}
                                        onToggle={toggleAutomation}
                                        onDelete={deleteAutomation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sonnenuntergangs-Gruppe */}
                    {groupedAutomations[AUTOMATION_TYPES.SUNSET] && (
                        <div className="automation-group">
                            <h3 className="group-title">
                                <AutomationIcon type={AUTOMATION_TYPES.SUNSET} />
                                <span>Sonnenuntergang</span>
                            </h3>
                            <div className="automation-list">
                                {groupedAutomations[AUTOMATION_TYPES.SUNSET].map(automation => (
                                    <AutomationCard
                                        key={automation.id}
                                        automation={automation}
                                        onEdit={editAutomation}
                                        onToggle={toggleAutomation}
                                        onDelete={deleteAutomation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sonnenaufgangs-Gruppe */}
                    {groupedAutomations[AUTOMATION_TYPES.SUNRISE] && (
                        <div className="automation-group">
                            <h3 className="group-title">
                                <AutomationIcon type={AUTOMATION_TYPES.SUNRISE} />
                                <span>Sonnenaufgang</span>
                            </h3>
                            <div className="automation-list">
                                {groupedAutomations[AUTOMATION_TYPES.SUNRISE].map(automation => (
                                    <AutomationCard
                                        key={automation.id}
                                        automation={automation}
                                        onEdit={editAutomation}
                                        onToggle={toggleAutomation}
                                        onDelete={deleteAutomation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Anwesenheitssimulation-Gruppe */}
                    {groupedAutomations[AUTOMATION_TYPES.PRESENCE] && (
                        <div className="automation-group">
                            <h3 className="group-title">
                                <AutomationIcon type={AUTOMATION_TYPES.PRESENCE} />
                                <span>Anwesenheitssimulation</span>
                            </h3>
                            <div className="automation-list">
                                {groupedAutomations[AUTOMATION_TYPES.PRESENCE].map(automation => (
                                    <AutomationCard
                                        key={automation.id}
                                        automation={automation}
                                        onEdit={editAutomation}
                                        onToggle={toggleAutomation}
                                        onDelete={deleteAutomation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Einschlaf-Gruppe */}
                    {groupedAutomations[AUTOMATION_TYPES.SLEEP] && (
                        <div className="automation-group">
                            <h3 className="group-title">
                                <AutomationIcon type={AUTOMATION_TYPES.SLEEP} />
                                <span>Einschlafmodus</span>
                            </h3>
                            <div className="automation-list">
                                {groupedAutomations[AUTOMATION_TYPES.SLEEP].map(automation => (
                                    <AutomationCard
                                        key={automation.id}
                                        automation={automation}
                                        onEdit={editAutomation}
                                        onToggle={toggleAutomation}
                                        onDelete={deleteAutomation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Standortbasierte Gruppe */}
                    {groupedAutomations[AUTOMATION_TYPES.GEO_FENCE] && (
                        <div className="automation-group">
                            <h3 className="group-title">
                                <AutomationIcon type={AUTOMATION_TYPES.GEO_FENCE} />
                                <span>Standortbasiert</span>
                            </h3>
                            <div className="automation-list">
                                {groupedAutomations[AUTOMATION_TYPES.GEO_FENCE].map(automation => (
                                    <AutomationCard
                                        key={automation.id}
                                        automation={automation}
                                        onEdit={editAutomation}
                                        onToggle={toggleAutomation}
                                        onDelete={deleteAutomation}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modaler Dialog für die Auswahl des Automatisierungstyps */}
            {showTypeSelector && (
                <SelectAutomationTypeModal
                    onSelect={handleTypeSelect}
                    onCancel={() => setShowTypeSelector(false)}
                />
            )}

            {/* Modaler Dialog zum Bearbeiten einer Automatisierung */}
            {editingAutomation && (
                <EditAutomationModal
                    automation={editingAutomation}
                    onSave={saveAutomation}
                    onCancel={() => setEditingAutomation(null)}
                    lights={lights}
                    rooms={rooms}
                    scenes={scenes}
                />
            )}
        </div>
    );
};

export default EnhancedAutomationView;