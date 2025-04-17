import React from 'react';

const LightCard = ({ id, light, toggleLight, setBrightness, setColor }) => {
  // Farbe aus Licht-Status ermitteln
  const getColorFromState = (state) => {
    if (state.hue === undefined || state.sat === undefined) {
      // Für weiße Lampen
      const bri = state.bri || 254;
      const briPercentage = (bri / 254) * 100;
      return `hsl(0, 0%, ${briPercentage}%)`;
    }

    // Für Farblampen
    const hue = (state.hue / 65535) * 360;
    const sat = (state.sat / 254) * 100;
    const bri = (state.bri || 254) / 254 * 100;

    return `hsl(${hue}, ${sat}%, ${bri}%)`;
  };

  // Hex-Farbe aus Licht-Status ermitteln
  const getHexColor = (state) => {
    if (state.hue === undefined || state.sat === undefined) {
      return '#ffffff';
    }

    return hsvToHex(state.hue, state.sat, state.bri || 254);
  };

  // Konvertierung: HSV zu Hex
  const hsvToHex = (h, s, v) => {
    // Konvertieren der Hue-API-Werte zu Standard-HSV
    h = (h / 65535) * 360;
    s = s / 254;
    v = v / 254;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r, g, b;

    if (h >= 0 && h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    b = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  };

  return (
      <div className="light-card" data-light-id={id}>
        <div className="light-header">
          <div
              className="color-indicator"
              style={{
                backgroundColor: light.state.on
                    ? getColorFromState(light.state)
                    : '#333'
              }}
          />
          <h3>{light.name}</h3>
        </div>

        <label className="switch">
          <input
              type="checkbox"
              checked={light.state.on}
              onChange={(e) => toggleLight(id, e.target.checked)}
          />
          <span className="slider"></span>
        </label>

        <div className="light-controls">
          <div>
            <label>Helligkeit:</label>
            <input
                type="range"
                min="1"
                max="254"
                value={light.state.bri || 254}
                onChange={(e) => setBrightness(id, e.target.value)}
            />
          </div>

          {light.state.hue !== undefined && light.state.sat !== undefined && (
              <div>
                <label>Farbe:</label>
                <input
                    type="color"
                    className="color-picker"
                    value={getHexColor(light.state)}
                    onChange={(e) => setColor(id, e.target.value)}
                />
              </div>
          )}
        </div>
      </div>
  );
};

export default LightCard;