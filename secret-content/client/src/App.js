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

  // Zeige Toast-Nachricht
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  // Passwort prüfen - VEREINFACHT FÜR STATISCHEN BETRIEB
  const checkPassword = (password) => {
    // Lokale Überprüfung statt Server-Request
    if (password === '🫦') {
      loadOpenerData();
      setView('opener');
    } else if (password === '🫠') {
      loadDatesData();
      setView('dates');
    } else {
      showToast("Falsches Passwort! 🔒");
    }
  };

  // Opener-Daten laden
  const loadOpenerData = async () => {
    try {
      // Absolute Pfade für statische JSON-Dateien
      const response = await fetch('./api/opener.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOpenerData(data.opener);

      if (data.opener && data.opener.length > 0) {
        showRandomOpener(data.opener);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Opener-Daten:', error);
      setCurrentOpener('Fehler beim Laden der Daten. Versuche es später erneut.');
    }
  };

  // Dates-Daten laden
  const loadDatesData = async () => {
    try {
      // Absolute Pfade für statische JSON-Dateien
      const response = await fetch('./api/dates.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDatesData(data.aktivitaeten);
    } catch (error) {
      console.error('Fehler beim Laden der Dates-Daten:', error);
    }
  };

  // Zufälligen Opener anzeigen
  const showRandomOpener = (data = openerData) => {
    if (data.length === 0) {
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