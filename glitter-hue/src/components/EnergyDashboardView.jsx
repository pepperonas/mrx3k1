// src/components/EnergyDashboardView.jsx - Energieverbrauchsanalyse für Philips Hue-Lampen
import React, { useState, useEffect, useRef } from 'react';
import '../styles/energy.css';

// Lampentypen mit ihrem durchschnittlichen Energieverbrauch in Watt
const LIGHT_TYPES = {
    'Extended color light': { name: 'Hue Color', maxWatts: 9.0, standbyWatts: 0.4 },
    'Color light': { name: 'Hue Color', maxWatts: 8.5, standbyWatts: 0.4 },
    'Color temperature light': { name: 'Hue White Ambiance', maxWatts: 6.5, standbyWatts: 0.4 },
    'Dimmable light': { name: 'Hue White', maxWatts: 4.5, standbyWatts: 0.4 },
    'On/off plug': { name: 'Hue Plug', maxWatts: 0.2, standbyWatts: 0.1 },
    'Default': { name: 'Generisches Licht', maxWatts: 7.0, standbyWatts: 0.4 }
};

// Durchschnittliche Stromkosten in Euro pro kWh (kann vom Benutzer angepasst werden)
const DEFAULT_ENERGY_COST = 0.32; // Euro pro kWh

// Komponente für die Energieübersicht einer einzelnen Lampe
const LightEnergyCard = ({ light, lightId, energyCost, usageData }) => {
    // Bestimme Lampentyp und Verbrauchsdaten
    const lightType = LIGHT_TYPES[light.type] || LIGHT_TYPES['Default'];

    // Berechne aktuellen Verbrauch basierend auf Status
    const calculateCurrentUsage = () => {
        if (!light.state.on) return lightType.standbyWatts;

        // Für dimmbare Lichter: Helligkeit beeinflusst den Verbrauch
        if (light.state.bri !== undefined) {
            const brightnessRatio = light.state.bri / 254;
            // Nicht-linear skalieren: Selbst bei niedriger Helligkeit gibt es einen Grundverbrauch
            return lightType.standbyWatts + (lightType.maxWatts - lightType.standbyWatts) *
                (0.2 + 0.8 * brightnessRatio);
        }

        return lightType.maxWatts;
    };

    // Stromverbrauch der Lampe
    const currentWattage = calculateCurrentUsage();

    // Täglicher Verbrauch in kWh basierend auf historischen Daten
    const dailyUsage = usageData && usageData[lightId]
        ? usageData[lightId].dailyKwh
        : (currentWattage * 6 / 1000); // Annahme: 6 Stunden Nutzung pro Tag

    // Monatliche Kosten berechnen
    const monthlyCost = dailyUsage * 30 * energyCost;

    // Energieeffizienz (0-100%) - höhere Werte bedeuten bessere Effizienz
    const calculateEfficiency = () => {
        if (!light.state.on) return 100; // Ausgeschaltete Lampe ist am effizientesten

        // Berücksichtige Helligkeit und Lampentyp
        const currentUsage = calculateCurrentUsage();
        const brightnessRatio = (light.state.bri || 254) / 254;

        // Effizient bei niedrigem Verbrauch im Verhältnis zur Helligkeit
        const usageRatio = currentUsage / lightType.maxWatts;

        // Wenn Helligkeit niedrig ist, aber Verbrauch relativ hoch: niedrigere Effizienz
        // Wenn Helligkeit hoch und Verbrauch verhältnismäßig niedrig: höhere Effizienz
        const efficiency = 100 - Math.max(0, Math.min(100,
            100 * (usageRatio - brightnessRatio + 0.2)
        ));

        return Math.round(efficiency);
    };

    const efficiency = calculateEfficiency();

    // Bestimme Effizienzklasse basierend auf Prozent
    const getEfficiencyClass = (percent) => {
        if (percent >= 90) return 'excellent';
        if (percent >= 75) return 'good';
        if (percent >= 60) return 'average';
        if (percent >= 40) return 'fair';
        return 'poor';
    };

    // Watt-Anzeige mit Farbverlauf von Grün nach Rot
    const PowerMeter = ({ value, max }) => {
        const percent = Math.min(100, (value / max) * 100);

        return (
            <div className="power-meter">
                <div className="power-bar">
                    <div
                        className="power-fill"
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>
                <div className="power-value">{value.toFixed(1)} W</div>
            </div>
        );
    };

    // Effizienzanzeige
    const EfficiencyMeter = ({ percent }) => {
        const efficiencyClass = getEfficiencyClass(percent);

        return (
            <div className="efficiency-meter">
                <div className="efficiency-label">Effizienz</div>
                <div className={`efficiency-badge ${efficiencyClass}`}>
                    {percent}%
                </div>
            </div>
        );
    };

    return (
        <div className="light-energy-card">
            <div className="light-energy-header">
                <div
                    className="light-color-indicator"
                    style={{
                        backgroundColor: light.state.on ?
                            (light.state.hue ? hsvToColor(light.state) : '#FFFFFF') :
                            '#444'
                    }}
                ></div>
                <h3>{light.name}</h3>
                <span className="light-type">{lightType.name}</span>
            </div>

            <div className="light-energy-details">
                <div className="energy-stat">
                    <span className="stat-label">Aktuell</span>
                    <PowerMeter value={currentWattage} max={lightType.maxWatts * 1.2} />
                </div>

                <div className="energy-stat">
                    <span className="stat-label">Täglich</span>
                    <div className="daily-usage">
                        <span className="usage-value">{dailyUsage.toFixed(2)} kWh</span>
                    </div>
                </div>

                <div className="energy-stat">
                    <span className="stat-label">Monatlich</span>
                    <div className="monthly-cost">
                        <span className="cost-value">{monthlyCost.toFixed(2)} €</span>
                    </div>
                </div>

                <EfficiencyMeter percent={efficiency} />

                <div className="light-status">
                    <span className={`status-dot ${light.state.on ? 'on' : 'off'}`}></span>
                    <span className="status-text">
                        {light.state.on
                            ? `Ein (${Math.round((light.state.bri || 254) / 254 * 100)}%)`
                            : 'Standby'}
                    </span>
                </div>
            </div>
        </div>
    );
};

