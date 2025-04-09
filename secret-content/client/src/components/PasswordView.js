import React, { useState } from 'react';

function PasswordView({ onSubmit }) {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
        setPassword('');
    };

    return (
        <div className="password-view">
            <div className="content-container">
                <div className="password-form">
                    <h2>Bitte gib das Passwort ein</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Passwort"
                            required
                        />
                        <button type="submit" className="primary-btn">Zugriff</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default PasswordView;