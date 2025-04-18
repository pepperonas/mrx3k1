// src/components/TimerControlView.jsx - Zeitsteuerung für GlitterHue-Lampen
import React, { useState, useEffect } from 'react';
import '../styles/timer.css';

// Timer-Presets (in Minuten)
const TIMER_PRESETS = [5, 15, 30, 60, 120];

// Timer-Typen
const TIMER_TYPES = {
    ON: 'on',       // Einschalten nach Zeit
    OFF: 'off',     // Ausschalten nach Zeit
    CYCLE: 'cycle'  // Zyklisches Ein-/Ausschalten
};

// Timer-Karte für aktive Timer
const TimerCard = ({ timer, onCancel, onEdit, lights }) => {
    const [timeRemaining, setTimeRemaining] = useState(calculateRemaining(timer));

    // Timer-Fortschritt berechnen (0-100%)
    const calculateProgress = () => {
        const elapsed = Date.now() - timer.startTime;
        const total = timer.duration * 60 * 1000; // Minuten zu Millisekunden
        return Math.min(100, Math.round((elapsed / total) * 100));
    };

    // Verbleibende Zeit berechnen
    function calculateRemaining(timer) {
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

    // Aktualisiere die verbleibende Zeit jede Sekunde
    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = calculateRemaining(timer);
            setTimeRemaining(remaining);

            // Timer beendet?
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    // Beschreibung des Timers generieren
    const getTimerDescription = () => {
        const targetLights = timer.lightIds.map(id => lights[id]?.name || 'Unbekannt');
        const lightText = targetLights.length > 1
            ? `${targetLights.length} Lampen`
            : targetLights[0];

        switch (timer.type) {
            case TIMER_TYPES.ON:
                return `Schaltet ${lightText} in ${formatTime(timeRemaining)} ein`;
            case TIMER_TYPES.OFF:
                return `Schaltet ${lightText} in ${formatTime(timeRemaining)} aus`;
            case TIMER_TYPES.CYCLE:
                return `Wechselt ${lightText} alle ${timer.interval} Minuten`;
            default:
                return 'Timer aktiv';
        }
    };

    return (
        <div className="timer-card">
            <div className="timer-header">
                <h3>{timer.name}</h3>
                <div className="timer-actions">
                    <button
                        className="icon-button edit"
                        onClick={() => onEdit(timer.id)}
                        aria-label="Timer bearbeiten"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                    <button
                        className="icon-button delete"
                        onClick={() => onCancel(timer.id)}
                        aria-label="Timer abbrechen"
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

            <div className="timer-details">
                <p className="timer-description">{getTimerDescription()}</p>
                <div className="timer-progress">
                    <div
                        className="progress-fill"
                        style={{ width: `${calculateProgress()}%` }}
                    ></div>
                </div>
                <div className="time-remaining">{formatTime(timeRemaining)}</div>
            </div>
        </div>
    );
};

// Formular zum Erstellen/Bearbeiten von Timern
const TimerForm = ({ timer, onSave, onCancel, lights }) => {
    const [formData, setFormData] = useState(
        timer || {
            name: 'Neuer Timer',
            type: TIMER_TYPES.OFF,
            duration: 30,
            lightIds: [],
            interval: 30, // Nur für zyklische Timer
            startTime: Date.now()
        }
    );

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Numerischen Wert ändern
    const handleNumberChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    // Lampe zur Auswahl hinzufügen/entfernen
    const toggleLight = (lightId) => {
        setFormData(prev => {
            const lightIds = [...prev.lightIds];
            const index = lightIds.indexOf(lightId);

            if (index >= 0) {
                // Lampe entfernen
                lightIds.splice(index, 1);
            } else {
                // Lampe hinzufügen
                lightIds.push(lightId);
            }

            return { ...prev, lightIds };
        });
    };

    // Voreinstellung auswählen
    const selectPreset = (minutes) => {
        setFormData(prev => ({ ...prev, duration: minutes }));
    };

    // Alle Lampen auswählen
    const selectAllLights = () => {
        setFormData(prev => ({ ...prev, lightIds: Object.keys(lights) }));
    };

    // Keine Lampen auswählen
    const clearLightSelection = () => {
        setFormData(prev => ({ ...prev, lightIds: [] }));
    };

    // Formular absenden
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validierung
        if (formData.lightIds.length === 0) {
            alert('Bitte wähle mindestens eine Lampe aus.');
            return;
        }

        onSave({
            ...formData,
            startTime: Date.now() // Timer startet zum aktuellen Zeitpunkt
        });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{timer ? 'Timer bearbeiten' : 'Neuer Timer'}</h2>
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
                            placeholder="Timername"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="type">Timer-Typ</label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                        >
                            <option value={TIMER_TYPES.OFF}>Ausschalten nach Zeit</option>
                            <option value={TIMER_TYPES.ON}>Einschalten nach Zeit</option>
                            <option value={TIMER_TYPES.CYCLE}>Zyklisches Ein-/Ausschalten</option>
                        </select>
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
                                    value={formData.duration}
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
                                        onClick={() => selectPreset(preset)}
                                    >
                                        {preset}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {formData.type === TIMER_TYPES.CYCLE && (
                        <div className="form-group">
                            <label htmlFor="interval">Intervall (Minuten)</label>
                            <input
                                type="number"
                                id="interval"
                                min="1"
                                max="120"
                                value={formData.interval}
                                onChange={(e) => handleNumberChange('interval', e.target.value)}
                                required
                            />
                            <p className="form-hint">Zeitintervall zwischen Ein- und Ausschalten.</p>
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
                                            checked={formData.lightIds.includes(id)}
                                            onChange={() => toggleLight(id)}
                                        />
                                        {light.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="secondary-button">Abbrechen</button>
                        <button type="submit">Timer starten</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Hauptkomponente für die Timer-Steuerung
const TimerControlView = ({ lights, username, bridgeIP }) => {
    const [timers, setTimers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingTimer, setEditingTimer] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });

    // Lade gespeicherte Timer beim ersten Rendern
    useEffect(() => {
        loadTimers();

        // Timer-Intervall zum Ausführen der Timer-Aktionen
        const interval = setInterval(executeTimerActions, 1000);

        return () => clearInterval(interval);
    }, []);

    // Lade gespeicherte Timer aus dem LocalStorage
    const loadTimers = () => {
        try {
            const savedTimers = localStorage.getItem('hue-timers');
            if (savedTimers) {
                setTimers(JSON.parse(savedTimers));
            }
        } catch (error) {
            console.error("Fehler beim Laden der Timer:", error);
            setStatusMessage({
                message: "Timer konnten nicht geladen werden: " + error.message,
                type: "error"
            });
        }
    };

    // Speichere Timer im LocalStorage
    const saveTimers = (updatedTimers) => {
        try {
            localStorage.setItem('hue-timers', JSON.stringify(updatedTimers));
        } catch (error) {
            console.error("Fehler beim Speichern der Timer:", error);
            setStatusMessage({
                message: "Timer konnten nicht gespeichert werden: " + error.message,
                type: "error"
            });
        }
    };

    // Führe Aktionen für fällige Timer aus
    const executeTimerActions = () => {
        if (timers.length === 0) return;

        const currentTime = Date.now();
        const updatedTimers = [...timers];
        let timerExecuted = false;

        for (let i = 0; i < updatedTimers.length; i++) {
            const timer = updatedTimers[i];
            const endTime = timer.startTime + (timer.duration * 60 * 1000);

            // Prüfe, ob Timer abgelaufen ist
            if (!timer.executed && currentTime >= endTime) {
                // Führe Timer-Aktion aus
                executeTimerAction(timer);

                // Markiere als ausgeführt oder entferne bei Nicht-Zyklen
                if (timer.type === TIMER_TYPES.CYCLE) {
                    // Bei zyklischen Timern: Setze neuen Startzeitpunkt
                    updatedTimers[i] = {
                        ...timer,
                        startTime: currentTime,
                        state: !timer.state // Wechsle zwischen Ein/Aus
                    };
                } else {
                    // Bei einmaligen Timern: Als ausgeführt markieren
                    updatedTimers[i] = {
                        ...timer,
                        executed: true
                    };
                }

                timerExecuted = true;
            }
        }

        // Timer entfernen, die ausgeführt wurden und nicht zyklisch sind
        const remainingTimers = updatedTimers.filter(timer =>
            timer.type === TIMER_TYPES.CYCLE || !timer.executed);

        if (timerExecuted) {
            setTimers(remainingTimers);
            saveTimers(remainingTimers);
        }
    };

    // Führe eine Timer-Aktion aus
    const executeTimerAction = async (timer) => {
        try {
            // Bestimme den neuen Zustand der Lampen
            let newState;

            switch (timer.type) {
                case TIMER_TYPES.ON:
                    newState = { on: true };
                    break;
                case TIMER_TYPES.OFF:
                    newState = { on: false };
                    break;
                case TIMER_TYPES.CYCLE:
                    // Wechsle zwischen Ein und Aus
                    newState = { on: !timer.state };
                    break;
                default:
                    newState = { on: false };
            }

            // Wende den Zustand auf alle ausgewählten Lampen an
            for (const lightId of timer.lightIds) {
                await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newState)
                });
            }

            console.log(`Timer "${timer.name}" ausgeführt:`, newState);

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

    // Neuen Timer erstellen
    const createTimer = () => {
        setEditingTimer(null);
        setShowForm(true);
    };

    // Timer bearbeiten
    const editTimer = (timerId) => {
        const timer = timers.find(t => t.id === timerId);
        if (timer) {
            setEditingTimer(timer);
            setShowForm(true);
        }
    };

    // Timer abbrechen
    const cancelTimer = (timerId) => {
        if (window.confirm("Möchtest du diesen Timer wirklich abbrechen?")) {
            const updatedTimers = timers.filter(t => t.id !== timerId);
            setTimers(updatedTimers);
            saveTimers(updatedTimers);
        }
    };

    // Timer speichern
    const saveTimer = (timerData) => {
        if (editingTimer) {
            // Bestehenden Timer aktualisieren
            const updatedTimers = timers.map(t =>
                t.id === editingTimer.id ? { ...timerData, id: t.id } : t
            );
            setTimers(updatedTimers);
            saveTimers(updatedTimers);
        } else {
            // Neuen Timer erstellen
            const newTimer = {
                ...timerData,
                id: Date.now().toString(),
                state: timerData.type === TIMER_TYPES.CYCLE ? true : undefined,
                executed: false
            };
            const updatedTimers = [...timers, newTimer];
            setTimers(updatedTimers);
            saveTimers(updatedTimers);
        }

        setShowForm(false);
        setEditingTimer(null);
    };

    return (
        <div className="timer-control-view">
            <div className="timer-header">
                <h2 className="section-title">Timer-Steuerung</h2>
                <button onClick={createTimer}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Neuer Timer
                </button>
            </div>

            {statusMessage.message && (
                <div className={`status-message status-${statusMessage.type}`}>
                    {statusMessage.message}
                </div>
            )}

            <div className="timers-container">
                {timers.length === 0 ? (
                    <div className="empty-state">
                        <p>Keine aktiven Timer. Erstelle einen neuen Timer, um Lichter automatisch zu steuern.</p>
                        <button onClick={createTimer}>Timer erstellen</button>
                    </div>
                ) : (
                    <div className="timer-list">
                        {timers.map(timer => (
                            <TimerCard
                                key={timer.id}
                                timer={timer}
                                onCancel={cancelTimer}
                                onEdit={editTimer}
                                lights={lights}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <TimerForm
                    timer={editingTimer}
                    onSave={saveTimer}
                    onCancel={() => setShowForm(false)}
                    lights={lights}
                />
            )}
        </div>
    );
};

export default TimerControlView;