// Energie-Zusammenfassungskarte
const EnergySummaryCard = ({ lights, energyCost, usageData }) => {
    // Berechne Gesamtverbrauch aller Lampen
    const calculateTotalUsage = () => {
        let totalWatts = 0;
        let onLights = 0;

        Object.entries(lights).forEach(([id, light]) => {
            const lightType = LIGHT_TYPES[light.type] || LIGHT_TYPES['Default'];

            if (light.state.on) {
                // Berechne Verbrauch basierend auf Helligkeit
                const brightnessRatio = (light.state.bri || 254) / 254;
                const currentWatts = lightType.standbyWatts +
                    (lightType.maxWatts - lightType.standbyWatts) *
                    (0.2 + 0.8 * brightnessRatio);

                totalWatts += currentWatts;
                onLights++;
            } else {
                // Standby-Verbrauch für ausgeschaltete Lampen
                totalWatts += lightType.standbyWatts;
            }
        });

        return { totalWatts, onLights };
    };

    const { totalWatts, onLights } = calculateTotalUsage();

    // Berechne täglichen und monatlichen Verbrauch
    const calculateProjectedUsage = () => {
        // Annahme: Durchschnittlich 6 Stunden Nutzung pro Tag
        const averageActiveHours = 6;
        const standbyHours = 24 - averageActiveHours;

        // Aktueller Verbrauch für eingeschaltete Lampen
        const activeUsage = totalWatts * averageActiveHours / 1000; // kWh

        // Standby-Verbrauch für alle Lampen (wenn sie ausgeschaltet sind)
        const standbyUsage = Object.values(lights).reduce((total, light) => {
            const lightType = LIGHT_TYPES[light.type] || LIGHT_TYPES['Default'];
            return total + lightType.standbyWatts;
        }, 0) * standbyHours / 1000; // kWh

        const dailyUsage = activeUsage + standbyUsage;
        const monthlyUsage = dailyUsage * 30;
        const monthlyCost = monthlyUsage * energyCost;
        const yearlyCost = monthlyCost * 12;

        return { dailyUsage, monthlyUsage, monthlyCost, yearlyCost };
    };

    const { dailyUsage, monthlyUsage, monthlyCost, yearlyCost } = calculateProjectedUsage();

    // Berechne CO2-Emissionen (vereinfacht, basierend auf deutschem Strommix)
    const calculateCO2 = (kwh) => {
        // Durchschnittlicher CO2-Faktor in Deutschland: ~400g CO2 pro kWh
        const co2Factor = 400; // g CO2 pro kWh
        return kwh * co2Factor / 1000; // kg CO2
    };

    const monthlyCO2 = calculateCO2(monthlyUsage);

    return (
        <div className="energy-summary-card">
            <h3>Energie-Übersicht</h3>

            <div className="summary-stats">
                <div className="summary-stat">
                    <span className="stat-name">Aktueller Verbrauch</span>
                    <span className="stat-value highlight">{totalWatts.toFixed(1)} W</span>
                    <span className="stat-detail">{onLights} von {Object.keys(lights).length} Lampen aktiv</span>
                </div>

                <div className="summary-stat">
                    <span className="stat-name">Täglicher Verbrauch</span>
                    <span className="stat-value">{dailyUsage.toFixed(2)} kWh</span>
                    <span className="stat-detail">{(dailyUsage * energyCost).toFixed(2)} € pro Tag</span>
                </div>

                <div className="summary-stat">
                    <span className="stat-name">Monatlicher Verbrauch</span>
                    <span className="stat-value">{monthlyUsage.toFixed(1)} kWh</span>
                    <span className="stat-detail primary">{monthlyCost.toFixed(2)} € pro Monat</span>
                </div>

                <div className="summary-stat">
                    <span className="stat-name">Jährliche Kosten</span>
                    <span className="stat-value primary">{yearlyCost.toFixed(2)} €</span>
                    <span className="stat-detail">{monthlyCO2.toFixed(1)} kg CO₂ pro Monat</span>
                </div>
            </div>

            <div className="energy-tips">
                <h4>Energiespartipps</h4>
                <ul>
                    <li>Reduziere die Helligkeit um 20% und spare bis zu 30% Energie</li>
                    <li>Nutze Bewegungssensoren in wenig genutzten Räumen</li>
                    <li>Verwende Zeitpläne, um Lichter automatisch auszuschalten</li>
                    <li>Nutze Szenen mit niedrigerer Helligkeit für den Abend</li>
                </ul>
            </div>
        </div>
    );
};

