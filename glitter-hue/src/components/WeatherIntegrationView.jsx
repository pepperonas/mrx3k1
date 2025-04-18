// src/components/WeatherIntegrationView.jsx - Wetterbasierte Lichtsteuerung für GlitterHue
import React, { useState, useEffect } from 'react';
import '../styles/weather.css';

// Wetter-Bedingungstypen
const WEATHER_CONDITIONS = {
    CLEAR: 'clear',           // Klar/Sonnig
    PARTLY_CLOUDY: 'partly-cloudy', // Teilweise bewölkt
    CLOUDY: 'cloudy',         // Bewölkt
    RAIN: 'rain',             // Regen
    THUNDERSTORM: 'thunderstorm', // Gewitter
    SNOW: 'snow',             // Schnee
    FOG: 'fog',               // Nebel
    WINDY: 'windy'            // Windig
};

// Tageszeiten für verschiedene Lichteinstellungen
const DAYTIMES = {
    MORNING: 'morning',       // Morgen (6-10 Uhr)
    DAY: 'day',               // Tag (10-16 Uhr)
    EVENING: 'evening',       // Abend (16-22 Uhr)
    NIGHT: 'night'            // Nacht (22-6 Uhr)
};

// Voreingestellte Lichtmodi für verschiedene Wetterbedingungen
const WEATHER_LIGHT_PRESETS = {
    [WEATHER_CONDITIONS.CLEAR]: {
        [DAYTIMES.MORNING]: {
            name: 'Sonniger Morgen',
            hue: 14000,          // Warmes Goldgelb
            sat: 180,
            bri: 254,
            ct: 320              // Warmes Weiß (~3100K)
        },
        [DAYTIMES.DAY]: {
            name: 'Sonniger Tag',
            hue: 12000,          // Leicht gelblich
            sat: 80,
            bri: 254,
            ct: 230              // Helles Tageslicht (~4300K)
        },
        [DAYTIMES.EVENING]: {
            name: 'Sonnenuntergang',
            hue: 6000,           // Orangerot
            sat: 200,
            bri: 220,
            ct: 370              // Warmes Weiß (~2700K)
        },
        [DAYTIMES.NIGHT]: {
            name: 'Klare Nacht',
            hue: 47000,          // Tiefblau
            sat: 200,
            bri: 100,
            ct: 450              // Sehr warmes Weiß (~2200K)
        }
    },
    [WEATHER_CONDITIONS.CLOUDY]: {
        [DAYTIMES.MORNING]: {
            name: 'Bewölkter Morgen',
            hue: 11000,          // Gedämpftes Gelb
            sat: 100,
            bri: 220,
            ct: 340              // Warmes Weiß (~2900K)
        },
        [DAYTIMES.DAY]: {
            name: 'Bewölkter Tag',
            hue: 39000,          // Leichtes Blau
            sat: 50,
            bri: 240,
            ct: 250              // Neutrales Weiß (~4000K)
        },
        [DAYTIMES.EVENING]: {
            name: 'Bewölkter Abend',
            hue: 8000,           // Gedämpftes Orange
            sat: 140,
            bri: 200,
            ct: 380              // Warmes Weiß (~2600K)
        },
        [DAYTIMES.NIGHT]: {
            name: 'Bewölkte Nacht',
            hue: 45000,          // Dunkelblau
            sat: 180,
            bri: 80,
            ct: 450              // Sehr warmes Weiß (~2200K)
        }
    },
    [WEATHER_CONDITIONS.RAIN]: {
        [DAYTIMES.MORNING]: {
            name: 'Regnerischer Morgen',
            hue: 42000,          // Blau-Grau
            sat: 70,
            bri: 200,
            ct: 330              // Warmes Weiß (~3000K)
        },
        [DAYTIMES.DAY]: {
            name: 'Regnerischer Tag',
            hue: 40000,          // Kühleres Blau
            sat: 90,
            bri: 220,
            ct: 280              // Neutrales bis kühles Weiß (~3500K)
        },
        [DAYTIMES.EVENING]: {
            name: 'Regnerischer Abend',
            hue: 43000,          // Blau-Lila
            sat: 130,
            bri: 180,
            ct: 400              // Warmes Weiß (~2500K)
        },
        [DAYTIMES.NIGHT]: {
            name: 'Regnerische Nacht',
            hue: 45000,          // Dunkelblau
            sat: 200,
            bri: 60,
            ct: 450              // Sehr warmes Weiß (~2200K)
        }
    },
    [WEATHER_CONDITIONS.THUNDERSTORM]: {
        [DAYTIMES.MORNING]: {
            name: 'Gewitter am Morgen',
            hue: 44000,          // Tiefes Blau
            sat: 180,
            bri: 180,
            ct: 340              // Warmes Weiß (~2900K)
        },
        [DAYTIMES.DAY]: {
            name: 'Gewitter am Tag',
            hue: 46000,          // Dunkelblau-Lila
            sat: 200,
            bri: 200,
            ct: 300              // Neutrales Weiß (~3300K)
        },
        [DAYTIMES.EVENING]: {
            name: 'Gewitter am Abend',
            hue: 47000,          // Lila-Blau
            sat: 220,
            bri: 150,
            ct: 420              // Warmes Weiß (~2400K)
        },
        [DAYTIMES.NIGHT]: {
            name: 'Gewitter in der Nacht',
            hue: 48000,          // Tiefes Lila
            sat: 240,
            bri: 40,
            ct: 470              // Sehr warmes Weiß (~2100K)
        }
    },
    [WEATHER_CONDITIONS.SNOW]: {
        [DAYTIMES.MORNING]: {
            name: 'Verschneiter Morgen',
            hue: 36000,          // Eisblau
            sat: 40,
            bri: 240,
            ct: 320              // Warmes Weiß (~3100K)
        },
        [DAYTIMES.DAY]: {
            name: 'Verschneiter Tag',
            hue: 35000,          // Helles Eisblau
            sat: 30,
            bri: 254,
            ct: 200              // Kühles Weiß (~5000K)
        },
        [DAYTIMES.EVENING]: {
            name: 'Verschneiter Abend',
            hue: 36000,          // Gedämpftes Eisblau
            sat: 60,
            bri: 220,
            ct: 380              // Warmes Weiß (~2600K)
        },
        [DAYTIMES.NIGHT]: {
            name: 'Verschneite Nacht',
            hue: 44000,          // Blau-Weiß
            sat: 100,
            bri: 120,
            ct: 430              // Sehr warmes Weiß (~2300K)
        }
    },
    [WEATHER_CONDITIONS.FOG]: {
        [DAYTIMES.MORNING]: {
            name: 'Nebliger Morgen',
            hue: 10000,          // Gedämpftes Gelb
            sat: 40,
            bri: 200,
            ct: 350              // Warmes Weiß (~2900K)
        },
        [DAYTIMES.DAY]: {
            name: 'Nebliger Tag',
            hue: 38000,          // Grau-Blau
            sat: 40,
            bri: 230,
            ct: 280              // Neutrales Weiß (~3500K)
        },
        [DAYTIMES.EVENING]: {
            name: 'Nebliger Abend',
            hue: 5000,           // Gedämpftes Orange
            sat: 60,
            bri: 180,
            ct: 400              // Sehr warmes Weiß (~2500K)
        },
        [DAYTIMES.NIGHT]: {
            name: 'Neblige Nacht',
            hue: 43000,          // Dunkelblau
            sat: 100,
            bri: 60,
            ct: 450              // Sehr warmes Weiß (~2200K)
        }
    }
};

