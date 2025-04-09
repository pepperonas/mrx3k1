import React, { useState, useEffect } from 'react';

function OpenerView({ currentOpener, onNext, onCopy, onBack }) {
    const [fadeIn, setFadeIn] = useState(true);

    // Fade-Effekt bei Änderung des Openers
    useEffect(() => {
        setFadeIn(false);
        const timer = setTimeout(() => setFadeIn(true), 300);
        return () => clearTimeout(timer);
    }, [currentOpener]);

    return (
        <div className="opener-view">
            <div className="content-container">
        <span className={`content-text ${fadeIn ? 'fade-in' : 'fade-out'}`}>
          {currentOpener}
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