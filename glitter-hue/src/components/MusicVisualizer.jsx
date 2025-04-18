// MusicVisualizer.jsx - Verbesserte visuelle Darstellung für den Disco-Modus
import React, { useRef, useEffect, useState } from 'react';

const MusicVisualizer = () => {
    const canvasRef = useRef(null);
    const [audioContext, setAudioContext] = useState(null);
    const [analyser, setAnalyser] = useState(null);
    const [dataArray, setDataArray] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [particles, setParticles] = useState([]);
    const animationRef = useRef(null);

    // Einfache Partikelklasse für Hintergrundeffekte
    class Particle {
        constructor(canvas) {
            this.canvas = canvas;
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.color = this.getRandomColor();
            this.alpha = 0.1 + Math.random() * 0.4;
            this.maxSize = Math.random() * 3 + 4;
        }

        getRandomColor() {
            const colors = [
                '#6C63FF', // Primärfarbe
                '#9D97FF', // Primärfarbe hell
                '#4E46E5', // Primärfarbe dunkel
                '#FF7D6B', // Akzentfarbe
                '#63E0FF'  // Akzentfarbe alt
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update(bassValue) {
            this.x += this.speedX;
            this.y += this.speedY;

            // Größenanpassung basierend auf Bass
            const targetSize = this.size + (bassValue * this.maxSize);
            this.size = this.size * 0.95 + targetSize * 0.05;

            // Neupositionierung von Partikeln, die den Bildschirm verlassen
            if (this.x < 0 || this.x > this.canvas.width) {
                this.x = Math.random() * this.canvas.width;
                this.y = Math.random() * this.canvas.height;
            }
            if (this.y < 0 || this.y > this.canvas.height) {
                this.x = Math.random() * this.canvas.width;
                this.y = Math.random() * this.canvas.height;
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    useEffect(() => {
        // Audio-System einrichten
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
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Partikel initialisieren
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Canvas-Größe an Container anpassen
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // Partikel erstellen
        const particleCount = Math.floor(canvas.width * canvas.height / 9000);
        const newParticles = [];
        for (let i = 0; i < particleCount; i++) {
            newParticles.push(new Particle(canvas));
        }
        setParticles(newParticles);
    }, [canvasRef]);

    // Haupt-Rendering-Loop
    useEffect(() => {
        if (!isAnalyzing || !analyser || !dataArray || !canvasRef.current || particles.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const renderFrame = () => {
            if (!isAnalyzing) return;

            animationRef.current = requestAnimationFrame(renderFrame);

            // Canvas-Größe aktualisieren, falls nötig
            const parent = canvas.parentElement;
            if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }

            // Audio-Daten holen
            analyser.getByteFrequencyData(dataArray);

            // Frequenzbereiche für Bass, Mid, Treble
            const bassEnd = Math.floor(dataArray.length * 0.15);
            const midEnd = Math.floor(dataArray.length * 0.6);

            // Durchschnittswerte berechnen
            let bassAvg = 0;
            for (let i = 0; i < bassEnd; i++) {
                bassAvg += dataArray[i];
            }
            bassAvg = bassAvg / bassEnd / 255;

            // Canvas teilweise löschen für Traileffekt
            ctx.fillStyle = 'rgba(26, 27, 46, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Hintergrundpartikel aktualisieren und zeichnen
            particles.forEach(particle => {
                particle.update(bassAvg);
                particle.draw(ctx);
            });

            // Visualisierungsparameter
            const barWidth = (canvas.width / dataArray.length) * 2.5;
            const barSpacing = 1;
            let x = 0;

            // Zeichne die Frequenzbalken mit Glow-Effekt
            for (let i = 0; i < dataArray.length; i++) {
                const value = dataArray[i] / 255;
                const barHeight = value * canvas.height * 0.8;

                // Farbe basierend auf Frequenzbereich
                let color;
                if (i < bassEnd) {
                    // Bass - Violett/Pink
                    color = `rgb(${108 + (value * 40)}, ${99 + (value * 40)}, 255)`;
                } else if (i < midEnd) {
                    // Mid - Türkis
                    color = `rgb(${99 + (value * 40)}, ${224 + (value * 30)}, 255)`;
                } else {
                    // Treble - Corallen
                    color = `rgb(255, ${125 + (value * 40)}, ${107 + (value * 40)})`;
                }

                // Schattierungen für 3D-Effekt
                const gradient = ctx.createLinearGradient(
                    x, canvas.height - barHeight,
                    x + barWidth, canvas.height
                );
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'rgba(26, 27, 46, 0.8)');

                // Zeichne den Balken
                ctx.fillStyle = gradient;

                // Abgerundete Ecken für die Balken
                const radius = barWidth / 2;
                const height = Math.max(barHeight, radius * 2); // Mindesthöhe für Rundungen

                // Zeichne nur wenn über dem Schwellenwert
                if (barHeight > 2) {
                    ctx.beginPath();
                    ctx.moveTo(x + radius, canvas.height);
                    ctx.lineTo(x + radius, canvas.height - height + radius);
                    ctx.quadraticCurveTo(x, canvas.height - height, x + radius, canvas.height - height);
                    ctx.lineTo(x + barWidth - radius, canvas.height - height);
                    ctx.quadraticCurveTo(x + barWidth, canvas.height - height, x + barWidth - radius, canvas.height - height + radius);
                    ctx.lineTo(x + barWidth - radius, canvas.height);
                    ctx.closePath();
                    ctx.fill();

                    // Glow-Effekt für hohe Werte
                    if (value > 0.6) {
                        ctx.shadowColor = color;
                        ctx.shadowBlur = 10 * value;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }

                    // Reflexion zeichnen
                    ctx.fillStyle = `rgba(255, 255, 255, ${value * 0.2})`;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, 1);
                }

                x += barWidth + barSpacing;
            }

            // Verbindungslinie zwischen den Frequenzen
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            x = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const value = dataArray[i] / 255;
                const barHeight = value * canvas.height * 0.8;

                if (i === 0) {
                    ctx.moveTo(x, canvas.height - barHeight);
                } else {
                    ctx.lineTo(x, canvas.height - barHeight);
                }

                x += barWidth + barSpacing;
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.closePath();

            // Schöner Verlaufseffekt für die Verbindungslinie
            const lineGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            lineGradient.addColorStop(0, 'rgba(108, 99, 255, 0.2)');
            lineGradient.addColorStop(1, 'rgba(26, 27, 46, 0.0)');

            ctx.fillStyle = lineGradient;
            ctx.fill();

            // Außenlinie zeichnen
            ctx.strokeStyle = 'rgba(108, 99, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        renderFrame();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isAnalyzing, analyser, dataArray, particles]);

    return (
        <div className="visualizer-container">
            <canvas ref={canvasRef} className="visualizer-canvas" />
        </div>
    );
};

export default MusicVisualizer;