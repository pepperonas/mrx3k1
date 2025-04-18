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

// Helfer-Funktionen für die Typprüfung
export const isGroup = (obj) => obj instanceof Group;
export const isScene = (obj) => obj instanceof Scene;
export const isAutomation = (obj) => obj instanceof Automation;