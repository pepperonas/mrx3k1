import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Stellen Sie sicher, dass das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');

    // Prüfen Sie, ob das Element existiert, bevor Sie createRoot aufrufen
    if (container) {
        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    } else {
        console.error("Container element with id 'root' not found!");
    }
});