// src/services/HueApiService.js - Zentrale API-Klasse für die Hue Bridge-Kommunikation
import { hexToHsv, hsvToHex } from '../utils/colorConverters';

/**
 * HueApiService - Zentrale Klasse für alle Kommunikation mit der Philips Hue Bridge
 *
 * Diese Klasse kapselt alle API-Aufrufe zur Hue Bridge und bietet eine einheitliche
 * Schnittstelle für alle App-Komponenten. Sie kümmert sich um:
 * - Verbindungsaufbau zur Bridge
 * - Bridge-Discovery
 * - Authentifizierung
 * - Lichter steuern
 * - Gruppen verwalten
 * - Szenen verwalten
 * - Zeitpläne und Routinen steuern
 */
class HueApiService {
    constructor() {
        this.bridgeIp = localStorage.getItem('hue-bridge-ip') || null;
        this.username = localStorage.getItem('hue-username') || null;
        this.bridgeData = {
            lights: {},
            groups: {},
            scenes: {},
            schedules: {},
            sensors: {},
            rules: {}
        };

        // Optionale Caching-Einstellungen
        this.cacheEnabled = true;
        this.cacheTTL = 5000; // 5 Sekunden
        this.lastFetchTime = {
            lights: 0,
            groups: 0,
            scenes: 0,
            schedules: 0,
            sensors: 0,
            rules: 0
        };
    }

    /**
     * Initialisiere die API mit gespeicherten oder übergebenen Werten
     * @param {string} bridgeIp - Optional: IP-Adresse der Bridge
     * @param {string} username - Optional: API-Benutzername
     */
    initialize(bridgeIp = null, username = null) {
        if (bridgeIp) {
            this.bridgeIp = bridgeIp;
            localStorage.setItem('hue-bridge-ip', bridgeIp);
        }

        if (username) {
            this.username = username;
            localStorage.setItem('hue-username', username);
        }

        return (this.bridgeIp && this.username);
    }

    /**
     * Prüfe, ob die API bereit für Aufrufe ist
     * @returns {boolean} True, wenn Bridge-IP und Username gesetzt sind
     */
    isReady() {
        return (this.bridgeIp && this.username);
    }

    /**
     * Entdecke Philips Hue Bridges im Netzwerk
     * @returns {Promise<Array>} Liste gefundener Bridges
     */
    async discoverBridges() {
        try {
            // Methode 1: Offizielle Philips Hue Discovery URL
            const response = await fetch('https://discovery.meethue.com/');
            const bridges = await response.json();

            // Methode 2: N-UPnP Lokale Suche als Fallback
            if (!bridges || bridges.length === 0) {
                // Lokale UPnP-Implementierung würde hier erfolgen
                // Für den Prototyp überspringen wir diesen Schritt
            }

            // Methode 3: mDNS-Suche als zweiter Fallback
            if (!bridges || bridges.length === 0) {
                // mDNS benötigt in der Regel native Code-Integration
                // Für den Prototyp überspringen wir diesen Schritt
            }

            return bridges;
        } catch (error) {
            console.error("Bridge-Discovery fehlgeschlagen:", error);
            throw new Error(`Bridge-Discovery fehlgeschlagen: ${error.message}`);
        }
    }

