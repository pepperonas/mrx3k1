// src/components/DynamicEffectsView.jsx - Erweiterte dynamische Lichteffekte
import React, { useState, useEffect, useRef } from 'react';
import '../styles/effects.css';

// Vordefinierte Effekte
const PRESET_EFFECTS = [
    {
        id: 'candlelight',
        name: 'Kerzenlicht',
        icon: 'flame',
        settings: {
            intensity: 60,
            speed: 45,
            colorRange: 3000,
            hueBase: 5000, // Warmes Orangegelb
            satBase: 200,
            briRange: 30,
            briBase: 150
        }
    },
    {
        id: 'fireplace',
        name: 'Kaminfeuer',
        icon: 'fire',
        settings: {
            intensity: 80,
            speed: 55,
            colorRange: 4000,
            hueBase: 6000, // Rotorange
            satBase: 240,
            briRange: 40,
            briBase: 180
        }
    },
    {
        id: 'ocean',
        name: 'Meereswellen',
        icon: 'droplet',
        settings: {
            intensity: 50,
            speed: 30,
            colorRange: 10000,
            hueBase: 45000, // Blau
            satBase: 230,
            briRange: 20,
            briBase: 140
        }
    },
    {
        id: 'aurora',
        name: 'Nordlicht',
        icon: 'sun',
        settings: {
            intensity: 70,
            speed: 25,
            colorRange: 25000,
            hueBase: 40000, // Lila/Blau
            satBase: 220,
            briRange: 30,
            briBase: 160
        }
    },
    {
        id: 'rainbow',
        name: 'Regenbogen',
        icon: 'rainbow',
        settings: {
            intensity: 100,
            speed: 35,
            colorRange: 65000,
            hueBase: 0, // Vollständiger Farbkreis
            satBase: 254,
            briRange: 0,
            briBase: 200
        }
    },
    {
        id: 'thunderstorm',
        name: 'Gewitter',
        icon: 'cloud-lightning',
        settings: {
            intensity: 90,
            speed: 80,
            colorRange: 2000,
            hueBase: 45000, // Blaues Licht
            satBase: 180,
            briRange: 150,
            briBase: 100,
            flash: true,
            flashChance: 0.05,
            flashDuration: 150
        }
    }
];

// Icon-Komponente für die Effekte
const EffectIcon = ({ type }) => {
    return (
        <div className="effect-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {type === 'flame' && (
                    <>
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                    </>
                )}
                {type === 'fire' && (
                    <>
                        <path d="M8 16s1.5-2 1.5-4c0-1.5-.5-3-2-5 .5 3 1.5 4.5 1.5 6 0 1.5-.5 3-1.5 4 0 0 3-1 3-4.5-1 0-1.728.402-2.5 1-1-1.5-1-4-1-5.5 2 1.5 3 4 3 6.5 0 2.5-2 3.5-2 3.5z" />
                        <path d="M12 16s1-1 1-3.5c0-1.5-.5-3-1.5-4 .5 2 .5 3.5 0 5.5 0 0 2-1 2-3.5-.5 0-1 .5-1.5 1-1-1.5-1-4-1-5.5 1.5 1.5 2.5 3 2.5 5.5 0 2-1.5 3.5-1.5 3.5z" />
                    </>
                )}
                {type === 'droplet' && (
                    <>
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </>
                )}
                {type === 'sun' && (
                    <>
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </>
                )}
                {type === 'rainbow' && (
                    <>
                        <path d="M8 13A4 4 0 0 1 16 13" />
                        <path d="M4 11A8 8 0 0 1 20 11" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                        <path d="M2 12a10 10 0 0 1 10-10" />
                    </>
                )}
                {type === 'cloud-lightning' && (
                    <>
                        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
                        <polyline points="13 11 9 17 15 17 11 23" />
                    </>
                )}
                {type === 'custom' && (
                    <>
                        <path d="M12 3v3" />
                        <path d="M19 12h3" />
                        <path d="M12 19v3" />
                        <path d="M2 12h3" />
                        <path d="M19.07 4.93l-2.12 2.12" />
                        <path d="M16.95 16.95l2.12 2.12" />
                        <path d="M4.93 19.07l2.12-2.12" />
                        <path d="M7.05 7.05L4.93 4.93" />
                    </>
                )}
            </svg>
        </div>
    );
};

