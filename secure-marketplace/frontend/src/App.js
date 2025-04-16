import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Shield, Lock, AlertTriangle, Eye, EyeOff, User,
  Search, ShoppingCart, LogOut, Settings, Home,
  Mail, Package, Menu, X, CheckCircle
} from 'lucide-react';

// Import der Komponenten
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import Messages from './Messages';
import Profile from './Profile';
import Orders from './Orders';

// Basiskonfiguration
const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:5005/api';

// Axios-Konfiguration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API-Token für Anfragen setzen
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Toast-Komponente
const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-success'
      : type === 'error' ? 'bg-error'
          : type === 'warning' ? 'bg-warning'
              : 'bg-info';

  const Icon = type === 'success' ? CheckCircle
      : type === 'error' ? AlertTriangle
          : type === 'warning' ? AlertTriangle
              : Shield;

  return (
      <div className={`fixed bottom-4 right-4 ${bgColor} text-white rounded-lg p-4 shadow-lg flex items-center max-w-sm`}>
        <Icon className="mr-2 h-5 w-5" />
        <p className="flex-1">{message}</p>
        <button onClick={onClose} className="ml-4 text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
  );
};

// App-Komponente
const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pgpKeys, setPgpKeys] = useState(null);
  const [toast, setToast] = useState(null);

  // Toast anzeigen
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // PGP-Schlüssel beim Start generieren oder aus LocalStorage laden
  useEffect(() => {
    const loadOrGenerateKeys = async () => {
      const storedKeys = localStorage.getItem('pgpKeys');

      if (storedKeys) {
        setPgpKeys(JSON.parse(storedKeys));
      } else {
        try {
          // Dummy-Implementierung ohne tatsächliche PGP
          const keys = {
            privateKey: "-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: OpenPGP.js v4.10.8\nComment: https://openpgpjs.org\n\nxcMGBGBD5DMBCADdPbml8oDUkFYz33NWG/xn1aU/WZ/Q3VX2u1d6gQkGnTJ4\nijE0n7F4laR/GwZY+IPJ3I+9pWNe/+ar0zEFkQGOeq6XB4HICJ2TDPQc5KPr\n...",
            publicKey: "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: OpenPGP.js v4.10.8\nComment: https://openpgpjs.org\n\nxjMEYEPkMxYJKwYBBAHaRw8BAQdAFIFO+hFZQZMCKnW6PjBt4TCKBiM2gArZ\nNtOHHQIHsVjNG0Fub255bW91cyA8YW5vbnltb3VzQGV4YW1wbGUuY29tPsKJ\n..."
          };
          setPgpKeys(keys);
          localStorage.setItem('pgpKeys', JSON.stringify(keys));
        } catch (error) {
          console.error('Fehler bei PGP-Schlüsselerzeugung:', error);
          showToast('Fehler bei der PGP-Schlüsselerzeugung', 'error');
        }
      }
    };

    loadOrGenerateKeys();
  }, []);

  useEffect(() => {
    // Token-Validierung beim Start
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      // Demo-Validierung
      setUser({
        _id: "user123",
        username: "demo_user",
        email: "demo@example.com",
        role: "user",
        isTwoFactorEnabled: false
      });
      setAuthenticated(true);
    } catch (error) {
      // Token ungültig, aus LocalStorage entfernen
      localStorage.removeItem('token');
      showToast('Sitzung abgelaufen, bitte erneut anmelden', 'error');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, twoFactorCode = null) => {
    try {
      // Demo-Login
      if (username === "demo" && password === "password") {
        const token = "demo_token";
        localStorage.setItem('token', token);
        setUser({
          _id: "user123",
          username: "demo_user",
          email: "demo@example.com",
          role: "user",
          isTwoFactorEnabled: false
        });
        setAuthenticated(true);
        showToast('Erfolgreich angemeldet', 'success');
        return { success: true };
      }

      return {
        success: false,
        error: "Ungültige Anmeldeinformationen"
      };
    } catch (error) {
      return {
        success: false,
        error: "Login fehlgeschlagen"
      };
    }
  };

  const register = async (userData) => {
    try {
      // Demo-Registrierung
      const token = "demo_token";
      localStorage.setItem('token', token);
      setUser({
        _id: "user123",
        username: userData.username,
        email: userData.email,
        role: "user",
        isTwoFactorEnabled: false
      });
      setAuthenticated(true);
      showToast('Registrierung erfolgreich', 'success');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Registrierung fehlgeschlagen"
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthenticated(false);
    showToast('Erfolgreich abgemeldet', 'info');
  };

  // PGP-Funktionen (Demo)
  const encryptMessage = async (message, recipientPublicKey) => {
    // Demo-Verschlüsselung
    return "-----BEGIN PGP MESSAGE-----\n..." + message + "...\n-----END PGP MESSAGE-----";
  };

  const decryptMessage = async (encryptedMessage) => {
    // Demo-Entschlüsselung
    return encryptedMessage.replace("-----BEGIN PGP MESSAGE-----\n...", "").replace("...\n-----END PGP MESSAGE-----", "");
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-primary">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent"></div>
        </div>
    );
  }

  return (
      <BrowserRouter>
        <div className="min-h-screen bg-primary text-text">
          {toast && (
              <Toast
                  message={toast.message}
                  type={toast.type}
                  onClose={() => setToast(null)}
              />
          )}

          <Routes>
            <Route
                path="/login"
                element={
                  authenticated ?
                      <Navigate to="/marketplace" /> :
                      <LoginPage login={login} />
                }
            />
            <Route
                path="/register"
                element={
                  authenticated ?
                      <Navigate to="/marketplace" /> :
                      <RegisterPage register={register} />
                }
            />
            <Route
                path="/marketplace/*"
                element={
                  authenticated ?
                      <Marketplace
                          user={user}
                          logout={logout}
                          pgpKeys={pgpKeys}
                          encryptMessage={encryptMessage}
                          decryptMessage={decryptMessage}
                          showToast={showToast}
                      /> :
                      <Navigate to="/login" />
                }
            />
            <Route path="/" element={<Navigate to={authenticated ? "/marketplace" : "/login"} />} />
            <Route path="*" element={<Navigate to={authenticated ? "/marketplace" : "/login"} />} />
          </Routes>
        </div>
      </BrowserRouter>
  );
};

