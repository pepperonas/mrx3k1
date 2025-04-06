// Spielkonstanten und -variablen
const levels = [
    {
        name: "Grundlage - Mittelreihe",
        text: "asdf jklö asdf jklö asdf jklö asdf jklö fjdk slöa asdfjklö fdsa ölkj",
        focusKeys: ["a", "s", "d", "f", "j", "k", "l", "ö"]
    },
    {
        name: "Grundlage - Obere Reihe",
        text: "qwer uiop qwer uiop qwer uiop qwert zuiop qwer tzui",
        focusKeys: ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p"]
    },
    {
        name: "Grundlage - Untere Reihe",
        text: "yxcv bnm yxcv bnm yxcv bnm yxcvb nm",
        focusKeys: ["y", "x", "c", "v", "b", "n", "m"]
    },
    {
        name: "Kombination - Alle Buchstaben",
        text: "der schnelle braune fuchs springt über den faulen hund maja und willi fliegen durch den wald",
        focusKeys: []
    },
    {
        name: "Fortgeschritten - Mit Umlauten",
        text: "schöne grüße aus köln wir üben jetzt mit umlauten ä ö ü",
        focusKeys: ["ä", "ö", "ü"]
    },
    {
        name: "Fortgeschritten - Satzzeichen",
        text: "Hallo, wie geht es dir? Mir geht es gut! Das ist ein Test; bitte übe weiter.",
        focusKeys: [",", ".", "?", "!"]
    },
    {
        name: "Experte - Komplexe Sätze",
        text: "Der Fluss floss träge durch das Tal. Die Bäume am Ufer spiegelten sich im Wasser. Ein Boot glitt langsam vorbei.",
        focusKeys: []
    },
    {
        name: "Meister - Schnelligkeit",
        text: "schnell tippen ist eine kunst die übung erfordert je mehr du übst desto besser wirst du werden",
        focusKeys: []
    }
];

// Globale Variablen
let currentLevel = 0;
let currentTextIndex = 0;
let correctCharacters = 0;
let incorrectCharacters = 0;
let startTime = null;
let timerInterval = null;
let totalSeconds = 0;
let isGameActive = false;

// DOM-Elemente
let textDisplay;
let timeDisplay;
let wpmDisplay;
let accuracyDisplay;
let progressBar;
let currentLevelDisplay;
let levelCompleteScreen;
let nextLevelBtn;
let restartBtn;
let helpBtn;
let handDiagram;
let levelWpm;
let levelAccuracy;
let levelTime;

// Initialisierung nach DOM-Laden
document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente initialisieren
    textDisplay = document.getElementById('text-display');
    timeDisplay = document.getElementById('time');
    wpmDisplay = document.getElementById('wpm');
    accuracyDisplay = document.getElementById('accuracy');
    progressBar = document.getElementById('progress-bar');
    currentLevelDisplay = document.getElementById('current-level');
    levelCompleteScreen = document.querySelector('.level-complete');
    nextLevelBtn = document.querySelector('.next-level-btn');
    restartBtn = document.querySelector('.restart-btn');
    helpBtn = document.querySelector('.help-btn');
    handDiagram = document.querySelector('.hand-diagram');
    levelWpm = document.getElementById('level-wpm');
    levelAccuracy = document.getElementById('level-accuracy');
    levelTime = document.getElementById('level-time');

    // Event-Listener einrichten
    document.addEventListener('keydown', handleKeyPress);
    nextLevelBtn.addEventListener('click', nextLevel);
    restartBtn.addEventListener('click', restart);
    helpBtn.addEventListener('click', toggleHelp);

    // Spielstart
    setupLevel();
});

// Level-Setup
function setupLevel() {
    currentTextIndex = 0;
    correctCharacters = 0;
    incorrectCharacters = 0;
    totalSeconds = 0;
    isGameActive = false;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    timeDisplay.textContent = '00:00';
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '100%';
    progressBar.style.width = '0%';

    currentLevelDisplay.textContent = currentLevel + 1;

    // Text anzeigen
    const levelText = levels[currentLevel].text;
    textDisplay.innerHTML = '';

    for (let i = 0; i < levelText.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.textContent = levelText[i];
        if (i === 0) {
            charSpan.classList.add('current-character');
        }
        textDisplay.appendChild(charSpan);
    }

    // Tastatur-Fokus setzen
    highlightKeys();
}

// Timer-Funktion
function startTimer() {
    startTime = new Date();
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const currentTime = new Date();
        totalSeconds = Math.floor((currentTime - startTime) / 1000);

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // WPM aktualisieren
        updateWPM();
    }, 1000);
}

// WPM berechnen
function updateWPM() {
    if (totalSeconds === 0) return;

    // WPM Berechnung (Anzahl der Zeichen / 5 / Minuten)
    const minutes = totalSeconds / 60;
    const wpm = Math.round((correctCharacters / 5) / minutes);

    wpmDisplay.textContent = wpm;
}

