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

    useEffect(() => {
        if (!canvasRef.current || !usageData) return;

        const ctx = canvasRef.current.getContext('2d');
        const canvas = canvasRef.current;

        // Canvas auf Container-Größe anpassen
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = 200;
        };

        resizeCanvas();

        // Zeichne das Diagramm
        drawChart(ctx, canvas.width, canvas.height, usageData, period);

        // Event-Listener für Größenänderungen
        window.addEventListener('resize', () => {
            resizeCanvas();
            drawChart(ctx, canvas.width, canvas.height, usageData, period);
        });

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [usageData, period]);

    // Diagramm zeichnen
    const drawChart = (ctx, width, height, data, period) => {
        ctx.clearRect(0, 0, width, height);

        // Beispieldaten generieren, wenn keine vorhanden sind
        if (!data || Object.keys(data).length === 0) {
            data = generateSampleData(period);
        }

        const days = period === 'week' ? 7 : 30;
        const values = Array(days).fill(0);

        // Summiere die Daten aller Lichter für jeden Tag
        Object.values(data).forEach(lightData => {
            if (lightData.history) {
                lightData.history.forEach((day, index) => {
                    if (index < days) {
                        values[index] += day.kwh;
                    }
                });
            }
        });

        // Finde den maximalen Wert für die Skalierung
        const maxValue = Math.max(...values) * 1.2;

        // Zeichne Hintergrundlinien
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Horizontale Linien
        for (let i = 0; i <= 4; i++) {
            const y = height - (i / 4) * (height - 30);
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();
        }

        // Zeichne die Balken
        const barWidth = Math.min(40, (width - 60) / days);
        const barSpacing = Math.min(10, (width - 60 - barWidth * days) / (days - 1));
        const totalBarWidth = barWidth + barSpacing;

        // Zeichne die Balken mit Farbverlauf
        for (let i = 0; i < days; i++) {
            const value = values[i];
            const barHeight = (value / maxValue) * (height - 30);
            const x = 40 + i * totalBarWidth;
            const y = height - barHeight;

            // Balkenfarbverlauf
            const gradient = ctx.createLinearGradient(x, y, x, height);
            gradient.addColorStop(0, 'rgba(125, 131, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(125, 131, 255, 0.3)');

            ctx.fillStyle = gradient;

            // Zeichne abgerundete Balken
            const radius = Math.min(barWidth / 2, 4);
            ctx.beginPath();

            if (barHeight > radius * 2) {
                ctx.moveTo(x, height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.lineTo(x + barWidth - radius, y);
                ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
                ctx.lineTo(x + barWidth, height - radius);
                ctx.quadraticCurveTo(x + barWidth, height, x + barWidth - radius, height);
                ctx.lineTo(x + radius, height);
                ctx.quadraticCurveTo(x, height, x, height - radius);
            } else {
                // Für sehr kleine Balken ein einfaches Rechteck
                ctx.rect(x, height - Math.max(1, barHeight), barWidth, Math.max(1, barHeight));
            }

            ctx.closePath();
            ctx.fill();

            // Wert über dem Balken anzeigen
            if (barHeight > 15) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(value.toFixed(1), x + barWidth / 2, y - 5);
            }

            // X-Achsen-Beschriftung
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';

            let label;
            if (period === 'week') {
                // Wochentage
                const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
                label = days[i % 7];
            } else {
                // Einfache Nummerierung bei Monat
                label = (i + 1).toString();
            }

            ctx.fillText(label, x + barWidth / 2, height - 5);
        }

        // Y-Achsen-Beschriftung (kWh)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';

        for (let i = 0; i <= 4; i++) {
            const value = (maxValue * i / 4).toFixed(1);
            const y = height - (i / 4) * (height - 30) + 4;
            ctx.fillText(`${value}`, 35, y);
        }

        // Einheit
        ctx.textAlign = 'left';
        ctx.fillText('kWh', 5, 15);

        // Titel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Energieverbrauch (${period === 'week' ? 'Woche' : 'Monat'})`, width / 2, 15);
    };

    // Generiere Beispieldaten für die Vorschau
    const generateSampleData = (period) => {
        const days = period === 'week' ? 7 : 30;
        const sampleData = {};

        // Generiere für jede Lampe einen Eintrag
        for (let i = 1; i <= 3; i++) {
            const lightHistory = Array(days).fill().map(() => ({
                kwh: Math.random() * 0.3 + 0.1 // Zwischen 0.1 und 0.4 kWh pro Tag
            }));

            sampleData[`sample-light-${i}`] = {
                history: lightHistory,
                dailyKwh: lightHistory.reduce((sum, day) => sum + day.kwh, 0) / days
            };
        }

        return sampleData;
    };

    return (
        <div className="energy-chart-container">
            <canvas ref={canvasRef} className="energy-chart"></canvas>
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