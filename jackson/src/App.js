import React, { useState } from 'react';
import KaraokeJsonGenerator from './components/KaraokeJsonGenerator';
import KaraokePlayer from './components/KaraokePlayer';
import './App.css';
import './Player.css';

function App() {
    const [activePage, setActivePage] = useState('generator');

    return (
        <div className="app-container">
            <nav className="app-nav">
                <div className="nav-logo">
                    Jackson {activePage === 'generator' ? 'Generator' : 'Player'}
                </div>
                <div className="nav-links">
                    <button
                        className={`nav-link ${activePage === 'generator' ? 'active' : ''}`}
                        onClick={() => setActivePage('generator')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Generator
                    </button>
                    <button
                        className={`nav-link ${activePage === 'player' ? 'active' : ''}`}
                        onClick={() => setActivePage('player')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="5.5" cy="17.5" r="2.5"></circle>
                            <circle cx="17.5" cy="15.5" r="2.5"></circle>
                            <path d="M8 17V5l12-2v12"></path>
                        </svg>
                        Player
                    </button>
                </div>
            </nav>

            {activePage === 'generator' ? <KaraokeJsonGenerator /> : <KaraokePlayer />}
        </div>
    );
}

export default App;