// Diagramm zum Energieverbrauch
const EnergyUsageChart = ({ usageData, period = 'week' }) => {
    const canvasRef = useRef(null);
    const [energyData, setEnergyData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });

    // Lade Energiedaten beim ersten Rendern und bei Periodenänderung
    useEffect(() => {
        loadEnergyData();
    }, [period]);

    // Aktualisiere das Diagramm, wenn sich die Daten ändern
    useEffect(() => {
        if (!canvasRef.current) return;

        // Sicherstellen, dass der Canvas die richtige Größe hat
        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        // Datenvalidierung vor dem Zeichnen
        let validatedData = [];
        let validMaxValue = 0;

        if (energyData && Array.isArray(energyData) && energyData.length > 0) {
            // Validiere jeden Datenpunkt und filtere ungültige Werte heraus
            validatedData = energyData
                .map(item => {
                    // Stelle sicher, dass der Wert eine Zahl ist und nicht NaN oder Infinity
                    return typeof item.value === 'number' && isFinite(item.value) ? item.value : 0;
                });

            // Berechne den maximalen Wert aus den validierten Daten
            validMaxValue = Math.max(...validatedData, 1); // Mindestens 1, um Division durch 0 zu vermeiden
        }

        // Jetzt zeichne das Diagramm mit den validierten Daten
        drawChart(canvas, validatedData, validMaxValue);

    }, [energyData]);

    // Funktion zum Laden der Energiedaten
    const loadEnergyData = () => {
        // Simuliere das Laden der Daten (in einer realen App würden hier API-Calls stehen)
        setLoading(true);

        setTimeout(() => {
            try {
                // Erzeuge Beispieldaten basierend auf dem Zeitraum
                let data = [];
                let maxPoints = 0;

                switch (period) {
                    case 'day':
                        maxPoints = 24; // Stündliche Daten für einen Tag
                        break;
                    case 'week':
                        maxPoints = 7; // Tägliche Daten für eine Woche
                        break;
                    case 'month':
                        maxPoints = 30; // Tägliche Daten für einen Monat
                        break;
                    default:
                        maxPoints = 24;
                }

                // Generiere Daten mit Validierung
                for (let i = 0; i < maxPoints; i++) {
                    // Generiere einen Zufallswert, aber validiere ihn
                    const randomValue = Math.random() * 30;
                    const safeValue = isFinite(randomValue) ? randomValue : 0;

                    data.push({
                        label: i.toString(),
                        value: safeValue
                    });
                }

                // Sicherstellen, dass das Array nicht leer ist
                if (data.length === 0) {
                    data = [{ label: '0', value: 0 }];
                }

                setEnergyData(data);
            } catch (error) {
                console.error("Fehler beim Laden der Energiedaten:", error);
                // Fallback auf leere Daten
                setEnergyData([{ label: '0', value: 0 }]);

                setStatus({
                    message: "Fehler beim Laden der Energiedaten: " + error.message,
                    type: "error"
                });
            } finally {
                setLoading(false);
            }
        }, 1000);
    };

    // Diagramm zeichnen
    function drawChart(canvas, data, maxValue) {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Canvas leeren
        ctx.clearRect(0, 0, width, height);

        // Sicherstellen, dass keine ungültigen Werte verwendet werden
        const safeWidth = isFinite(width) ? width : 300;
        const safeHeight = isFinite(height) ? height : 150;

        // Gradient mit Validierung erstellen
        let gradient;
        try {
            // Prüfe, ob die Parameter endliche Werte sind, ansonsten verwende Fallback-Werte
            const x0 = 0;
            const y0 = 0;
            const x1 = isFinite(safeWidth) ? safeWidth : 300;
            const y1 = isFinite(safeHeight) ? safeHeight : 150;

            gradient = ctx.createLinearGradient(x0, y0, x1, y1);
            gradient.addColorStop(0, 'rgba(125, 131, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(125, 131, 255, 0.2)');
        } catch (error) {
            console.error('Fehler beim Erstellen des Gradienten:', error);
            // Fallback auf eine Standardfarbe
            gradient = 'rgba(125, 131, 255, 0.5)';
        }

        // Datenpunkte zeichnen
        ctx.beginPath();
        ctx.moveTo(0, safeHeight);

        // Stelle sicher, dass Daten vorhanden sind und maxValue gültig ist
        if (data && data.length > 0 && isFinite(maxValue) && maxValue > 0) {
            // Berechne Abstand zwischen Datenpunkten
            const pointSpacing = safeWidth / (data.length - 1);

            // Zeichne die Kurve
            data.forEach((value, index) => {
                // Validiere den Wert
                const safeValue = isFinite(value) ? value : 0;
                // Berechne y-Position (invertiert, da Canvas y-Achse von oben nach unten geht)
                const y = safeHeight - (safeValue / maxValue) * safeHeight;
                const x = index * pointSpacing;

                // Validiere x und y vor Verwendung
                if (isFinite(x) && isFinite(y)) {
                    ctx.lineTo(x, y);
                }
            });

            // Schließe den Pfad zum unteren Rand
            ctx.lineTo(safeWidth, safeHeight);
            ctx.closePath();

            // Fülle den Bereich
            ctx.fillStyle = gradient;
            ctx.fill();

            // Zeichne die Linie
            ctx.strokeStyle = 'rgba(125, 131, 255, 1)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Wenn keine Daten vorhanden sind, zeige einen leeren Chart mit Mitteilung
            ctx.font = '14px var(--font-family)';
            ctx.fillStyle = 'var(--color-text-secondary)';
            ctx.textAlign = 'center';
            ctx.fillText('Keine Daten verfügbar', safeWidth / 2, safeHeight / 2);
        }
    }

    // Stelle Content basierend auf dem Ladestatus dar
    if (loading) {
        return (
            <div className="energy-chart-container loading">
                <p>Lade Daten...</p>
            </div>
        );
    }

    return (
        <div className="energy-chart-container">
            <canvas ref={canvasRef} className="energy-chart"></canvas>
            {status.message && (
                <div className={`status-message status-${status.type}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
};

// Einstellungsdialog für Energiekosten
const EnergyCostDialog = ({ currentCost, onSave, onCancel }) => {
    const [cost, setCost] = useState(currentCost);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(parseFloat(cost));
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content small">
                <div className="modal-header">
                    <h2>Stromkosten anpassen</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="energy-cost">Stromkosten pro kWh (in €)</label>
                        <input
                            type="number"
                            id="energy-cost"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            min="0.01"
                            max="1.00"
                            step="0.01"
                            required
                        />
                        <p className="form-hint">
                            Die durchschnittlichen Stromkosten in Deutschland liegen bei ca. 0,32 €/kWh.
                        </p>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="secondary-button">Abbrechen</button>
                        <button type="submit">Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Hilfsfunktion zum Konvertieren von HSV zu Farbe für Anzeige
const hsvToColor = (state) => {
    const h = (state.hue / 65535) * 360;
    const s = (state.sat / 254) * 100;
    const l = 50; // Feste Helligkeit für Anzeige

    return `hsl(${h}, ${s}%, ${l}%)`;
};

// Hauptkomponente für die Energieübersicht
const EnergyDashboardView = ({ lights, username, bridgeIP }) => {
    const [energyCost, setEnergyCost] = useState(DEFAULT_ENERGY_COST);
    const [usageData, setUsageData] = useState({});
    const [chartPeriod, setChartPeriod] = useState('week');
    const [showCostDialog, setShowCostDialog] = useState(false);
    const [sortOrder, setSortOrder] = useState('usage'); // 'usage', 'name', 'status'
    const [status, setStatus] = useState({ message: '', type: '' });

    // Lade gespeicherte Daten beim ersten Rendern
    useEffect(() => {
        loadSettings();
        loadUsageData();

        // Simuliere Datenspeicherung im 5-Minuten-Intervall
        const interval = setInterval(simulateDataCollection, 300000); // 5 Minuten

        return () => clearInterval(interval);
    }, []);

    // Lade gespeicherte Einstellungen
    const loadSettings = () => {
        try {
            const savedCost = localStorage.getItem('hue-energy-cost');
            if (savedCost) {
                setEnergyCost(parseFloat(savedCost));
            }
        } catch (error) {
            console.error("Fehler beim Laden der Energieeinstellungen:", error);
        }
    };

    // Lade gespeicherte Verbrauchsdaten
    const loadUsageData = () => {
        try {
            const savedData = localStorage.getItem('hue-energy-usage');
            if (savedData) {
                setUsageData(JSON.parse(savedData));
            } else {
                // Wenn keine Daten vorhanden, initialisiere mit leeren Daten
                initializeUsageData();
            }
        } catch (error) {
            console.error("Fehler beim Laden der Verbrauchsdaten:", error);
            initializeUsageData();
        }
    };

    // Initialisiere leere Verbrauchsdaten für alle Lampen
    const initializeUsageData = () => {
        const initialData = {};

        Object.keys(lights).forEach(lightId => {
            initialData[lightId] = {
                dailyKwh: 0,
                history: []
            };
        });

        setUsageData(initialData);
        localStorage.setItem('hue-energy-usage', JSON.stringify(initialData));
    };

    // Simuliere die Sammlung von Verbrauchsdaten
    const simulateDataCollection = () => {
        const currentTime = new Date();
        const updatedData = { ...usageData };

        // Für jede Lampe den aktuellen Verbrauch erfassen
        Object.entries(lights).forEach(([lightId, light]) => {
            // Berechne aktuellen Verbrauch
            const lightType = LIGHT_TYPES[light.type] || LIGHT_TYPES['Default'];
            let currentWatts;

            if (light.state.on) {
                const brightnessRatio = (light.state.bri || 254) / 254;
                currentWatts = lightType.standbyWatts +
                    (lightType.maxWatts - lightType.standbyWatts) *
                    (0.2 + 0.8 * brightnessRatio);
            } else {
                currentWatts = lightType.standbyWatts;
            }

            // Aktualisiere täglichen Durchschnitt (5 Minuten als Anteil des Tages)
            const kwhPer5Min = currentWatts * (5 / 60) / 1000;

            // Initialisiere Daten für neue Lampen
            if (!updatedData[lightId]) {
                updatedData[lightId] = {
                    dailyKwh: 0,
                    history: []
                };
            }

            // Aktualisiere täglichen Durchschnitt mit gewichtetem Mittelwert
            // (Gewichtung: 95% alter Wert, 5% neuer Wert)
            const oldWeight = 0.95;
            const newWeight = 0.05;

            // In kWh pro Tag umrechnen
            const kwhPerDay = kwhPer5Min * 288; // 288 5-Minuten-Intervalle pro Tag

            updatedData[lightId].dailyKwh =
                (updatedData[lightId].dailyKwh * oldWeight) +
                (kwhPerDay * newWeight);

            // Bei Tageswechsel oder am Beginn eines neuen Tages: Tagesverbrauch in Historie speichern
            const today = currentTime.getDate();
            const lastHistoryEntry = updatedData[lightId].history &&
            updatedData[lightId].history.length > 0 ?
                updatedData[lightId].history[0] : null;

            if (!lastHistoryEntry ||
                lastHistoryEntry.day !== today) {

                // Neuen Tag hinzufügen
                updatedData[lightId].history = [
                    { day: today, kwh: updatedData[lightId].dailyKwh },
                    ...(updatedData[lightId].history || []).slice(0, 29) // Max. 30 Tage speichern
                ];
            }
        });

        setUsageData(updatedData);
        localStorage.setItem('hue-energy-usage', JSON.stringify(updatedData));
    };

    // Speichere aktualisierte Stromkosten
    const saveEnergyCost = (cost) => {
        setEnergyCost(cost);
        localStorage.setItem('hue-energy-cost', cost.toString());
        setShowCostDialog(false);
    };

    // Sortiere Lampen nach verschiedenen Kriterien
    const getSortedLights = () => {
        return Object.entries(lights).sort((a, b) => {
            const [idA, lightA] = a;
            const [idB, lightB] = b;

            switch (sortOrder) {
                case 'usage':
                    // Sortiere nach geschätztem Verbrauch
                    const usageA = usageData[idA]?.dailyKwh || 0;
                    const usageB = usageData[idB]?.dailyKwh || 0;
                    return usageB - usageA; // Absteigend

                case 'name':
                    // Sortiere alphabetisch nach Namen
                    return lightA.name.localeCompare(lightB.name);

                case 'status':
                    // Sortiere nach Status (ein vor aus)
                    if (lightA.state.on !== lightB.state.on) {
                        return lightB.state.on ? 1 : -1;
                    }
                    return lightA.name.localeCompare(lightB.name);

                default:
                    return 0;
            }
        });
    };

    const sortedLights = getSortedLights();

    return (
        <div className="energy-dashboard-view">
            <div className="energy-header">
                <h2 className="section-title">Energie-Dashboard</h2>
                <button onClick={() => setShowCostDialog(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Stromkosten anpassen
                </button>
            </div>

            <div className="energy-dashboard-content">
                <div className="energy-summary-section">
                    <EnergySummaryCard
                        lights={lights}
                        energyCost={energyCost}
                        usageData={usageData}
                    />

                    <div className="chart-container">
                        <div className="chart-header">
                            <h3>Verbrauchsverlauf</h3>
                            <div className="chart-controls">
                                <button
                                    className={chartPeriod === 'week' ? 'active' : ''}
                                    onClick={() => setChartPeriod('week')}
                                >
                                    Woche
                                </button>
                                <button
                                    className={chartPeriod === 'month' ? 'active' : ''}
                                    onClick={() => setChartPeriod('month')}
                                >
                                    Monat
                                </button>
                            </div>
                        </div>
                        <EnergyUsageChart usageData={usageData} period={chartPeriod} />
                    </div>
                </div>

                <div className="energy-details-section">
                    <div className="lights-header">
                        <h3>Gerätedetails</h3>
                        <div className="sort-controls">
                            <label>Sortieren nach:</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="usage">Verbrauch</option>
                                <option value="name">Name</option>
                                <option value="status">Status</option>
                            </select>
                        </div>
                    </div>

                    <div className="lights-energy-grid">
                        {sortedLights.map(([id, light]) => (
                            <LightEnergyCard
                                key={id}
                                light={light}
                                lightId={id}
                                energyCost={energyCost}
                                usageData={usageData}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {status.message && (
                <div className={`status-message status-${status.type}`}>
                    {status.message}
                </div>
            )}

            {showCostDialog && (
                <EnergyCostDialog
                    currentCost={energyCost}
                    onSave={saveEnergyCost}
                    onCancel={() => setShowCostDialog(false)}
                />
            )}
        </div>
    );
};

export default EnergyDashboardView;