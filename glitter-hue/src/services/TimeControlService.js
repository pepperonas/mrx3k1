// src/services/TimeControlService.js - Einheitlicher Service für alle Zeitsteuerungen
// Kombiniert Zeitpläne (Bridge-basiert) und Timer (lokal)

/**
 * Zeitsteuerungstypen
 */
export const TIME_CONTROL_TYPES = {
    // Bridge-verwaltete Zeitpläne
    FIXED_SCHEDULE: 'fixed_schedule',    // Feste Zeit (wöchentlich)
    SUNRISE_SCHEDULE: 'sunrise_schedule', // Sonnenaufgangsbasiert
    SUNSET_SCHEDULE: 'sunset_schedule',   // Sonnenuntergangsbasiert

    // Lokal verwaltete Timer
    COUNTDOWN_ON: 'countdown_on',       // Einschalten nach Zeit
    COUNTDOWN_OFF: 'countdown_off',     // Ausschalten nach Zeit
    CYCLE: 'cycle'                      // Zyklisches Ein-/Ausschalten
};

/**
 * Integrierter Service für alle Zeitsteuerungen in GlitterHue
 */
export default class TimeControlService {
    constructor(bridgeIP, username) {
        this.bridgeIP = bridgeIP;
        this.username = username;
        this.apiBaseUrl = `http://${bridgeIP}/api/${username}`;
        this.localTimerInterval = null;
        this.localTimers = [];
        this.onTimerExecute = null; // Callback für Timer-Aktionen
    }

