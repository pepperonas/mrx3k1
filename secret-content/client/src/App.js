// src/App.js
import React, { useState, useEffect } from 'react';
import PasswordView from './components/PasswordView';
import OpenerView from './components/OpenerView';
import DatesView from './components/DatesView';
import Toast from './components/Toast';
import './App.css';

function App() {
    // States
    const [view, setView] = useState('password');
    const [openerData, setOpenerData] = useState([]);
    const [datesData, setDatesData] = useState([]);
    const [currentOpener, setCurrentOpener] = useState('');
    const [toast, setToast] = useState({ show: false, message: '' });
    const [loading, setLoading] = useState(false);

    // Debugging-Funktion
    const logError = (message, error) => {
        console.error(message, error);
        showToast(message);
    };

    // Zeige Toast-Nachricht
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // Passwort prüfen
    const checkPassword = (password) => {
        console.log('Passwort-Check:', password);

        // Lokale Überprüfung statt Server-Request
        if (password === '💋') {
            console.log('Passwort korrekt für opener-Ansicht');
            loadOpenerData();
            setView('opener');
        } else if (password === '😘') {
            console.log('Passwort korrekt für dates-Ansicht');
            loadDatesData();
            setView('dates');
        } else {
            console.log('Falsches Passwort');
            showToast("Falsches Passwort! 🔒");
        }
    };

    // Opener-Daten laden
    const loadOpenerData = async () => {
        setLoading(true);
        try {
            console.log('Lade Opener-Daten...');

            // Vollständiger Pfad zur API
            const apiUrl = '/secret-content/api/getOpeners';
            console.log('Fetching von:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('Response Status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Daten erhalten:', Array.isArray(data) ? data.length : 'Kein Array');

            if (!Array.isArray(data)) {
                console.warn('Unerwartetes Datenformat:', data);
                showToast('Fehler: Unerwartetes Datenformat');
                return;
            }

            setOpenerData(data);

            if (data.length > 0) {
                showRandomOpener(data);
            } else {
                setCurrentOpener('Keine Opener-Daten verfügbar.');
            }
        } catch (error) {
            logError('Fehler beim Laden der Opener-Daten:', error);
            setCurrentOpener('Fehler beim Laden der Daten. Versuche es später erneut.');
        } finally {
            setLoading(false);
        }
    };

    // Dates-Daten laden
    const loadDatesData = async () => {
        setLoading(true);
        try {
            console.log('Lade Dates-Daten...');

            // Vollständiger Pfad zur API
            const apiUrl = '/secret-content/api/getDates';
            console.log('Fetching von:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('Response Status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Daten erhalten:', Array.isArray(data) ? data.length : 'Kein Array');

            if (!Array.isArray(data)) {
                console.warn('Unerwartetes Datenformat:', data);
                showToast('Fehler: Unerwartetes Datenformat');
                return;
            }

            setDatesData(data);
        } catch (error) {
            logError('Fehler beim Laden der Dates-Daten:', error);
        } finally {
            setLoading(false);
        }
    };

    // Zufälligen Opener anzeigen
    const showRandomOpener = (data = openerData) => {
        if (!data || data.length === 0) {
            setCurrentOpener('Keine Daten geladen.');
            return;
        }

        let randomIndex = Math.floor(Math.random() * data.length);
        setCurrentOpener(data[randomIndex]);
    };

    // Opener kopieren
    const copyOpener = () => {
        if (currentOpener &&
            currentOpener !== 'Keine Daten geladen.' &&
            !currentOpener.startsWith('Fehler')) {
            navigator.clipboard.writeText(currentOpener)
                .then(() => showToast('Spruch kopiert! 📋'))
                .catch(() => showToast('Fehler beim Kopieren 😕'));
        }
    };

    // Zurück zum Passwort-View
    const goBack = () => {
        setView('password');
    };

    return (
        <div className="app">
            <h1>
                <span className="emoji">🔒</span> Geheimer Inhalt <span className="emoji">🔒</span>
            </h1>

            {loading && (
                <div className="loading-indicator">Lädt Daten...</div>
            )}

            {view === 'password' && (
                <PasswordView onSubmit={checkPassword} />
            )}

            {view === 'opener' && (
                <OpenerView
                    currentOpener={currentOpener}
                    onNext={() => showRandomOpener()}
                    onCopy={copyOpener}
                    onBack={goBack}
                />
            )}

            {view === 'dates' && (
                <DatesView
                    datesData={datesData}
                    onBack={goBack}
                />
            )}

            <Toast
                show={toast.show}
                message={toast.message}
            />
        </div>
    );
}

export default App;