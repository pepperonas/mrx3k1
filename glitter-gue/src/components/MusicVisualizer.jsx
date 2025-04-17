// MusicVisualizer.jsx - Visuelles Feedback für den Disco-Modus
import React, { useRef, useEffect, useState } from 'react';

const MusicVisualizer = () => {
    const canvasRef = useRef(null);
    const [audioContext, setAudioContext] = useState(null);
    const [analyser, setAnalyser] = useState(null);
    const [dataArray, setDataArray] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        // Initialisierung
        const setupAudio = async () => {
            try {
                // Audio-Kontext erstellen
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const audioAnalyser = context.createAnalyser();
                audioAnalyser.fftSize = 256;

                // Mikrofonzugriff anfordern
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                });

                // Mikrofon mit Analyzer verbinden
                const source = context.createMediaStreamSource(stream);
                source.connect(audioAnalyser);

                // Daten-Array erstellen
                const bufferLength = audioAnalyser.frequencyBinCount;
                const array = new Uint8Array(bufferLength);

                setAudioContext(context);
                setAnalyser(audioAnalyser);
                setDataArray(array);
                setIsAnalyzing(true);
            } catch (error) {
                console.error("Fehler beim Einrichten des Audio-Analyzers:", error);
            }
        };

        setupAudio();

        // Cleanup
        return () => {
            if (audioContext) {
                audioContext.close();
            }
            setIsAnalyzing(false);
        };
    }, []);

    useEffect(() => {
        if (!isAnalyzing || !analyser || !dataArray || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const renderFrame = () => {
            if (!isAnalyzing) return;

            // Canvas-Größe an Container anpassen
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;

            requestAnimationFrame(renderFrame);

            // Audio-Daten holen
            analyser.getByteFrequencyData(dataArray);

            // Canvas löschen
            ctx.fillStyle = 'rgba(26, 27, 35, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Variablen für die Visualisierung
            const barWidth = (canvas.width / dataArray.length) * 2.5;
            let x = 0;

            // Frequenzbereiche für Bass, Mid, Treble
            const bassEnd = Math.floor(dataArray.length * 0.2);
            const midEnd = Math.floor(dataArray.length * 0.6);

            // Zeichne die Frequenzbalken
            for (let i = 0; i < dataArray.length; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

                // Farbe basierend auf Frequenzbereich
                if (i < bassEnd) {
                    // Bass - Rot
                    ctx.fillStyle = `rgb(255, ${60 + (dataArray[i]/255) * 40}, ${40 + (dataArray[i]/255) * 40})`;
                } else if (i < midEnd) {
                    // Mid - Grün
                    ctx.fillStyle = `rgb(${40 + (dataArray[i]/255) * 40}, 255, ${60 + (dataArray[i]/255) * 40})`;
                } else {
                    // Treble - Blau
                    ctx.fillStyle = `rgb(${40 + (dataArray[i]/255) * 40}, ${60 + (dataArray[i]/255) * 40}, 255)`;
                }

                // Zeichne den Balken von unten nach oben
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                // Zeichne einen Kreis oben auf dem Balken
                const circleRadius = barWidth * 0.6;
                if (barHeight > circleRadius) {
                    ctx.beginPath();
                    ctx.arc(x + barWidth/2, canvas.height - barHeight, circleRadius, 0, Math.PI * 2);
                    ctx.fill();
                }

                x += barWidth + 1;
            }
        };

        renderFrame();

        return () => {
            setIsAnalyzing(false);
        };
    }, [isAnalyzing, analyser, dataArray]);

    return (
        <div className="visualizer-container">
            <canvas ref={canvasRef} className="visualizer-canvas"></canvas>
        </div>
    );
};

export default MusicVisualizer;