// Login-Komponente
const LoginPage = ({ login }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [userId, setUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (showTwoFactor) {
      // 2FA-Code validieren
      try {
        const result = await login(username, password, twoFactorCode);
        if (!result.success) {
          setError(result.error || '2FA-Code ungültig');
        }
      } catch (error) {
        setError('Fehler bei der 2FA-Validierung');
      }
    } else {
      // Normaler Login
      const result = await login(username, password);

      if (result.requiresTwoFactor) {
        setShowTwoFactor(true);
        setUserId(result.userId);
      } else if (!result.success) {
        setError(result.error);
      }
    }

    setLoading(false);
  };

  return (
      <div className="flex items-center justify-center min-h-screen bg-primary p-4">
        <div className="w-full max-w-md bg-secondary rounded-xl shadow-card p-8">
          <div className="flex justify-center mb-6">
            <Shield className="h-12 w-12 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-center text-text-light mb-6">Secure Login</h2>

          {showTwoFactor ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-text-light font-medium mb-2">2FA-Code</label>
                  <input
                      type="text"
                      value={twoFactorCode}
                      onChange={e => setTwoFactorCode(e.target.value)}
                      placeholder="Geben Sie den Code aus Ihrer Authenticator-App ein"
                      className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                      required
                      autoFocus
                  />
                </div>
                {error && <div className="text-error mb-4 text-sm">{error}</div>}
                <div className="flex space-x-3">
                  <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-accent hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex justify-center items-center"
                  >
                    {loading ?
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> :
                        'Verifizieren'
                    }
                  </button>
                  <button
                      type="button"
                      onClick={() => {
                        setShowTwoFactor(false);
                        setTwoFactorCode('');
                      }}
                      disabled={loading}
                      className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition duration-200"
                  >
                    Zurück
                  </button>
                </div>
              </form>
          ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-text-light font-medium mb-2">Benutzername</label>
                  <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                      required
                      autoFocus
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-text-light font-medium mb-2">Passwort</label>
                  <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light pr-10"
                        required
                    />
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ?
                          <EyeOff className="h-5 w-5 text-gray-500" /> :
                          <Eye className="h-5 w-5 text-gray-500" />
                      }
                    </button>
                  </div>
                </div>
                {error && <div className="text-error mb-4 text-sm">{error}</div>}
                <p className="text-text-dark text-sm mb-4">Demo: Username "demo", Passwort "password"</p>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-accent hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex justify-center items-center"
                >
                  {loading ?
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> :
                      'Login'
                  }
                </button>
                <p className="text-center mt-6 text-text-dark">
                  Kein Konto? <a href="/register" className="text-accent hover:underline">Registrieren</a>
                </p>
              </form>
          )}
        </div>
      </div>
  );
};

