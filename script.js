// Eine Liste von Code-Fragmenten für die Animation
const codeFragments = [
    "if (x > 0)", "function()", "return true;", "for(i=0;i<10;i++)", "while(true)",
    "await fetch(url)", "import React", "const data = []", "try { ... } catch(e) { }",
    "class Node {}", "<div>", "git commit", "npm install", "docker run",
    "SELECT * FROM", "console.log()", "var x = 10", "async/await", "let array = []",
    "export default", "addEventListener", "Promise.all()", "new Map()", "Object.keys()",
    "useState()", "useEffect()", "componentDidMount()", "this.setState()", "props =>",
    ".then()", ".catch()", ".filter()", ".map()", ".reduce()",
    "sudo apt-get", "ssh root@", "python -m", "pip install", "java -jar",
    "kubectl", "terraform", "aws s3", "gcloud", "azure",
    "curl -X POST", "wget -O", "chmod +x", "grep -r", "sed 's/a/b/g'",
    "{...props}", "</body>", "<head>", "<!DOCTYPE html>", "app.use(express())",
    "throw Error()", "typeof x === 'string'", "null ?? 'default'", "x?.property",
    "git push", "docker-compose up", "cd /var/www", "rm -rf", "mkdir -p",
    "npm run build", "yarn start", "go build", "mvn install", "gradle build",
    "systemctl restart", "kubectl apply", "helm install", "terraform apply", "aws lambda",
    "const router = express.Router()", "<React.Fragment>", "import { useState }", "export interface", "class implements",
    "public static void main", "def __init__(self)", "sudo systemctl", "git checkout -b", "brew install"
];

// Grab the canvas element from the DOM
const canvas = document.getElementById("canvas");
// Get a 2D drawing context from the canvas
const ctx = canvas.getContext("2d");

// Arrays to hold various particle types
const particles = [];
const dustParticles = [];
const activeCodeFragments = [];

// A simple mouse state object to track the user's cursor
const mouse = {
    x: null,
    y: null,
    set: function ({x, y}) {
        this.x = x;
        this.y = y;
    },
    reset: function () {
        this.x = null;
        this.y = null;
    }
};

// Some global state variables for background shifting and frame counting
let backgroundHue = 0;
let frameCount = 0;
let autoDrift = true;

// Dynamically adjust the number of particles based on canvas size
function adjustParticleCount() {
    const particleConfig = {
        heightConditions: [200, 300, 400, 500, 600],
        widthConditions: [450, 600, 900, 1200, 1600],
        particlesForHeight: [40, 60, 70, 90, 110],
        particlesForWidth: [40, 50, 70, 90, 110]
    };

    let numParticles = 130;

    // Check the height and pick a suitable particle count
    for (let i = 0; i < particleConfig.heightConditions.length; i++) {
        if (canvas.height < particleConfig.heightConditions[i]) {
            numParticles = particleConfig.particlesForHeight[i];
            break;
        }
    }

    // Check the width and try to lower the particle count if needed
    for (let i = 0; i < particleConfig.widthConditions.length; i++) {
        if (canvas.width < particleConfig.widthConditions[i]) {
            numParticles = Math.min(
                numParticles,
                particleConfig.particlesForWidth[i]
            );
            break;
        }
    }

    return numParticles;
}