    /**
     * Erstelle einen neuen API-Benutzer auf der Bridge
     * Erfordert, dass der Link-Button auf der Bridge gedrückt wurde
     * @returns {Promise<string>} Neuer API-Benutzername
     */
    async createUser() {
        if (!this.bridgeIp) {
            throw new Error("Bridge-IP nicht gesetzt. Führe zuerst die Bridge-Discovery durch.");
        }

        try {
            const response = await fetch(`http://${this.bridgeIp}/api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    devicetype: `glitterhue_app#${navigator.platform.replace(/\s+/g, '')}`
                })
            });

            const data = await response.json();

            if (data[0] && data[0].success) {
                const newUsername = data[0].success.username;
                this.username = newUsername;
                localStorage.setItem('hue-username', newUsername);
                return newUsername;
            } else if (data[0] && data[0].error) {
                throw new Error(data[0].error.description || "Unbekannter Fehler");
            } else {
                throw new Error("Unerwartete Antwort von der Bridge");
            }
        } catch (error) {
            console.error("Benutzer-Erstellung fehlgeschlagen:", error);
            throw error;
        }
    }

    /**
     * Generischer API-Aufruf zur Bridge
     * @param {string} endpoint - API-Endpunkt relativ zur Basis-URL
     * @param {string} method - HTTP-Methode (GET, PUT, POST, DELETE)
     * @param {Object} body - Optional: Request-Body für PUT/POST
     * @returns {Promise<Object>} Antwort der API
     */
    async callApi(endpoint, method = 'GET', body = null) {
        if (!this.isReady()) {
            throw new Error("API nicht bereit. Bridge-IP und Username müssen gesetzt sein.");
        }

        const url = `http://${this.bridgeIp}/api/${this.username}/${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body && (method === 'PUT' || method === 'POST')) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            // Bridge gibt bei Erfolg oft ein Array von Objekten mit "success" zurück
            if (Array.isArray(data) && data[0] && data[0].error) {
                throw new Error(data[0].error.description || "API-Fehler");
            }

            return data;
        } catch (error) {
            console.error(`API-Aufruf fehlgeschlagen (${method} ${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Hole alle Lichter von der Bridge
     * @param {boolean} forceRefresh - Cache ignorieren und Daten neu laden
     * @returns {Promise<Object>} Objekt mit allen Lichtern
     */
    async getLights(forceRefresh = false) {
        if (!forceRefresh &&
            this.cacheEnabled &&
            this.bridgeData.lights &&
            Object.keys(this.bridgeData.lights).length > 0 &&
            Date.now() - this.lastFetchTime.lights < this.cacheTTL) {
            return this.bridgeData.lights;
        }

        try {
            const lights = await this.callApi('lights');
            this.bridgeData.lights = lights;
            this.lastFetchTime.lights = Date.now();
            return lights;
        } catch (error) {
            throw new Error(`Fehler beim Laden der Lichter: ${error.message}`);
        }
    }

    /**
     * Hole Informationen zu einem bestimmten Licht
     * @param {string} lightId - ID des Lichts
     * @returns {Promise<Object>} Licht-Informationen
     */
    async getLight(lightId) {
        try {
            return await this.callApi(`lights/${lightId}`);
        } catch (error) {
            throw new Error(`Fehler beim Laden von Licht ${lightId}: ${error.message}`);
        }
    }

    /**
     * Setze den Zustand eines Lichts
     * @param {string} lightId - ID des Lichts
     * @param {Object} state - Neuer Zustand (on, bri, hue, sat, ct, xy, ...)
     * @returns {Promise<Object>} Antwort der API
     */
    async setLightState(lightId, state) {
        try {
            const response = await this.callApi(`lights/${lightId}/state`, 'PUT', state);

            // Lokales Caching aktualisieren
            if (this.bridgeData.lights && this.bridgeData.lights[lightId]) {
                this.bridgeData.lights[lightId].state = {
                    ...this.bridgeData.lights[lightId].state,
                    ...state
                };
            }

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Setzen des Zustands von Licht ${lightId}: ${error.message}`);
        }
    }

    /**
     * Schalte ein Licht ein oder aus
     * @param {string} lightId - ID des Lichts
     * @param {boolean} on - Einschalten (true) oder ausschalten (false)
     * @returns {Promise<Object>} Antwort der API
     */
    async toggleLight(lightId, on) {
        return this.setLightState(lightId, { on });
    }

    /**
     * Stelle die Helligkeit eines Lichts ein
     * @param {string} lightId - ID des Lichts
     * @param {number} brightness - Helligkeit (1-254)
     * @returns {Promise<Object>} Antwort der API
     */
    async setBrightness(lightId, brightness) {
        // Sicherstellen, dass der Wert im gültigen Bereich liegt
        const bri = Math.max(1, Math.min(254, Math.round(brightness)));
        return this.setLightState(lightId, { bri });
    }

    /**
     * Stelle die Farbe eines Lichts ein (HEX-Format)
     * @param {string} lightId - ID des Lichts
     * @param {string} hexColor - Farbe im HEX-Format (#RRGGBB)
     * @returns {Promise<Object>} Antwort der API
     */
    async setColor(lightId, hexColor) {
        const hsvColor = hexToHsv(hexColor);
        return this.setLightState(lightId, {
            hue: hsvColor.hue,
            sat: hsvColor.sat
        });
    }

    /**
     * Hole alle Gruppen von der Bridge
     * @param {boolean} forceRefresh - Cache ignorieren und Daten neu laden
     * @returns {Promise<Object>} Objekt mit allen Gruppen
     */
    async getGroups(forceRefresh = false) {
        if (!forceRefresh &&
            this.cacheEnabled &&
            this.bridgeData.groups &&
            Object.keys(this.bridgeData.groups).length > 0 &&
            Date.now() - this.lastFetchTime.groups < this.cacheTTL) {
            return this.bridgeData.groups;
        }

        try {
            const groups = await this.callApi('groups');
            this.bridgeData.groups = groups;
            this.lastFetchTime.groups = Date.now();
            return groups;
        } catch (error) {
            throw new Error(`Fehler beim Laden der Gruppen: ${error.message}`);
        }
    }

    /**
     * Erstelle eine neue Gruppe
     * @param {string} name - Name der Gruppe
     * @param {Array<string>} lightIds - Liste von Licht-IDs
     * @param {string} type - Gruppentyp (Room, LightGroup, Zone, Entertainment, Luminaire)
     * @param {string} class - Raumklasse (nur bei type=Room, z.B. Living room, Kitchen, ...)
     * @returns {Promise<Object>} Antwort der API mit neuer Gruppen-ID
     */
    async createGroup(name, lightIds, type = 'Room', roomClass = 'Living room') {
        const body = {
            name,
            lights: lightIds,
            type
        };

        // Raumklasse nur bei type=Room hinzufügen
        if (type === 'Room') {
            body.class = roomClass;
        }

        try {
            const response = await this.callApi('groups', 'POST', body);

            // Cache ungültig machen, damit bei nächster Abfrage neu geladen wird
            this.lastFetchTime.groups = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Erstellen der Gruppe: ${error.message}`);
        }
    }

    /**
     * Bearbeite eine bestehende Gruppe
     * @param {string} groupId - ID der Gruppe
     * @param {Object} data - Zu ändernde Daten (name, lights, class)
     * @returns {Promise<Object>} Antwort der API
     */
    async updateGroup(groupId, data) {
        try {
            const response = await this.callApi(`groups/${groupId}`, 'PUT', data);

            // Cache ungültig machen
            this.lastFetchTime.groups = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Aktualisieren der Gruppe ${groupId}: ${error.message}`);
        }
    }

    /**
     * Lösche eine Gruppe
     * @param {string} groupId - ID der Gruppe
     * @returns {Promise<Object>} Antwort der API
     */
    async deleteGroup(groupId) {
        try {
            const response = await this.callApi(`groups/${groupId}`, 'DELETE');

            // Cache ungültig machen
            this.lastFetchTime.groups = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Löschen der Gruppe ${groupId}: ${error.message}`);
        }
    }

    /**
     * Setze den Zustand aller Lichter in einer Gruppe
     * @param {string} groupId - ID der Gruppe
     * @param {Object} state - Neuer Zustand (on, bri, hue, sat, ...)
     * @returns {Promise<Object>} Antwort der API
     */
    async setGroupState(groupId, state) {
        try {
            return await this.callApi(`groups/${groupId}/action`, 'PUT', state);
        } catch (error) {
            throw new Error(`Fehler beim Setzen des Gruppenzustands ${groupId}: ${error.message}`);
        }
    }

    /**
     * Schalte alle Lichter in einer Gruppe ein oder aus
     * @param {string} groupId - ID der Gruppe
     * @param {boolean} on - Einschalten (true) oder ausschalten (false)
     * @returns {Promise<Object>} Antwort der API
     */
    async toggleGroup(groupId, on) {
        return this.setGroupState(groupId, { on });
    }

    /**
     * Hole alle Szenen von der Bridge
     * @param {boolean} forceRefresh - Cache ignorieren und Daten neu laden
     * @returns {Promise<Object>} Objekt mit allen Szenen
     */
    async getScenes(forceRefresh = false) {
        if (!forceRefresh &&
            this.cacheEnabled &&
            this.bridgeData.scenes &&
            Object.keys(this.bridgeData.scenes).length > 0 &&
            Date.now() - this.lastFetchTime.scenes < this.cacheTTL) {
            return this.bridgeData.scenes;
        }

        try {
            const scenes = await this.callApi('scenes');
            this.bridgeData.scenes = scenes;
            this.lastFetchTime.scenes = Date.now();
            return scenes;
        } catch (error) {
            throw new Error(`Fehler beim Laden der Szenen: ${error.message}`);
        }
    }

    /**
     * Erstelle eine neue Szene
     * @param {string} name - Name der Szene
     * @param {Array<string>} lightIds - Liste von Licht-IDs
     * @param {Object} lightstates - Lichtzustände für die Szene
     * @returns {Promise<Object>} Antwort der API mit neuer Szenen-ID
     */
    async createScene(name, lightIds, lightstates = {}) {
        const body = {
            name,
            lights: lightIds,
            recycle: false // Nicht automatisch löschen
        };

        // Lichtzustände hinzufügen, falls vorhanden
        if (Object.keys(lightstates).length > 0) {
            body.lightstates = lightstates;
        }

        try {
            const response = await this.callApi('scenes', 'POST', body);

            // Cache ungültig machen
            this.lastFetchTime.scenes = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Erstellen der Szene: ${error.message}`);
        }
    }

    /**
     * Aktualisiere eine bestehende Szene
     * @param {string} sceneId - ID der Szene
     * @param {Object} data - Zu ändernde Daten (name, lights, ...)
     * @returns {Promise<Object>} Antwort der API
     */
    async updateScene(sceneId, data) {
        try {
            const response = await this.callApi(`scenes/${sceneId}`, 'PUT', data);

            // Cache ungültig machen
            this.lastFetchTime.scenes = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Aktualisieren der Szene ${sceneId}: ${error.message}`);
        }
    }

    /**
     * Aktualisiere den Lichtzustand eines Lichts in einer Szene
     * @param {string} sceneId - ID der Szene
     * @param {string} lightId - ID des Lichts
     * @param {Object} state - Neuer Zustand (on, bri, hue, sat, ...)
     * @returns {Promise<Object>} Antwort der API
     */
    async updateSceneLightState(sceneId, lightId, state) {
        try {
            return await this.callApi(`scenes/${sceneId}/lightstates/${lightId}`, 'PUT', state);
        } catch (error) {
            throw new Error(`Fehler beim Aktualisieren des Lichtzustands in Szene ${sceneId}: ${error.message}`);
        }
    }

    /**
     * Lösche eine Szene
     * @param {string} sceneId - ID der Szene
     * @returns {Promise<Object>} Antwort der API
     */
    async deleteScene(sceneId) {
        try {
            const response = await this.callApi(`scenes/${sceneId}`, 'DELETE');

            // Cache ungültig machen
            this.lastFetchTime.scenes = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Löschen der Szene ${sceneId}: ${error.message}`);
        }
    }

    /**
     * Aktiviere eine Szene
     * @param {string} sceneId - ID der Szene
     * @param {string} groupId - Optional: ID der Gruppe
     * @returns {Promise<Object>} Antwort der API
     */
    async activateScene(sceneId, groupId = null) {
        try {
            const endpoint = groupId ? `groups/${groupId}/action` : 'groups/0/action';

            // Szene in der angegebenen Gruppe aktivieren
            return await this.callApi(endpoint, 'PUT', { scene: sceneId });
        } catch (error) {
            throw new Error(`Fehler beim Aktivieren der Szene ${sceneId}: ${error.message}`);
        }
    }

    /**
     * Hole alle Zeitpläne von der Bridge
     * @param {boolean} forceRefresh - Cache ignorieren und Daten neu laden
     * @returns {Promise<Object>} Objekt mit allen Zeitplänen
     */
    async getSchedules(forceRefresh = false) {
        if (!forceRefresh &&
            this.cacheEnabled &&
            this.bridgeData.schedules &&
            Object.keys(this.bridgeData.schedules).length > 0 &&
            Date.now() - this.lastFetchTime.schedules < this.cacheTTL) {
            return this.bridgeData.schedules;
        }

        try {
            const schedules = await this.callApi('schedules');
            this.bridgeData.schedules = schedules;
            this.lastFetchTime.schedules = Date.now();
            return schedules;
        } catch (error) {
            throw new Error(`Fehler beim Laden der Zeitpläne: ${error.message}`);
        }
    }

    /**
     * Erstelle einen neuen Zeitplan
     * @param {Object} schedule - Zeitplan-Objekt
     * @returns {Promise<Object>} Antwort der API mit neuer Zeitplan-ID
     */
    async createSchedule(schedule) {
        try {
            const response = await this.callApi('schedules', 'POST', schedule);

            // Cache ungültig machen
            this.lastFetchTime.schedules = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Erstellen des Zeitplans: ${error.message}`);
        }
    }

    /**
     * Erstelle einen zeitbasierten Einschalt-Zeitplan
     * @param {string} name - Name des Zeitplans
     * @param {string} time - Zeit im Format "HH:MM:SS"
     * @param {Array} days - Wochentage (0-6, 0=Sonntag)
     * @param {string} groupId - ID der Gruppe oder '0' für alle Lichter
     * @param {Object} action - Auszuführende Aktion
     * @returns {Promise<Object>} Antwort der API
     */
    async createTimeSchedule(name, time, days, groupId = '0', action = { on: true }) {
        // Erzeuge Zeitplan nach Hue API v1 Format
        const schedule = {
            name,
            description: `Zeitplan für ${name}`,
            command: {
                address: `/api/${this.username}/groups/${groupId}/action`,
                method: 'PUT',
                body: action
            },
            localtime: `W${days.join('')}/T${time}`
        };

        return this.createSchedule(schedule);
    }

    /**
     * Erstelle einen sonnenbasierten Zeitplan (Sonnenaufgang/-untergang)
     * @param {string} name - Name des Zeitplans
     * @param {string} event - 'sunrise' oder 'sunset'
     * @param {number} offset - Offset in Minuten (positiv oder negativ)
     * @param {Array} days - Wochentage (0-6, 0=Sonntag)
     * @param {string} groupId - ID der Gruppe oder '0' für alle Lichter
     * @param {Object} action - Auszuführende Aktion
     * @returns {Promise<Object>} Antwort der API
     */
    async createSunSchedule(name, event, offset, days, groupId = '0', action = { on: true }) {
        // Erzeuge Zeitplan nach Hue API v1 Format
        const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;

        const schedule = {
            name,
            description: `${event}-Zeitplan für ${name}`,
            command: {
                address: `/api/${this.username}/groups/${groupId}/action`,
                method: 'PUT',
                body: action
            },
            localtime: `W${days.join('')}/${event}${offsetStr}`
        };

        return this.createSchedule(schedule);
    }

    /**
     * Aktualisiere einen bestehenden Zeitplan
     * @param {string} scheduleId - ID des Zeitplans
     * @param {Object} data - Zu ändernde Daten
     * @returns {Promise<Object>} Antwort der API
     */
    async updateSchedule(scheduleId, data) {
        try {
            const response = await this.callApi(`schedules/${scheduleId}`, 'PUT', data);

            // Cache ungültig machen
            this.lastFetchTime.schedules = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Aktualisieren des Zeitplans ${scheduleId}: ${error.message}`);
        }
    }

    /**
     * Lösche einen Zeitplan
     * @param {string} scheduleId - ID des Zeitplans
     * @returns {Promise<Object>} Antwort der API
     */
    async deleteSchedule(scheduleId) {
        try {
            const response = await this.callApi(`schedules/${scheduleId}`, 'DELETE');

            // Cache ungültig machen
            this.lastFetchTime.schedules = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Löschen des Zeitplans ${scheduleId}: ${error.message}`);
        }
    }

    /**
     * Aktiviere oder deaktiviere einen Zeitplan
     * @param {string} scheduleId - ID des Zeitplans
     * @param {boolean} enabled - Aktivieren (true) oder deaktivieren (false)
     * @returns {Promise<Object>} Antwort der API
     */
    async enableSchedule(scheduleId, enabled) {
        return this.updateSchedule(scheduleId, { status: enabled ? 'enabled' : 'disabled' });
    }

    /**
     * Hole alle Sensoren von der Bridge
     * @param {boolean} forceRefresh - Cache ignorieren und Daten neu laden
     * @returns {Promise<Object>} Objekt mit allen Sensoren
     */
    async getSensors(forceRefresh = false) {
        if (!forceRefresh &&
            this.cacheEnabled &&
            this.bridgeData.sensors &&
            Object.keys(this.bridgeData.sensors).length > 0 &&
            Date.now() - this.lastFetchTime.sensors < this.cacheTTL) {
            return this.bridgeData.sensors;
        }

        try {
            const sensors = await this.callApi('sensors');
            this.bridgeData.sensors = sensors;
            this.lastFetchTime.sensors = Date.now();
            return sensors;
        } catch (error) {
            throw new Error(`Fehler beim Laden der Sensoren: ${error.message}`);
        }
    }

    /**
     * Hole alle Regeln von der Bridge
     * @param {boolean} forceRefresh - Cache ignorieren und Daten neu laden
     * @returns {Promise<Object>} Objekt mit allen Regeln
     */
    async getRules(forceRefresh = false) {
        if (!forceRefresh &&
            this.cacheEnabled &&
            this.bridgeData.rules &&
            Object.keys(this.bridgeData.rules).length > 0 &&
            Date.now() - this.lastFetchTime.rules < this.cacheTTL) {
            return this.bridgeData.rules;
        }

        try {
            const rules = await this.callApi('rules');
            this.bridgeData.rules = rules;
            this.lastFetchTime.rules = Date.now();
            return rules;
        } catch (error) {
            throw new Error(`Fehler beim Laden der Regeln: ${error.message}`);
        }
    }

    /**
     * Erstelle eine Regel für Automatisierungen
     * @param {string} name - Name der Regel
     * @param {Array} conditions - Array von Bedingungen
     * @param {Array} actions - Array von Aktionen
     * @returns {Promise<Object>} Antwort der API mit neuer Regel-ID
     */
    async createRule(name, conditions, actions) {
        try {
            const rule = {
                name,
                conditions,
                actions
            };

            const response = await this.callApi('rules', 'POST', rule);

            // Cache ungültig machen
            this.lastFetchTime.rules = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Erstellen der Regel: ${error.message}`);
        }
    }

    /**
     * Lösche eine Regel
     * @param {string} ruleId - ID der Regel
     * @returns {Promise<Object>} Antwort der API
     */
    async deleteRule(ruleId) {
        try {
            const response = await this.callApi(`rules/${ruleId}`, 'DELETE');

            // Cache ungültig machen
            this.lastFetchTime.rules = 0;

            return response;
        } catch (error) {
            throw new Error(`Fehler beim Löschen der Regel ${ruleId}: ${error.message}`);
        }
    }

    /**
     * Hole Informationen über die Bridge
     * @returns {Promise<Object>} Bridge-Informationen
     */
    async getBridgeInfo() {
        try {
            return await this.callApi('config');
        } catch (error) {
            throw new Error(`Fehler beim Laden der Bridge-Informationen: ${error.message}`);
        }
    }

    /**
     * Setze Einstellungen der Bridge
     * @param {Object} config - Zu ändernde Einstellungen
     * @returns {Promise<Object>} Antwort der API
     */
    async updateBridgeConfig(config) {
        try {
            return await this.callApi('config', 'PUT', config);
        } catch (error) {
            throw new Error(`Fehler beim Aktualisieren der Bridge-Konfiguration: ${error.message}`);
        }
    }
}

// Singleton-Instanz exportieren
const hueApi = new HueApiService();

export default hueApi;