/**
 * BrainBuster Theme - JavaScript
 * Einfache Interaktionen für das Theme-Template
 */

// Quiz-Option-Auswahl
const quizOptions = document.querySelectorAll('.quiz-option');

quizOptions.forEach(option => {
    option.addEventListener('click', () => {
        // Alle Optionen zurücksetzen
        quizOptions.forEach(opt => opt.classList.remove('option-selected'));

        // Die angeklickte Option als ausgewählt markieren
        option.classList.add('option-selected');
    });
});

// Fortschrittsbalken-Animation
const progressBars = document.querySelectorAll('.progress-fill');

// Funktion zur Animation der Fortschrittsbalken
function animateProgressBars() {
    progressBars.forEach(bar => {
        const targetWidth = bar.style.width;

        // Zurücksetzen für Animation
        bar.style.width = '0%';

        // Animation starten
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 100);
    });
}

// Animation beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    animateProgressBars();
});

// Einfaches Formular-Feedback
const formInputs = document.querySelectorAll('.form-input, .form-select');

formInputs.forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('form-group-active');
    });

    input.addEventListener('blur', () => {
        input.parentElement.classList.remove('form-group-active');
    });
});

// Button-Ripple-Effekt
const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('btn-ripple');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});