// API-Keys für unterstützte Wetter-APIs
// In einer echten Anwendung sollten diese sicher gespeichert werden
// und nicht im Code stehen
const API_KEYS = {
    OPENWEATHERMAP: 'YOUR_OPENWEATHERMAP_API_KEY',
    WEATHERAPI: 'YOUR_WEATHERAPI_KEY'
};

// Wetter-Icon-Komponente für die verschiedenen Wetterbedingungen
const WeatherIcon = ({ condition }) => {
    return (
        <div className="weather-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {condition === WEATHER_CONDITIONS.CLEAR && (
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
                {condition === WEATHER_CONDITIONS.PARTLY_CLOUDY && (
                    <>
                        <path d="M8 4.5a6 6 0 0 0 9 8 6 6 0 0 1-9-8z"></path>
                        <path d="M4 14.5a4 4 0 0 1 6 0 4 4 0 0 0 6 0 4 4 0 0 1 6 0"></path>
                    </>
                )}
                {condition === WEATHER_CONDITIONS.CLOUDY && (
                    <>
                        <path d="M17 5.5a6 6 0 0 0-10 4 5 5 0 0 0-7 5 5 5 0 0 0 10 0 10 10 0 0 1 7 0"></path>
                    </>
                )}
                {condition === WEATHER_CONDITIONS.RAIN && (
                    <>
                        <path d="M20 16.2A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
                        <line x1="8" y1="19" x2="8" y2="21"></line>
                        <line x1="16" y1="19" x2="16" y2="21"></line>
                        <line x1="12" y1="19" x2="12" y2="21"></line>
                        <line x1="12" y1="15" x2="12" y2="17"></line>
                        <line x1="8" y1="15" x2="8" y2="17"></line>
                        <line x1="16" y1="15" x2="16" y2="17"></line>
                    </>
                )}
                {condition === WEATHER_CONDITIONS.THUNDERSTORM && (
                    <>
                        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"></path>
                        <polyline points="13 11 9 17 15 17 11 23"></polyline>
                    </>
                )}
                {condition === WEATHER_CONDITIONS.SNOW && (
                    <>
                        <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path>
                        <line x1="8" y1="16" x2="8.01" y2="16"></line>
                        <line x1="8" y1="20" x2="8.01" y2="20"></line>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                        <line x1="12" y1="22" x2="12.01" y2="22"></line>
                        <line x1="16" y1="16" x2="16.01" y2="16"></line>
                        <line x1="16" y1="20" x2="16.01" y2="20"></line>
                    </>
                )}
                {condition === WEATHER_CONDITIONS.FOG && (
                    <>
                        <path d="M4 14h16"></path>
                        <path d="M4 10h16"></path>
                        <path d="M4 6h16"></path>
                        <path d="M16 18h4"></path>
                        <path d="M4 18h4"></path>
                        <path d="M10 18h4"></path>
                    </>
                )}
                {condition === WEATHER_CONDITIONS.WINDY && (
                    <>
                        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
                    </>
                )}
            </svg>
        </div>
    );
};

