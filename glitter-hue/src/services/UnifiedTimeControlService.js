// src/services/UnifiedTimeControlService.js - Kombiniert alle Arten von Zeitsteuerungen

/**
 * Zeitsteuerungstypen - kombiniert von TimeControlService und EnhancedAutomationView
 */
export const TIME_CONTROL_TYPES = {
    // Bridge-verwaltete Zeitpläne
    FIXED_SCHEDULE: 'fixed_schedule',      // Feste Zeit (wöchentlich)
    SUNRISE_SCHEDULE: 'sunrise_schedule',  // Sonnenaufgangsbasiert
    SUNSET_SCHEDULE: 'sunset_schedule',    // Sonnenuntergangsbasiert

    // Lokal verwaltete Timer
    COUNTDOWN_ON: 'countdown_on',          // Einschalten nach Zeit
    COUNTDOWN_OFF: 'countdown_off',        // Ausschalten nach Zeit
    CYCLE: 'cycle',                        // Zyklisches Ein-/Ausschalten

    // Erweiterte Automatisierungen
    WAKE_UP: 'wake-up',                    // Lichtwecker
    PRESENCE: 'presence',                  // Anwesenheitssimulation
    SLEEP: 'sleep',                        // Einschlafmodus
    GEO_FENCE: 'geo-fence'                 // Standortbasiert
};

/**
 * Standardeinstellungen für verschiedene Automatisierungstypen
 */