// Karte für einen einzelnen Effekt
const EffectCard = ({ effect, active, onSelect, onCustomize }) => {
    return (
        <div
            className={`effect-card ${active ? 'active' : ''}`}
            onClick={() => onSelect(effect.id)}
        >
            <EffectIcon type={effect.icon} />
            <div className="effect-details">
                <h3>{effect.name}</h3>
                {active && (
                    <button
                        className="customize-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCustomize(effect);
                        }}
                    >
                        Anpassen
                    </button>
                )}
            </div>
        </div>
    );
};

// Effekt-Anpassungsdialog
const EffectCustomizeModal = ({ effect, onSave, onCancel, lights }) => {
    const [settings, setSettings] = useState({...effect.settings});
    const [selectedLights, setSelectedLights] = useState([]);
    const [previewActive, setPreviewActive] = useState(false);
    const previewTimerRef = useRef(null);

    // Beim Öffnen des Dialogs, wähle alle Lichter standardmäßig
    useEffect(() => {
        setSelectedLights(Object.keys(lights));
        return () => {
            // Cleanup bei Schließen des Dialogs
            if (previewTimerRef.current) {
                clearInterval(previewTimerRef.current);
            }
        };
    }, [lights]);

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const toggleLight = (lightId) => {
        setSelectedLights(prev =>
            prev.includes(lightId)
                ? prev.filter(id => id !== lightId)
                : [...prev, lightId]
        );
    };

    const togglePreview = () => {
        if (previewActive) {
            // Stoppe den Preview
            if (previewTimerRef.current) {
                clearInterval(previewTimerRef.current);
                previewTimerRef.current = null;
            }
            setPreviewActive(false);
        } else {
            // Starte den Preview
            setPreviewActive(true);
            // Implementierung einer Preview-Funktion hier
            // Diese würde normalerweise die Lichter mit den aktuellen Einstellungen steuern
            previewTimerRef.current = setInterval(() => {
                console.log("Vorschau läuft mit Einstellungen:", settings);
                // Hier würde die tatsächliche Lichtsteuerung erfolgen
            }, 1000);
        }
    };

    const handleSave = () => {
        onSave({
            ...effect,
            settings,
            lights: selectedLights
        });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Effekt anpassen: {effect.name}</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <div className="effect-settings">
                    <div className="setting-group">
                        <h3>Intensität</h3>
                        <div className="setting-controls">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={settings.intensity}
                                onChange={(e) => handleSettingChange('intensity', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{settings.intensity}%</span>
                        </div>
                    </div>

                    <div className="setting-group">
                        <h3>Geschwindigkeit</h3>
                        <div className="setting-controls">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={settings.speed}
                                onChange={(e) => handleSettingChange('speed', parseInt(e.target.value))}
                            />
                            <span className="setting-value">{settings.speed}%</span>
                        </div>
                    </div>

                    <div className="setting-group">
                        <h3>Farbauswahl</h3>
                        <div className="color-controls">
                            <div className="color-field">
                                <label>Basis-Farbton</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="65535"
                                    value={settings.hueBase}
                                    onChange={(e) => handleSettingChange('hueBase', parseInt(e.target.value))}
                                />
                                <div
                                    className="color-preview"
                                    style={{
                                        backgroundColor: `hsl(${(settings.hueBase / 65535) * 360}, ${(settings.satBase / 254) * 100}%, 50%)`
                                    }}
                                ></div>
                            </div>

                            <div className="color-field">
                                <label>Farbtonbereich</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="65535"
                                    value={settings.colorRange}
                                    onChange={(e) => handleSettingChange('colorRange', parseInt(e.target.value))}
                                />
                            </div>

                            <div className="color-field">
                                <label>Sättigung</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="254"
                                    value={settings.satBase}
                                    onChange={(e) => handleSettingChange('satBase', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="setting-group">
                        <h3>Helligkeit</h3>
                        <div className="brightness-controls">
                            <div className="brightness-field">
                                <label>Grundhelligkeit</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="254"
                                    value={settings.briBase}
                                    onChange={(e) => handleSettingChange('briBase', parseInt(e.target.value))}
                                />
                            </div>

                            <div className="brightness-field">
                                <label>Helligkeitsschwankung</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={settings.briRange}
                                    onChange={(e) => handleSettingChange('briRange', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {effect.id === 'thunderstorm' && (
                        <div className="setting-group">
                            <h3>Blitz-Effekt</h3>
                            <div className="flash-controls">
                                <div className="control-row">
                                    <label className="checkbox-container">
                                        <input
                                            type="checkbox"
                                            checked={settings.flash || false}
                                            onChange={(e) => handleSettingChange('flash', e.target.checked)}
                                        />
                                        <span>Blitz-Effekt aktivieren</span>
                                    </label>
                                </div>
                                <div className="flash-field">
                                    <label>Häufigkeit</label>
                                    <input
                                        type="range"
                                        min="0.01"
                                        max="0.2"
                                        step="0.01"
                                        value={settings.flashChance}
                                        onChange={(e) => handleSettingChange('flashChance', parseFloat(e.target.value))}
                                        disabled={!settings.flash}
                                    />

                                    <span className="setting-value">{settings.flashDuration}ms</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="setting-group">
                        <h3>Lampenauswahl</h3>
                        <div className="lights-grid">
                            {Object.entries(lights).map(([id, light]) => (
                                <div key={id} className="light-checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={selectedLights.includes(id)}
                                            onChange={() => toggleLight(id)}
                                        />
                                        {light.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className={`preview-button ${previewActive ? 'active' : ''}`}
                        onClick={togglePreview}
                    >
                        {previewActive ? 'Vorschau stoppen' : 'Vorschau starten'}
                    </button>
                    <button className="reset-button" onClick={onCancel}>Abbrechen</button>
                    <button onClick={handleSave}>Speichern & Aktivieren</button>
                </div>
            </div>
        </div>
    );
};

// Animation-Dienst für dynamische Effekte
class EffectAnimationService {
    constructor(bridgeIP, username, effect, callback = null) {
        this.bridgeIP = bridgeIP;
        this.username = username;
        this.effect = effect;
        this.callback = callback;
        this.isRunning = false;
        this.animationFrame = null;
        this.lastUpdateTime = 0;
        this.lightStates = {}; // Aktuelle Zustände der Lichter speichern
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    animate() {
        if (!this.isRunning) return;

        const now = Date.now();
        // Aktualisiere Lichter nur alle X ms, abhängig von der Geschwindigkeit
        // Schnellere Geschwindigkeit = häufigere Updates
        const updateInterval = Math.max(50, 500 - (this.effect.settings.speed * 4.5));

        if (now - this.lastUpdateTime > updateInterval) {
            this.updateLights();
            this.lastUpdateTime = now;
        }

        this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    }

    updateLights() {
        if (!this.effect.lights || this.effect.lights.length === 0) return;

        // Für jedes Licht im Effekt
        this.effect.lights.forEach(lightId => {
            // Berechne neuen Lichtzustand basierend auf dem Effekt-Typ und Einstellungen
            const newState = this.calculateLightState(lightId);

            // Wende den Zustand auf das Licht an
            this.setLightState(lightId, newState);
        });

        // Callback mit aktuellen Zuständen aufrufen, falls vorhanden
        if (this.callback) {
            this.callback(this.lightStates);
        }
    }

    calculateLightState(lightId) {
        const settings = this.effect.settings;
        let state = {};

        // Basis-Zustand
        state.on = true;

        // Werte abhängig vom Effekt berechnen
        switch (this.effect.id) {
            case 'candlelight':
            case 'fireplace':
                // Warmes Flackern mit zufälligen Änderungen in Helligkeit und leicht in Farbe
                state.hue = settings.hueBase + Math.random() * settings.colorRange - settings.colorRange / 2;
                state.sat = settings.satBase;
                state.bri = settings.briBase + Math.round(Math.random() * settings.briRange - settings.briRange / 2);
                state.transitiontime = 1; // Schnelle Übergänge für Flackern
                break;

            case 'ocean':
                // Langsame, sanfte Wellenbewegungen
                const t = Date.now() / 1000; // Zeit in Sekunden
                const waveSpeed = settings.speed / 50; // Normalisierte Geschwindigkeit

                // Sinuswelle für blaue Farbtöne
                state.hue = settings.hueBase + Math.sin(t * waveSpeed) * (settings.colorRange / 2);
                state.sat = settings.satBase;
                state.bri = settings.briBase + Math.sin(t * waveSpeed * 0.7) * (settings.briRange / 2);
                state.transitiontime = 2; // Sanftere Übergänge
                break;

            case 'aurora':
                // Langsame, weite Farbänderungen
                const time = Date.now() / 1000;
                const auroraSpeed = settings.speed / 100;

                // Komplexere Bewegung mit mehreren Sinuswellen
                state.hue = settings.hueBase +
                    Math.sin(time * auroraSpeed) * settings.colorRange / 2 +
                    Math.sin(time * auroraSpeed * 0.7) * settings.colorRange / 4;
                state.sat = settings.satBase;
                state.bri = settings.briBase + Math.sin(time * auroraSpeed * 0.5) * (settings.briRange / 2);
                state.transitiontime = 3; // Sehr sanfte Übergänge
                break;

            case 'rainbow':
                // Fortlaufender Regenbogen-Effekt
                const rainbowOffset = (lightId % 3) * 21845; // Versatz für verschiedene Lichter
                const rainbowTime = Date.now() / (110 - settings.speed); // Geschwindigkeitsabhängig
                state.hue = (rainbowTime + rainbowOffset) % 65535;
                state.sat = settings.satBase;
                state.bri = settings.briBase;
                state.transitiontime = 1;
                break;

            case 'thunderstorm':
                // Grundbeleuchtung mit gelegentlichen Blitzen
                state.hue = settings.hueBase + (Math.random() - 0.5) * settings.colorRange;
                state.sat = settings.satBase;
                state.bri = settings.briBase;

                // Zufällige Blitze
                if (settings.flash && Math.random() < settings.flashChance) {
                    state.bri = 254; // Maximale Helligkeit
                    state.sat = 20;  // Fast weiß
                    state.transitiontime = 0; // Sofortiger Übergang

                    // Zurücksetzen nach Blitz (wird später durch einen Timer implementiert)
                    setTimeout(() => {
                        this.setLightState(lightId, {
                            hue: settings.hueBase + (Math.random() - 0.5) * settings.colorRange,
                            sat: settings.satBase,
                            bri: settings.briBase,
                            transitiontime: 1
                        });
                    }, settings.flashDuration);
                } else {
                    state.transitiontime = 2;
                }
                break;

            default:
                // Standardeffekt für benutzerdefinierte oder unbekannte Effekte
                const defaultTime = Date.now() / 1000;
                state.hue = (settings.hueBase + (Math.sin(defaultTime * settings.speed / 50) * settings.colorRange / 2)) % 65535;
                state.sat = settings.satBase;
                state.bri = settings.briBase + (Math.sin(defaultTime * settings.speed / 80) * settings.briRange / 2);
                state.transitiontime = 2;
        }

        // Stelle sicher, dass Werte im gültigen Bereich sind
        state.hue = Math.max(0, Math.min(65535, Math.round(state.hue)));
        state.sat = Math.max(0, Math.min(254, Math.round(state.sat)));
        state.bri = Math.max(1, Math.min(254, Math.round(state.bri)));

        // Speichere den aktuellen Zustand
        this.lightStates[lightId] = {...state};

        return state;
    }

    async setLightState(lightId, state) {
        try {
            const response = await fetch(`http://${this.bridgeIP}/api/${this.username}/lights/${lightId}/state`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(state)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Fehler beim Setzen des Lichtzustands für ${lightId}:`, error);
        }
    }
}

// Hauptkomponente für die dynamischen Effekte
const DynamicEffectsView = ({ lights, bridgeIP, username }) => {
    const [effects, setEffects] = useState(PRESET_EFFECTS);
    const [activeEffectId, setActiveEffectId] = useState(null);
    const [customizing, setCustomizing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const animationServiceRef = useRef(null);

    // Bereinige Animation beim Unmounten
    useEffect(() => {
        return () => {
            if (animationServiceRef.current) {
                animationServiceRef.current.stop();
            }
        };
    }, []);

    // Effekt auswählen und aktivieren
    const selectEffect = (effectId) => {
        // Stoppe vorherigen Effekt falls vorhanden
        if (animationServiceRef.current) {
            animationServiceRef.current.stop();
            animationServiceRef.current = null;
        }

        if (activeEffectId === effectId) {
            // Deaktivieren, wenn bereits aktiv
            setActiveEffectId(null);
            return;
        }

        // Aktiviere den neuen Effekt
        setActiveEffectId(effectId);
        const selectedEffect = effects.find(e => e.id === effectId);

        if (!selectedEffect) return;

        // Starte Animations-Service für den ausgewählten Effekt
        animationServiceRef.current = new EffectAnimationService(
            bridgeIP,
            username,
            {
                ...selectedEffect,
                lights: Object.keys(lights).slice(0, 3) // Standardmäßig die ersten drei Lichter
            }
        );

        animationServiceRef.current.start();
    };

    // Öffne Anpassungsdialog
    const customizeEffect = (effect) => {
        setCustomizing(effect);
    };

    // Speichere angepassten Effekt
    const saveCustomizedEffect = (customizedEffect) => {
        // Aktualisiere den Effekt in der Liste
        setEffects(prev => prev.map(e =>
            e.id === customizedEffect.id ? { ...e, settings: customizedEffect.settings } : e
        ));

        // Stoppe aktuellen Animations-Service
        if (animationServiceRef.current) {
            animationServiceRef.current.stop();
        }

        // Starte neuen mit angepassten Einstellungen
        animationServiceRef.current = new EffectAnimationService(
            bridgeIP,
            username,
            customizedEffect
        );

        animationServiceRef.current.start();

        // Schließe Dialog
        setCustomizing(null);
    };

    // Benutzerdefinierten Effekt erstellen
    const createCustomEffect = () => {
        // Erstelle einen neuen Effekt mit Standardeinstellungen
        const newEffect = {
            id: `custom-${Date.now()}`,
            name: 'Mein Effekt',
            icon: 'custom',
            settings: {
                intensity: 50,
                speed: 40,
                colorRange: 10000,
                hueBase: 20000,
                satBase: 200,
                briRange: 30,
                briBase: 150
            }
        };

        // Füge den neuen Effekt zur Liste hinzu
        setEffects(prev => [...prev, newEffect]);

        // Öffne direkt den Anpassungsdialog
        customizeEffect(newEffect);
    };

    // Verwerfe Anpassungen
    const cancelCustomization = () => {
        setCustomizing(null);
    };

    return (
        <div className="effects-view">
            <div className="effects-header">
                <h2 className="section-title">Dynamische Effekte</h2>
                <button onClick={createCustomEffect}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Neuer Effekt
                </button>
            </div>

            {loading ? (
                <div className="loading">
                    <p>Lade Effekte...</p>
                </div>
            ) : error ? (
                <div className="status-message status-error">{error}</div>
            ) : (
                <>
                    <div className="effects-grid">
                        {effects.map(effect => (
                            <EffectCard
                                key={effect.id}
                                effect={effect}
                                active={activeEffectId === effect.id}
                                onSelect={selectEffect}
                                onCustomize={customizeEffect}
                            />
                        ))}
                    </div>

                    {activeEffectId && (
                        <div className="active-effect-info">
                            <p>
                                <strong>Aktiver Effekt:</strong> {effects.find(e => e.id === activeEffectId)?.name}
                                <button
                                    className="stop-button"
                                    onClick={() => selectEffect(activeEffectId)} // Deaktiviert den Effekt
                                >
                                    Stoppen
                                </button>
                            </p>
                        </div>
                    )}
                </>
            )}

            {customizing && (
                <EffectCustomizeModal
                    effect={customizing}
                    onSave={saveCustomizedEffect}
                    onCancel={cancelCustomization}
                    lights={lights}
                />
            )}
        </div>
    );
};

export default DynamicEffectsView;