// SettingsPanel.jsx - Komponente für Disco-Modus-Einstellungen im BrainBuster-Stil
import React from 'react';

const SettingsPanel = ({ discoSettings, updateSettings, lights, discoMode, toggleDiscoMode, isSecureConnection }) => {
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
                <h2 className="section-title">Disco Light Modus</h2>
                <div className="disco-switch">
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={discoMode}
                            onChange={toggleDiscoMode}
                            disabled={!isSecureConnection}
                        />
                        <span className="slider"></span>
                    </label>
                    <span className="disco-label">{discoMode ? 'Aktiv' : 'Inaktiv'}</span>
                </div>
            </div>

            {!isSecureConnection && (
                <div className="status-message status-warning">
                    <p><strong>Achtung:</strong> Die Disco-Funktionalität ist in der Web-App nur über HTTPS verfügbar.</p>
                    <p>Da die Philips Hue Bridge kein HTTPS unterstützt, kann der Browser aus Sicherheitsgründen nicht auf dein Mikrofon zugreifen.</p>
                    <p style={{marginTop: '0.5rem'}}><a href="https://github.com/yourusername/glitterhue/releases" style={{color: '#ffad33', textDecoration: 'underline'}}>Lade die Electron Desktop-Version herunter</a>, um die Disco-Funktionalität zu nutzen.</p>
                </div>
            )}

            {discoMode && isSecureConnection && (
                <div className="disco-message">
                    <p>Musik wird durch das Mikrofon erkannt und zur Steuerung der Lichter verwendet.</p>
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
                            disabled={!isSecureConnection}
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
                            disabled={!isSecureConnection}
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
                            disabled={!isSecureConnection}
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
                            disabled={!isSecureConnection}
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
                        <button onClick={handleSelectAllLights} disabled={!isSecureConnection}>Alle auswählen</button>
                        <button onClick={handleDeselectAllLights} disabled={!isSecureConnection}>Keine auswählen</button>
                    </div>
                    <div className="light-checkboxes">
                        {Object.keys(lights).map(lightId => (
                            <div key={lightId} className="light-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={discoSettings.lightsToInclude.includes(lightId)}
                                        onChange={() => handleLightToggle(lightId)}
                                        disabled={!isSecureConnection}
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