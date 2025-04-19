// src/components/UnifiedTimeControlView.jsx - Kombiniert alle Arten von Zeitsteuerungen
import React, { useState, useEffect } from 'react';
import UnifiedTimeControlService, { TIME_CONTROL_TYPES, DEFAULT_SETTINGS } from '../services/UnifiedTimeControlService';
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

                {/* Lichtwecker */}
                {type === TIME_CONTROL_TYPES.WAKE_UP && (
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

                {/* Anwesenheitssimulation */}
                {type === TIME_CONTROL_TYPES.PRESENCE && (
                    <>
                        <path d="M5 5v14" />
                        <path d="M19 5v14" />
                        <rect x="1" y="5" width="22" height="14" rx="2" />
                        <circle cx="8" cy="12" r="2" />
                        <circle cx="16" cy="12" r="2" />
                    </>
                )}

                {/* Einschlafmodus */}
                {type === TIME_CONTROL_TYPES.SLEEP && (
                    <>
                        <path d="M8 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                        <path d="M16 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                        <line x1="21" y1="3" x2="3" y2="21" />
                        <path d="M12 12a10 10 0 0 0 7.4-3.4M12 12a10 10 0 0 1-7.4 3.4" />
                    </>
                )}

                {/* Geo-Fence (Standortbasiert) */}
                {type === TIME_CONTROL_TYPES.GEO_FENCE && (
                    <>
                        <circle cx="12" cy="10" r="3" />
                        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                    </>
                )}
            </svg>
        </div>
    );
};