// Wetter-Karte zur Anzeige der aktuellen Wetterbedingungen
const WeatherCard = ({ weather, onApplyLightMode }) => {
    const { condition, temperature, description, location, daytime } = weather;

    // Passende Lichteinstellungen für diese Wetterbedingung und Tageszeit finden
    const lightPreset = WEATHER_LIGHT_PRESETS[condition]?.[daytime];

    return (
        <div className="weather-card">
            <div className="weather-header">
                <WeatherIcon condition={condition} />
                <div className="weather-info">
                    <h3 className="location">{location}</h3>
                    <div className="current-weather">
                        <span className="temperature">{temperature}°C</span>
                        <span className="description">{description}</span>
                    </div>
                </div>
            </div>

            {lightPreset && (
                <div className="weather-lighting">
                    <h4>Passende Beleuchtung: {lightPreset.name}</h4>
                    <div className="light-preview" style={{
                        backgroundColor: `hsl(${(lightPreset.hue / 65535) * 360}, ${(lightPreset.sat / 254) * 100}%, ${(lightPreset.bri / 254) * 50}%)`
                    }}></div>
                    <button
                        className="apply-button"
                        onClick={() => onApplyLightMode(lightPreset)}
                    >
                        Beleuchtung anwenden
                    </button>
                </div>
            )}
        </div>
    );
};

// Formular zur manuellen Standortsuche
const LocationSearchForm = ({ onSearch, loading }) => {
    const [location, setLocation] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (location.trim()) {
            onSearch(location);
        }
    };

    return (
        <form className="location-search-form" onSubmit={handleSubmit}>
            <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Standort eingeben (z.B. Berlin, DE)"
                disabled={loading}
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Suche...' : 'Suchen'}
            </button>
        </form>
    );
};

