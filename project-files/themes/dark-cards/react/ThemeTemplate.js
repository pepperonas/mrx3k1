import React from 'react';
import './theme-template.css';

/**
 * BrainBuster Theme Template (ohne Tailwind)
 * --------------------------
 * Dieses Template zeigt die wichtigsten Designelemente der BrainBuster Quiz App
 * basierend auf dem #2C2E3B Farbschema und Material Design.
 */

// Farbdefinitionen
const colors = {
    background: {
        dark: '#2B2E3B',    // Haupthintergrund
        darker: '#252830',  // Seitenleiste
        card: '#343845',    // Kartenelemente
    },
    accent: {
        blue: '#688db1',    // Helles Blau für Buttons
        green: '#9cb68f',   // Helles Grün für Buttons
        red: '#e16162',     // Für rote Elemente
    },
    secondary: {
        300: '#8ca0b3',     // Hellblau (für Texte und Überschriften)
    },
    text: {
        primary: '#d1d5db', // Primärer Text
        secondary: '#9ca3af', // Sekundärer Text
    }
};

// Komponenten-Demo
const ThemeTemplate = () => {
    return (
        <div className="theme-container">
            <h1 className="page-title">BrainBuster Theme Template</h1>

            {/* Farb-Palette */}
            <section className="section">
                <h2 className="section-title">Farbpalette</h2>
                <div className="color-grid">
                    <ColorSwatch name="Hintergrund (Dunkel)" color={colors.background.dark} />
                    <ColorSwatch name="Hintergrund (Dunkler)" color={colors.background.darker} />
                    <ColorSwatch name="Karten-Hintergrund" color={colors.background.card} />
                    <ColorSwatch name="Akzent Blau" color={colors.accent.blue} />
                    <ColorSwatch name="Akzent Grün" color={colors.accent.green} />
                    <ColorSwatch name="Akzent Rot" color={colors.accent.red} />
                    <ColorSwatch name="Text (Primär)" color={colors.text.primary} />
                    <ColorSwatch name="Text (Sekundär)" color={colors.text.secondary} />
                </div>
            </section>

            {/* Typografie */}
            <section className="section">
                <h2 className="section-title">Typografie</h2>
                <div className="card">
                    <h1 className="h1">Überschrift 1</h1>
                    <h2 className="h2">Überschrift 2</h2>
                    <h3 className="h3">Überschrift 3</h3>
                    <h4 className="h4">Überschrift 4</h4>
                    <p className="text">Normaler Text in Standardgröße. Die App verwendet 'Poppins' als Hauptschriftart.</p>
                    <p className="text-small">Kleinerer Text für weniger wichtige Informationen.</p>
                    <p className="text-accent">Farbiger Text für Hervorhebungen.</p>
                </div>
            </section>

            {/* Komponenten */}
            <section className="section">
                <h2 className="section-title">Komponenten</h2>

                {/* Cards */}
                <div className="subsection">
                    <h3 className="subsection-title">Cards</h3>
                    <div className="card-grid">
                        <div className="card">
                            <h4 className="card-title">Standard Card</h4>
                            <p>Cards werden für alle Content-Bereiche verwendet und haben eine leicht abgerundete Form mit subtiler Schattierung.</p>
                        </div>

                        <div className="card card-alt">
                            <h4 className="card-title">Alternative Card</h4>
                            <p>Für leichte Variation können Cards auch mit einem semi-transparenten Hintergrund dargestellt werden.</p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="subsection">
                    <h3 className="subsection-title">Buttons</h3>
                    <div className="button-group">
                        <button className="btn btn-primary">
                            Primary Button
                        </button>

                        <button className="btn btn-secondary">
                            Secondary Button
                        </button>

                        <button className="btn btn-outline">
                            Outline Button
                        </button>

                        <button className="btn btn-danger">
                            Danger Button
                        </button>
                    </div>
                </div>

                {/* Form Elements */}
                <div className="subsection">
                    <h3 className="subsection-title">Formular-Elemente</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Input-Feld</label>
                            <input
                                type="text"
                                placeholder="Text eingeben..."
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Dropdown</label>
                            <select className="form-select">
                                <option>Option 1</option>
                                <option>Option 2</option>
                                <option>Option 3</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Progress Bars */}
                <div className="subsection">
                    <h3 className="subsection-title">Fortschrittsbalken</h3>
                    <div className="progress-container">
                        <div className="progress-group">
                            <div className="progress-header">
                                <span className="progress-label">Standardfortschritt</span>
                                <span className="progress-value">70%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill progress-gradient" style={{width: '70%'}}></div>
                            </div>
                        </div>

                        <div className="progress-group">
                            <div className="progress-header">
                                <span className="progress-label">Erfolg</span>
                                <span className="progress-value">85%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill progress-success" style={{width: '85%'}}></div>
                            </div>
                        </div>

                        <div className="progress-group">
                            <div className="progress-header">
                                <span className="progress-label">Warnung</span>
                                <span className="progress-value">45%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill progress-danger" style={{width: '45%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Layouts */}
            <section className="section">
                <h2 className="section-title">Layout-Beispiele</h2>

                <div className="card mb-20">
                    <h3 className="subsection-title">Quiz-Frage Layout</h3>

                    <div className="quiz-header">
                        <div className="quiz-info">
                            <span className="quiz-category">Kategorie • Schwierigkeit</span>
                            <span className="quiz-timer">Zeit: 20s</span>
                        </div>

                        <div className="progress-bar">
                            <div className="progress-fill progress-gradient" style={{width: '75%'}}></div>
                        </div>
                    </div>

                    <h3 className="quiz-question">Wie lautet die Frage?</h3>

                    <div className="quiz-options">
                        <div className="quiz-option">
                            <div className="option-marker">A</div>
                            <span>Antwort Option 1</span>
                        </div>

                        <div className="quiz-option option-selected">
                            <div className="option-marker">B</div>
                            <span>Ausgewählte Option</span>
                        </div>

                        <div className="quiz-option">
                            <div className="option-marker">C</div>
                            <span>Antwort Option 3</span>
                        </div>

                        <div className="quiz-option">
                            <div className="option-marker">D</div>
                            <span>Antwort Option 4</span>
                        </div>
                    </div>

                    <div className="quiz-actions">
                        <button className="btn btn-primary">
                            Antwort überprüfen
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3 className="subsection-title">Statistik Layout</h3>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Gespielte Spiele</div>
                            <div className="stat-value">42</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">Siege</div>
                            <div className="stat-value stat-success">28</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">Niederlagen</div>
                            <div className="stat-value stat-danger">14</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">Siegrate</div>
                            <div className="stat-value">67%</div>
                        </div>
                    </div>

                    <div className="progress-group">
                        <div className="progress-header">
                            <span className="progress-label">Genauigkeit</span>
                            <span className="progress-value">73%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill progress-gradient" style={{width: '73%'}}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Designprinzipien */}
            <section className="section">
                <h2 className="section-title">Designprinzipien</h2>
                <div className="card">
                    <ul className="principle-list">
                        <li>
                            <strong>Kontrast:</strong> Dunkler Hintergrund mit hellen Text- und Akzentfarben für optimale Lesbarkeit.
                        </li>
                        <li>
                            <strong>Konsistenz:</strong> Durchgängige Verwendung von abgerundeten Ecken, Schattierungen und Transparenzeffekten.
                        </li>
                        <li>
                            <strong>Einfachheit:</strong> Klare Layouts mit ausreichend Leerraum und gut strukturierter Hierarchie.
                        </li>
                        <li>
                            <strong>Feedback:</strong> Interaktive Elemente zeigen deutliche Hover- und Aktiv-Zustände.
                        </li>
                        <li>
                            <strong>Animation:</strong> Subtile Übergänge und Bewegungen für bessere Benutzererfahrung.
                        </li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

// Hilfkomponente für die Farbpalette
const ColorSwatch = ({ name, color }) => (
    <div className="color-swatch">
        <div
            className="color-sample"
            style={{ backgroundColor: color }}
        />
        <span className="color-name">{name}</span>
        <span className="color-value">{color}</span>
    </div>
);

export default ThemeTemplate;