// Karte für eine einzelne Zeitsteuerung in der Liste
const TimeControlCard = ({ timeControl, onToggle, onEdit, onDelete, lights, scenes }) => {
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

    // Offset formatieren (für sonnenbasierte Zeitpläne)
    const formatOffset = (offset) => {
        if (offset === 0) return '';
        return offset > 0 ? `+${offset} Min.` : `${offset} Min.`;
    };

    // Beschreibung der Zeitsteuerung je nach Typ generieren
    const getDescription = () => {
        switch (timeControl.type) {
            // Bridge-Zeitpläne
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

            // Lokale Timer
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

            // Erweiterte Automatisierungen
            case TIME_CONTROL_TYPES.WAKE_UP:
                return `${timeControl.time} • ${formatDays(timeControl.days)} • ${timeControl.duration} Min. Dauer`;

            case TIME_CONTROL_TYPES.PRESENCE:
                return `${timeControl.active.start}-${timeControl.active.end} • Zufälligkeit: ${timeControl.randomness}%`;

            case TIME_CONTROL_TYPES.SLEEP:
                return `${timeControl.time} • ${formatDays(timeControl.days)} • ${timeControl.duration} Min. Abdunkeln`;

            case TIME_CONTROL_TYPES.GEO_FENCE:
                return `Radius: ${timeControl.radius}m • ${timeControl.condition === 'anyone' ? 'Bei Ankunft von jedem' : 'Bei Ankunft aller'}`;

            default:
                return 'Zeitsteuerung';
        }
    };

    // Aktionen beschreiben
    const getActionDescription = () => {
        // Für Bridge-Zeitpläne
        if (timeControl.actions && timeControl.actions.length > 0) {
            const action = timeControl.actions[0]; // Wir zeigen nur die erste Aktion an
            switch (action.type) {
                case 'light':
                    return `Lampe: ${lights[action.target]?.name || action.target} ${action.state?.on ? 'Ein' : 'Aus'}`;
                case 'group':
                    return `Gruppe: ${action.target} ${action.state?.on ? 'Ein' : 'Aus'}`;
                case 'scene':
                    const sceneName = scenes.find(s => s.id === action.target)?.name || action.target;
                    return `Szene: ${sceneName}`;
                case 'sensor':
                    return `Sensor: ${action.target} (Status: ${action.state?.status || 'unbekannt'})`;
                default:
                    return `Aktion: ${action.type}`;
            }
        }

        // Für erweiterte Automatisierungen
        if (timeControl.managed === 'automation') {
            if (timeControl.type === TIME_CONTROL_TYPES.WAKE_UP) {
                const lights = timeControl.lights || [];
                return `Lichtwecker für ${lights.length} Lampen, Helligkeit: ${Math.round(timeControl.targetBrightness / 254 * 100)}%`;
            }

            if (timeControl.type === TIME_CONTROL_TYPES.GEO_FENCE && timeControl.scene) {
                const sceneName = scenes.find(s => s.id === timeControl.scene)?.name || timeControl.scene;
                return `Aktiviert Szene: ${sceneName}`;
            }
        }

        return '';
    };

    // Bestimme spezielle Farbe/Design-Klasse basierend auf dem Typ
    const getTypeClass = () => {
        if (timeControl.managed === 'bridge') return 'bridge';
        if (timeControl.managed === 'local') return 'local';

        // Erweiterte Automatisierungen
        switch (timeControl.type) {
            case TIME_CONTROL_TYPES.WAKE_UP: return 'wake-up';
            case TIME_CONTROL_TYPES.PRESENCE: return 'presence';
            case TIME_CONTROL_TYPES.SLEEP: return 'sleep';
            case TIME_CONTROL_TYPES.GEO_FENCE: return 'geo-fence';
            default: return 'automation';
        }
    };

    return (
        <div className={`time-control-card ${getTypeClass()} ${!timeControl.enabled ? 'disabled' : ''}`}>
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
                        onClick={() => onEdit(timeControl)}
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

// 1. Komponente für die Anzeige des Sonnenauf- und -untergangs
const SunEventInfo = ({ sunTimes }) => {
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

// 2. Filter-Komponente für Zeitsteuerungen
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
            <button
                className={`filter-btn ${activeFilter === 'automations' ? 'active' : ''}`}
                onClick={() => onFilterChange('automations')}
            >
                Automatisierung
            </button>
        </div>
    );
};

// 3. Modaler Dialog für die Auswahl des Zeitsteuerungstyps
const SelectTimeControlTypeModal = ({ onSelect, onCancel }) => {
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Neue Zeitsteuerung</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <div className="time-control-type-groups">
                    <div className="type-group">
                        <h3>Einfache Timer</h3>
                        <div className="time-control-type-grid">
                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.COUNTDOWN_OFF)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.COUNTDOWN_OFF} />
                                <h4>Ausschalttimer</h4>
                                <p>Schaltet Lichter nach Zeit aus</p>
                            </button>

                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.COUNTDOWN_ON)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.COUNTDOWN_ON} />
                                <h4>Einschalttimer</h4>
                                <p>Schaltet Lichter nach Zeit ein</p>
                            </button>

                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.CYCLE)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.CYCLE} />
                                <h4>Zyklischer Timer</h4>
                                <p>Wechselt regelmäßig zwischen ein/aus</p>
                            </button>
                        </div>
                    </div>

                    <div className="type-group">
                        <h3>Zeitpläne</h3>
                        <div className="time-control-type-grid">
                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.FIXED_SCHEDULE)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.FIXED_SCHEDULE} />
                                <h4>Fester Zeitplan</h4>
                                <p>Zu einer bestimmten Zeit</p>
                            </button>

                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.SUNRISE_SCHEDULE)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.SUNRISE_SCHEDULE} />
                                <h4>Sonnenaufgang</h4>
                                <p>Zeitplan basierend auf Sonnenaufgang</p>
                            </button>

                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.SUNSET_SCHEDULE)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.SUNSET_SCHEDULE} />
                                <h4>Sonnenuntergang</h4>
                                <p>Zeitplan basierend auf Sonnenuntergang</p>
                            </button>
                        </div>
                    </div>

                    <div className="type-group">
                        <h3>Erweiterte Automatisierungen</h3>
                        <div className="time-control-type-grid">
                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.WAKE_UP)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.WAKE_UP} />
                                <h4>Lichtwecker</h4>
                                <p>Wache mit einem sanften Sonnenaufgang auf</p>
                            </button>

                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.SLEEP)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.SLEEP} />
                                <h4>Einschlafmodus</h4>
                                <p>Dimme die Lichter langsam zum Einschlafen</p>
                            </button>

                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.PRESENCE)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.PRESENCE} />
                                <h4>Anwesenheitssimulation</h4>
                                <p>Täusche Anwesenheit vor</p>
                            </button>

                            <button
                                className="time-control-type-card"
                                onClick={() => onSelect(TIME_CONTROL_TYPES.GEO_FENCE)}
                            >
                                <TimeControlIcon type={TIME_CONTROL_TYPES.GEO_FENCE} />
                                <h4>Standortbasiert</h4>
                                <p>Steuere Lichter basierend auf deinem Standort</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Hauptkomponente für die integrierte Zeitsteuerungs-Ansicht
