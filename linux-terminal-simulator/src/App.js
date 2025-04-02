// App.js
import React from 'react';
import LinuxTerminalSimulator from './LinuxTerminalSimulator';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Linux Terminal Simulator</h1>
      </header>
      <main>
        <LinuxTerminalSimulator />
      </main>
      <footer className="App-footer">
        <p>© 2025 Martin Pfeffer</p>
      </footer>
    </div>
  );
}

export default App;