// Particle class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 3 + 1;
        this.hue = Math.random() * 360;
        this.alpha = 1;
        this.sizeDirection = Math.random() < 0.5 ? -1 : 1;
        this.trail = [];
    }

    update() {
        // Völlig zufällige Bewegung ohne Anziehungspunkte
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        // Geschwindigkeit begrenzen, damit Partikel nicht zu schnell werden
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 2) {
            this.vx = (this.vx / speed) * 2;
            this.vy = (this.vy / speed) * 2;
        }

        // Wenn Partikel zu langsam wird, zufälligen Schubs geben
        if (speed < 0.2) {
            this.vx += (Math.random() - 0.5) * 0.5;
            this.vy += (Math.random() - 0.5) * 0.5;
        }

        // Leichte Abstoßung zwischen Partikeln, um Cluster zu vermeiden
        for (let i = 0; i < particles.length && i < 10; i++) {
            const other = particles[Math.floor(Math.random() * particles.length)];
            if (other === this) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distSquared = dx * dx + dy * dy;

            if (distSquared < 400) {
                const repulsion = 0.03 / (distSquared + 1);
                this.vx -= dx * repulsion;
                this.vy -= dy * repulsion;
            }
        }

        // Leichte Dämpfung der Geschwindigkeit
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Position aktualisieren
        this.x += this.vx;
        this.y += this.vy;

        // Vom Rand abprallen mit zufälliger Richtungsänderung
        if (this.x <= 0 || this.x >= canvas.width) {
            this.vx = -this.vx * 0.8;
            // Zufällige Y-Komponente hinzufügen
            this.vy += (Math.random() - 0.5) * 0.5;
            this.x = Math.max(0, Math.min(this.x, canvas.width));
        }

        if (this.y <= 0 || this.y >= canvas.height) {
            this.vy = -this.vy * 0.8;
            // Zufällige X-Komponente hinzufügen
            this.vx += (Math.random() - 0.5) * 0.5;
            this.y = Math.max(0, Math.min(this.y, canvas.height));
        }

        // Größenänderung und Farbwechsel wie zuvor
        this.size += this.sizeDirection * 0.1;
        if (this.size > 4 || this.size < 1) this.sizeDirection *= -1;
        this.hue = (this.hue + 0.3) % 360;

        // Trail-Aktualisierung
        if (
            frameCount % 2 === 0 &&
            (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1)
        ) {
            this.trail.push({
                x: this.x,
                y: this.y,
                hue: this.hue,
                alpha: this.alpha
            });
            if (this.trail.length > 15) this.trail.shift();
        }
    }

    draw(ctx) {
        // Draw a gradient-based circle to represent the particle
        const gradient = ctx.createRadialGradient(
            this.x,
            this.y,
            0,
            this.x,
            this.y,
            this.size
        );
        gradient.addColorStop(
            0,
            `hsla(${this.hue}, 80%, 60%, ${this.alpha})`
        );
        gradient.addColorStop(
            1,
            `hsla(${this.hue + 30}, 80%, 30%, ${this.alpha})`
        );

        ctx.fillStyle = gradient;
        // Add a slight glow if the screen is large
        ctx.shadowBlur = canvas.width > 900 ? 10 : 0;
        ctx.shadowColor = `hsl(${this.hue}, 80%, 60%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw the particle's trail as a faint line
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.lineWidth = 1.5;
            for (let i = 0; i < this.trail.length - 1; i++) {
                const {x: x1, y: y1, hue: h1, alpha: a1} = this.trail[i];
                const {x: x2, y: y2} = this.trail[i + 1];
                ctx.strokeStyle = `hsla(${h1}, 80%, 60%, ${a1})`;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        }
    }
}

// Dust particles are static, background-like elements to add depth and interest
class DustParticle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.hue = Math.random() * 360;
        this.vx = (Math.random() - 0.5) * 0.05;
        this.vy = (Math.random() - 0.5) * 0.05;
    }

    update() {
        // Wrap around the edges so dust just cycles across the screen
        this.x = (this.x + this.vx + canvas.width) % canvas.width;
        this.y = (this.y + this.vy + canvas.height) % canvas.height;
        // Slowly shift hue for a subtle shimmering effect
        this.hue = (this.hue + 0.1) % 360;
    }

    draw(ctx) {
        // Draw faint circles
        ctx.fillStyle = `hsla(${this.hue}, 30%, 70%, 0.3)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Code Fragment class
class CodeFragment {
    constructor(x, y, text, hue) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.hue = hue;
        // Zufällige Transparenz für mehr visuelle Variation
        this.alpha = 0.5 + Math.random() * 0.5;
        // Größere und zufälligere Schriftgrößen (zwischen 10 und 30 Pixeln)
        this.size = 10 + Math.random() * 20; // Basisgröße zwischen 10 und 30
        // Zufällige Lebensdauer
        this.life = 150 + Math.random() * 250;
        this.maxLife = this.life;
        // Zufällige Rotation
        this.angle = Math.random() * Math.PI * 2;
        // Völlig zufällige Bewegung
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        // Rotationsgeschwindigkeit
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
        this.life--;

        // Zufällige Änderung der Bewegungsrichtung
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        // Geschwindigkeit begrenzen
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 1) {
            this.vx = (this.vx / speed) * 1;
            this.vy = (this.vy / speed) * 1;
        }

        // Leichte Dämpfung
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Position aktualisieren
        this.x += this.vx;
        this.y += this.vy;

        // Rotation aktualisieren
        this.angle += this.rotationSpeed;

        // Vom Rand abprallen
        if (this.x < 0 || this.x > canvas.width) {
            this.vx *= -1;
            this.x = Math.max(0, Math.min(this.x, canvas.width));
            // Richtung leicht ändern
            this.vy += (Math.random() - 0.5) * 0.3;
        }

        if (this.y < 0 || this.y > canvas.height) {
            this.vy *= -1;
            this.y = Math.max(0, Math.min(this.y, canvas.height));
            // Richtung leicht ändern
            this.vx += (Math.random() - 0.5) * 0.3;
        }

        // Zufällige Größenänderungen
        if (Math.random() < 0.02) {
            this.size += (Math.random() - 0.5) * 0.5;
            this.size = Math.max(6, Math.min(this.size, 16));
        }

        // Zufällige Farbänderungen
        if (Math.random() < 0.05) {
            this.hue = (this.hue + Math.random() * 20 - 10) % 360;
            if (this.hue < 0) this.hue += 360;
        }

        // Transparenz gegen Ende verringern
        if (this.life < 60) {
            this.alpha = this.life / 60 * 0.7;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Füge Text-Schatten für bessere Lesbarkeit und optischen Effekt hinzu
        ctx.shadowColor = `rgba(0, 0, 0, ${this.alpha * 0.7})`;
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Zufällig variierte Textfarbe
        ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.alpha})`;
        // Verwende nur Monospace-Schriften
        ctx.font = `${this.size}px "Consolas", "Courier New", "Menlo", "Monaco", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, 0, 0);

        // Setze Schatten zurück
        ctx.shadowColor = "transparent";

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// Create initial sets of particles whenever we resize the canvas
function createParticles() {
    particles.length = 0;
    dustParticles.length = 0;
    activeCodeFragments.length = 0;

    const numParticles = adjustParticleCount();

    // Komplett zufällige Verteilung ohne Grid
    for (let i = 0; i < numParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;

        // Zufällige Anfangsgeschwindigkeit in beliebiger Richtung
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;

        const particle = new Particle(x, y);
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;

        particles.push(particle);
    }

    // Auch die Staubpartikel völlig zufällig verteilen
    for (let i = 0; i < 250; i++) {
        dustParticles.push(new DustParticle());
    }

    // Initial ein paar Code-Fragmente erzeugen
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const fragmentText = codeFragments[Math.floor(Math.random() * codeFragments.length)];
        const hue = Math.random() * 360;
        activeCodeFragments.push(new CodeFragment(x, y, fragmentText, hue));
    }
}