// Automatisierungs-Karte für wetterbasierte Automatisierungen
const WeatherAutomationCard = ({ automation, onEdit, onToggle, onDelete }) => {
    return (
        <div className={`weather-automation-card ${!automation.enabled ? 'disabled' : ''}`}>
            <div className="automation-condition">
                <WeatherIcon condition={automation.condition} />
                <div className="condition-details">
                    <h4>{automation.name}</h4>
                    <p>{getConditionDescription(automation)}</p>
                </div>
            </div>

            <div className="automation-action">
                <p>
                    <strong>Aktion:</strong> {getActionDescription(automation)}
                </p>
            </div>

            <div className="automation-controls">
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
    );
};

// Hilfsfunktion: Beschreibung für die Bedingung einer Automatisierung
const getConditionDescription = (automation) => {
    let description = '';

    // Wetterbedingungs-Bezeichnung
    const conditionNames = {
        [WEATHER_CONDITIONS.CLEAR]: 'Klar/Sonnig',
        [WEATHER_CONDITIONS.PARTLY_CLOUDY]: 'Teilweise bewölkt',
        [WEATHER_CONDITIONS.CLOUDY]: 'Bewölkt',
        [WEATHER_CONDITIONS.RAIN]: 'Regen',
        [WEATHER_CONDITIONS.THUNDERSTORM]: 'Gewitter',
        [WEATHER_CONDITIONS.SNOW]: 'Schnee',
        [WEATHER_CONDITIONS.FOG]: 'Nebel',
        [WEATHER_CONDITIONS.WINDY]: 'Windig'
    };

    // Tageszeiten-Bezeichnung
    const daytimeNames = {
        [DAYTIMES.MORNING]: 'Morgen',
        [DAYTIMES.DAY]: 'Tag',
        [DAYTIMES.EVENING]: 'Abend',
        [DAYTIMES.NIGHT]: 'Nacht'
    };

    description = `${conditionNames[automation.condition] || 'Unbekannt'}`;

    // Tageszeit hinzufügen, falls angegeben
    if (automation.daytime) {
        description += ` am ${daytimeNames[automation.daytime] || 'Tag'}`;
    }

    // Temperaturbereich hinzufügen, falls angegeben
    if (automation.minTemp !== undefined && automation.maxTemp !== undefined) {
        description += `, ${automation.minTemp}°C bis ${automation.maxTemp}°C`;
    } else if (automation.minTemp !== undefined) {
        description += `, über ${automation.minTemp}°C`;
    } else if (automation.maxTemp !== undefined) {
        description += `, unter ${automation.maxTemp}°C`;
    }

    return description;
};

// Hilfsfunktion: Beschreibung für die Aktion einer Automatisierung
const getActionDescription = (automation) => {
    if (automation.action === 'scene') {
        return `Aktiviere Szene "${automation.sceneName || 'Unbekannt'}"`;
    } else if (automation.action === 'preset') {
        return `Verwende Wettervoreinstellung`;
    } else {
        return 'Benutzerdefinierte Aktion';
    }
};