const UnifiedTimeControlView = ({ username, bridgeIP, lights, rooms = [], scenes = [] }) => {
    const [timeControls, setTimeControls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTimeControl, setEditingTimeControl] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });
    const [activeFilter, setActiveFilter] = useState('all');
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [service, setService] = useState(null);
    const [sunTimes, setSunTimes] = useState({ sunrise: '06:00', sunset: '18:00' });

    // TimeControlService initialisieren
    useEffect(() => {
        if (username && bridgeIP) {
            const timeControlService = new UnifiedTimeControlService(bridgeIP, username);
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

            // Callback für Automatisierungs-Aktionen
            const handleAutomationExecute = async (automation, state) => {
                try {
                    // Je nach Automatisierungstyp unterschiedliche Aktionen ausführen
                    if (automation.type === TIME_CONTROL_TYPES.WAKE_UP) {
                        // Lichtwecker: alle konfigurierten Lichter mit neuer Helligkeit/Farbe
                        for (const lightId of automation.lights || []) {
                            await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(state)
                            });
                        }
                    } else if (automation.action === 'scene' && automation.scene) {
                        // Szene aktivieren
                        await fetch(`http://${bridgeIP}/api/${username}/groups/0/action`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ scene: automation.scene })
                        });
                    } else {
                        // Standardaktion: bestimmte Lichter/Räume steuern
                        const targetLights = automation.lights || [];
                        for (const lightId of targetLights) {
                            await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(state)
                            });
                        }
                    }

                    // Status-Nachricht anzeigen
                    setStatusMessage({
                        message: `Automatisierung "${automation.name}" wurde ausgeführt.`,
                        type: "success"
                    });

                    // Status-Nachricht nach 3 Sekunden ausblenden
                    setTimeout(() => setStatusMessage({ message: '', type: '' }), 3000);
                } catch (error) {
                    console.error("Fehler beim Ausführen der Automatisierung:", error);
                    setStatusMessage({
                        message: "Automatisierung konnte nicht ausgeführt werden: " + error.message,
                        type: "error"
                    });
                }
            };

            // Service initialisieren und Zeitsteuerungen laden
            timeControlService.initialize(handleTimerExecute, handleAutomationExecute)
                .then(allTimeControls => {
                    setTimeControls(allTimeControls);
                    setSunTimes(timeControlService.sunTimes);
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
        // Basis-Sortierung
        const sortedTimeControls = [...timeControls].sort((a, b) => {
            // Nach Typ
            if (a.managed !== b.managed) {
                // Bridge, dann local, dann automation
                if (a.managed === 'bridge') return -1;
                if (b.managed === 'bridge') return 1;
                if (a.managed === 'local') return -1;
                return 1;
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
            case 'automations':
                return sortedTimeControls.filter(tc =>
                    tc.type === TIME_CONTROL_TYPES.WAKE_UP ||
                    tc.type === TIME_CONTROL_TYPES.PRESENCE ||
                    tc.type === TIME_CONTROL_TYPES.SLEEP ||
                    tc.type === TIME_CONTROL_TYPES.GEO_FENCE);
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
        setShowTypeSelector(true);
    };

    // Callback für die Auswahl des Zeitsteuerungstyps
    const handleTypeSelect = (type) => {
        setShowTypeSelector(false);

        // Je nach Typ unterschiedliche Standardeinstellungen
        let defaultSettings;

        if (service.isBridgeScheduleType(type)) {
            defaultSettings = {
                type,
                name: '',
                schedule: {
                    time: '08:00',
                    days: [0, 1, 2, 3, 4, 5, 6], // Alle Tage
                    offset: 0
                },
                actions: []
            };
        } else if (service.isLocalTimerType(type)) {
            defaultSettings = {
                type,
                name: type === TIME_CONTROL_TYPES.COUNTDOWN_ON ? 'Einschalttimer' :
                    type === TIME_CONTROL_TYPES.COUNTDOWN_OFF ? 'Ausschalttimer' : 'Zyklischer Timer',
                duration: 30,
                lightIds: [],
                interval: 30 // nur für zyklische Timer
            };
        } else if (service.isAdvancedAutomationType(type)) {
            defaultSettings = DEFAULT_SETTINGS[type] || {};
        }

        setEditingTimeControl(defaultSettings);
        setShowForm(true);
    };

    // Zeitsteuerung bearbeiten
    const editTimeControl = (timeControl) => {
        setEditingTimeControl({...timeControl});
        setShowForm(true);
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
            let id;
            if (timeControlData.id) {
                // Bestehende Zeitsteuerung aktualisieren
                await service.updateTimeControl(timeControlData.id, timeControlData);
                id = timeControlData.id;
            } else {
                // Neue Zeitsteuerung erstellen
                id = await service.createTimeControl(timeControlData);
            }

            // Zeitsteuerungen neu laden
            await refreshTimeControls();

            // Formular schließen
            setShowForm(false);
            setEditingTimeControl(null);

            setStatusMessage({
                message: timeControlData.id ? "Zeitsteuerung aktualisiert." : "Zeitsteuerung erstellt.",
                type: "success"
            });

            // Status-Nachricht nach 3 Sekunden ausblenden
            setTimeout(() => setStatusMessage({ message: '', type: '' }), 3000);
        } catch (error) {
            console.error("Fehler beim Speichern der Zeitsteuerung:", error);
            setError(`Zeitsteuerung konnte nicht gespeichert werden: ${error.message}`);
        }
    };

    return (
        <div className="unified-time-control-view">
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

            {/* Sonnenzeiten-Anzeige */}
            <SunEventInfo sunTimes={sunTimes} />

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
                                    scenes={scenes}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Typ-Auswahl-Dialog */}
            {showTypeSelector && (
                <SelectTimeControlTypeModal
                    onSelect={handleTypeSelect}
                    onCancel={() => setShowTypeSelector(false)}
                />
            )}

            {/* Bearbeitungs-Dialog würde hier eingefügt - dieser ist komplex und
                würde aus mehreren Komponenten für die verschiedenen Zeitsteuerungstypen bestehen */}
            {showForm && editingTimeControl && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingTimeControl.id ? 'Zeitsteuerung bearbeiten' : 'Neue Zeitsteuerung'}</h2>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                setEditingTimeControl(null);
                            }}>×</button>
                        </div>

                        <div className="modal-body">
                            {/* Hier würde die entsprechende Form-Komponente für den ausgewählten Typ eingefügt,
                                z.B. ScheduleForm, TimerForm, WakeUpForm, etc. */}
                            <p>Bearbeitungsformular für {editingTimeControl.type}</p>

                            {/* Demo-Buttons */}
                            <div className="form-actions">
                                <button
                                    className="secondary-button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingTimeControl(null);
                                    }}
                                >
                                    Abbrechen
                                </button>
                                <button onClick={() => {
                                    // Demo-Speichern
                                    saveTimeControl({
                                        ...editingTimeControl,
                                        name: editingTimeControl.name || 'Neue Zeitsteuerung'
                                    });
                                }}>
                                    Speichern
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedTimeControlView;