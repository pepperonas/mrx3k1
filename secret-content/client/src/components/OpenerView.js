import React, { useState, useEffect, useRef } from 'react';

function OpenerView({ currentOpener, onNext, onCopy, onBack }) {
    // Lade beim ersten Rendern
    useEffect(() => {
        fullTextRef.current = currentOpener;
        setIsTyping(true);
    }, []);
    const [isVisible, setIsVisible] = useState(true);
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const fullTextRef = useRef(currentOpener);
    const typingSpeedRef = useRef(30); // Millisekunden pro Zeichen

    // Text-Tipp-Animation
    useEffect(() => {
        if (isTyping && displayText.length < fullTextRef.current.length) {
            const typingTimer = setTimeout(() => {
                setDisplayText(prevText => fullTextRef.current.substring(0, prevText.length + 1));
            }, typingSpeedRef.current);

            return () => clearTimeout(typingTimer);
        } else if (isTyping && displayText.length === fullTextRef.current.length) {
            setIsTyping(false);
        }
    }, [displayText, isTyping]);

    // Optimierter Fade-Effekt und Tippanimation bei Änderung des Openers
    useEffect(() => {
        if (currentOpener !== fullTextRef.current) {
            // Ausblenden
            setIsVisible(false);

            // Warte bis der Fade-out abgeschlossen ist, dann Text aktualisieren
            const timer = setTimeout(() => {
                fullTextRef.current = currentOpener;
                setDisplayText(''); // Text zurücksetzen für neue Tippanimation
                setIsVisible(true);
                setIsTyping(true);
            }, 300); // Diese Zeit sollte mit der CSS-Transition übereinstimmen

            return () => clearTimeout(timer);
        }
    }, [currentOpener]);

    // Initial Typing starten
    useEffect(() => {
        if (displayText === '' && fullTextRef.current && !isTyping && isVisible) {
            setIsTyping(true);
        }
    }, [displayText, isTyping, isVisible]);

    return (
        <div className="opener-view">
            <div className="content-container">
                <span
                    className={`content-text ${isVisible ? 'fade-in' : 'fade-out'}`}
                    style={{ transition: 'opacity 0.3s ease' }}
                >
                    {displayText}
                    {isTyping && <span className="typing-cursor">|</span>}
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