// Genauigkeit berechnen
function updateAccuracy() {
    const totalAttempts = correctCharacters + incorrectCharacters;
    if (totalAttempts === 0) return;

    const accuracy = Math.round((correctCharacters / totalAttempts) * 100);
    accuracyDisplay.textContent = `${accuracy}%`;
}

// Fortschritt aktualisieren
function updateProgress() {
    const levelText = levels[currentLevel].text;
    const progress = (currentTextIndex / levelText.length) * 100;
    progressBar.style.width = `${progress}%`;

    // Level abgeschlossen?
    if (currentTextIndex >= levelText.length) {
        completeLevel();
    }
}

// Level abschließen
function completeLevel() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    isGameActive = false;

    // Statistiken für Level-Abschluss-Bildschirm
    levelWpm.textContent = wpmDisplay.textContent;
    levelAccuracy.textContent = accuracyDisplay.textContent;
    levelTime.textContent = timeDisplay.textContent;

    // Level-Abschluss-Bildschirm anzeigen
    levelCompleteScreen.classList.add('active');

    // Konfetti-Animation
    createConfetti();
}

// Konfetti erstellen
function createConfetti() {
    const confettiCount = 100;
    const container = document.querySelector('.container');

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');

        // Zufällige Position
        const leftPos = Math.random() * 100;
        confetti.style.left = `${leftPos}%`;

        // Zufällige Farbe
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.backgroundColor = color;

        // Zufällige Größe
        const size = Math.random() * 10 + 5;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;

        // Animation
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        confetti.style.animation = `confetti-fall ${duration}s ${delay}s linear forwards`;

        container.appendChild(confetti);

        // Nach Animation entfernen
        setTimeout(() => {
            confetti.remove();
        }, (duration + delay) * 1000);
    }
}

// Tasten hervorheben
function highlightKeys() {
    // Alle Hervorhebungen zurücksetzen
    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('key-highlight');
    });

    // Aktuelle Taste hervorheben
    const levelText = levels[currentLevel].text;
    if (currentTextIndex < levelText.length) {
        const currentChar = levelText[currentTextIndex].toLowerCase();
        const keyElement = document.querySelector(`.key[data-key="${currentChar}"]`);
        if (keyElement) {
            keyElement.classList.add('key-highlight');
        }
    }

    // Fokus-Tasten für das Level hervorheben
    const focusKeys = levels[currentLevel].focusKeys;
    focusKeys.forEach(key => {
        const keyElement = document.querySelector(`.key[data-key="${key}"]`);
        if (keyElement) {
            keyElement.classList.add('key-highlight');
        }
    });
}

// Tastatur-Animation
function animateKey(key) {
    const keyElement = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
    if (keyElement) {
        keyElement.classList.add('key-active');
        setTimeout(() => {
            keyElement.classList.remove('key-active');
        }, 100);
    }
}

// Tastendruck verarbeiten
function handleKeyPress(event) {
    // Nur verarbeiten, wenn kein Overlay angezeigt wird
    if (levelCompleteScreen.classList.contains('active')) return;

    const pressedKey = event.key;
    animateKey(pressedKey);

    // Spielstart
    if (!isGameActive) {
        isGameActive = true;
        startTimer();
    }

    // Aktuellen Zeichen prüfen
    const levelText = levels[currentLevel].text;
    if (currentTextIndex < levelText.length) {
        const currentChar = levelText[currentTextIndex];
        const currentCharElement = textDisplay.children[currentTextIndex];

        if (pressedKey === currentChar) {
            // Richtig
            currentCharElement.classList.remove('current-character');
            currentCharElement.classList.add('correct-character');
            correctCharacters++;

            // Nächster Zeichen
            currentTextIndex++;
            if (currentTextIndex < levelText.length) {
                textDisplay.children[currentTextIndex].classList.add('current-character');
            }

            // Bounce-Animation an der Statistik
            wpmDisplay.parentElement.classList.add('bounce');
            setTimeout(() => {
                wpmDisplay.parentElement.classList.remove('bounce');
            }, 500);
        } else {
            // Falsch
            currentCharElement.classList.add('incorrect-character');
            incorrectCharacters++;

            // Shake-Animation
            textDisplay.classList.add('bounce');
            setTimeout(() => {
                textDisplay.classList.remove('bounce');
            }, 500);

            // Bounce-Animation an der Statistik
            accuracyDisplay.parentElement.classList.add('bounce');
            setTimeout(() => {
                accuracyDisplay.parentElement.classList.remove('bounce');
            }, 500);
        }

        // Statistiken aktualisieren
        updateAccuracy();
        updateWPM();
        updateProgress();
        highlightKeys();
    }
}

// Nächstes Level
function nextLevel() {
    currentLevel = (currentLevel + 1) % levels.length;
    levelCompleteScreen.classList.remove('active');
    setupLevel();
}

// Neustart
function restart() {
    setupLevel();
}

// Hilfe-Toggle
function toggleHelp() {
    handDiagram.style.display = handDiagram.style.display === 'none' ? 'block' : 'none';
}