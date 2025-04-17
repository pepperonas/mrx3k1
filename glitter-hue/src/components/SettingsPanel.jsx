// SettingsPanel.jsx - Komponente für Disco-Modus-Einstellungen
import React from 'react';

const SettingsPanel = ({ discoSettings, updateSettings, lights, discoMode, toggleDiscoMode }) => {
    const handleFocusChange = (e) => {
        updateSettings({ focus: e.target.value });
    };

    const handleIntensityChange = (e) => {
        updateSettings({ intensity: parseInt(e.target.value) });
    };

    const handleSpeedChange = (e) => {
        updateSettings({ speed: parseInt(e.target.value) });
    };

    const handleColorSchemeChange = (e) => {
        updateSettings({ colorScheme: e.target.value });
    };

    const handleLightToggle = (lightId) => {
        const currentLights = [...discoSettings.lightsToInclude];

        if (currentLights.includes(lightId)) {
            updateSettings({
                lightsToInclude: currentLights.filter(id => id !== lightId)
            });
        } else {
            updateSettings({
                lightsToInclude: [...currentLights, lightId]
            });
        }
    };

    const handleSelectAllLights = () => {
        updateSettings({
            lightsToInclude: Object.keys(lights)
        });
    };

    const handleDeselectAllLights = () => {
        updateSettings({
            lightsToInclude: []
        });
    };

    return (
        <div className="settings-panel">
            <div className="disco-header">
                <h2>Disco Light Modus</h2>
                <div className="disco-switch">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={discoMode}
                            onChange={toggleDiscoMode}
                        />
                        <span className="slider"></span>
                    </label>
                    <span className="disco-label">{discoMode ? 'Aktiv' : 'Inaktiv'}</span>
                </div>
            </div>

            {discoMode && (
                <div className="disco-message">
                    <p>Musik abspielt wird durch das Mikrofon erkannt und zur Steuerung der Lichter verwendet.</p>
                </div>
            )}

            <div className="disco-settings">
                <div className="setting-group">
                    <h3>Fokus</h3>
                    <div className="setting-controls">
                        <select
                            value={discoSettings.focus}
                            onChange={handleFocusChange}
                            className="focus-select"
                        >
                            <option value="bass">Bass</option>
                            <option value="mid">Mitteltöne</option>
                            <option value="treble">Höhen</option>
                            <option value="vocals">Gesang</option>
                            <option value="balanced">Ausgewogen</option>
                        </select>
                    </div>
                </div>

                <div className="setting-group">
                    <h3>Intensität</h3>
                    <div className="setting-controls">
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={discoSettings.intensity}
                            onChange={handleIntensityChange}
                        />
                        <span className="setting-value">{discoSettings.intensity}%</span>
                    </div>
                </div>

                <div className="setting-group">
                    <h3>Geschwindigkeit</h3>
                    <div className="setting-controls">
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={discoSettings.speed}
                            onChange={handleSpeedChange}
                        />
                        <span className="setting-value">{discoSettings.speed}%</span>
                    </div>
                </div>

                <div className="setting-group">
                    <h3>Farbschema</h3>
                    <div className="setting-controls">
                        <select
                            value={discoSettings.colorScheme}
                            onChange={handleColorSchemeChange}
                            className="color-scheme-select"
                        >
                            <option value="rainbow">Regenbogen</option>
                            <option value="warm">Warme Farben</option>
                            <option value="cool">Kühle Farben</option>
                            <option value="mono">Einfarbig</option>
                        </select>
                    </div>
                </div>

                <div className="setting-group light-selection">
                    <h3>Lichter</h3>
                    <div className="light-selection-buttons">
                        <button onClick={handleSelectAllLights}>Alle auswählen</button>
                        <button onClick={handleDeselectAllLights}>Keine auswählen</button>
                    </div>
                    <div className="light-checkboxes">
                        {Object.keys(lights).map(lightId => (
                            <div key={lightId} className="light-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={discoSettings.lightsToInclude.includes(lightId)}
                                        onChange={() => handleLightToggle(lightId)}
                                    />
                                    {lights[lightId].name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;