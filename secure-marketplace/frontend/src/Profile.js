import React, { useState } from 'react';
import {
    User, Lock, Shield, Eye, EyeOff,
    Mail, Key, AlertTriangle, Save,
    CheckCircle, Clock, Settings
} from 'lucide-react';

const Profile = ({ user, pgpKeys, showToast }) => {
    const [profileData, setProfileData] = useState({
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [twoFactorSetup, setTwoFactorSetup] = useState({
        isGenerating: false,
        isVerifying: false,
        secret: "JBSWY3DPEHPK3PXP", // Demo-Secret für Beispiel-QR-Code
        qrCode: "data:image/png;base64,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",
        token: ''
    });

    const [disabling2FA, setDisabling2FA] = useState({
        isDisabling: false,
        password: '',
        token: ''
    });

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [activeTab, setActiveTab] = useState('profile');

    const handleChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        showToast('Profil erfolgreich aktualisiert', 'success');
    };

    const changePassword = async (e) => {
        e.preventDefault();

        if (profileData.newPassword !== profileData.confirmPassword) {
            showToast('Passwörter stimmen nicht überein', 'error');
            return;
        }

        showToast('Passwort erfolgreich geändert', 'success');
        setProfileData({
            ...profileData,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    // 2FA-Funktionen
    const generate2FA = async () => {
        setTwoFactorSetup({
            ...twoFactorSetup,
            isGenerating: false,
            isVerifying: true
        });

        showToast('Scannen Sie den QR-Code mit Ihrer Authenticator-App', 'info');
    };

    const verify2FA = async (e) => {
        e.preventDefault();

        if (twoFactorSetup.token === '123456') {
            user.isTwoFactorEnabled = true;

            setTwoFactorSetup({
                isGenerating: false,
                isVerifying: false,
                secret: "JBSWY3DPEHPK3PXP",
                qrCode: "data:image/png;base64,...",
                token: ''
            });

            showToast('2FA wurde erfolgreich aktiviert', 'success');
        } else {
            showToast('Ungültiger Code', 'error');
        }
    };

    const startDisable2FA = () => {
        setDisabling2FA({
            isDisabling: true,
            password: '',
            token: ''
        });
    };

    const disable2FA = async (e) => {
        e.preventDefault();

        if (disabling2FA.password && disabling2FA.token === '123456') {
            user.isTwoFactorEnabled = false;

            setDisabling2FA({
                isDisabling: false,
                password: '',
                token: ''
            });

            showToast('2FA wurde erfolgreich deaktiviert', 'success');
        } else {
            showToast('Ungültiges Passwort oder Code', 'error');
        }
    };

    // Tab-Komponenten
    const TabButton = ({ id, icon, label, active }) => {
        const Icon = icon;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-4 py-3 w-full lg:w-auto text-left ${
                    active
                        ? 'bg-secondary border-l-4 border-accent lg:border-l-0 lg:border-b-4 text-text-light'
                        : 'hover:bg-secondary text-text-dark hover:text-text-light'
                } transition-colors duration-150`}
            >
                <Icon className={`h-5 w-5 mr-2 ${active ? 'text-accent' : ''}`} />
                <span>{label}</span>
            </button>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-light">Benutzerprofil</h1>
                <p className="text-text-dark mt-2">Verwalten Sie Ihre persönlichen Informationen und Sicherheitseinstellungen</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex flex-col lg:flex-row lg:border-b lg:border-gray-700">
                    <TabButton
                        id="profile"
                        icon={User}
                        label="Profilinformationen"
                        active={activeTab === 'profile'}
                    />
                    <TabButton
                        id="security"
                        icon={Lock}
                        label="Sicherheit & Passwort"
                        active={activeTab === 'security'}
                    />
                    <TabButton
                        id="pgp"
                        icon={Key}
                        label="PGP-Schlüssel"
                        active={activeTab === 'pgp'}
                    />
                </div>
            </div>

            {/* Profilinformationen */}
            {activeTab === 'profile' && (
                <div className="bg-secondary rounded-lg shadow-card overflow-hidden">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center mb-6 pb-6 border-b border-gray-700">
                            <div className="md:mr-6 mb-4 md:mb-0">
                                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
                                    <User className="h-10 w-10 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-text-light">{user.username}</h2>
                                <p className="text-text-dark">{user.email}</p>
                                <div className="flex items-center mt-2">
                  <span className="bg-accent text-white text-xs px-2 py-1 rounded mr-2">
                    {user.role}
                  </span>
                                    {user.isTwoFactorEnabled && (
                                        <span className="bg-success text-white text-xs px-2 py-1 rounded flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      2FA aktiviert
                    </span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 text-text-dark text-sm">
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>Mitglied seit: 15.04.2023</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={updateProfile}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-text-light font-medium mb-2">Benutzername</label>
                                    <input
                                        type="text"
                                        value={user.username}
                                        disabled
                                        className="w-full px-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-text-dark text-xs">Der Benutzername kann nicht geändert werden.</p>
                                </div>
                                <div>
                                    <label className="block text-text-light font-medium mb-2">E-Mail-Adresse</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-accent hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center"
                                >
                                    <Save className="h-5 w-5 mr-2" />
                                    Profil aktualisieren
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sicherheit & Passwort */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    {/* Passwort ändern */}
                    <div className="bg-secondary rounded-lg shadow-card overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-text-light mb-4">Passwort ändern</h2>
                            <form onSubmit={changePassword}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-text-light font-medium mb-2">Aktuelles Passwort</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.current ? "text" : "password"}
                                                name="currentPassword"
                                                value={profileData.currentPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                                            >
                                                {showPassword.current ?
                                                    <EyeOff className="h-5 w-5 text-gray-500" /> :
                                                    <Eye className="h-5 w-5 text-gray-500" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-text-light font-medium mb-2">Neues Passwort</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.new ? "text" : "password"}
                                                name="newPassword"
                                                value={profileData.newPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light pr-10"
                                                required
                                                minLength="8"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                                            >
                                                {showPassword.new ?
                                                    <EyeOff className="h-5 w-5 text-gray-500" /> :
                                                    <Eye className="h-5 w-5 text-gray-500" />
                                                }
                                            </button>
                                        </div>
                                        <p className="mt-1 text-text-dark text-xs">Mindestens 8 Zeichen, mit Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen.</p>
                                    </div>
                                    <div>
                                        <label className="block text-text-light font-medium mb-2">Passwort bestätigen</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword.confirm ? "text" : "password"}
                                                name="confirmPassword"
                                                value={profileData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light pr-10"
                                                required
                                                minLength="8"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                                            >
                                                {showPassword.confirm ?
                                                    <EyeOff className="h-5 w-5 text-gray-500" /> :
                                                    <Eye className="h-5 w-5 text-gray-500" />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-accent hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center"
                                    >
                                        <Lock className="h-5 w-5 mr-2" />
                                        Passwort ändern
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Zwei-Faktor-Authentifizierung */}
                    <div className="bg-secondary rounded-lg shadow-card overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-text-light">Zwei-Faktor-Authentifizierung</h2>
                                {user.isTwoFactorEnabled ? (
                                    <span className="bg-success text-white text-xs px-3 py-1 rounded-full flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Aktiviert
                  </span>
                                ) : (
                                    <span className="bg-gray-600 text-white text-xs px-3 py-1 rounded-full flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Deaktiviert
                  </span>
                                )}
                            </div>

                            {user.isTwoFactorEnabled ? (
                                <div>
                                    <p className="text-text mb-4">
                                        Ihre Anmeldungen sind mit einem zusätzlichen Sicherheitscode geschützt.
                                        Bei jeder Anmeldung wird ein Code von Ihrer Authenticator-App benötigt.
                                    </p>

                                    {disabling2FA.isDisabling ? (
                                        <form onSubmit={disable2FA}>
                                            <div className="p-4 bg-primary rounded-lg border border-gray-700 mb-4">
                                                <h3 className="text-text-light font-medium mb-2">2FA deaktivieren</h3>
                                                <p className="text-text-dark text-sm mb-4">
                                                    Um die 2FA zu deaktivieren, bestätigen Sie mit Ihrem Passwort und einem letzten Authentifizierungscode.
                                                </p>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-text-light text-sm font-medium mb-1">Passwort</label>
                                                        <input
                                                            type="password"
                                                            value={disabling2FA.password}
                                                            onChange={e => setDisabling2FA({...disabling2FA, password: e.target.value})}
                                                            className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-text-light text-sm font-medium mb-1">Authentifizierungscode</label>
                                                        <input
                                                            type="text"
                                                            value={disabling2FA.token}
                                                            onChange={e => setDisabling2FA({...disabling2FA, token: e.target.value})}
                                                            className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                <button
                                                    type="submit"
                                                    className="px-4 py-2 bg-error hover:bg-red-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
                                                >
                                                    <Shield className="h-5 w-5 mr-2" />
                                                    2FA deaktivieren
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDisabling2FA({...disabling2FA, isDisabling: false})}
                                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
                                                >
                                                    Abbrechen
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button
                                            onClick={startDisable2FA}
                                            className="px-4 py-2 bg-error hover:bg-red-700 text-white font-medium rounded-lg transition duration-200 flex items-center"
                                        >
                                            <Shield className="h-5 w-5 mr-2" />
                                            2FA deaktivieren
                                        </button>
                                    )}
                                </div>
                            ) : twoFactorSetup.isVerifying ? (
                                <div className="space-y-4">
                                    <p className="text-text">
                                        Scannen Sie diesen QR-Code mit Ihrer Authenticator-App oder geben Sie den Schlüssel manuell ein.
                                    </p>

                                    <div className="flex flex-col md:flex-row md:space-x-6 items-center">
                                        <div className="bg-white p-4 rounded-lg mb-4 md:mb-0">
                                            <img src={twoFactorSetup.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-text-light font-medium mb-2">Manueller Schlüssel:</p>
                                            <div className="bg-primary p-3 rounded-lg border border-gray-700 font-mono text-text-light break-all mb-4">
                                                {twoFactorSetup.secret}
                                            </div>

                                            <form onSubmit={verify2FA}>
                                                <div className="mb-4">
                                                    <label className="block text-text-light font-medium mb-2">Geben Sie den Code aus Ihrer App ein</label>
                                                    <input
                                                        type="text"
                                                        value={twoFactorSetup.token}
                                                        onChange={e => setTwoFactorSetup({...twoFactorSetup, token: e.target.value})}
                                                        className="w-full px-4 py-2 bg-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-text-light"
                                                        required
                                                    />
                                                    <p className="mt-1 text-text-dark text-xs">Demo: Versuchen Sie "123456"</p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                    <button
                                                        type="submit"
                                                        className="px-4 py-2 bg-accent hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
                                                    >
                                                        <CheckCircle className="h-5 w-5 mr-2" />
                                                        Code verifizieren & 2FA aktivieren
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTwoFactorSetup({
                                                            isGenerating: false,
                                                            isVerifying: false,
                                                            secret: "JBSWY3DPEHPK3PXP",
                                                            qrCode: "data:image/png;base64,...",
                                                            token: ''
                                                        })}
                                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
                                                    >
                                                        Abbrechen
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-text mb-4">
                                        Mit 2FA müssen Sie bei der Anmeldung zusätzlich einen Code aus einer
                                        Authenticator-App (wie Google Authenticator, Authy oder Microsoft Authenticator) eingeben.
                                    </p>
                                    <div className="p-4 bg-primary rounded-lg border border-gray-700 mb-4">
                                        <div className="flex items-start">
                                            <div className="mr-3 mt-1">
                                                <Shield className="h-6 w-6 text-accent" />
                                            </div>
                                            <div>
                                                <h3 className="text-text-light font-medium">Warum sollten Sie 2FA aktivieren?</h3>
                                                <ul className="list-disc list-inside text-text-dark text-sm mt-2 space-y-1">
                                                    <li>Erhöht die Sicherheit Ihres Kontos erheblich</li>
                                                    <li>Schützt vor unbefugtem Zugriff, selbst wenn Ihr Passwort kompromittiert wurde</li>
                                                    <li>Schnelle und einfache Verifizierung bei jeder Anmeldung</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={generate2FA}
                                        disabled={twoFactorSetup.isGenerating}
                                        className="px-4 py-2 bg-accent hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 flex items-center"
                                    >
                                        <Shield className="h-5 w-5 mr-2" />
                                        {twoFactorSetup.isGenerating ? 'Wird vorbereitet...' : '2FA aktivieren'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PGP-Schlüssel */}
            {activeTab === 'pgp' && (
                <div className="bg-secondary rounded-lg shadow-card overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-text-light mb-4">PGP-Schlüssel</h2>
                        <p className="text-text mb-4">
                            Ihr öffentlicher PGP-Schlüssel wird für die sichere Ende-zu-Ende-Verschlüsselung Ihrer Nachrichten und sensiblen Daten verwendet.
                        </p>

                        <div className="p-4 bg-primary rounded-lg border border-gray-700 mb-4">
                            <h3 className="text-text-light font-medium mb-2 flex items-center">
                                <Key className="h-5 w-5 mr-2 text-accent" />
                                Ihr öffentlicher Schlüssel
                            </h3>
                            <textarea
                                value={pgpKeys?.publicKey || 'PGP-Schlüssel nicht gefunden'}
                                readOnly
                                rows="8"
                                className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-lg text-text-dark font-mono text-sm resize-none"
                            />
                        </div>

                        <div className="bg-primary rounded-lg border border-gray-700 p-4">
                            <div className="flex items-start">
                                <div className="mr-3 mt-1">
                                    <AlertTriangle className="h-6 w-6 text-warning" />
                                </div>
                                <div>
                                    <h3 className="text-text-light font-medium">Sicherheitshinweis</h3>
                                    <p className="text-text-dark text-sm mt-1">
                                        Ihr privater PGP-Schlüssel wird sicher in Ihrem Browser gespeichert.
                                        Teilen Sie diesen niemals mit anderen. Wenn Sie Ihren Browser wechseln oder die Browserdaten löschen,
                                        müssen Sie Ihren PGP-Schlüssel neu generieren.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;