// App.jsx - Mit Sensoren-/Schalter-Verwaltung
import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import LightCard from './components/LightCard';
import MusicVisualizer from './components/MusicVisualizer';
import {Tab, Tabs} from './components/Tabs';
import SettingsPanel from './components/SettingsPanel';
import GroupsView from './components/GroupsView';
import ScenesView from './components/ScenesView';
import DynamicEffectsView from './components/DynamicEffectsView';
import DashboardView from './components/DashboardView';
import MediaSyncTool from './components/MediaSyncTool';
import EnergyDashboardView from './components/EnergyDashboardView';
import SensorControlView from './components/SensorControlView';
import DevView from './components/DevView';
import UnifiedTimeControlView from './components/UnifiedTimeControlView';

// BrainBuster-Stil Logo-Komponente
const LogoComponent = () => (
    <div className="logo-container">
        <svg width="32" height="32" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"
             className="app-icon">
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7d83ff"/>
                    <stop offset="100%" stopColor="#9fa4ff"/>
                </linearGradient>
            </defs>

            {/* Hintergrund-Kreis mit Schein */}
            <circle cx="20" cy="20" r="16" fill="#2c2e3b" stroke="rgba(125, 131, 255, 0.3)"
                    strokeWidth="1"/>

            {/* Glühbirnen-Symbol */}
            <path
                d="M20,10 C16.13,10 13,13.13 13,17 C13,19.57 14.5,21.77 16.62,22.74 C16.8,22.83 17,23.03 17,23.3 L17,27 C17,27.55 17.45,28 18,28 L22,28 C22.55,28 23,27.55 23,27 L23,23.3 C23,23.03 23.17,22.83 23.37,22.74 C25.5,21.77 27,19.57 27,17 C27,13.13 23.87,10 20,10 Z"
                fill="url(#logoGradient)"/>

            {/* Glanz/Lichteffekte */}
            <circle cx="17" cy="16" r="1.5" fill="white" opacity="0.6"/>
            <circle cx="15" cy="18" r="0.8" fill="white" opacity="0.4"/>

            {/* Strahlen */}
            <line x1="20" y1="5" x2="20" y2="8" stroke="url(#logoGradient)" strokeWidth="1.5"
                  strokeLinecap="round"/>
            <line x1="28" y1="12" x2="26" y2="14" stroke="url(#logoGradient)" strokeWidth="1.5"
                  strokeLinecap="round"/>
            <line x1="30" y1="20" x2="27" y2="20" stroke="url(#logoGradient)" strokeWidth="1.5"
                  strokeLinecap="round"/>
            <line x1="12" y1="12" x2="14" y2="14" stroke="url(#logoGradient)" strokeWidth="1.5"
                  strokeLinecap="round"/>
            <line x1="10" y1="20" x2="13" y2="20" stroke="url(#logoGradient)" strokeWidth="1.5"
                  strokeLinecap="round"/>
        </svg>
        <h1 className="app-title">GlitterHue</h1>
    </div>
);

