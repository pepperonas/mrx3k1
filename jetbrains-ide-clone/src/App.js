import React, { useState, useEffect } from 'react';
import { Sidebar, Folder, Code, Settings, Terminal, Server, Monitor, Search, X, ChevronRight, ChevronDown, Play, Check, AlertTriangle, Pause, Menu, Coffee } from 'lucide-react';

const JetBrainsIDE = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({
    'src': true,
    'components': true
  });
  const [fileSelected, setFileSelected] = useState('App.js');
  const [showTip, setShowTip] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [isMacOS, setIsMacOS] = useState(false);

  const mainColor = '#2C2E3B';
  const lightColor = '#383A4A';
  const accentColor = '#4D9DE0';
  const textColor = '#E8E9ED';
  const darkTextColor = '#9DA0AE';
  const borderColor = '#1F2029';

  // Windows/Linux Shortcuts
  const windowsShortcuts = [
    {
      category: "Navigation",
      shortcuts: [
        { keys: ["Ctrl", "E"], description: "Datei suchen" },
        { keys: ["Ctrl", "N"], description: "Klasse suchen" },
        { keys: ["Alt", "←/→"], description: "Zwischen offenen Tabs wechseln" },
        { keys: ["Ctrl", "B"], description: "Zur Deklaration navigieren" },
        { keys: ["Ctrl", "Shift", "N"], description: "Datei öffnen" },
        { keys: ["Ctrl", "Tab"], description: "Zwischen Dateien wechseln" }
      ]
    },
    {
      category: "Bearbeiten",
      shortcuts: [
        { keys: ["Ctrl", "D"], description: "Zeile duplizieren" },
        { keys: ["Ctrl", "Y"], description: "Zeile löschen" },
        { keys: ["Ctrl", "/"], description: "Zeile(n) auskommentieren" },
        { keys: ["Ctrl", "Shift", "↑/↓"], description: "Zeile(n) verschieben" },
        { keys: ["Alt", "Enter"], description: "Quick-Fix anzeigen" },
        { keys: ["Ctrl", "Alt", "L"], description: "Code formatieren" }
      ]
    },
    {
      category: "Refactoring",
      shortcuts: [
        { keys: ["Shift", "F6"], description: "Umbenennen" },
        { keys: ["Ctrl", "Alt", "M"], description: "Methode extrahieren" },
        { keys: ["Ctrl", "Alt", "V"], description: "Variable extrahieren" },
        { keys: ["Ctrl", "Alt", "C"], description: "Konstante extrahieren" },
        { keys: ["Ctrl", "Alt", "P"], description: "Parameter extrahieren" }
      ]
    },
    {
      category: "Debugging",
      shortcuts: [
        { keys: ["F9"], description: "Breakpoint setzen/entfernen" },
        { keys: ["Shift", "F9"], description: "Debug starten" },
        { keys: ["F8"], description: "Step über" },
        { keys: ["F7"], description: "Step in" },
        { keys: ["Shift", "F8"], description: "Step out" }
      ]
    }
  ];

  // macOS Shortcuts
  const macShortcuts = [
    {
      category: "Navigation",
      shortcuts: [
        { keys: ["⌘", "E"], description: "Datei suchen" },
        { keys: ["⌘", "O"], description: "Klasse suchen" },
        { keys: ["⌘", "←/→"], description: "Zwischen offenen Tabs wechseln" },
        { keys: ["⌘", "B"], description: "Zur Deklaration navigieren" },
        { keys: ["⇧", "⌘", "O"], description: "Datei öffnen" },
        { keys: ["⌃", "Tab"], description: "Zwischen Dateien wechseln" }
      ]
    },
    {
      category: "Bearbeiten",
      shortcuts: [
        { keys: ["⌘", "D"], description: "Zeile duplizieren" },
        { keys: ["⌘", "⌫"], description: "Zeile löschen" },
        { keys: ["⌘", "/"], description: "Zeile(n) auskommentieren" },
        { keys: ["⌥", "⇧", "↑/↓"], description: "Zeile(n) verschieben" },
        { keys: ["⌥", "↩"], description: "Quick-Fix anzeigen" },
        { keys: ["⌥", "⌘", "L"], description: "Code formatieren" }
      ]
    },
    {
      category: "Refactoring",
      shortcuts: [
        { keys: ["⇧", "F6"], description: "Umbenennen" },
        { keys: ["⌥", "⌘", "M"], description: "Methode extrahieren" },
        { keys: ["⌥", "⌘", "V"], description: "Variable extrahieren" },
        { keys: ["⌥", "⌘", "C"], description: "Konstante extrahieren" },
        { keys: ["⌥", "⌘", "P"], description: "Parameter extrahieren" }
      ]
    },
    {
      category: "Debugging",
      shortcuts: [
        { keys: ["F9"], description: "Breakpoint setzen/entfernen" },
        { keys: ["⌃", "D"], description: "Debug starten" },
        { keys: ["F8"], description: "Step über" },
        { keys: ["F7"], description: "Step in" },
        { keys: ["⇧", "F8"], description: "Step out" }
      ]
    }
  ];

  // Windows Tipps
  const windowsTips = [
    "Tipp: Nutze Ctrl+Shift+A um nach Aktionen zu suchen",
    "Tipp: Nutze Alt+Enter auf Fehlern für schnelle Fixes",
    "Tipp: Live Templates mit Ctrl+J für häufig genutzte Code-Snippets",
    "Tipp: Doppelklicke Shift für die globale Suche",
    "Tipp: Nutze Ctrl+Shift+F für projektweite Suche",
    "Tipp: Multiple Cursors mit Alt+Click setzen",
    "Tipp: Mit Ctrl+/ Zeilen schnell auskommentieren",
    "Tipp: Code-Formatierung mit Ctrl+Alt+L"
  ];

  // Mac Tipps
  const macTips = [
    "Tipp: Nutze ⌘⇧A um nach Aktionen zu suchen",
    "Tipp: Nutze ⌥↩ auf Fehlern für schnelle Fixes",
    "Tipp: Live Templates mit ⌘J für häufig genutzte Code-Snippets",
    "Tipp: Doppelklicke ⇧ für die globale Suche",
    "Tipp: Nutze ⌘⇧F für projektweite Suche",
    "Tipp: Multiple Cursors mit ⌥Click setzen",
    "Tipp: Mit ⌘/ Zeilen schnell auskommentieren",
    "Tipp: Code-Formatierung mit ⌥⌘L"
  ];

  // Holt die aktuellen Shortcuts basierend auf dem OS
  const getShortcuts = () => isMacOS ? macShortcuts : windowsShortcuts;

  // Holt die aktuellen Tipps basierend auf dem OS
  const getTips = () => isMacOS ? macTips : windowsTips;

  useEffect(() => {
    // Zeige periodisch Tipps an
    const tipInterval = setInterval(() => {
      setShowTip(true);
      setTimeout(() => setShowTip(false), 5000);
      setTipIndex(prev => (prev + 1) % getTips().length);
    }, 15000);

    return () => clearInterval(tipInterval);
  }, [isMacOS]); // Wenn sich das OS ändert, wird der Effect neu ausgeführt

  const fileTree = {
    'node_modules': {},
    'public': {
      'index.html': '',
      'favicon.ico': '',
    },
    'src': {
      'components': {
        'Header.js': '',
        'Sidebar.js': '',
        'Footer.js': '',
      },
      'App.js': '',
      'index.js': '',
      'App.css': '',
      'index.css': '',
    },
    'package.json': '',
    'README.md': '',
  };

  const tabs = [
    { name: 'App.js', type: 'js' },
    { name: 'Header.js', type: 'js' },
    { name: 'index.css', type: 'css' },
  ];

  const toggleNode = (nodeName) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeName]: !prev[nodeName]
    }));
  };

  const codeContent = `import React, { useState } from 'react';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={\`app \${darkMode ? 'dark-mode' : 'light-mode'}\`}>
      <header className="app-header">
        <h2>My Application</h2>
        <button onClick={toggleDarkMode}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>
      <div className="main-content">
        <div className="sidebar">
          <nav>
            <ul>
              <li>Home</li>
              <li>About</li>
              <li>Contact</li>
            </ul>
          </nav>
        </div>
        <main>
          <h1>Willkommen zur React-App</h1>
          <p>Dies ist eine Beispiel-Anwendung.</p>
        </main>
      </div>
      <footer>© 2025 My Company</footer>
    </div>
  );
}

export default App;`;

  const renderFileTree = (tree, path = '') => {
    return Object.entries(tree).map(([name, subtree]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isDirectory = typeof subtree === 'object';
      const isExpanded = expandedNodes[fullPath];

      return (
          <div key={fullPath}>
            <div
                className="file-tree-item"
                style={{
                  padding: '4px 0',
                  paddingLeft: path ? '20px' : '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: isDirectory ? textColor : darkTextColor,
                  backgroundColor: fileSelected === name ? lightColor : 'transparent'
                }}
                onClick={() => {
                  if (isDirectory) {
                    toggleNode(fullPath);
                  } else {
                    setFileSelected(name);
                  }
                }}
            >
              {isDirectory ? (
                  isExpanded ? (
                      <ChevronDown size={14} style={{ marginRight: '4px' }} />
                  ) : (
                      <ChevronRight size={14} style={{ marginRight: '4px' }} />
                  )
              ) : null}
              {isDirectory ? (
                  <Folder size={16} style={{ marginRight: '6px', color: '#E2C08C' }} />
              ) : (
                  <Code size={16} style={{
                    marginRight: '6px',
                    marginLeft: isDirectory ? 0 : '14px',
                    color:
                        name.endsWith('.js') ? '#A9B7C6' :
                            name.endsWith('.css') ? '#6A8759' :
                                name.endsWith('.json') ? '#CC7832' :
                                    name.endsWith('.md') ? '#9876AA' :
                                        '#A9B7C6'
                  }} />
              )}
              <span>{name}</span>
            </div>
            {isDirectory && isExpanded && renderFileTree(subtree, fullPath)}
          </div>
      );
    });
  };

  const toggleShortcutModal = () => {
    setShowShortcutModal(!showShortcutModal);
  };

  const ShortcutModal = () => {
    const currentShortcuts = getShortcuts();

    return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: mainColor,
            borderRadius: '8px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${borderColor}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: textColor, margin: 0 }}>JetBrains Shortcuts und Produktivitätstipps</h2>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: mainColor,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginRight: '16px',
                      border: `1px solid ${borderColor}`
                    }}
                >
                  <div
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isMacOS ? 'transparent' : accentColor,
                        color: isMacOS ? darkTextColor : textColor,
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setIsMacOS(false)}
                  >
                    Windows/Linux
                  </div>
                  <div
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isMacOS ? accentColor : 'transparent',
                        color: isMacOS ? textColor : darkTextColor,
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setIsMacOS(true)}
                  >
                    macOS
                  </div>
                </div>
                <X
                    size={24}
                    style={{ cursor: 'pointer', color: darkTextColor }}
                    onClick={toggleShortcutModal}
                />
              </div>
            </div>

            {currentShortcuts.map((cat, index) => (
                <div key={index} style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: accentColor, borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px' }}>
                    {cat.category}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {cat.shortcuts.map((shortcut, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          padding: '8px',
                          backgroundColor: lightColor,
                          borderRadius: '4px',
                          marginBottom: '4px'
                        }}>
                          <div style={{
                            display: 'flex',
                            marginRight: '12px',
                            minWidth: '120px'
                          }}>
                            {shortcut.keys.map((key, keyIdx) => (
                                <React.Fragment key={keyIdx}>
                          <span style={{
                            padding: '2px 6px',
                            backgroundColor: borderColor,
                            borderRadius: '4px',
                            color: textColor,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            border: '1px solid #444'
                          }}>
                            {key}
                          </span>
                                  {keyIdx < shortcut.keys.length - 1 && (
                                      <span style={{ margin: '0 4px', color: darkTextColor }}>+</span>
                                  )}
                                </React.Fragment>
                            ))}
                          </div>
                          <div style={{ color: textColor, fontSize: '14px' }}>
                            {shortcut.description}
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            ))}

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ color: accentColor, borderBottom: `1px solid ${borderColor}`, paddingBottom: '8px' }}>
                Produktivitäts-Workflows
              </h3>
              <div style={{ color: textColor }}>
                <div style={{
                  backgroundColor: lightColor,
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ color: accentColor, margin: '0 0 8px 0' }}>Multi-Cursor-Bearbeitung</h4>
                  <p>Halte <b>{isMacOS ? '⌥' : 'Alt'}</b> gedrückt und klicke an verschiedenen Stellen, um mehrere Cursor zu setzen. Perfekt um identische Änderungen an mehreren Stellen gleichzeitig vorzunehmen.</p>
                </div>

                <div style={{
                  backgroundColor: lightColor,
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ color: accentColor, margin: '0 0 8px 0' }}>Code-Generierung mit Live Templates</h4>
                  <p>Drücke <b>{isMacOS ? '⌘J' : 'Ctrl+J'}</b> und wähle aus einer Liste von Code-Snippets, oder gib einfach den Abkürzungsnamen ein und drücke Tab.</p>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Tippe <b>iter</b> + Tab für eine for-Schleife</li>
                    <li>Tippe <b>psvm</b> + Tab für public static void main</li>
                    <li>Tippe <b>sout</b> + Tab für System.out.println()</li>
                  </ul>
                </div>

                <div style={{
                  backgroundColor: lightColor,
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ color: accentColor, margin: '0 0 8px 0' }}>Effiziente Navigation</h4>
                  <p>Kombiniere <b>{isMacOS ? '⌘E' : 'Ctrl+E'}</b> (letzte Dateien), <b>{isMacOS ? '⇧⌘E' : 'Ctrl+Shift+E'}</b> (letzte Positionen) und <b>{isMacOS ? '⌘←/→' : 'Alt+Pfeil links/rechts'}</b> (Navigation zwischen Tabs), um schnell zwischen Arbeitsbereichn zu wechseln.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  };

  const TipNotification = () => (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: accentColor,
        color: 'white',
        padding: '10px 16px',
        borderRadius: '6px',
        maxWidth: '300px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        transform: showTip ? 'translateY(0)' : 'translateY(100px)',
        opacity: showTip ? 1 : 0,
        transition: 'all 0.3s ease',
        zIndex: 1000
      }}>
        <Coffee size={18} style={{ marginRight: '8px' }} />
        <span>{getTips()[tipIndex]}</span>
      </div>
  );

  return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: mainColor,
        color: textColor,
        fontFamily: 'JetBrains Mono, monospace',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header / Menu Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '2px 8px',
          backgroundColor: borderColor,
          borderBottom: `1px solid ${borderColor}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '4px 8px',
          }}>
            <Menu size={16} style={{ color: darkTextColor }} />
            <span style={{ color: darkTextColor, fontSize: '13px' }}>File</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>Edit</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>View</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>Navigate</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>Code</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>Refactor</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>Run</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>Tools</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>VCS</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>Window</span>
            <span style={{ color: darkTextColor, fontSize: '13px' }}>Help</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Project Panel */}
          <div style={{
            width: '220px',
            backgroundColor: mainColor,
            borderRight: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '8px',
              borderBottom: `1px solid ${borderColor}`,
              fontSize: '13px',
              fontWeight: 'bold',
              color: darkTextColor
            }}>
              Project
            </div>
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '8px 0'
            }}>
              {renderFileTree(fileTree)}
            </div>
          </div>

          {/* Editor Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: mainColor
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              backgroundColor: lightColor,
              borderBottom: `1px solid ${borderColor}`
            }}>
              {tabs.map((tab, index) => (
                  <div
                      key={index}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: activeTab === index ? mainColor : lightColor,
                        color: activeTab === index ? textColor : darkTextColor,
                        borderRight: `1px solid ${borderColor}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => setActiveTab(index)}
                  >
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      marginRight: '8px',
                      backgroundColor:
                          tab.type === 'js' ? '#FFCB6B' :
                              tab.type === 'css' ? '#C3E88D' :
                                  tab.type === 'html' ? '#F07178' : '#89DDFF'
                    }}></div>
                    {tab.name}
                  </div>
              ))}
            </div>

            {/* Code Editor */}
            <div style={{
              flex: 1,
              padding: '12px',
              fontSize: '14px',
              backgroundColor: mainColor,
              overflow: 'auto',
              position: 'relative'
            }}>
              {/* Line Numbers */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '36px',
                backgroundColor: borderColor,
                textAlign: 'right',
                padding: '12px 0',
                color: darkTextColor,
                fontSize: '12px',
                userSelect: 'none'
              }}>
                {codeContent.split('\n').map((_, i) => (
                    <div key={i} style={{ padding: '0 8px' }}>{i + 1}</div>
                ))}
              </div>

              {/* Code Content */}
              <pre style={{
                margin: 0,
                paddingLeft: '40px',
                fontFamily: 'JetBrains Mono, monospace',
                lineHeight: '1.5',
                color: textColor
              }}>
              <code>{codeContent}</code>
            </pre>
            </div>

            {/* Terminal (collapsible) */}
            {terminalOpen && (
                <div style={{
                  height: '150px',
                  backgroundColor: borderColor,
                  borderTop: `1px solid ${borderColor}`,
                  padding: '8px',
                  color: textColor,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  overflow: 'auto'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      padding: '4px 12px',
                      backgroundColor: mainColor,
                      borderTopLeftRadius: '3px',
                      borderTopRightRadius: '3px',
                      marginRight: '1px',
                      fontSize: '12px'
                    }}>
                      Terminal
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      backgroundColor: 'transparent',
                      color: darkTextColor,
                      fontSize: '12px'
                    }}>
                      Problems
                    </div>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ color: '#A9B7C6' }}>user@jetbrains-ide</span>
                    <span style={{ color: '#73C990' }}> $ </span>
                    <span style={{ color: '#D8D8D8' }}>npm start</span>
                  </div>
                  <div style={{ marginTop: '4px', color: '#73C990' }}>
                    Starting development server...
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    Compiled successfully!
                  </div>
                  <div style={{ color: '#D8D8D8', marginTop: '4px' }}>
                    You can now view the project in the browser.
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ color: '#A9B7C6' }}>Local: </span>
                    <span style={{ color: '#89DDFF' }}>http://localhost:3000</span>
                  </div>
                </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{
            width: '30px',
            backgroundColor: mainColor,
            borderLeft: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 0'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
              color: darkTextColor
            }}>
              <Search size={18} />
            </div>
            <div style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
              color: darkTextColor
            }}>
              <Folder size={18} />
            </div>
            <div style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
              color: darkTextColor
            }}>
              <Settings size={18} />
            </div>
            <div style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
              color: darkTextColor
            }} onClick={() => setTerminalOpen(!terminalOpen)}>
              <Terminal size={18} />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 8px',
          backgroundColor: borderColor,
          fontSize: '12px',
          color: darkTextColor
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
              <Check size={14} style={{ marginRight: '4px', color: '#73C990' }} />
              <span>ESLint: No problems</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
              <Server size={14} style={{ marginRight: '4px' }} />
              <span>master</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <AlertTriangle size={14} style={{ marginRight: '4px', color: '#F78C6C' }} />
              <span>0 warnings</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
                style={{
                  marginRight: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onClick={toggleShortcutModal}
            >
              <span style={{ color: accentColor }}>Shortcuts & Workflow-Tipps</span>
            </div>
            <div
                style={{
                  marginRight: '16px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  backgroundColor: isMacOS ? accentColor : 'transparent',
                  borderRadius: '4px',
                  color: isMacOS ? textColor : darkTextColor,
                  border: `1px solid ${accentColor}`,
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setIsMacOS(!isMacOS)}
            >
              {isMacOS ? 'macOS' : 'Windows/Linux'}
            </div>
            <div style={{ marginRight: '16px' }}>UTF-8</div>
            <div style={{ marginRight: '16px' }}>JavaScript</div>
            <div style={{ marginRight: '16px' }}>Ln 12, Col 24</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Play size={14} style={{ marginRight: '4px', color: '#73C990' }} />
              <span>Running</span>
            </div>
          </div>
        </div>

        {/* Shortcuts Modal */}
        {showShortcutModal && <ShortcutModal />}

        {/* Productivity Tips */}
        <TipNotification />
      </div>
  );
};

export default JetBrainsIDE;