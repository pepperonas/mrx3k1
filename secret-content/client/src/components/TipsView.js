// src/components/TipsView.js
import React from 'react';

function TipsView({ onBack }) {
    return (
        <div className="tips-view">
            <header className="tips-header">
                <h2>Ratgeber: Erfolgreiche Dating-Strategien</h2>
                <p className="subtitle">Ein authentischer Ansatz zum Kennenlernen</p>
            </header>

            <section className="intro">
                <h2>Über diesen Ratgeber</h2>
                <p>Dieser Ratgeber konzentriert sich auf authentische und respektvolle Wege, um neue Beziehungen aufzubauen. Es geht nicht darum, jemanden zu "erobern", sondern darum, echte Verbindungen zu schaffen und dabei du selbst zu bleiben.</p>
            </section>

            <div className="card-container">
                <div className="card">
                    <h2><span className="tip-number">1</span> Selbstentwicklung</h2>
                    <p>Die Grundlage für erfolgreiche Beziehungen ist ein gesundes Selbstwertgefühl und Selbstbewusstsein:</p>
                    <ul>
                        <li>Entwickle deine eigenen Interessen und Leidenschaften</li>
                        <li>Arbeite an deinem Selbstvertrauen durch kleine Erfolge</li>
                        <li>Pflege einen gesunden Lebensstil</li>
                        <li>Verstehe und arbeite an deinen eigenen emotionalen Mustern</li>
                    </ul>
                </div>

                <div className="card">
                    <h2><span className="tip-number">2</span> Authentizität</h2>
                    <p>Authentizität ist attraktiv und schafft die Basis für tiefere Verbindungen:</p>
                    <ul>
                        <li>Sei ehrlich zu dir selbst und anderen</li>
                        <li>Zeige deine wahre Persönlichkeit statt einer Fassade</li>
                        <li>Teile deine echten Interessen und Werte</li>
                        <li>Sprich offen über deine Ziele und Wünsche</li>
                    </ul>
                </div>

                <div className="card">
                    <h2><span className="tip-number">3</span> Soziale Kompetenz</h2>
                    <p>Gute Kommunikationsfähigkeiten sind entscheidend:</p>
                    <ul>
                        <li>Übe aktives Zuhören ohne ständig zu unterbrechen</li>
                        <li>Stelle offene Fragen, die Gespräche vertiefen</li>
                        <li>Lerne, Körpersprache zu lesen und zu verstehen</li>
                        <li>Entwickle einen Sinn für Humor ohne auf Kosten anderer</li>
                    </ul>
                </div>

                <div className="card">
                    <h2><span className="tip-number">4</span> Respektvolles Kennenlernen</h2>
                    <p>Respekt ist die Grundlage jeder gesunden Beziehung:</p>
                    <ul>
                        <li>Akzeptiere ein "Nein" ohne Diskussion</li>
                        <li>Verstehe und respektiere persönliche Grenzen</li>
                        <li>Behandle alle Menschen mit Würde, unabhängig vom Interesse</li>
                        <li>Respektiere die Autonomie und Entscheidungen anderer</li>
                    </ul>
                </div>

                <div className="card">
                    <h2><span className="tip-number">5</span> Gemeinsame Interessen</h2>
                    <p>Gemeinsame Aktivitäten schaffen natürliche Verbindungen:</p>
                    <ul>
                        <li>Engagiere dich in Gruppen mit deinen Interessen</li>
                        <li>Nimm an Workshops, Kursen oder Vereinen teil</li>
                        <li>Nutze Apps und Plattformen für gemeinsame Aktivitäten</li>
                        <li>Sei offen für neue Erfahrungen und Hobbys</li>
                    </ul>
                </div>

                <div className="card">
                    <h2><span className="tip-number">6</span> Geduld und Timing</h2>
                    <p>Beziehungen brauchen Zeit zum Wachsen:</p>
                    <ul>
                        <li>Verstehe, dass bedeutungsvolle Beziehungen Zeit brauchen</li>
                        <li>Erkenne den richtigen Moment für den nächsten Schritt</li>
                        <li>Respektiere das Tempo der anderen Person</li>
                        <li>Sei geduldig mit dir selbst und dem Prozess</li>
                    </ul>
                </div>
            </div>

            <div className="button-container">
                <button className="secondary-btn" onClick={onBack}>Zurück</button>
            </div>
        </div>
    );
}

export default TipsView;