// Home-Screen mit Kategorien
const HomeScreen = ({onConnectClick, onDiscoverClick}) => {
    return (
        <div className="home-screen">
            <div className="hero">
                <h1 className="hero-title">GlitterHue</h1>
                <p className="hero-subtitle">Steuere deine Philips Hue-Lampen und synchronisiere sie
                    mit Musik</p>
            </div>

            <div className="category-grid">
                <div className="category-card">
                    <div className="category-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    </div>
                    <h3 className="category-title">Lampen steuern</h3>
                    <p className="category-description">Steuere Helligkeit und Farbe deiner
                        Hue-Lampen</p>
                    <button onClick={onConnectClick}>Verbinden</button>
                </div>

                <div className="category-card">
                    <div className="category-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                    </div>
                    <h3 className="category-title">Disco Modus</h3>
                    <p className="category-description">Synchronisiere deine Lampen mit Musik</p>
                    <button onClick={onConnectClick}>Starten</button>
                </div>

                <div className="category-card">
                    <div className="category-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <h3 className="category-title">Bridge finden</h3>
                    <p className="category-description">Automatische Suche nach deiner Hue
                        Bridge</p>
                    <button onClick={onDiscoverClick}>Bridge finden</button>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [bridgeIP, setBridgeIP] = useState('');
    const [username, setUsername] = useState('');
    const [connectedToBridge, setConnectedToBridge] = useState(false);
    const [lights, setLights] = useState({});
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({message: '', type: 'info'});
    const [connecting, setConnecting] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [activeTab, setActiveTab] = useState('lights');
    const [discoMode, setDiscoMode] = useState(false);
    const [discoSettings, setDiscoSettings] = useState({
        focus: 'balanced', // 'bass', 'mid', 'treble', 'vocals', 'balanced'
        intensity: 50,
        speed: 50,
        colorScheme: 'rainbow', // 'rainbow', 'warm', 'cool', 'mono'
        lightsToInclude: []
    });
    const [showHomeScreen, setShowHomeScreen] = useState(true);

    // Gruppen von Lichtern
    const [groups, setGroups] = useState([]);
    // Szenen
    const [scenes, setScenes] = useState([]);

    // Referenz für den Media-Analyzer
    const audioAnalyzerRef = useRef(null);

    // Basis-URL für API-Anfragen - Direkt-Modus
    const getBaseUrl = (ip) => {
        return `http://${ip}`;
    };

    useEffect(() => {
        // Ausführung nur beim ersten Rendering
        const savedTab = window.localStorage.getItem('hue-active-tab');
        if (savedTab) {
            setActiveTab(savedTab);
        }
    }, []);

    useEffect(() => {
        // Speichern nur, wenn sich der Tab ändert und nicht beim initialen Rendering
        if (activeTab !== 'lights') { // Nicht speichern, wenn es der Standardwert ist
            window.localStorage.setItem('hue-active-tab', activeTab);
        }
    }, [activeTab]);

    // Gespeicherte Werte laden
    useEffect(() => {
        const savedBridgeIP = localStorage.getItem('hue-bridge-ip');
        const savedUsername = localStorage.getItem('hue-username');
        const savedDiscoSettings = localStorage.getItem('hue-disco-settings');

        // Lösche alten Proxy-Modus-Eintrag falls vorhanden
        localStorage.removeItem('hue-use-proxy');

        if (savedBridgeIP) {
            setBridgeIP(savedBridgeIP);
        }

        if (savedUsername) {
            setUsername(savedUsername);
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
                setShowHomeScreen(false);
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
        setStatusMessage({message, type});
        console.log(`[${type}] ${message}`);
    };

    // Bridge finden
    const discoverBridge = async () => {
        setLoading(true);
        setShowHomeScreen(false);
        setStatus('Suche nach Hue Bridge im Netzwerk...', 'info');

        try {
            // Verwende ausschließlich die offizielle Discovery-URL
            const response = await fetch('https://discovery.meethue.com/');
            const bridges = await response.json();

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

    // Verbindung zur Bridge aufbauen
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
        setShowHomeScreen(false);
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

                // Setze Standard-Lichter für Disco-Modus bei erstem Verbinden
                if (discoSettings.lightsToInclude.length === 0) {
                    const allLightIds = Object.keys(data);
                    setDiscoSettings(prev => {
                        const updated = {...prev, lightsToInclude: allLightIds};
                        localStorage.setItem('hue-disco-settings', JSON.stringify(updated));
                        return updated;
                    });
                }

                // Lade Gruppen
                loadGroups(ip, user);

                // Lade Szenen
                loadScenes(ip, user);

                setStatus('Erfolgreich mit Hue Bridge verbunden', 'success');
            } else {
                console.log("Unerwartete Antwort:", data);
                setStatus('Verbindung fehlgeschlagen. Unerwartete Antwort.', 'error');
            }
        } catch (error) {
            console.error("Verbindungsfehler:", error);
            setStatus(`Verbindung fehlgeschlagen: ${error.message}`, 'error');

            // Bei CORS-Fehlern eine spezifische Hilfestellung anbieten
            if (error.message.includes('CORS')) {
                setStatus('CORS-Fehler. Stelle sicher, dass du dich im selben Netzwerk wie die Hue Bridge befindest.', 'warning');
            }
        }

        setLoading(false);
    };

    // Lade Gruppen von der Bridge
    const loadGroups = async (ip, user) => {
        try {
            const baseUrl = getBaseUrl(ip);
            const endpoint = `${baseUrl}/api/${user}/groups`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (typeof data === 'object' && !Array.isArray(data) && !data.error) {
                // Konvertiere Gruppen in ein Array-Format für unsere App
                const groupsArray = Object.entries(data).map(([id, group]) => ({
                    id,
                    bridgeGroupId: id,
                    name: group.name,
                    type: group.type === 'Room' ? 'room' : 'zone',
                    roomType: group.class ? mapBridgeTypeToRoomType(group.class) : 'other',
                    lights: group.lights || []
                }));

                setGroups(groupsArray);

                // Speichere Gruppen im localStorage
                localStorage.setItem('hue-groups', JSON.stringify(groupsArray));
            }
        } catch (error) {
            console.error("Fehler beim Laden der Gruppen:", error);
        }
    };

    // Konvertiere Bridge-Raumtypen zu unseren Typen
    const mapBridgeTypeToRoomType = (bridgeClass) => {
        const mapping = {
            'Living room': 'living',
            'Kitchen': 'kitchen',
            'Dining': 'dining',
            'Bedroom': 'bedroom',
            'Bathroom': 'bathroom',
            'Office': 'office',
            'Outdoor': 'outdoor'
        };

        return mapping[bridgeClass] || 'other';
    };

    // Lade Szenen von der Bridge
    const loadScenes = async (ip, user) => {
        try {
            const baseUrl = getBaseUrl(ip);
            const endpoint = `${baseUrl}/api/${user}/scenes`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (typeof data === 'object' && !Array.isArray(data) && !data.error) {
                // Konvertiere Szenen in ein Array-Format für unsere App
                const scenesArray = Object.entries(data).map(([id, scene]) => ({
                    id,
                    name: scene.name,
                    type: scene.type || 'static',
                    lights: scene.lights || [],
                    owner: scene.owner,
                    recycle: scene.recycle,
                    locked: scene.locked,
                    isActive: false
                }));

                setScenes(scenesArray);

                // Speichere Szenen im localStorage
                localStorage.setItem('hue-scenes', JSON.stringify(scenesArray));
            }
        } catch (error) {
            console.error("Fehler beim Laden der Szenen:", error);
        }
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
                body: JSON.stringify({on})
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
                body: JSON.stringify({bri: parseInt(brightness)})
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

        setBridgeIP('');
        setUsername('');
        setConnectedToBridge(false);
        setLights({});
        setShowHomeScreen(true);

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

        const {lightsToInclude} = discoSettings;

        // Berechne Farben und Helligkeit basierend auf den Audiodaten und fokus
        // Focus: 'bass', 'mid', 'treble', 'vocals', 'balanced'
        const {focus, intensity, speed, colorScheme} = discoSettings;

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
                    bri = Math.min(254, Math.max(50, Math.round(bassValue * 254 * (intensity / 100))));
                    hue = (bassValue * 10000 + Date.now() * (speed / 2000)) % 65535;
                    break;
                case 'mid':
                    bri = Math.min(254, Math.max(50, Math.round(midValue * 254 * (intensity / 100))));
                    hue = (midValue * 20000 + Date.now() * (speed / 2000)) % 65535;
                    break;
                case 'treble':
                    bri = Math.min(254, Math.max(50, Math.round(trebleValue * 254 * (intensity / 100))));
                    hue = (trebleValue * 30000 + Date.now() * (speed / 2000)) % 65535;
                    break;
                case 'vocals':
                    bri = Math.min(254, Math.max(50, Math.round(vocalsValue * 254 * (intensity / 100))));
                    hue = (vocalsValue * 40000 + Date.now() * (speed / 2000)) % 65535;
                    break;
                case 'balanced':
                default:
                    const avg = (bassValue + midValue + trebleValue + vocalsValue) / 4;
                    bri = Math.min(254, Math.max(50, Math.round(avg * 254 * (intensity / 100))));
                    hue = (avg * 25000 + Date.now() * (speed / 2000)) % 65535;
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
            const updated = {...prev, ...newSettings};
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
            const bassRange = [Math.floor(20 / binSize), Math.floor(250 / binSize)];
            const midRange = [Math.floor(250 / binSize), Math.floor(2000 / binSize)];
            const trebleRange = [Math.floor(2000 / binSize), Math.min(Math.floor(20000 / binSize), this.dataArray.length - 1)];
            const vocalsRange = [Math.floor(300 / binSize), Math.floor(3400 / binSize)];

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

    // Prüfen, ob HTTPS verwendet wird
    const isSecureConnection = window.location.protocol === 'https:';

    return (
        <div className="app">
            <header>
                <LogoComponent/>
            </header>

            <div className="container">
                {showHomeScreen ? (
                    <HomeScreen
                        onConnectClick={() => setShowHomeScreen(false)}
                        onDiscoverClick={discoverBridge}
                    />
                ) : !connectedToBridge ? (
                    <div className="setup-section">
                        <h2 className="section-title">Verbindung einrichten</h2>
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
                                            Zurück
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
                                        style={{width: `${(connectionAttempts / 5) * 100}%`}}
                                    ></div>
                                </div>
                                <p>Drücke den Link-Button auf deiner Hue Bridge...</p>
                            </div>
                        )}

                        {!isSecureConnection && (
                            <div className="status-message status-info">
                                <strong>Hinweis:</strong> Für die vollständige Funktionalität,
                                einschließlich des Disco-Modus, wird eine HTTPS-Verbindung benötigt.
                                Die meisten Browser erlauben den Zugriff auf das Mikrofon nur in
                                einer sicheren Umgebung.
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Tabs activeTab={activeTab} onChange={setActiveTab}>
                            <Tab id="dashboard" label="Dashboard">
                                <DashboardView
                                    lights={lights}
                                    username={username}
                                    bridgeIP={bridgeIP}
                                />
                            </Tab>

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

                            <Tab id="groups" label="Räume & Zonen">
                                <GroupsView
                                    lights={lights}
                                    username={username}
                                    bridgeIP={bridgeIP}
                                />
                            </Tab>

                            <Tab id="scenes" label="Szenen">
                                <ScenesView
                                    lights={lights}
                                    username={username}
                                    bridgeIP={bridgeIP}
                                />
                            </Tab>

                            <Tab id="sensors" label="Schalter & Sensoren">
                                <SensorControlView
                                    username={username}
                                    bridgeIP={bridgeIP}
                                />
                            </Tab>

                            <Tab id="timecontrol" label="Zeitsteuerung">
                                <UnifiedTimeControlView
                                    username={username}
                                    bridgeIP={bridgeIP}
                                    lights={lights}
                                />
                            </Tab>

                            <Tab id="energy" label="Energie">
                                <EnergyDashboardView
                                    lights={lights}
                                    username={username}
                                    bridgeIP={bridgeIP}
                                />
                            </Tab>

                            <Tab id="effects" label="Effekte">
                                <DynamicEffectsView
                                    lights={lights}
                                    username={username}
                                    bridgeIP={bridgeIP}
                                />
                            </Tab>

                            <Tab id="mediasync" label="Media Sync">
                                <MediaSyncTool
                                    lights={lights}
                                    username={username}
                                    bridgeIP={bridgeIP}
                                />
                            </Tab>

                            <Tab id="disco" label="Disco">
                                <div className="disco-section">
                                    {discoMode && (
                                        <div className="music-visualizer">
                                            <MusicVisualizer/>
                                        </div>
                                    )}

                                    <div className="disco-controls">
                                        <SettingsPanel
                                            discoSettings={discoSettings}
                                            updateSettings={updateDiscoSettings}
                                            lights={lights}
                                            discoMode={discoMode}
                                            toggleDiscoMode={toggleDiscoMode}
                                            isSecureConnection={isSecureConnection}
                                        />
                                    </div>
                                </div>
                            </Tab>

                            <Tab id="dev" label="Dev">
                                <DevView
                                    username={username}
                                    bridgeIP={bridgeIP}
                                />
                            </Tab>

                            <Tab id="settings" label="Einstellungen">
                                <div className="settings-section">
                                    <h2 className="section-title">Einstellungen</h2>
                                    <div className="settings-card">
                                        <h3>Verbindung</h3>
                                        <div className="setting-row">
                                            <span>Bridge IP: {bridgeIP}</span>
                                        </div>
                                        <div className="setting-row">
                                            <span>API Username: {username.substring(0, 8)}...</span>
                                        </div>
                                        <div className="button-group">
                                            <button onClick={resetConnection}
                                                    className="reset-button">
                                                Verbindung zurücksetzen
                                            </button>
                                        </div>
                                    </div>

                                    <div className="settings-card">
                                        <h3>Über GlitterHue</h3>
                                        <p>Version: 0.3.0</p>
                                        <p>Eine moderne, mobiloptimierte Web-App zur Steuerung von
                                            Philips Hue-Lampen mit Musik-Visualisierung,
                                            Automatisierungen und Disco-Modus.</p>

                                        {!isSecureConnection && (
                                            <div className="status-message status-warning"
                                                 style={{marginTop: '1rem'}}>
                                                <p><strong>Hinweis:</strong> Einige Funktionen wie
                                                    der Disco-Modus benötigen einen gesicherten
                                                    Kontext (HTTPS).</p>
                                                <p style={{marginTop: '0.5rem'}}><a
                                                    href="https://github.com/yourusername/glitterhue/releases"
                                                    style={{
                                                        color: '#ffad33',
                                                        textDecoration: 'underline'
                                                    }}>Lade die Electron Desktop-Version
                                                    herunter</a>, um vollen Funktionsumfang zu
                                                    erhalten.</p>
                                            </div>
                                        )}
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
            </div>
        </div>
    );
}

export default App;