// Formular zum Erstellen/Bearbeiten einer Wetter-Automatisierung
const WeatherAutomationForm = ({ automation, onSave, onCancel, scenes }) => {
    const [formData, setFormData] = useState(
        automation || {
            id: null,
            name: 'Neue Wetter-Automatisierung',
            condition: WEATHER_CONDITIONS.CLEAR,
            daytime: null, // optional
            minTemp: null, // optional
            maxTemp: null, // optional
            action: 'preset', // 'preset', 'scene', 'custom'
            sceneId: '',
            enabled: true
        }
    );

    // Formular-Input-Handler
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        // Für numerische Felder entweder Zahl oder null speichern
        if (type === 'number') {
            setFormData(prev => ({
                ...prev,
                [name]: value === '' ? null : Number(value)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Formular-Submit-Handler
    const handleSubmit = (e) => {
        e.preventDefault();

        // Formular-Validierung
        if (!formData.name || !formData.condition) {
            alert('Bitte Name und Wetterbedingung angeben.');
            return;
        }

        if (formData.action === 'scene' && !formData.sceneId) {
            alert('Bitte eine Szene auswählen.');
            return;
        }

        // Automatisierung speichern
        onSave({
            ...formData,
            id: formData.id || Date.now().toString(),
            sceneName: formData.action === 'scene' ?
                scenes.find(s => s.id === formData.sceneId)?.name : null
        });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{formData.id ? 'Automatisierung bearbeiten' : 'Neue Wetter-Automatisierung'}</h2>
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
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="condition">Wetterbedingung</label>
                        <select
                            id="condition"
                            name="condition"
                            value={formData.condition}
                            onChange={handleInputChange}
                            required
                        >
                            <option value={WEATHER_CONDITIONS.CLEAR}>Klar/Sonnig</option>
                            <option value={WEATHER_CONDITIONS.PARTLY_CLOUDY}>Teilweise bewölkt</option>
                            <option value={WEATHER_CONDITIONS.CLOUDY}>Bewölkt</option>
                            <option value={WEATHER_CONDITIONS.RAIN}>Regen</option>
                            <option value={WEATHER_CONDITIONS.THUNDERSTORM}>Gewitter</option>
                            <option value={WEATHER_CONDITIONS.SNOW}>Schnee</option>
                            <option value={WEATHER_CONDITIONS.FOG}>Nebel</option>
                            <option value={WEATHER_CONDITIONS.WINDY}>Windig</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="daytime">Tageszeit (optional)</label>
                        <select
                            id="daytime"
                            name="daytime"
                            value={formData.daytime || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">Jederzeit</option>
                            <option value={DAYTIMES.MORNING}>Morgen (6-10 Uhr)</option>
                            <option value={DAYTIMES.DAY}>Tag (10-16 Uhr)</option>
                            <option value={DAYTIMES.EVENING}>Abend (16-22 Uhr)</option>
                            <option value={DAYTIMES.NIGHT}>Nacht (22-6 Uhr)</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label htmlFor="minTemp">Min. Temperatur (°C)</label>
                            <input
                                type="number"
                                id="minTemp"
                                name="minTemp"
                                value={formData.minTemp === null ? '' : formData.minTemp}
                                onChange={handleInputChange}
                                placeholder="Optional"
                                step="1"
                            />
                        </div>

                        <div className="form-group half">
                            <label htmlFor="maxTemp">Max. Temperatur (°C)</label>
                            <input
                                type="number"
                                id="maxTemp"
                                name="maxTemp"
                                value={formData.maxTemp === null ? '' : formData.maxTemp}
                                onChange={handleInputChange}
                                placeholder="Optional"
                                step="1"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="action">Aktion</label>
                        <select
                            id="action"
                            name="action"
                            value={formData.action}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="preset">Wettervoreinstellung verwenden</option>
                            <option value="scene">Szene aktivieren</option>
                            <option value="custom">Benutzerdefiniert</option>
                        </select>
                    </div>

                    {formData.action === 'scene' && (
                        <div className="form-group">
                            <label htmlFor="sceneId">Szene</label>
                            <select
                                id="sceneId"
                                name="sceneId"
                                value={formData.sceneId}
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

                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={onCancel}>Abbrechen</button>
                        <button type="submit">Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Hauptkomponente für die Wetterintegration
const WeatherIntegrationView = ({ lights, rooms, scenes, username, bridgeIP }) => {
    // Status-Variablen
    const [loading, setLoading] = useState(false);
    const [weatherData, setWeatherData] = useState(null);
    const [weatherAutomations, setWeatherAutomations] = useState([]);
    const [editingAutomation, setEditingAutomation] = useState(null);
    const [error, setError] = useState(null);

    // Initialisierung
    useEffect(() => {
        // Lade gespeicherte Wetter-Automatisierungen
        const savedAutomations = localStorage.getItem('hue-weather-automations');
        if (savedAutomations) {
            try {
                setWeatherAutomations(JSON.parse(savedAutomations));
            } catch (e) {
                console.error('Fehler beim Laden der Wetter-Automatisierungen:', e);
            }
        } else {
            // Erstelle ein Beispiel, wenn keine vorhanden sind
            const defaultAutomation = {
                id: '1',
                name: 'Regnerischer Tag',
                condition: WEATHER_CONDITIONS.RAIN,
                daytime: DAYTIMES.DAY,
                action: 'preset',
                enabled: true
            };

            setWeatherAutomations([defaultAutomation]);
            saveAutomations([defaultAutomation]);
        }

        // Aktuelles Wetter laden, wenn Standort bekannt
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
                },
                error => {
                    console.log('Standortermittlung nicht möglich:', error);
                    // Fallback: Berlin
                    fetchWeatherByLocation('Berlin');
                }
            );
        } else {
            // Fallback, wenn Geolocation nicht unterstützt wird
            fetchWeatherByLocation('Berlin');
        }
    }, []);

    // Automatisierungen im LocalStorage speichern
    const saveAutomations = (automations) => {
        localStorage.setItem('hue-weather-automations', JSON.stringify(automations));
    };

    // Wetterdaten anhand der Koordinaten laden
    const fetchWeatherByCoordinates = async (lat, lon) => {
        setLoading(true);
        setError(null);

        try {
            // In einer echten Anwendung würde hier ein API-Aufruf stehen
            // Für die Demo simulieren wir das Wetter
            const weatherResponse = await simulateWeatherAPI(lat, lon);
            processWeatherData(weatherResponse);
        } catch (err) {
            console.error('Fehler beim Laden der Wetterdaten:', err);
            setError('Wetterdaten konnten nicht geladen werden. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Wetterdaten anhand des Standortnamens laden
    const fetchWeatherByLocation = async (location) => {
        setLoading(true);
        setError(null);

        try {
            // In einer echten Anwendung würde hier ein API-Aufruf stehen
            // Für die Demo simulieren wir das Wetter
            const weatherResponse = await simulateWeatherAPI(null, null, location);
            processWeatherData(weatherResponse);
        } catch (err) {
            console.error('Fehler beim Laden der Wetterdaten:', err);
            setError('Wetterdaten konnten nicht geladen werden. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Funktion um einen Wetter-API-Aufruf zu simulieren
    const simulateWeatherAPI = async (lat, lon, location = null) => {
        // In einer echten Anwendung würde hier ein echter API-Aufruf stehen
        // Wir simulieren eine Antwort für die Demo

        // Kurze Verzögerung simulieren
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Zufälliges Wetter generieren
        const conditions = Object.values(WEATHER_CONDITIONS);
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

        // Aktuelle Stunde ermitteln für die Tageszeit
        const hour = new Date().getHours();
        let daytime;

        if (hour >= 6 && hour < 10) {
            daytime = DAYTIMES.MORNING;
        } else if (hour >= 10 && hour < 16) {
            daytime = DAYTIMES.DAY;
        } else if (hour >= 16 && hour < 22) {
            daytime = DAYTIMES.EVENING;
        } else {
            daytime = DAYTIMES.NIGHT;
        }

        // Zufällige Temperatur je nach Wetterbedingung
        let temperature;
        switch (randomCondition) {
            case WEATHER_CONDITIONS.CLEAR:
                temperature = Math.floor(Math.random() * 15) + 15; // 15-30°C
                break;
            case WEATHER_CONDITIONS.SNOW:
                temperature = Math.floor(Math.random() * 10) - 10; // -10-0°C
                break;
            case WEATHER_CONDITIONS.RAIN:
            case WEATHER_CONDITIONS.THUNDERSTORM:
                temperature = Math.floor(Math.random() * 10) + 5; // 5-15°C
                break;
            default:
                temperature = Math.floor(Math.random() * 20) + 5; // 5-25°C
        }

        // Wetterbeschreibungen
        const descriptions = {
            [WEATHER_CONDITIONS.CLEAR]: 'Klar und sonnig',
            [WEATHER_CONDITIONS.PARTLY_CLOUDY]: 'Teilweise bewölkt',
            [WEATHER_CONDITIONS.CLOUDY]: 'Bewölkt',
            [WEATHER_CONDITIONS.RAIN]: 'Regnerisch',
            [WEATHER_CONDITIONS.THUNDERSTORM]: 'Gewitter',
            [WEATHER_CONDITIONS.SNOW]: 'Schneefall',
            [WEATHER_CONDITIONS.FOG]: 'Neblig',
            [WEATHER_CONDITIONS.WINDY]: 'Windig'
        };

        // Orts-Name basierend auf Parametern
        const locationName = location || (lat && lon ? 'Dein Standort' : 'Berlin');

        return {
            location: locationName,
            condition: randomCondition,
            temperature,
            description: descriptions[randomCondition] || 'Unbekannt',
            daytime,
            humidity: Math.floor(Math.random() * 50) + 30, // 30-80%
            windSpeed: Math.floor(Math.random() * 30) + 5, // 5-35 km/h
            timestamp: Date.now()
        };
    };

    // Wetterdaten verarbeiten und speichern
    const processWeatherData = (data) => {
        setWeatherData(data);

        // Prüfen, ob Automatisierungen für dieses Wetter vorhanden sind
        const matchingAutomations = weatherAutomations.filter(automation => {
            // Nur aktivierte Automatisierungen prüfen
            if (!automation.enabled) return false;

            // Grundbedingung: Wetter muss übereinstimmen
            if (automation.condition !== data.condition) return false;

            // Tageszeit prüfen, falls angegeben
            if (automation.daytime && automation.daytime !== data.daytime) return false;

            // Temperaturbereich prüfen, falls angegeben
            if (automation.minTemp !== null && data.temperature < automation.minTemp) return false;
            if (automation.maxTemp !== null && data.temperature > automation.maxTemp) return false;

            // Alle Bedingungen erfüllt
            return true;
        });

        // Erste passende Automatisierung ausführen
        if (matchingAutomations.length > 0) {
            const automation = matchingAutomations[0];
            console.log('Passende Wetterautomatisierung gefunden:', automation.name);

            // Aktion ausführen
            if (automation.action === 'preset') {
                // Voreinstellung verwenden
                const preset = WEATHER_LIGHT_PRESETS[data.condition]?.[data.daytime];
                if (preset) {
                    applyLightMode(preset);
                }
            } else if (automation.action === 'scene' && automation.sceneId) {
                // Szene aktivieren
                activateScene(automation.sceneId);
            }

            // Zeitstempel der letzten Ausführung aktualisieren
            const updatedAutomations = weatherAutomations.map(a =>
                a.id === automation.id ? { ...a, lastTriggered: Date.now() } : a
            );
            setWeatherAutomations(updatedAutomations);
            saveAutomations(updatedAutomations);
        }
    };

    // Lichtmodus auf ausgewählte Lampen anwenden
    const applyLightMode = async (lightPreset) => {
        try {
            // In einer echten App würden wir hier eine Gruppe von Lampen auswählen
            // Für die Demo verwenden wir alle verfügbaren Lampen
            const lightIds = Object.keys(lights);

            // Ändere für jede Lampe die Einstellungen
            for (const lightId of lightIds) {
                // Prüfen, ob die Lampe Farbe unterstützt
                const supportsColor = lights[lightId].state.hasOwnProperty('hue') &&
                    lights[lightId].state.hasOwnProperty('sat');

                // Neue Einstellungen basierend auf Funktionalität
                const newState = {
                    on: true,
                    bri: lightPreset.bri
                };

                // Farbwerte hinzufügen, wenn unterstützt
                if (supportsColor) {
                    newState.hue = lightPreset.hue;
                    newState.sat = lightPreset.sat;
                } else if (lightPreset.ct) {
                    // Farbtemperatur, falls unterstützt
                    newState.ct = lightPreset.ct;
                }

                // Lampe aktualisieren
                await fetch(`http://${bridgeIP}/api/${username}/lights/${lightId}/state`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newState)
                });
            }

            // Erfolgreiche Anwendung anzeigen
            setStatus(`Lichtmodus "${lightPreset.name}" wurde angewendet.`, 'success');
        } catch (error) {
            console.error('Fehler beim Anwenden des Lichtmodus:', error);
            setStatus('Fehler beim Anwenden des Lichtmodus: ' + error.message, 'error');
        }
    };

    // Szene aktivieren
    const activateScene = async (sceneId) => {
        try {
            const scene = scenes.find(s => s.id === sceneId);
            if (!scene) {
                throw new Error('Szene nicht gefunden.');
            }

            // Szene auf allen zugehörigen Lampen aktivieren
            await fetch(`http://${bridgeIP}/api/${username}/groups/0/action`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ scene: sceneId })
            });

            // Erfolgreiche Aktivierung anzeigen
            setStatus(`Szene "${scene.name}" wurde aktiviert.`, 'success');
        } catch (error) {
            console.error('Fehler beim Aktivieren der Szene:', error);
            setStatus('Fehler beim Aktivieren der Szene: ' + error.message, 'error');
        }
    };

    // Automatisierung erstellen/bearbeiten
    const handleSaveAutomation = (automation) => {
        if (automation.id && weatherAutomations.some(a => a.id === automation.id)) {
            // Bestehende Automatisierung aktualisieren
            const updatedAutomations = weatherAutomations.map(a =>
                a.id === automation.id ? automation : a
            );
            setWeatherAutomations(updatedAutomations);
            saveAutomations(updatedAutomations);
        } else {
            // Neue Automatisierung hinzufügen
            const newAutomations = [...weatherAutomations, automation];
            setWeatherAutomations(newAutomations);
            saveAutomations(newAutomations);
        }

        // Formular schließen
        setEditingAutomation(null);
    };

    // Automatisierung aktivieren/deaktivieren
    const toggleAutomation = (id) => {
        const updatedAutomations = weatherAutomations.map(a =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
        );
        setWeatherAutomations(updatedAutomations);
        saveAutomations(updatedAutomations);
    };

    // Automatisierung löschen
    const deleteAutomation = (id) => {
        if (window.confirm('Möchtest du diese Wetter-Automatisierung wirklich löschen?')) {
            const updatedAutomations = weatherAutomations.filter(a => a.id !== id);
            setWeatherAutomations(updatedAutomations);
            saveAutomations(updatedAutomations);
        }
    };

    // Status-Nachricht anzeigen
    const [status, setStatus] = useState({ message: '', type: '' });

    // Status-Nachricht aktualisieren
    const handleStatus = (message, type = 'info') => {
        setStatus({ message, type });
        // Nach 5 Sekunden ausblenden
        setTimeout(() => setStatus({ message: '', type: '' }), 5000);
    };

    return (
        <div className="weather-integration-view">
            <div className="weather-header">
                <h2 className="section-title">Wetter-Integration</h2>
                <div className="weather-actions">
                    <button onClick={() => setEditingAutomation({})}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Neue Wetter-Automatisierung
                    </button>
                </div>
            </div>

            <div className="weather-content">
                <div className="weather-section">
                    <h3>Aktuelles Wetter</h3>

                    <LocationSearchForm
                        onSearch={fetchWeatherByLocation}
                        loading={loading}
                    />

                    {loading ? (
                        <div className="loading">
                            <p>Wetterdaten werden geladen...</p>
                        </div>
                    ) : error ? (
                        <div className="status-message status-error">{error}</div>
                    ) : weatherData ? (
                        <WeatherCard
                            weather={weatherData}
                            onApplyLightMode={applyLightMode}
                        />
                    ) : (
                        <div className="empty-state">
                            <p>Keine Wetterdaten verfügbar.</p>
                        </div>
                    )}
                </div>

                <div className="automations-section">
                    <h3>Wetter-Automatisierungen</h3>

                    {weatherAutomations.length === 0 ? (
                        <div className="empty-state">
                            <p>Keine Wetter-Automatisierungen vorhanden. Erstelle deine erste Automatisierung!</p>
                        </div>
                    ) : (
                        <div className="weather-automations-list">
                            {weatherAutomations.map(automation => (
                                <WeatherAutomationCard
                                    key={automation.id}
                                    automation={automation}
                                    onEdit={setEditingAutomation}
                                    onToggle={toggleAutomation}
                                    onDelete={deleteAutomation}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {status.message && (
                <div className={`status-message status-${status.type}`}>
                    {status.message}
                </div>
            )}

            {editingAutomation && (
                <WeatherAutomationForm
                    automation={editingAutomation}
                    onSave={handleSaveAutomation}
                    onCancel={() => setEditingAutomation(null)}
                    scenes={scenes}
                />
            )}
        </div>
    );
};

export default WeatherIntegrationView;