// src/App.js
import React, { useState, useEffect } from 'react';
import PasswordView from './components/PasswordView';
import OpenerView from './components/OpenerView';
import DatesView from './components/DatesView';
import TipsView from './components/TipsView';
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
    const checkPassword = async (password) => {
        console.log('Überprüfe Passwort...');
        setLoading(true);

        try {
            // API-Anfrage zur Passwortprüfung
            const apiUrl = '/secret-content/api/checkPassword';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const result = await response.json();

            // Rate-Limit-Fehler
            if (response.status === 429) {
                console.log('Rate-Limit überschritten');
                showToast(result.message || "Zu viele Versuche. Bitte warten Sie.");
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            if (result.success) {
                console.log(`Passwort korrekt für: ${result.type}`);

                if (result.type === 'opener') {
                    loadOpenerData();
                    setView('opener');
                } else if (result.type === 'dates') {
                    loadDatesData();
                    setView('dates');
                } else if (result.type === 'tips') {
                    setView('tips');
                }
            } else {
                console.log('Falsches Passwort');

                // Zeige verbleibende Versuche an, wenn verfügbar
                if (result.message) {
                    showToast(result.message);
                } else {
                    showToast("Falsches Passwort! 🔒");
                }
            }
        } catch (error) {
            logError('Fehler bei der Passwortüberprüfung:', error);
            showToast("Fehler bei der Überprüfung. Versuche es später erneut.");
        } finally {
            setLoading(false);
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

            {view === 'tips' && (
                <TipsView
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