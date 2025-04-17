// App.jsx - Verbesserte GUI mit Musikvisualisierung
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import LightCard from './components/LightCard';
import MusicVisualizer from './components/MusicVisualizer';
import { Tabs, Tab } from './components/Tabs';
import SettingsPanel from './components/SettingsPanel';

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
  const [activeTab, setActiveTab] = useState('lights');
  const [discoMode, setDiscoMode] = useState(false);
  const [discoSettings, setDiscoSettings] = useState({
    focus: 'balanced', // 'bass', 'mid', 'treble', 'vocals', 'balanced'
    intensity: 50,
    speed: 50,
    colorScheme: 'rainbow', // 'rainbow', 'warm', 'cool', 'mono'
    lightsToInclude: []
  });

  // Referenz für den Media-Analyzer
  const audioAnalyzerRef = useRef(null);

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
    const savedDiscoSettings = localStorage.getItem('hue-disco-settings');

    if (savedBridgeIP) {
      setBridgeIP(savedBridgeIP);
    }

    if (savedUsername) {
      setUsername(savedUsername);
    }

    if (savedUseProxy === 'true') {
      setUseProxy(true);
    }

    if (savedDiscoSettings) {
      try {
        setDiscoSettings(JSON.parse(savedDiscoSettings));
      } catch (e) {
        console.error("Fehler beim Laden der Disco-Einstellungen:", e);
      }
    }

    if (savedBridgeIP && savedUsername) {
      // Verzögerte Verbindung um UI-Rendering zu gewährleisten
      const timer = setTimeout(() => {
        connectToBridge(savedBridgeIP, savedUsername);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Starte/Stoppe Disco-Modus
  useEffect(() => {
    if (discoMode) {
      startDiscoMode();
    } else {
      stopDiscoMode();
    }

    return () => {
      // Cleanup wenn Komponente entfernt wird
      stopDiscoMode();
    };
  }, [discoMode, discoSettings]);

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

        // Setze Standard-Lichter für Disco-Modus bei erstem Verbinden
        if (discoSettings.lightsToInclude.length === 0) {
          const allLightIds = Object.keys(data);
          setDiscoSettings(prev => {
            const updated = { ...prev, lightsToInclude: allLightIds };
            localStorage.setItem('hue-disco-settings', JSON.stringify(updated));
            return updated;
          });
        }

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

  // Farbe und Helligkeit setzen (für den Disco-Modus)
  const setLightState = async (id, state) => {
    try {
      const baseUrl = getBaseUrl(bridgeIP);
      const response = await fetch(`${baseUrl}/api/${username}/lights/${id}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(state)
      });

      const data = await response.json();

      if (data[0]?.success) {
        // Optional: Lokales State-Update für bessere Performance
        setLights(prevLights => ({
          ...prevLights,
          [id]: {
            ...prevLights[id],
            state: {
              ...prevLights[id].state,
              ...state
            }
          }
        }));
      }
    } catch (error) {
      console.error(`Fehler beim Setzen des Lichtzustands für ${id}:`, error);
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

  // Disco-Modus starten
  const startDiscoMode = () => {
    if (!audioAnalyzerRef.current) {
      audioAnalyzerRef.current = new AudioAnalyzer(discoSettings, processAudioData);
      audioAnalyzerRef.current.start();
    }
  };

  // Disco-Modus stoppen
  const stopDiscoMode = () => {
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.stop();
      audioAnalyzerRef.current = null;
    }
  };

  // Audio-Daten verarbeiten und Lichter steuern
  const processAudioData = (audioData) => {
    // Hier die Logik für die Steuerung der Lichter basierend auf Audio-Daten
    if (!discoMode || !connectedToBridge) return;

    const { lightsToInclude } = discoSettings;

    // Berechne Farben und Helligkeit basierend auf den Audiodaten und fokus
    // Focus: 'bass', 'mid', 'treble', 'vocals', 'balanced'
    const { focus, intensity, speed, colorScheme } = discoSettings;

    // Für jedes Licht eine passende Farbe und Helligkeit berechnen und setzen
    lightsToInclude.forEach((lightId, index) => {
      const light = lights[lightId];
      if (!light) return;

      // Hier eine Beispiel-Implementation (in der echten Anwendung komplexer)
      const bassValue = audioData.bass;
      const midValue = audioData.mid;
      const trebleValue = audioData.treble;
      const vocalsValue = audioData.vocals;

      let hue, sat, bri;

      // Berechne Werte basierend auf den Focus-Einstellungen
      switch (focus) {
        case 'bass':
          bri = Math.min(254, Math.max(50, Math.round(bassValue * 254 * (intensity/100))));
          hue = (bassValue * 10000 + Date.now() * (speed/2000)) % 65535;
          break;
        case 'mid':
          bri = Math.min(254, Math.max(50, Math.round(midValue * 254 * (intensity/100))));
          hue = (midValue * 20000 + Date.now() * (speed/2000)) % 65535;
          break;
        case 'treble':
          bri = Math.min(254, Math.max(50, Math.round(trebleValue * 254 * (intensity/100))));
          hue = (trebleValue * 30000 + Date.now() * (speed/2000)) % 65535;
          break;
        case 'vocals':
          bri = Math.min(254, Math.max(50, Math.round(vocalsValue * 254 * (intensity/100))));
          hue = (vocalsValue * 40000 + Date.now() * (speed/2000)) % 65535;
          break;
        case 'balanced':
        default:
          const avg = (bassValue + midValue + trebleValue + vocalsValue) / 4;
          bri = Math.min(254, Math.max(50, Math.round(avg * 254 * (intensity/100))));
          hue = (avg * 25000 + Date.now() * (speed/2000)) % 65535;
          break;
      }

      // Anpassung für verschiedene Farbschemata
      switch (colorScheme) {
        case 'warm':
          hue = (hue % 10000) + 1000; // Rotbereich
          sat = 200 + Math.round(Math.random() * 54);
          break;
        case 'cool':
          hue = (hue % 10000) + 40000; // Blaubereich
          sat = 200 + Math.round(Math.random() * 54);
          break;
        case 'mono':
          hue = 10000; // Feste Farbe (Grünlich)
          sat = 150 + Math.round(Math.random() * 104);
          break;
        case 'rainbow':
        default:
          sat = 200 + Math.round(Math.random() * 54);
          break;
      }

      // Sende Update an die Lampe
      setLightState(lightId, {
        on: true,
        hue: Math.round(hue),
        sat: Math.round(sat),
        bri: Math.round(bri),
        transitiontime: 1 // schnelle Übergänge für Disco-Effekt
      });
    });
  };

  // Disco-Einstellungen aktualisieren
  const updateDiscoSettings = (newSettings) => {
    setDiscoSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('hue-disco-settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Disco-Modus umschalten
  const toggleDiscoMode = () => {
    setDiscoMode(!discoMode);
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

  // Audio-Analyzer Klasse
  class AudioAnalyzer {
    constructor(settings, callback) {
      this.settings = settings;
      this.callback = callback;
      this.audioContext = null;
      this.analyser = null;
      this.microphone = null;
      this.animationFrame = null;
      this.dataArray = null;
      this.isRunning = false;
    }

    async start() {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 1024;

        // Mikrofon-Zugriff anfordern
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });

        this.microphone = this.audioContext.createMediaStreamSource(audioStream);
        this.microphone.connect(this.analyser);

        // Daten-Arrays erstellen
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);

        this.isRunning = true;
        this.analyze();
      } catch (error) {
        console.error("Fehler beim Starten des Audio-Analyzers:", error);
        setStatus("Mikrofon-Zugriff nicht möglich. Bitte erlaube den Zugriff.", "error");
      }
    }

    stop() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }

      if (this.microphone && this.audioContext) {
        this.microphone.disconnect();
        this.audioContext.close();
      }

      this.isRunning = false;
    }

    analyze() {
      if (!this.isRunning) return;

      this.analyser.getByteFrequencyData(this.dataArray);

      // Frequenzbereiche für Bass, Mid, Treble, Vocals
      // Typische Bereiche:
      // Bass: 20-250 Hz
      // Mid: 250-2000 Hz
      // Treble: 2000-20000 Hz
      // Vocals: 300-3400 Hz (Überschneidet sich mit Mid)

      const binSize = this.audioContext.sampleRate / this.analyser.fftSize;

      // Berechne die bin-Indizes für die verschiedenen Frequenzbereiche
      const bassRange = [Math.floor(20/binSize), Math.floor(250/binSize)];
      const midRange = [Math.floor(250/binSize), Math.floor(2000/binSize)];
      const trebleRange = [Math.floor(2000/binSize), Math.min(Math.floor(20000/binSize), this.dataArray.length - 1)];
      const vocalsRange = [Math.floor(300/binSize), Math.floor(3400/binSize)];

      // Berechne Durchschnittswerte für jeden Bereich
      const bass = this.getAverageVolume(bassRange[0], bassRange[1]) / 255;
      const mid = this.getAverageVolume(midRange[0], midRange[1]) / 255;
      const treble = this.getAverageVolume(trebleRange[0], trebleRange[1]) / 255;
      const vocals = this.getAverageVolume(vocalsRange[0], vocalsRange[1]) / 255;

      // Rufe den Callback mit den Audio-Daten auf
      this.callback({
        bass,
        mid,
        treble,
        vocals
      });

      // Nächsten Frame anfordern
      this.animationFrame = requestAnimationFrame(this.analyze.bind(this));
    }

    getAverageVolume(startIndex, endIndex) {
      let sum = 0;

      for (let i = startIndex; i <= endIndex; i++) {
        sum += this.dataArray[i];
      }

      return sum / (endIndex - startIndex + 1);
    }
  }

  return (
      <div className="app">
        <header>
          <h1>GlitterHue</h1>
        </header>

        <div className="container">
          {!connectedToBridge ? (
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
                    Proxy-Modus verwenden
                  </label>
                </div>
                <div className="button-group">
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
          ) : (
              <>
                <Tabs activeTab={activeTab} onChange={setActiveTab}>
                  <Tab id="lights" label="Lampen">
                    {loading ? (
                        <div className="loading">
                          <p>Lade Daten...</p>
                        </div>
                    ) : (
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
                    )}
                  </Tab>
                  <Tab id="disco" label="Disco Light">
                    <div className="disco-section">
                      {discoMode && (
                          <div className="music-visualizer">
                            <MusicVisualizer />
                          </div>
                      )}

                      <div className="disco-controls">
                        <SettingsPanel
                            discoSettings={discoSettings}
                            updateSettings={updateDiscoSettings}
                            lights={lights}
                            discoMode={discoMode}
                            toggleDiscoMode={toggleDiscoMode}
                        />
                      </div>
                    </div>
                  </Tab>
                  <Tab id="settings" label="Einstellungen">
                    <div className="settings-section">
                      <h2>Einstellungen</h2>
                      <div className="settings-card">
                        <h3>Verbindung</h3>
                        <div className="setting-row">
                          <span>Bridge IP: {bridgeIP}</span>
                        </div>
                        <div className="setting-row">
                          <span>API Username: {username.substring(0, 8)}...</span>
                        </div>
                        <div className="checkbox-container">
                          <label>
                            <input
                                type="checkbox"
                                checked={useProxy}
                                onChange={(e) => {
                                  setUseProxy(e.target.checked);
                                  localStorage.setItem('hue-use-proxy', e.target.checked.toString());
                                }}
                            />
                            Proxy-Modus verwenden
                          </label>
                        </div>
                        <div className="button-group">
                          <button onClick={resetConnection} className="reset-button">
                            Verbindung zurücksetzen
                          </button>
                        </div>
                      </div>
                    </div>
                  </Tab>
                </Tabs>

                {statusMessage.message && (
                    <div className={`status-message status-${statusMessage.type}`}>
                      {statusMessage.message}
                    </div>
                )}
              </>
          )}

          <div className="mode-info">
            <span>{useProxy ? 'Proxy-Modus' : 'Direkt-Modus'}</span>
          </div>
        </div>
      </div>
  );
}

export default App;