// Keep canvas full size to fill the browser window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
}

// Draw a shifting background gradient
// Draw a static background with the color #2C2E3B
function drawBackground() {
    // Setze die Hintergrundfarbe auf #2C2E3B
    ctx.fillStyle = "#1f2026";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional: Füge ein feines "Noise"-Muster hinzu für einen technischeren Look
    ctx.fillStyle = `rgba(0, 0, 0, 0.02)`;
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 1;
        ctx.fillRect(x, y, size, size);
    }
}

// Verwalte die Code-Fragmente
function updateCodeFragments() {
    const maxFragments = 150;

    // Erstelle regelmäßig neue Fragmente
    if (frameCount % 10 === 0 && activeCodeFragments.length < maxFragments) {
        // Mehr Fragmente pro Batch erstellen
        for (let i = 0; i < 5; i++) {
            // Zufällige Position im gesamten Canvas
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;

            // Zufälliges Codefragment auswählen
            const fragmentText = codeFragments[Math.floor(Math.random() * codeFragments.length)];

            // Zufällige Farbe
            const hue = Math.random() * 360;

            // Neues Fragment erstellen
            activeCodeFragments.push(new CodeFragment(x, y, fragmentText, hue));
        }
    }

    // Bestehende Fragmente aktualisieren und zeichnen
    for (let i = activeCodeFragments.length - 1; i >= 0; i--) {
        const fragment = activeCodeFragments[i];
        fragment.update();
        fragment.draw(ctx);

        if (fragment.isDead()) {
            activeCodeFragments.splice(i, 1);
        }
    }
}

// Main animation loop
function animate() {
    drawBackground();

    // Update and draw dust particles
    for (let i = dustParticles.length - 1; i >= 0; i--) {
        dustParticles[i].update();
        dustParticles[i].draw(ctx);
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
    }

    // Update and draw code fragments
    updateCodeFragments();

    frameCount++;
    requestAnimationFrame(animate);
}

// Mousemove: set mouse position and add new code fragments
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.set({x: e.clientX - rect.left, y: e.clientY - rect.top});

    // Füge ein neues Code-Fragment bei Mausbewegung hinzu
    if (Math.random() < 0.1 && activeCodeFragments.length < 200) {
        const fragmentText = codeFragments[Math.floor(Math.random() * codeFragments.length)];
        const hue = Math.random() * 360;
        activeCodeFragments.push(new CodeFragment(mouse.x, mouse.y, fragmentText, hue));
    }
});

// Mouse leaves: reset mouse position
canvas.addEventListener("mouseleave", () => {
    mouse.reset();
});

// Click to create code fragment explosion
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Erzeuge eine größere Anzahl von Code-Fragmenten bei einem Klick
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 50;
        const x = clickX + Math.cos(angle) * distance;
        const y = clickY + Math.sin(angle) * distance;

        const fragmentText = codeFragments[Math.floor(Math.random() * codeFragments.length)];
        const hue = Math.random() * 360;
        const fragment = new CodeFragment(x, y, fragmentText, hue);

        // Gib dem Fragment eine Anfangsgeschwindigkeit weg vom Klickpunkt
        fragment.vx = Math.cos(angle) * (1 + Math.random());
        fragment.vy = Math.sin(angle) * (1 + Math.random());

        activeCodeFragments.push(fragment);
    }
});

// Whenever the window is resized, adjust canvas and particles
window.addEventListener("resize", resizeCanvas);

// Initialize everything
resizeCanvas();
animate();