import React, {useEffect, useState} from 'react';

function OpenerView({currentOpener, onNext, onCopy, onBack}) {
    const [isVisible, setIsVisible] = useState(true);
    const [displayText, setDisplayText] = useState(currentOpener);

    // Optimierter Fade-Effekt bei Änderung des Openers
    useEffect(() => {
        if (currentOpener !== displayText) {
            // Ausblenden
            setIsVisible(false);

            // Warte bis der Fade-out abgeschlossen ist, dann Text aktualisieren
            const timer = setTimeout(() => {
                setDisplayText(currentOpener);
                // Einblenden nach Text-Update
                setIsVisible(true);
            }, 300); // Diese Zeit sollte mit der CSS-Transition übereinstimmen

            return () => clearTimeout(timer);
        }
    }, [currentOpener, displayText]);

    return (
        <div className="opener-view">
            <div className="content-container">
                <span
                    className={`content-text ${isVisible ? 'fade-in' : 'fade-out'}`}
                    style={{transition: 'opacity 0.3s ease'}}
                >
                    {displayText}
                </span>
            </div>

            <div className="button-container">
                <button className="primary-btn" onClick={onNext}>Nächster</button>
                <button className="secondary-btn" onClick={onCopy}>Kopieren</button>
                <button className="secondary-btn" onClick={onBack}>Zurück</button>
            </div>
        </div>
    );
}

export default OpenerView;