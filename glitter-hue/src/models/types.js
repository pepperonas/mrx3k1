// src/models/types.js - Definiert Datentypen und Konstanten für die Anwendung

// Automatisierungstypen
export const AUTOMATION_TYPES = {
    SCHEDULE: 'schedule',       // Zeitplan
    WAKE_UP: 'wake-up',         // Lichtwecker
    PRESENCE: 'presence',       // Anwesenheitssimulation
    GEO_FENCE: 'geo-fence',     // Standortbasiert
    SENSOR: 'sensor',           // Sensorbasiert
    SLEEP: 'sleep',             // Einschlafmodus
    SUNSET: 'sunset',           // Sonnenuntergang
    SUNRISE: 'sunrise',         // Sonnenaufgang
    WEBHOOK: 'webhook'          // API-Trigger
};

// Szenentypen
export const SCENE_TYPES = {
    STATIC: 'static',           // Statische Szene
    DYNAMIC: 'dynamic',         // Dynamische Szene (Animation)
    SYNC: 'sync'                // Synchronisierte Szene (Musik, Film, etc.)
};

// Sensor-Typen
export const SENSOR_TYPES = {
    // Schalter
    DIMMER_SWITCH: 'ZLLSwitch',     // Hue Dimmer Switch
    TAP_SWITCH: 'ZGPSwitch',        // Hue Tap Switch
    // Sensoren
    MOTION: 'ZLLPresence',          // Bewegungssensor
    LIGHT_LEVEL: 'ZLLLightLevel',   // Lichtsensor
    TEMPERATURE: 'ZLLTemperature',  // Temperatursensor
    // Andere
    GENERIC: 'CLIPGenericStatus',   // Generischer Sensor (Software)
    DAYLIGHT: 'Daylight'            // Tageslicht-Sensor
};

// Gruppe (Raum oder Zone)
export class Group {
    constructor(id, name, type = 'room', roomType = 'living') {
        this.id = id;
        this.name = name;
        this.type = type;         // 'room' oder 'zone'
        this.roomType = roomType; // 'living', 'bedroom', 'kitchen', usw.
        this.lights = [];         // Array von Licht-IDs
        this.bridgeGroupId = null; // Optional: ID auf der Hue Bridge
    }
}

// Szene
export class Scene {
    constructor(id, name, icon = 'scene', type = SCENE_TYPES.STATIC) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.icon = icon;        // Icon-Name für die Anzeige
        this.lights = [];        // Array von Licht-IDs
        this.states = {};        // Zustandseinstellungen pro Licht
        this.isActive = false;   // Ist die Szene aktiv?
        this.created = Date.now();
        this.lastModified = Date.now();
    }
}

// Basisklasse für Automatisierungen
export class Automation {
    constructor(id, name, type = AUTOMATION_TYPES.SCHEDULE) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.enabled = true;
        this.actions = [];       // Auszuführende Aktionen
        this.created = Date.now();
        this.lastModified = Date.now();
        this.lastTriggered = null; // Zeitpunkt der letzten Auslösung
    }
}

// Zeitplan-Automatisierung
export class ScheduleAutomation extends Automation {
    constructor(id, name) {
        super(id, name, AUTOMATION_TYPES.SCHEDULE);
        this.schedule = {
            time: '08:00',       // Format: "HH:MM"
            days: [1, 2, 3, 4, 5], // Indizes der Wochentage (0 = Sonntag)
            sunEvent: null,      // 'sunrise' oder 'sunset' (optional)
            offset: 0            // Offset in Minuten (wenn sunEvent gesetzt)
        };
    }
}

// Geofencing-Automatisierung
export class GeoFenceAutomation extends Automation {
    constructor(id, name) {
        super(id, name, AUTOMATION_TYPES.GEO_FENCE);
        this.location = {
            latitude: 0,
            longitude: 0,
            radius: 100         // Radius in Metern
        };
        this.condition = 'enter'; // 'enter' oder 'leave'
        this.users = [];         // Benutzer, für die diese Automatisierung gilt
    }
}

// Anwesenheitssimulation
export class PresenceAutomation extends Automation {
    constructor(id, name) {
        super(id, name, AUTOMATION_TYPES.PRESENCE);
        this.activeTime = {
            start: '18:00',      // Format: "HH:MM"
            end: '23:00'         // Format: "HH:MM"
        };
        this.randomness = 50;    // Grad der Zufälligkeit (0-100)
        this.rooms = [];         // Zu verwendende Räume (IDs)
    }
}

// Sensor-Automatisierung
export class SensorAutomation extends Automation {
    constructor(id, name) {
        super(id, name, AUTOMATION_TYPES.SENSOR);
        this.sensorId = '';      // ID des Sensors
        this.condition = {
            type: 'presence',    // Typ der Bedingung
            value: true          // Erwarteter Wert
        };
        this.timeout = 300;      // Zeitüberschreitung in Sekunden
    }
}