export const DEFAULT_SETTINGS = {
    [TIME_CONTROL_TYPES.WAKE_UP]: {
        name: 'Lichtwecker',
        time: '07:00',
        days: [1, 2, 3, 4, 5], // Mo-Fr
        duration: 30, // Dauer in Minuten
        targetBrightness: 254,
        targetColor: 'warm',
        enabled: true
    },
    [TIME_CONTROL_TYPES.PRESENCE]: {
        name: 'Anwesenheitssimulation',
        active: {
            start: '18:00',
            end: '23:00'
        },
        rooms: [],
        randomness: 60, // 0-100%
        enabled: true
    },
    [TIME_CONTROL_TYPES.SLEEP]: {
        name: 'Einschlafmodus',
        time: '22:30',
        days: [0, 1, 2, 3, 4, 5, 6], // Täglich
        duration: 15, // Dauer in Minuten
        enabled: true
    },
    [TIME_CONTROL_TYPES.GEO_FENCE]: {
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

/**
 * Integrierter Service für alle Zeitsteuerungen in GlitterHue
 */
export default class UnifiedTimeControlService {
    constructor(bridgeIP, username) {
        this.bridgeIP = bridgeIP;
        this.username = username;
        this.apiBaseUrl = `http://${bridgeIP}/api/${username}`;
        this.localTimerInterval = null;
        this.localTimers = [];
        this.automations = [];
        this.sunTimes = { sunrise: '06:00', sunset: '18:00' };
        this.onTimerExecute = null; // Callback für Timer-Aktionen
        this.onAutomationExecute = null; // Callback für Automatisierungs-Aktionen
    }

    /**
     * Initialisiert den Service und lädt alle Zeitsteuerungen
     */
    async initialize(onTimerExecute, onAutomationExecute, coordinates = { lat: 50.1, lng: 8.6 }) {
        this.onTimerExecute = onTimerExecute;
        this.onAutomationExecute = onAutomationExecute;

        // Berechne Sonnenzeiten
        this.calculateSunTimes(coordinates.lat, coordinates.lng);

        // Lokale Timer laden
        this.loadLocalTimers();

        // Automatisierungen laden
        this.loadAutomations();

        // Timer-Intervall starten
        if (this.localTimerInterval) {
            clearInterval(this.localTimerInterval);
        }
        this.localTimerInterval = setInterval(() => this.processLocalTimers(), 1000);

        // Bridge-Zeitpläne laden und mit lokalen Timern und Automatisierungen kombinieren
        const schedules = await this.getBridgeSchedules();
        return [...schedules, ...this.localTimers, ...this.automations];
    }

    /**
     * Beendet den Service und stoppt alle Timer
     */
    dispose() {
        if (this.localTimerInterval) {
            clearInterval(this.localTimerInterval);
            this.localTimerInterval = null;
        }
    }

    /**
     * Lädt alle Zeitsteuerungen (Bridge-Zeitpläne, lokale Timer und erweiterte Automatisierungen)
     */
    async getAllTimeControls() {
        const bridgeSchedules = await this.getBridgeSchedules();
        return [...bridgeSchedules, ...this.localTimers, ...this.automations];
    }

    /**
     * Berechnet Sonnenauf- und -untergangszeiten für bestimmte Koordinaten
     */
    calculateSunTimes(lat, lng) {
        // In einer echten App würde hier eine sonnenzeitberechnende Bibliothek verwendet
        // Hier für Demo: Beispiel-Berechnung basierend auf aktuellem Datum
        const now = new Date();
        const season = Math.sin((now.getMonth() + 9) / 12 * Math.PI);

        // Grobe Simulation der Jahreszeiten
        const sunriseHour = 7 - Math.round(season * 2);
        const sunsetHour = 17 + Math.round(season * 2);

        this.sunTimes = {
            sunrise: `${sunriseHour.toString().padStart(2, '0')}:${Math.round(Math.random() * 59).toString().padStart(2, '0')}`,
            sunset: `${sunsetHour.toString().padStart(2, '0')}:${Math.round(Math.random() * 59).toString().padStart(2, '0')}`
        };

        return this.sunTimes;
    }

    /**
     * Lädt alle Zeitpläne von der Bridge
     */
    async getBridgeSchedules() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/schedules`);
            if (!response.ok) {
                throw new Error(`HTTP Fehler: ${response.status}`);
            }
            const schedules = await response.json();
            return this.formatBridgeSchedulesToApp(schedules);
        } catch (error) {
            console.error("Fehler beim Laden der Zeitpläne:", error);
            throw error;
        }
    }

    /**
     * Erstellt eine neue Zeitsteuerung
     */
    async createTimeControl(timeControl) {
        // Unterscheide zwischen verschiedenen Typen
        if (this.isBridgeScheduleType(timeControl.type)) {
            return await this.createBridgeSchedule(timeControl);
        } else if (this.isLocalTimerType(timeControl.type)) {
            return this.createLocalTimer(timeControl);
        } else if (this.isAdvancedAutomationType(timeControl.type)) {
            return this.createAutomation(timeControl);
        }
    }

    /**
     * Aktualisiert eine bestehende Zeitsteuerung
     */
    async updateTimeControl(id, timeControl) {
        if (this.isBridgeScheduleType(timeControl.type)) {
            return await this.updateBridgeSchedule(id, timeControl);
        } else if (this.isLocalTimerType(timeControl.type)) {
            return this.updateLocalTimer(id, timeControl);
        } else if (this.isAdvancedAutomationType(timeControl.type)) {
            return this.updateAutomation(id, timeControl);
        }
    }

    /**
     * Löscht eine Zeitsteuerung
     */
    async deleteTimeControl(id, type) {
        if (this.isBridgeScheduleType(type)) {
            return await this.deleteBridgeSchedule(id);
        } else if (this.isLocalTimerType(type)) {
            return this.deleteLocalTimer(id);
        } else if (this.isAdvancedAutomationType(type)) {
            return this.deleteAutomation(id);
        }
    }

    /**
     * Aktiviert oder deaktiviert eine Zeitsteuerung
     */
    async setTimeControlStatus(id, type, enabled) {
        if (this.isBridgeScheduleType(type)) {
            return await this.setBridgeScheduleStatus(id, enabled);
        } else if (this.isLocalTimerType(type)) {
            return this.setLocalTimerStatus(id, enabled);
        } else if (this.isAdvancedAutomationType(type)) {
            return this.setAutomationStatus(id, enabled);
        }
    }

    /**
     * Prüft, ob ein Zeitsteuerungstyp ein Bridge-Zeitplan ist
     */
    isBridgeScheduleType(type) {
        return [
            TIME_CONTROL_TYPES.FIXED_SCHEDULE,
            TIME_CONTROL_TYPES.SUNRISE_SCHEDULE,
            TIME_CONTROL_TYPES.SUNSET_SCHEDULE
        ].includes(type);
    }

    /**
     * Prüft, ob ein Zeitsteuerungstyp ein lokaler Timer ist
     */
    isLocalTimerType(type) {
        return [
            TIME_CONTROL_TYPES.COUNTDOWN_ON,
            TIME_CONTROL_TYPES.COUNTDOWN_OFF,
            TIME_CONTROL_TYPES.CYCLE
        ].includes(type);
    }

    /**
     * Prüft, ob ein Zeitsteuerungstyp eine erweiterte Automatisierung ist
     */
    isAdvancedAutomationType(type) {
        return [
            TIME_CONTROL_TYPES.WAKE_UP,
            TIME_CONTROL_TYPES.PRESENCE,
            TIME_CONTROL_TYPES.SLEEP,
            TIME_CONTROL_TYPES.GEO_FENCE
        ].includes(type);
    }

    /*****************************************************************************
     * Bridge-Zeitplan-Funktionen
     *****************************************************************************/

    // [... alle Bridge-Zeitplan Funktionen aus dem original TimeControlService ...]

    /*****************************************************************************
     * Lokale Timer-Funktionen
     *****************************************************************************/

    /**
     * Lädt lokale Timer aus dem localStorage
     */
    loadLocalTimers() {
        try {
            const savedTimers = localStorage.getItem('hue-timers');
            if (savedTimers) {
                this.localTimers = JSON.parse(savedTimers).map(timer => ({
                    ...timer,
                    managed: 'local'
                }));
            }
        } catch (error) {
            console.error("Fehler beim Laden der lokalen Timer:", error);
            this.localTimers = [];
        }
    }

    /**
     * Speichert lokale Timer im localStorage
     */
    saveLocalTimers() {
        try {
            const timersToSave = this.localTimers.map(({ managed, ...timer }) => timer);
            localStorage.setItem('hue-timers', JSON.stringify(timersToSave));
        } catch (error) {
            console.error("Fehler beim Speichern der lokalen Timer:", error);
        }
    }

    // [... restliche lokale Timer Funktionen aus dem original TimeControlService ...]

    /*****************************************************************************
     * Erweiterte Automatisierungs-Funktionen
     *****************************************************************************/

    /**
     * Lädt Automatisierungen aus dem localStorage
     */
    loadAutomations() {
        try {
            const savedAutomations = localStorage.getItem('hue-automations');
            if (savedAutomations) {
                this.automations = JSON.parse(savedAutomations).map(automation => ({
                    ...automation,
                    managed: 'automation'
                }));
            } else {
                // Demo-Automatisierungen wenn keine vorhanden sind
                this.automations = [];
            }
        } catch (error) {
            console.error("Fehler beim Laden der Automatisierungen:", error);
            this.automations = [];
        }
    }

    /**
     * Speichert Automatisierungen im localStorage
     */
    saveAutomations() {
        try {
            const automationsToSave = this.automations.map(({ managed, ...automation }) => automation);
            localStorage.setItem('hue-automations', JSON.stringify(automationsToSave));
        } catch (error) {
            console.error("Fehler beim Speichern der Automatisierungen:", error);
        }
    }

    /**
     * Erstellt eine neue Automatisierung
     */
    createAutomation(automation) {
        const newAutomation = {
            ...automation,
            id: Date.now().toString(),
            managed: 'automation',
            created: Date.now()
        };

        this.automations.push(newAutomation);
        this.saveAutomations();

        return newAutomation.id;
    }

    /**
     * Aktualisiert eine bestehende Automatisierung
     */
    updateAutomation(id, automation) {
        const index = this.automations.findIndex(a => a.id === id);
        if (index === -1) {
            throw new Error(`Automatisierung mit ID ${id} nicht gefunden`);
        }

        this.automations[index] = {
            ...automation,
            id,
            managed: 'automation',
            modified: Date.now()
        };

        this.saveAutomations();
        return true;
    }

    /**
     * Löscht eine Automatisierung
     */
    deleteAutomation(id) {
        const index = this.automations.findIndex(a => a.id === id);
        if (index === -1) {
            throw new Error(`Automatisierung mit ID ${id} nicht gefunden`);
        }

        this.automations.splice(index, 1);
        this.saveAutomations();

        return true;
    }

    /**
     * Aktiviert oder deaktiviert eine Automatisierung
     */
    setAutomationStatus(id, enabled) {
        const index = this.automations.findIndex(a => a.id === id);
        if (index === -1) {
            throw new Error(`Automatisierung mit ID ${id} nicht gefunden`);
        }

        this.automations[index].enabled = enabled;
        this.saveAutomations();

        return true;
    }

    /**
     * Verarbeitet automatisierte Aktionen (wird regelmäßig aufgerufen)
     * Implementierung für fortgeschrittenere Automatisierungen
     */
    processAutomations() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // Format: "HH:MM"
        const currentDay = now.getDay(); // 0 = Sonntag, 1 = Montag, ...

        // Für jede Automatisierung prüfen
        for (const automation of this.automations) {
            if (!automation.enabled) continue;

            switch (automation.type) {
                case TIME_CONTROL_TYPES.WAKE_UP:
                    this.processWakeUpAutomation(automation, currentTime, currentDay);
                    break;
                case TIME_CONTROL_TYPES.SLEEP:
                    this.processSleepAutomation(automation, currentTime, currentDay);
                    break;
                case TIME_CONTROL_TYPES.PRESENCE:
                    this.processPresenceAutomation(automation);
                    break;
                // Weitere Typen können hier hinzugefügt werden
            }
        }
    }

    /**
     * Verarbeitet Lichtwecker-Automatisierung
     */
    processWakeUpAutomation(automation, currentTime, currentDay) {
        // Prüfe, ob die Automatisierung heute ausgeführt werden soll
        if (!automation.days.includes(currentDay)) return;

        // Berechne Start- und Endzeit für den Weckvorgang
        const wakeUpTime = automation.time;

        // Konvertiere Zeiten in Minuten seit Mitternacht für einfacheren Vergleich
        const currentMinutes = this.timeStringToMinutes(currentTime);
        const wakeUpMinutes = this.timeStringToMinutes(wakeUpTime);
        const startMinutes = wakeUpMinutes - automation.duration;

        // Prüfe, ob wir innerhalb des Weckzeitraums sind
        if (currentMinutes >= startMinutes && currentMinutes <= wakeUpMinutes) {
            // Bestimme Fortschritt (0-1)
            const progress = (currentMinutes - startMinutes) / automation.duration;

            // Berechne aktuelle Helligkeit basierend auf Fortschritt
            const currentBrightness = Math.round(progress * automation.targetBrightness);

            // Führe Aktion aus, wenn Callback definiert
            if (this.onAutomationExecute) {
                this.onAutomationExecute(automation, {
                    on: true,
                    bri: currentBrightness,
                    // Farbe entsprechend der Einstellung bestimmen
                    ...this.getColorForWakeUp(automation.targetColor, progress)
                });
            }
        }
    }

    /**
     * Verarbeitet Einschlaf-Automatisierung
     */
    processSleepAutomation(automation, currentTime, currentDay) {
        // Ähnliche Implementierung wie für den Lichtwecker, aber mit abnehmender Helligkeit
    }

    /**
     * Verarbeitet Anwesenheitssimulation
     */
    processPresenceAutomation(automation) {
        // Komplexere Implementierung für zufällige Lichtmuster
    }

    /**
     * Hilfsfunktion zur Konvertierung einer Zeitzeichenkette in Minuten seit Mitternacht
     */
    timeStringToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Bestimmt Farbparameter für den Lichtwecker basierend auf Farbeinstellung und Fortschritt
     */
    getColorForWakeUp(colorType, progress) {
        switch (colorType) {
            case 'warm':
                return {
                    ct: 500 - Math.round(progress * 150) // Von sehr warm (500) zu warm (350)
                };
            case 'morning':
                return {
                    ct: 450 - Math.round(progress * 250) // Von warm (450) zu neutral (200)
                };
            case 'neutral':
                return {
                    ct: 350 - Math.round(progress * 200) // Von warm (350) zu neutral (150)
                };
            case 'daylight':
                return {
                    ct: 300 - Math.round(progress * 200) // Von warm (300) zu kalt (100)
                };
            case 'energize':
                // Blauton für "energetisierend"
                if (progress < 0.5) {
                    return {
                        hue: 43000, // Blauton
                        sat: Math.round(progress * 2 * 254) // Zunehmendes Blau
                    };
                } else {
                    return {
                        hue: 43000,
                        sat: 254
                    };
                }
            default:
                return {
                    ct: 350 - Math.round(progress * 200)
                };
        }
    }

    /**
     * Verarbeitet lokale Timer (wird periodisch aufgerufen)
     */
    processLocalTimers() {
        if (this.localTimers.length === 0) return;

        const currentTime = Date.now();
        let timerExecuted = false;

        for (let i = 0; i < this.localTimers.length; i++) {
            const timer = this.localTimers[i];

            // Nur aktivierte und nicht bereits ausgeführte Timer verarbeiten
            if (!timer.enabled || timer.executed) continue;

            const endTime = timer.startTime + (timer.duration * 60 * 1000);

            // Prüfe, ob Timer abgelaufen ist
            if (currentTime >= endTime) {
                // Führe Timer-Aktion aus
                if (this.onTimerExecute) {
                    this.executeLocalTimer(timer);
                }

                // Markiere als ausgeführt oder starte neu bei zyklischen Timern
                if (timer.type === TIME_CONTROL_TYPES.CYCLE) {
                    // Bei zyklischen Timern: Setze neuen Startzeitpunkt
                    this.localTimers[i] = {
                        ...timer,
                        startTime: currentTime,
                        state: !timer.state // Wechsle zwischen Ein/Aus
                    };
                } else {
                    // Bei einmaligen Timern: Als ausgeführt markieren
                    this.localTimers[i] = {
                        ...timer,
                        executed: true
                    };
                }

                timerExecuted = true;
            }
        }

        // Timer entfernen, die ausgeführt wurden und nicht zyklisch sind
        if (timerExecuted) {
            this.localTimers = this.localTimers.filter(timer =>
                timer.type === TIME_CONTROL_TYPES.CYCLE || !timer.executed);
            this.saveLocalTimers();
        }
    }

    /**
     * Führt einen lokalen Timer aus (sendet Befehle an die Bridge)
     */
    async executeLocalTimer(timer) {
        try {
            // Bestimme den neuen Zustand der Lampen
            let newState;

            switch (timer.type) {
                case TIME_CONTROL_TYPES.COUNTDOWN_ON:
                    newState = { on: true };
                    break;
                case TIME_CONTROL_TYPES.COUNTDOWN_OFF:
                    newState = { on: false };
                    break;
                case TIME_CONTROL_TYPES.CYCLE:
                    // Wechsle zwischen Ein und Aus
                    newState = { on: !timer.state };
                    break;
                default:
                    newState = { on: false };
            }

            // Rufe den Callback mit den Timer-Aktionen auf
            if (this.onTimerExecute) {
                this.onTimerExecute(timer, newState);
            }

            // Wende die Aktion direkt an, wenn keine Callback-Funktion definiert ist
            else {
                for (const lightId of timer.lightIds) {
                    await fetch(`${this.apiBaseUrl}/lights/${lightId}/state`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newState)
                    });
                }
            }

            return true;
        } catch (error) {
            console.error("Fehler beim Ausführen des Timers:", error);
            return false;
        }
    }
}