    /**
     * Initialisiert den Service und lädt alle Zeitsteuerungen
     */
    async initialize(onTimerExecute) {
        this.onTimerExecute = onTimerExecute;

        // Lokale Timer laden
        this.loadLocalTimers();

        // Timer-Intervall starten
        if (this.localTimerInterval) {
            clearInterval(this.localTimerInterval);
        }
        this.localTimerInterval = setInterval(() => this.processLocalTimers(), 1000);

        // Bridge-Zeitpläne laden und mit lokalen Timern kombinieren
        const schedules = await this.getBridgeSchedules();
        return [...schedules, ...this.localTimers];
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
     * Lädt alle Zeitsteuerungen (Bridge-Zeitpläne und lokale Timer)
     */
    async getAllTimeControls() {
        const bridgeSchedules = await this.getBridgeSchedules();
        return [...bridgeSchedules, ...this.localTimers];
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
        // Unterscheide zwischen Bridge-Zeitplänen und lokalen Timern
        if (this.isBridgeScheduleType(timeControl.type)) {
            return await this.createBridgeSchedule(timeControl);
        } else {
            return this.createLocalTimer(timeControl);
        }
    }

    /**
     * Aktualisiert eine bestehende Zeitsteuerung
     */
    async updateTimeControl(id, timeControl) {
        if (this.isBridgeScheduleType(timeControl.type)) {
            return await this.updateBridgeSchedule(id, timeControl);
        } else {
            return this.updateLocalTimer(id, timeControl);
        }
    }

    /**
     * Löscht eine Zeitsteuerung
     */
    async deleteTimeControl(id, type) {
        if (this.isBridgeScheduleType(type)) {
            return await this.deleteBridgeSchedule(id);
        } else {
            return this.deleteLocalTimer(id);
        }
    }

    /**
     * Aktiviert oder deaktiviert eine Zeitsteuerung
     */
    async setTimeControlStatus(id, type, enabled) {
        if (this.isBridgeScheduleType(type)) {
            return await this.setBridgeScheduleStatus(id, enabled);
        } else {
            return this.setLocalTimerStatus(id, enabled);
        }
    }

    /*****************************************************************************
     * Bridge-Zeitplan-Funktionen
     *****************************************************************************/

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
     * Erstellt einen neuen Zeitplan auf der Bridge
     */
    async createBridgeSchedule(schedule) {
        try {
            const bridgeSchedule = this.formatAppScheduleToBridge(schedule);

            const response = await fetch(`${this.apiBaseUrl}/schedules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bridgeSchedule)
            });

            if (!response.ok) {
                throw new Error(`HTTP Fehler: ${response.status}`);
            }

            const result = await response.json();
            if (result[0] && result[0].success) {
                return result[0].success.id;
            } else {
                throw new Error("Unbekannter Fehler beim Erstellen des Zeitplans");
            }
        } catch (error) {
            console.error("Fehler beim Erstellen des Zeitplans:", error);
            throw error;
        }
    }

    /**
     * Aktualisiert einen bestehenden Zeitplan auf der Bridge
     */
    async updateBridgeSchedule(id, schedule) {
        try {
            const bridgeSchedule = this.formatAppScheduleToBridge(schedule);

            // Die ID sollte nicht im Body der Anfrage enthalten sein
            delete bridgeSchedule.id;

            const response = await fetch(`${this.apiBaseUrl}/schedules/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bridgeSchedule)
            });

            if (!response.ok) {
                throw new Error(`HTTP Fehler: ${response.status}`);
            }

            const result = await response.json();
            if (result[0] && result[0].success) {
                return true;
            } else {
                throw new Error("Unbekannter Fehler beim Aktualisieren des Zeitplans");
            }
        } catch (error) {
            console.error("Fehler beim Aktualisieren des Zeitplans:", error);
            throw error;
        }
    }

    /**
     * Löscht einen Zeitplan von der Bridge
     */
    async deleteBridgeSchedule(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/schedules/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP Fehler: ${response.status}`);
            }

            const result = await response.json();
            if (result[0] && result[0].success) {
                return true;
            } else {
                throw new Error("Unbekannter Fehler beim Löschen des Zeitplans");
            }
        } catch (error) {
            console.error("Fehler beim Löschen des Zeitplans:", error);
            throw error;
        }
    }

    /**
     * Aktiviert oder deaktiviert einen Zeitplan
     */
    async setBridgeScheduleStatus(id, enabled) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/schedules/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: enabled ? "enabled" : "disabled" })
            });

            if (!response.ok) {
                throw new Error(`HTTP Fehler: ${response.status}`);
            }

            const result = await response.json();
            if (result[0] && result[0].success) {
                return true;
            } else {
                throw new Error("Unbekannter Fehler beim Ändern des Zeitplanstatus");
            }
        } catch (error) {
            console.error("Fehler beim Ändern des Zeitplanstatus:", error);
            throw error;
        }
    }

    /**
     * Konvertiert Zeitpläne vom Bridge-Format ins App-Format
     */
    formatBridgeSchedulesToApp(bridgeSchedules) {
        return Object.entries(bridgeSchedules).map(([id, schedule]) => {
            // Nur rekurrierende Zeitpläne betrachten
            if (!schedule.localtime) return null;

            let type = TIME_CONTROL_TYPES.FIXED_SCHEDULE;
            let days = [];
            let time = null;
            let offset = 0;

            // Bestimme den Typ basierend auf dem localtime-Format
            if (schedule.localtime.startsWith('W') && schedule.localtime.includes('/T')) {
                // Fester Zeitplan (wöchentlich)
                type = TIME_CONTROL_TYPES.FIXED_SCHEDULE;

                // Extrahere Wochentage und Zeit
                const parts = schedule.localtime.split('/T');
                const weekDaysCode = parts[0].substring(1); // "124"
                const timeString = parts[1]; // "07:30:00"

                // Wochentage dekodieren (1=Mo, 2=Di, 4=Mi, 8=Do, 16=Fr, 32=Sa, 64=So)
                const weekDaysBitmap = parseInt(weekDaysCode, 10);
                const weekDaysMap = [64, 1, 2, 4, 8, 16, 32]; // [So, Mo, Di, Mi, Do, Fr, Sa]

                for (let i = 0; i < 7; i++) {
                    if (weekDaysBitmap & weekDaysMap[i]) {
                        days.push(i); // 0=So, 1=Mo, usw.
                    }
                }

                time = timeString.substring(0, 5); // "07:30"
            } else if (schedule.localtime.startsWith('A')) {
                // Sonnenaufgang-basiert
                type = TIME_CONTROL_TYPES.SUNRISE_SCHEDULE;

                // Extrahere Offset
                const offsetStr = schedule.localtime.substring(1);
                if (offsetStr.startsWith('-')) {
                    const timeParts = offsetStr.substring(1).split(':').map(Number);
                    offset = -(timeParts[0] * 60 + timeParts[1]);
                } else if (offsetStr.startsWith('+')) {
                    const timeParts = offsetStr.substring(1).split(':').map(Number);
                    offset = timeParts[0] * 60 + timeParts[1];
                }

                // Bei sonnenbasierten Zeitplänen keine Wochentage extrahieren
                days = [0, 1, 2, 3, 4, 5, 6]; // Täglich
            } else if (schedule.localtime.startsWith('P')) {
                // Sonnenuntergang-basiert
                type = TIME_CONTROL_TYPES.SUNSET_SCHEDULE;

                // Extrahere Offset
                const offsetStr = schedule.localtime.substring(1);
                if (offsetStr.startsWith('-')) {
                    const timeParts = offsetStr.substring(1).split(':').map(Number);
                    offset = -(timeParts[0] * 60 + timeParts[1]);
                } else if (offsetStr.startsWith('+')) {
                    const timeParts = offsetStr.substring(1).split(':').map(Number);
                    offset = timeParts[0] * 60 + timeParts[1];
                }

                // Bei sonnenbasierten Zeitplänen keine Wochentage extrahieren
                days = [0, 1, 2, 3, 4, 5, 6]; // Täglich
            } else {
                // Unbekanntes Format, überspringen
                return null;
            }

            // Aktionen aus dem command extrahieren
            const actions = this.extractActionsFromCommand(schedule.command);

            // Zeitplan im App-Format zurückgeben
            return {
                id,
                name: schedule.name,
                type,
                managed: 'bridge',
                enabled: schedule.status === 'enabled',
                actions,
                schedule: {
                    time,
                    days,
                    offset
                },
                created: schedule.created ? new Date(schedule.created).getTime() : Date.now(),
                lastModified: schedule.lastmodified ? new Date(schedule.lastmodified).getTime() : Date.now()
            };
        }).filter(Boolean); // Nicht-null-Werte filtern
    }

    /**
     * Extrahiert Aktionen aus dem command-Objekt eines Zeitplans
     */
    extractActionsFromCommand(command) {
        if (!command) return [];

        const actions = [];
        const { address, body } = command;

        // Prüfen, ob es sich um eine Lichtsteuerung handelt
        if (address.includes('/lights/') && address.includes('/state')) {
            const lightIdMatch = address.match(/\/lights\/([^/]+)\/state/);
            if (lightIdMatch && lightIdMatch[1]) {
                actions.push({
                    type: 'light',
                    target: lightIdMatch[1],
                    state: body
                });
            }
        }
        // Prüfen, ob es sich um einen Gruppenbefehl handelt
        else if (address.includes('/groups/') && address.includes('/action')) {
            const groupIdMatch = address.match(/\/groups\/([^/]+)\/action/);
            if (groupIdMatch && groupIdMatch[1]) {
                actions.push({
                    type: 'group',
                    target: groupIdMatch[1],
                    state: body
                });
            }
        }
        // Prüfen, ob es sich um eine Szenenaktivierung handelt
        else if (body && body.scene) {
            actions.push({
                type: 'scene',
                target: body.scene,
                state: {}
            });
        }
        // Prüfen, ob es sich um einen CLIP-Sensor-Status handelt
        else if (address.includes('/sensors/') && address.includes('/state')) {
            const sensorIdMatch = address.match(/\/sensors\/([^/]+)\/state/);
            if (sensorIdMatch && sensorIdMatch[1]) {
                actions.push({
                    type: 'sensor',
                    target: sensorIdMatch[1],
                    state: body
                });
            }
        }

        return actions;
    }

    /**
     * Konvertiert einen Zeitplan vom App-Format ins Bridge-Format
     */
    formatAppScheduleToBridge(timeControl) {
        // localtime-Format erstellen
        let localtime;

        switch (timeControl.type) {
            case TIME_CONTROL_TYPES.SUNRISE_SCHEDULE:
                // Sonnenaufgang mit Offset
                const sunriseOffset = timeControl.schedule.offset || 0;
                const sunriseOffsetSign = sunriseOffset >= 0 ? '+' : '-';
                const sunriseOffsetHours = Math.floor(Math.abs(sunriseOffset) / 60);
                const sunriseOffsetMins = Math.abs(sunriseOffset) % 60;

                localtime = `A${sunriseOffsetSign}${sunriseOffsetHours.toString().padStart(2, '0')}:${sunriseOffsetMins.toString().padStart(2, '0')}:00`;
                break;

            case TIME_CONTROL_TYPES.SUNSET_SCHEDULE:
                // Sonnenuntergang mit Offset
                const sunsetOffset = timeControl.schedule.offset || 0;
                const sunsetOffsetSign = sunsetOffset >= 0 ? '+' : '-';
                const sunsetOffsetHours = Math.floor(Math.abs(sunsetOffset) / 60);
                const sunsetOffsetMins = Math.abs(sunsetOffset) % 60;

                localtime = `P${sunsetOffsetSign}${sunsetOffsetHours.toString().padStart(2, '0')}:${sunsetOffsetMins.toString().padStart(2, '0')}:00`;
                break;

            case TIME_CONTROL_TYPES.FIXED_SCHEDULE:
            default:
                // Wöchentlicher Zeitplan mit Wochentagen und Uhrzeit
                // 1=Mo, 2=Di, 4=Mi, 8=Do, 16=Fr, 32=Sa, 64=So
                const weekDaysMap = [64, 1, 2, 4, 8, 16, 32]; // [So, Mo, Di, Mi, Do, Fr, Sa]
                let weekDaysBitmap = 0;

                for (const day of timeControl.schedule.days) {
                    weekDaysBitmap |= weekDaysMap[day];
                }

                const time = timeControl.schedule.time || '00:00';
                localtime = `W${weekDaysBitmap}/T${time}:00`;
        }

        // Command erstellen basierend auf den Aktionen
        let command = { address: '', body: {}, method: 'PUT' };

        if (timeControl.actions && timeControl.actions.length > 0) {
            const action = timeControl.actions[0]; // Wir nehmen die erste Aktion

            switch (action.type) {
                case 'light':
                    command.address = `/api/${this.username}/lights/${action.target}/state`;
                    command.body = action.state;
                    break;
                case 'group':
                    command.address = `/api/${this.username}/groups/${action.target}/action`;
                    command.body = action.state;
                    break;
                case 'scene':
                    command.address = `/api/${this.username}/groups/0/action`;
                    command.body = { scene: action.target };
                    break;
                case 'sensor':
                    command.address = `/api/${this.username}/sensors/${action.target}/state`;
                    command.body = action.state;
                    break;
                default:
                    console.warn("Unbekannter Aktionstyp:", action.type);
            }
        }

        // Zeitplan im Bridge-Format zurückgeben
        return {
            name: timeControl.name,
            description: "Recurring Schedule :: GlitterHue",
            command,
            localtime,
            status: timeControl.enabled ? "enabled" : "disabled",
            recycle: false
        };
    }

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

    /**
     * Erstellt einen neuen lokalen Timer
     */
    createLocalTimer(timer) {
        const newTimer = {
            ...timer,
            id: Date.now().toString(),
            managed: 'local',
            startTime: Date.now(),
            state: timer.type === TIME_CONTROL_TYPES.CYCLE ? true : undefined,
            executed: false
        };

        this.localTimers.push(newTimer);
        this.saveLocalTimers();

        return newTimer.id;
    }

    /**
     * Aktualisiert einen bestehenden lokalen Timer
     */
    updateLocalTimer(id, timer) {
        const index = this.localTimers.findIndex(t => t.id === id);
        if (index === -1) {
            throw new Error(`Timer mit ID ${id} nicht gefunden`);
        }

        this.localTimers[index] = {
            ...timer,
            id,
            managed: 'local',
            startTime: Date.now(),
            state: timer.type === TIME_CONTROL_TYPES.CYCLE ? true : undefined,
            executed: false
        };

        this.saveLocalTimers();
        return true;
    }

    /**
     * Löscht einen lokalen Timer
     */
    deleteLocalTimer(id) {
        const index = this.localTimers.findIndex(t => t.id === id);
        if (index === -1) {
            throw new Error(`Timer mit ID ${id} nicht gefunden`);
        }

        this.localTimers.splice(index, 1);
        this.saveLocalTimers();

        return true;
    }

    /**
     * Aktiviert oder deaktiviert einen lokalen Timer
     */
    setLocalTimerStatus(id, enabled) {
        const index = this.localTimers.findIndex(t => t.id === id);
        if (index === -1) {
            throw new Error(`Timer mit ID ${id} nicht gefunden`);
        }

        this.localTimers[index].enabled = enabled;
        this.saveLocalTimers();

        return true;
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