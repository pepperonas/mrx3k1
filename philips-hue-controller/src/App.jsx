// App.jsx - Unterstützt Direkt-Modus und Proxy-Modus
import React, { useState, useEffect } from 'react';
import './App.css';
import LightCard from './components/LightCard';

function App() {
  const [bridgeIP, setBridgeIP] = useState('');
  const [username, setUsername] = useState('');
  const [connectedToBridge, setConnectedToBridge] = useState(false);
  const [lights, setLights] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ message: '', type: 'info' });
  const [connecting, setConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [useProxy, setUseProxy] = useState(false);

  // Basis-URL für API-Anfragen je nach Modus
  const getBaseUrl = (ip) => {
    return useProxy
        ? `http://localhost:8080/hue/${ip}`
        : `http://${ip}`;
  };

  // Gespeicherte Werte laden
  useEffect(() => {
    const savedBridgeIP = localStorage.getItem('hue-bridge-ip');
    const savedUsername = localStorage.getItem('hue-username');
    const savedUseProxy = localStorage.getItem('hue-use-proxy');

    if (savedBridgeIP) {
      setBridgeIP(savedBridgeIP);
    }

    if (savedUsername) {
      setUsername(savedUsername);
    }

    if (savedUseProxy === 'true') {
      setUseProxy(true);
    }

    if (savedBridgeIP && savedUsername) {
      // Verzögerte Verbindung um UI-Rendering zu gewährleisten
      const timer = setTimeout(() => {
        connectToBridge(savedBridgeIP, savedUsername);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Status setzen
  const setStatus = (message, type = 'info') => {
    setStatusMessage({ message, type });
    console.log(`[${type}] ${message}`);
  };

  // Bridge finden
  const discoverBridge = async () => {
    setLoading(true);
    setStatus('Suche nach Hue Bridge im Netzwerk...', 'info');

    try {
      // Versuche beide Methoden: mDNS (via Proxy) und offizielle Discovery-URL
      let bridges = [];

      // Methode 1: Offizielle Discovery-URL
      try {
        const response = await fetch('https://discovery.meethue.com/');
        bridges = await response.json();
      } catch (e) {
        console.log("Fehler bei der offiziellen Discovery-URL:", e);
        // Fehler ignorieren und mit der zweiten Methode fortfahren
      }

      // Methode 2: Lokale Discovery über den Proxy (falls aktiviert)
      if (useProxy && bridges.length === 0) {
        try {
          const response = await fetch('http://localhost:8080/hue/discovery');
          const proxyResult = await response.json();
          if (proxyResult && proxyResult.bridges) {
            bridges = [...bridges, ...proxyResult.bridges];
          }
        } catch (e) {
          console.log("Fehler bei der Proxy-Discovery:", e);
          // Fehler ignorieren
        }
      }

      if (bridges && bridges.length > 0) {
        const foundIP = bridges[0].internalipaddress;
        setBridgeIP(foundIP);
        localStorage.setItem('hue-bridge-ip', foundIP);
        setStatus(`Bridge gefunden: ${foundIP}`, 'success');
      } else {
        setStatus('Keine Bridge gefunden. Bitte gib die IP-Adresse manuell ein.', 'error');
      }
    } catch (error) {
      setStatus('Fehler bei der Bridge-Suche: ' + error.message, 'error');
    }

    setLoading(false);
  };

  // Verbindung zur Bridge aufbauen - Unterstützt beide Modi
  const connectToBridge = async (ip = bridgeIP, user = username) => {
    if (!ip) {
      setStatus('Bitte Bridge IP eingeben', 'error');
      return;
    }

    if (!user) {
      setStatus('Bitte API Username eingeben', 'error');
      return;
    }

    setLoading(true);
    setStatus('Verbinde mit Hue Bridge...', 'info');

    try {
      const baseUrl = getBaseUrl(ip);
      const endpoint = `${baseUrl}/api/${user}/lights`;

      console.log(`Versuche Verbindung: ${endpoint}`);
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.error && data.error[0]?.description?.includes('unauthorized')) {
        setStatus('Unauthorized. Bitte erstelle einen neuen Benutzer.', 'error');
      }
      // Prüfen ob es tatsächlich ein Lichterobjekt ist
      else if (typeof data === 'object' && !Array.isArray(data) && !data.error) {
        setConnectedToBridge(true);
        setLights(data);

        // Einstellungen speichern
        localStorage.setItem('hue-bridge-ip', ip);
        localStorage.setItem('hue-username', user);
        localStorage.setItem('hue-use-proxy', useProxy.toString());

        setStatus('Erfolgreich mit Hue Bridge verbunden', 'success');
      } else {
        console.log("Unerwartete Antwort:", data);
        setStatus('Verbindung fehlgeschlagen. Unerwartete Antwort.', 'error');

        // Falls wir im Direkt-Modus sind und CORS-Fehler auftreten könnten,
        // empfehlen wir den Proxy-Modus
        if (!useProxy) {
          setStatus('Verbindung fehlgeschlagen. Versuche den Proxy-Modus für CORS-Unterstützung.', 'warning');
        }
      }
    } catch (error) {
      console.error("Verbindungsfehler:", error);
      setStatus(`Verbindung fehlgeschlagen: ${error.message}`, 'error');

      // Bei CORS-Fehlern auf Proxy-Modus hinweisen
      if (!useProxy && error.message.includes('CORS')) {
        setStatus('CORS-Fehler erkannt. Aktiviere den Proxy-Modus und versuche es erneut.', 'warning');
      }
    }

    setLoading(false);
  };

  // Standard-Verbindungsversuch mit Link-Button
  const createUserWithLinkButton = async () => {
    if (!bridgeIP) {
      setStatus('Bitte Bridge IP eingeben', 'error');
      return;
    }

    setLoading(true);
    setConnecting(true);
    setConnectionAttempts(0);
    setStatus('Drücke den Link-Button auf deiner Hue Bridge...', 'info');

    // Speichere Bridge IP bereits vorab
    localStorage.setItem('hue-bridge-ip', bridgeIP);

    // Speichere Proxy-Einstellung
    localStorage.setItem('hue-use-proxy', useProxy.toString());

    // Starte den Versuchsprozess
    tryCreateUser();
  };

  // Versucht, einen Benutzer zu erstellen (mit Wiederholungen)
  const tryCreateUser = async () => {
    const MAX_ATTEMPTS = 5;
    const attemptNumber = connectionAttempts + 1;

    setConnectionAttempts(attemptNumber);
    setStatus(`Versuch ${attemptNumber}/${MAX_ATTEMPTS}...`, 'info');

    try {
      const baseUrl = getBaseUrl(bridgeIP);
      const endpoint = `${baseUrl}/api`;

      console.log(`Versuche User zu erstellen: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          devicetype: `hue_react_controller#${Date.now()}`
        })
      });

      const data = await response.json();
      console.log("Antwort:", data);

      if (data[0] && data[0].success) {
        // Erfolg!
        const newUsername = data[0].success.username;
        setUsername(newUsername);
        localStorage.setItem('hue-username', newUsername);
        setStatus(`ERFOLG! API-Key erhalten: ${newUsername}`, 'success');
        setConnecting(false);
        setLoading(false);

        // Gleich mit dem neuen Benutzer verbinden
        connectToBridge(bridgeIP, newUsername);
        return;
      } else if (data[0] && data[0].error && data[0].error.type === 101) {
        // Link-Button wurde nicht gedrückt
        setStatus('Link-Button wurde nicht gedrückt oder nicht erkannt.', 'warning');

        // Weitere Versuche starten, wenn das Maximum noch nicht erreicht ist
        if (attemptNumber < MAX_ATTEMPTS) {
          setTimeout(tryCreateUser, 2000);
          return;
        }
      } else {
        // Andere Fehler
        setStatus(`Unerwartete Antwort: ${JSON.stringify(data)}`, 'error');
      }
    } catch (error) {
      console.error("Fehler beim Erstellen des Users:", error);
      setStatus(`Fehler: ${error.message}`, 'error');

      // Bei CORS-Fehlern auf Proxy-Modus hinweisen
      if (!useProxy && error.message.includes('CORS')) {
        setUseProxy(true);
        localStorage.setItem('hue-use-proxy', 'true');
        setStatus('CORS-Fehler erkannt. Proxy-Modus wurde aktiviert. Probiere es erneut.', 'warning');
        setConnecting(false);
        setLoading(false);
        return;
      }
    }

    // Wenn wir hier ankommen, dann war der aktuelle Versuch nicht erfolgreich
    if (attemptNumber >= MAX_ATTEMPTS) {
      // Maximale Anzahl an Versuchen erreicht
      setStatus('Alle Verbindungsversuche sind fehlgeschlagen. Versuche es erneut.', 'error');
      setConnecting(false);
      setLoading(false);
    } else {
      // Nächsten Versuch starten
      setTimeout(tryCreateUser, 2000);
    }
  };

  // Verbindungsprozess abbrechen
  const cancelConnection = () => {
    setConnecting(false);
    setLoading(false);
    setStatus('Verbindungsversuch abgebrochen', 'info');
  };

  // Licht ein-/ausschalten
  const toggleLight = async (id, on) => {
    try {
      const baseUrl = getBaseUrl(bridgeIP);
      const response = await fetch(`${baseUrl}/api/${username}/lights/${id}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ on })
      });
      const data = await response.json();

      if (data[0]?.success) {
        setLights(prevLights => ({
          ...prevLights,
          [id]: {
            ...prevLights[id],
            state: {
              ...prevLights[id].state,
              on
            }
          }
        }));
      }
    } catch (error) {
      setStatus(`Fehler beim Schalten von Licht ${id}: ${error.message}`, 'error');
    }
  };

  // Helligkeit setzen
  const setBrightness = async (id, brightness) => {
    try {
      const baseUrl = getBaseUrl(bridgeIP);
      const response = await fetch(`${baseUrl}/api/${username}/lights/${id}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bri: parseInt(brightness) })
      });
      const data = await response.json();

      if (data[0]?.success) {
        setLights(prevLights => ({
          ...prevLights,
          [id]: {
            ...prevLights[id],
            state: {
              ...prevLights[id].state,
              bri: parseInt(brightness)
            }
          }
        }));
      }
    } catch (error) {
      setStatus(`Fehler beim Einstellen der Helligkeit von Licht ${id}: ${error.message}`, 'error');
    }
  };

  // Farbe setzen
  const setColor = async (id, hexColor) => {
    const hsv = hexToHsv(hexColor);

    try {
      const baseUrl = getBaseUrl(bridgeIP);
      const response = await fetch(`${baseUrl}/api/${username}/lights/${id}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hue: hsv.hue,
          sat: hsv.sat
        })
      });
      const data = await response.json();

      if (data[0]?.success) {
        setLights(prevLights => ({
          ...prevLights,
          [id]: {
            ...prevLights[id],
            state: {
              ...prevLights[id].state,
              hue: hsv.hue,
              sat: hsv.sat
            }
          }
        }));
      }
    } catch (error) {
      setStatus(`Fehler beim Einstellen der Farbe von Licht ${id}: ${error.message}`, 'error');
    }
  };

  // Daten zurücksetzen
  const resetConnection = () => {
    localStorage.removeItem('hue-bridge-ip');
    localStorage.removeItem('hue-username');
    localStorage.removeItem('hue-use-proxy');

    setBridgeIP('');
    setUsername('');
    setConnectedToBridge(false);
    setLights({});

    setStatus('Verbindungsdaten wurden zurückgesetzt. Du kannst dich nun neu verbinden.', 'info');
  };

  // Konvertierung: Hex zu HSV für die Hue API
  const hexToHsv = (hex) => {
    // Hex zu RGB
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;

    if (diff === 0) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    // Für Hue API: hue von 0-65535
    const hueForApi = Math.round((h / 360) * 65535);

    // Sättigung von 0-254
    const s = (max === 0) ? 0 : diff / max;
    const satForApi = Math.round(s * 254);

    return {
      hue: hueForApi,
      sat: satForApi
    };
  };

  return (
      <div className="app">
        <header>
          <h1>Philips Hue Controller</h1>
        </header>

        <div className="container">
          <div className="setup-section">
            <h2>Verbindung einrichten</h2>
            <div>
              <label htmlFor="bridge-ip">Bridge IP:</label>
              <input
                  type="text"
                  id="bridge-ip"
                  placeholder="z.B. 192.168.2.35"
                  value={bridgeIP}
                  onChange={(e) => setBridgeIP(e.target.value)}
                  disabled={connecting}
              />
            </div>
            <div>
              <label htmlFor="username">API Username:</label>
              <input
                  type="text"
                  id="username"
                  placeholder="API Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={connecting}
              />
            </div>
            <div className="checkbox-container">
              <label>
                <input
                    type="checkbox"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                    disabled={connecting}
                />
                Proxy-Modus verwenden (für CORS-Kompatibilität)
              </label>
            </div>
            <div>
              <button
                  onClick={() => connectToBridge()}
                  disabled={connecting || !bridgeIP || !username}
              >
                Verbinden
              </button>
              <button
                  onClick={discoverBridge}
                  disabled={connecting}
              >
                Bridge finden
              </button>
              {!connecting ? (
                  <>
                    <button
                        onClick={createUserWithLinkButton}
                        disabled={!bridgeIP}
                        className="create-button"
                    >
                      Neuen Benutzer erstellen
                    </button>
                    {(bridgeIP || username) && (
                        <button
                            onClick={resetConnection}
                            className="reset-button"
                        >
                          Zurücksetzen
                        </button>
                    )}
                  </>
              ) : (
                  <button
                      onClick={cancelConnection}
                      className="cancel-btn"
                  >
                    Abbrechen
                  </button>
              )}
            </div>
            {statusMessage.message && (
                <div className={`status-message status-${statusMessage.type}`}>
                  {statusMessage.message}
                </div>
            )}

            {connecting && (
                <div className="connection-progress">
                  <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(connectionAttempts / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p>Drücke den Link-Button auf deiner Hue Bridge...</p>
                </div>
            )}
          </div>

          {loading && !connecting && (
              <div className="loading">
                <p>Lade Daten...</p>
              </div>
          )}

          {connectedToBridge && !loading && (
              <div className="lights-section">
                <h2>Verfügbare Lampen</h2>
                <div className="lights-container">
                  {Object.keys(lights).map(id => (
                      <LightCard
                          key={id}
                          id={id}
                          light={lights[id]}
                          toggleLight={toggleLight}
                          setBrightness={setBrightness}
                          setColor={setColor}
                      />
                  ))}
                </div>
              </div>
          )}

          <div className="mode-info">
            <span>{useProxy ? 'Proxy-Modus: CORS-kompatibel' : 'Direkt-Modus: Kommunikation direkt mit Bridge'}</span>
          </div>
        </div>
      </div>
  );
}

export default App;