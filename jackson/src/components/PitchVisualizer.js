import React, { useEffect, useRef, useState } from 'react';

const PitchVisualizer = ({
                             songData,
                             currentTime,
                             currentPitch,
                             targetPitch,
                             pitchHistory,
                             debugMode
                         }) => {
    const [pitchPoints, setPitchPoints] = useState([]);
    const [visualRange, setVisualRange] = useState({ min: 40, max: 90 });
    const canvasRef = useRef(null);
    const [timeWindow, setTimeWindow] = useState(10); // Fenster in Sekunden

    // Effekt zum Berechnen der visuellen Bereichsgrenzen
    useEffect(() => {
        if (songData?.pitchData && songData.pitchData.length > 0) {
            // Berechne den Pitch-Bereich für bessere Visualisierung
            const pitches = songData.pitchData.map(p => p.pitch);
            const minPitch = Math.min(...pitches);
            const maxPitch = Math.max(...pitches);

            // Füge etwas Padding hinzu
            setVisualRange({
                min: Math.max(minPitch - 5, 0),
                max: maxPitch + 5
            });

            if (debugMode) {
                console.log(`Pitch-Bereich: ${minPitch} bis ${maxPitch}`);
            }
        }
    }, [songData, debugMode]);

    // Effekt zum Aktualisieren der angezeigten Pitch-Punkte
    useEffect(() => {
        if (songData?.pitchData && songData.pitchData.length > 0) {
            // Berechne das aktuelle Zeitfenster
            const startTime = Math.max(0, currentTime - timeWindow / 2);
            const endTime = currentTime + timeWindow / 2;

            // Filtere alle Pitch-Daten im aktuellen Zeitfenster
            const visiblePoints = songData.pitchData
                .filter(p => p.time >= startTime && p.time <= endTime)
                .map(p => ({
                    ...p,
                    isCurrent: Math.abs(p.time - currentTime) < 0.2, // Markiere aktuellen Punkt
                }));

            setPitchPoints(visiblePoints);
        }
    }, [songData, currentTime, timeWindow]);

    // Effekt zum Zeichnen der Pitch-Visualisierung
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || pitchPoints.length === 0) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas.getBoundingClientRect();

        // Canvas-Größe anpassen
        canvas.width = width;
        canvas.height = height;

        // Hintergrund
        ctx.fillStyle = '#242634'; // var(--inner-bg)
        ctx.fillRect(0, 0, width, height);

        // Raster zeichnen
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Horizontale Linien (Pitches)
        const pitchStep = 5;
        const pitchRange = visualRange.max - visualRange.min;
        for (let p = visualRange.min; p <= visualRange.max; p += pitchStep) {
            const y = height - ((p - visualRange.min) / pitchRange) * height;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Pitch-Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText(p.toString(), 5, y - 3);
        }

        // Vertikale Linien (Zeit)
        const timeStep = 1; // 1 Sekunde
        const startTime = Math.max(0, currentTime - timeWindow / 2);
        const endTime = currentTime + timeWindow / 2;
        const timeRange = endTime - startTime;

        for (let t = Math.floor(startTime); t <= endTime; t += timeStep) {
            const x = ((t - startTime) / timeRange) * width;

            // Zeit-Linie
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            // Zeit-Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText(t.toString() + 's', x + 2, height - 5);
        }

        // Aktuelle Zeitleinie
        const currentX = ((currentTime - startTime) / timeRange) * width;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.setLineDash([5, 3]);
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ziel-Pitch-Linie zeichnen, wenn vorhanden
        if (targetPitch !== null && targetPitch >= visualRange.min && targetPitch <= visualRange.max) {
            const targetY = height - ((targetPitch - visualRange.min) / pitchRange) * height;

            // Gradient für Ziel-Pitch-Linie
            const gradient = ctx.createLinearGradient(0, targetY, width, targetY);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
            gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.2)');

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, targetY);
            ctx.lineTo(width, targetY);
            ctx.stroke();

            // Ziel-Pitch-Label
            ctx.fillStyle = '#a78bfa'; // var(--primary-light)
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(`Ziel: ${targetPitch}`, width - 70, targetY - 8);
        }

        // Pitch-Punkte zeichnen
        pitchPoints.forEach(point => {
            const x = ((point.time - startTime) / timeRange) * width;
            const y = height - ((point.pitch - visualRange.min) / pitchRange) * height;

            // Bestimme Punktfarbe
            let color = '#3b82f6'; // var(--accent)
            if (point.isCurrent) {
                color = '#8b5cf6'; // var(--primary)
            }

            // Zeichne Punkt
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, point.isCurrent ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();

            // Glühen für aktuelle Punkte
            if (point.isCurrent) {
                ctx.shadowColor = '#8b5cf6';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });

        // Verbinde die Punkte mit einer Linie
        if (pitchPoints.length > 1) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // var(--accent) mit Transparenz
            ctx.lineWidth = 2;
            ctx.beginPath();

            pitchPoints.forEach((point, idx) => {
                const x = ((point.time - startTime) / timeRange) * width;
                const y = height - ((point.pitch - visualRange.min) / pitchRange) * height;

                if (idx === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        }

        // Aktuellen Pitch anzeigen
        if (currentPitch !== null && currentPitch >= visualRange.min && currentPitch <= visualRange.max) {
            const currentY = height - ((currentPitch - visualRange.min) / pitchRange) * height;

            // Hintergrund für aktuellen Pitch
            ctx.fillStyle = 'rgba(35, 37, 51, 0.7)';
            ctx.fillRect(width - 100, currentY - 20, 90, 40);
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 1;
            ctx.strokeRect(width - 100, currentY - 20, 90, 40);

            // Text für aktuellen Pitch
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(`${currentPitch}`, width - 70, currentY + 5);

            // Linie von aktuellem Punkt zum Wert
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            ctx.lineTo(width - 100, currentY);
            ctx.stroke();
        }

        // Debug-Informationen
        if (debugMode) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 250, 70);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.fillText(`Zeit: ${currentTime.toFixed(2)}s`, 20, 30);
            ctx.fillText(`Aktueller Pitch: ${currentPitch || 'N/A'}`, 20, 50);
            ctx.fillText(`Ziel-Pitch: ${targetPitch || 'N/A'}`, 20, 70);
        }

    }, [pitchPoints, currentTime, targetPitch, currentPitch, visualRange, timeWindow, debugMode]);

    return (
        <div className="pitch-visualizer-container">
            <div className="controls">
                <div className="zoom-controls">
                    <button
                        className="btn btn-small btn-outline"
                        onClick={() => setTimeWindow(prev => Math.max(prev - 2, 4))}
                    >
                        Zoom In
                    </button>
                    <span className="time-window-display">{timeWindow}s</span>
                    <button
                        className="btn btn-small btn-outline"
                        onClick={() => setTimeWindow(prev => Math.min(prev + 2, 20))}
                    >
                        Zoom Out
                    </button>
                </div>

                {pitchPoints.length === 0 && (
                    <div className="no-data-message">
                        Keine Pitch-Daten im aktuellen Zeitbereich
                    </div>
                )}
            </div>

            <div className="pitch-canvas-container">
                <canvas
                    ref={canvasRef}
                    className="pitch-canvas"
                />
            </div>

            {debugMode && (
                <div className="debug-info">
                    <div>Visualisierungsbereich: {visualRange.min} bis {visualRange.max}</div>
                    <div>Sichtbare Datenpunkte: {pitchPoints.length}</div>
                    <div>Zeitfenster: {timeWindow}s</div>
                </div>
            )}
        </div>
    );
};

export default PitchVisualizer;