// Registrierungs-Komponente
const RegisterPage = ({ register }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setError('');
    setLoading(true);

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
      <div className="flex items-center justify-center min-h-screen bg-primary p-4">
        <div className="w-full max-w-md bg-secondary rounded-xl shadow-card p-8">
          <div className="flex justify-center mb-6">
            <Shield className="h-12 w-12 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-center text-text-light mb-6">Secure Registrierung</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-text-light font-medium mb-2">Benutzername</label>
              <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                  required
              />
            </div>
            <div className="mb-4">
              <label className="block text-text-light font-medium mb-2">E-Mail</label>
              <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                  required
              />
            </div>
            <div className="mb-4">
              <label className="block text-text-light font-medium mb-2">Passwort</label>
              <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light pr-10"
                    required
                    minLength="8"
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ?
                      <EyeOff className="h-5 w-5 text-gray-500" /> :
                      <Eye className="h-5 w-5 text-gray-500" />
                  }
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-text-light font-medium mb-2">Passwort bestätigen</label>
              <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                  required
                  minLength="8"
              />
            </div>
            {error && <div className="text-error mb-4 text-sm">{error}</div>}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex justify-center items-center"
            >
              {loading ?
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> :
                  'Registrieren'
              }
            </button>
            <p className="text-center mt-6 text-text-dark">
              Bereits ein Konto? <a href="/login" className="text-accent hover:underline">Login</a>
            </p>
          </form>
        </div>
      </div>
  );
};

// Header-Komponente
const Header = ({ user, logout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
      <header className="bg-secondary shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Shield className="h-8 w-8 text-accent" />
                <span className="ml-2 text-xl font-bold text-accent">SecureMarket</span>
              </div>
              {/* Desktop Navigation */}
              <nav className="hidden md:ml-6 md:flex md:space-x-6">
                <a href="/marketplace" className="flex items-center px-3 py-2 text-text-light hover:text-accent">
                  <Home className="h-5 w-5 mr-1" />
                  <span>Produkte</span>
                </a>
                <a href="/marketplace/messages" className="flex items-center px-3 py-2 text-text-light hover:text-accent">
                  <Mail className="h-5 w-5 mr-1" />
                  <span>Nachrichten</span>
                </a>
                <a href="/marketplace/orders" className="flex items-center px-3 py-2 text-text-light hover:text-accent">
                  <Package className="h-5 w-5 mr-1" />
                  <span>Bestellungen</span>
                </a>
                <a href="/marketplace/profile" className="flex items-center px-3 py-2 text-text-light hover:text-accent">
                  <User className="h-5 w-5 mr-1" />
                  <span>Profil</span>
                </a>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-text-light">Hallo, {user.username}</span>
                <button
                    onClick={logout}
                    className="flex items-center text-text-light hover:text-accent"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-text-light hover:text-accent focus:outline-none"
                >
                  {menuOpen ? (
                      <X className="h-6 w-6" />
                  ) : (
                      <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
            <div className="md:hidden bg-secondary border-t border-gray-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="/marketplace" className="flex items-center px-3 py-2 rounded-md text-text-light hover:bg-primary">
                  <Home className="h-5 w-5 mr-2" />
                  <span>Produkte</span>
                </a>
                <a href="/marketplace/messages" className="flex items-center px-3 py-2 rounded-md text-text-light hover:bg-primary">
                  <Mail className="h-5 w-5 mr-2" />
                  <span>Nachrichten</span>
                </a>
                <a href="/marketplace/orders" className="flex items-center px-3 py-2 rounded-md text-text-light hover:bg-primary">
                  <Package className="h-5 w-5 mr-2" />
                  <span>Bestellungen</span>
                </a>
                <a href="/marketplace/profile" className="flex items-center px-3 py-2 rounded-md text-text-light hover:bg-primary">
                  <User className="h-5 w-5 mr-2" />
                  <span>Profil</span>
                </a>
                <button
                    onClick={logout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-text-light hover:bg-primary"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
        )}
      </header>
  );
};

// Marketplace Hauptkomponente
const Marketplace = ({ user, logout, pgpKeys, encryptMessage, decryptMessage, showToast }) => {
  return (
      <div className="flex flex-col min-h-screen">
        <Header user={user} logout={logout} />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<ProductList showToast={showToast} />} />
            <Route path="/product/:id" element={<ProductDetail pgpKeys={pgpKeys} showToast={showToast} />} />
            <Route path="/messages" element={
              <Messages
                  user={user}
                  encryptMessage={encryptMessage}
                  decryptMessage={decryptMessage}
                  showToast={showToast}
              />
            } />
            <Route path="/profile" element={<Profile user={user} pgpKeys={pgpKeys} showToast={showToast} />} />
            <Route path="/orders" element={<Orders user={user} decryptMessage={decryptMessage} showToast={showToast} />} />
            <Route path="*" element={<Navigate to="/marketplace" />} />
          </Routes>
        </main>

        <footer className="bg-secondary text-text-dark text-center py-4 mt-auto text-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p>© 2025 SecureMarket. Alle Rechte vorbehalten.</p>
          </div>
        </footer>
      </div>
  );
};

// Weitere Komponenten wie ProductList, ProductDetail, Messages, Profile und Orders...
// Diese müssen auch modern gestaltet und mit dem #2C2E3B Farbschema angepasst werden.

export default App;