// Sensor Klasse
export class Sensor {
    constructor(id, name, type = SENSOR_TYPES.MOTION) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.modelId = '';       // Hardware-Modell-ID
        this.manufacturerName = ''; // Herstellername
        this.uniqueId = '';      // Eindeutige ID des Sensors
        this.state = {};         // Aktueller Zustand
        this.config = {
            on: true,            // Aktiviert/Deaktiviert
            battery: null,       // Batteriestatus in Prozent (wenn zutreffend)
            reachable: true,     // Ist der Sensor erreichbar?
        };
        this.lastUpdated = Date.now(); // Letztes Update des Sensors
    }

    // Status prüfen
    isActive() {
        return this.config.on && this.config.reachable;
    }

    // Batteriestatus prüfen
    getBatteryLevel() {
        return this.config.battery;
    }

    // Prüfen, ob der Sensor Batterie-betrieben ist
    hasBattery() {
        return this.config.battery !== null && this.config.battery !== undefined;
    }

    // Prüfen, ob der Batteriestand niedrig ist
    hasLowBattery() {
        return this.hasBattery() && this.config.battery < 20;
    }
}

// Hue Dimmer Schalter
export class DimmerSwitch extends Sensor {
    constructor(id, name) {
        super(id, name, SENSOR_TYPES.DIMMER_SWITCH);
        this.state = {
            buttonevent: null,   // Letztes Knopfdruck-Ereignis
            lastupdated: null    // Zeitpunkt des letzten Updates
        };
    }

    // Button-ID und Aktion aus buttonevent extrahieren
    getButtonInfo() {
        if (!this.state.buttonevent) return null;

        const buttonId = Math.floor(this.state.buttonevent / 1000);
        const action = this.state.buttonevent % 1000;

        return {
            button: buttonId,     // 1-4: Schalter-Tasten
            action: action,       // 0: Press, 1: Hold, 2: Short Release, 3: Long Release
            time: this.state.lastupdated
        };
    }
}

// Bewegungssensor
export class MotionSensor extends Sensor {
    constructor(id, name) {
        super(id, name, SENSOR_TYPES.MOTION);
        this.state = {
            presence: false,      // Bewegung erkannt?
            lastupdated: null     // Zeitpunkt des letzten Updates
        };
        this.config = {
            ...this.config,
            sensitivity: 2,       // Empfindlichkeit (1-3)
            ledindication: false  // LED-Anzeige aktiviert?
        };
    }

    // Prüfen, ob Bewegung erkannt wurde
    isPresenceDetected() {
        return this.state.presence === true;
    }

    // Zeit seit letzter Bewegung berechnen
    getTimeSinceLastMotion() {
        if (!this.state.lastupdated) return null;

        const lastUpdate = new Date(this.state.lastupdated);
        const now = new Date();
        return now - lastUpdate; // Millisekunden seit letzter Bewegung
    }
}

// Regel (für die Hue Bridge)
export class Rule {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.conditions = [];     // Bedingungen, die erfüllt sein müssen
        this.actions = [];        // Auszuführende Aktionen
        this.created = Date.now();
        this.lastTriggered = null; // Zeitpunkt der letzten Auslösung
        this.status = 'enabled';   // 'enabled' oder 'disabled'
        this.timesTriggered = 0;   // Wie oft wurde die Regel ausgelöst?
    }

    // Bedingung hinzufügen
    addCondition(address, operator, value) {
        this.conditions.push({
            address,             // Ressourcenadresse (z.B. /sensors/1/state/presence)
            operator,            // 'eq', 'gt', 'lt', 'dx', 'ddx'
            value                // Zu vergleichender Wert
        });
        return this;
    }

    // Aktion hinzufügen
    addAction(address, method, body) {
        this.actions.push({
            address,             // Ressourcenadresse (z.B. /lights/1/state)
            method,              // 'PUT', 'POST', 'DELETE'
            body                 // Zu sendende Daten
        });
        return this;
    }

    // Regel aktivieren
    enable() {
        this.status = 'enabled';
        return this;
    }

    // Regel deaktivieren
    disable() {
        this.status = 'disabled';
        return this;
    }
}

// Helfer-Funktionen für die Typprüfung
export const isGroup = (obj) => obj instanceof Group;
export const isScene = (obj) => obj instanceof Scene;
export const isAutomation = (obj) => obj instanceof Automation;
export const isSensor = (obj) => obj instanceof Sensor;
export const isRule = (obj) => obj instanceof Rule;
export const isDimmerSwitch = (obj) => obj instanceof DimmerSwitch;
export const isMotionSensor = (obj) => obj instanceof MotionSensor;