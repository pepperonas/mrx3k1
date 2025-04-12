import React, {useEffect, useState} from 'react';
import {
    ChevronDown,
    ChevronRight,
    ExternalLink,
    FileText,
    Folder,
    Home,
    Menu,
    Moon,
    Sun,
    Search
} from 'lucide-react';

// TextScramble Effekt für Überschriften
const TextScramble = ({text}) => {
    const [displayText, setDisplayText] = useState('');
    const chars = '!<>-_\\/[]{}—=+*^?#________';

    useEffect(() => {
        let frame = 0;
        const frames = 20;
        const finalText = text;

        const updateText = () => {
            let output = '';
            const complete = Math.floor((frame / frames) * finalText.length);

            for (let i = 0; i < finalText.length; i++) {
                if (i <= complete) {
                    output += finalText[i];
                } else if (i === complete + 1) {
                    output += chars[Math.floor(Math.random() * chars.length)];
                } else {
                    output += '';
                }
            }

            setDisplayText(output);

            frame++;
            if (frame <= frames + finalText.length) {
                setTimeout(updateText, 30);
            }
        };

        updateText();
    }, [text]);

    return <span className="scrambling-text">{displayText}</span>;
};

// Dokument-Kategorie mit Vorschau-Komponente
const DocumentPreview = ({document}) => {
    return (
        <div className="document-preview">
            <div className="document-preview-header">
                <FileText size={18} className="preview-icon"/>
                <h3>{document.name}</h3>
            </div>
            <div className="document-preview-content">
                <p>{document.description}</p>
                <div className="document-meta">
                    <span className="document-category">{document.category}</span>
                    <span className="document-divider">•</span>
                    <span className="document-path">{document.path}</span>
                </div>
            </div>
        </div>
    );
};

// Breadcrumb-Navigation
const Breadcrumbs = ({items}) => {
    return (
        <div className="breadcrumbs">
            <Home size={14}/>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-item">{item}</span>
                </React.Fragment>
            ))}
        </div>
    );
};

// Dokumentenstruktur
const documentsData = [
    {
        id: 'ai',
        name: 'AI',
        files: [
            {
                id: 'james-bond',
                name: 'James Bond Statistiken',
                path: 'ai/james-bond-data.html',
                description: 'Visualisierung von Todesfällen in James Bond Filmen mit interaktiven Charts und Details zu allen 25 Filmen.',
                category: 'Datenvisualisierung',
                tags: ['charts', 'statistik', 'visualisierung', 'james bond']
            }
        ]
    },
    {
        id: 'development',
        name: 'Development',
        files: [
            {
                id: 'seo-checklist',
                name: 'SEO Checkliste 2025',
                path: 'development/seo-checklist.html',
                description: 'Eine umfassende Checkliste der wichtigsten SEO-Faktoren für Webentwickler - von technischen Grundlagen bis zu fortgeschrittenen Strategien.',
                category: 'Webentwicklung',
                tags: ['seo', 'webentwicklung', 'marketing']
            }
        ]
    },
    {
        id: 'security',
        name: 'IT-Security',
        files: [
            {
                id: 'rsa-v1',
                name: 'RSA-Verschlüsselung V1',
                path: 'it-security/rsa-erklaerung-v1.html',
                description: 'Eine leicht verständliche Erklärung der RSA-Verschlüsselung mit interaktiven Animationen für Einsteiger.',
                category: 'Kryptographie',
                tags: ['verschlüsselung', 'rsa', 'sicherheit', 'grundlagen']
            },
            {
                id: 'rsa-v2',
                name: 'RSA-Verschlüsselung V2',
                path: 'it-security/rsa-erklaerung-v2.html',
                description: 'Eine detailliertere Erklärung der RSA-Verschlüsselung mit mathematischen Hintergründen und praktischen Anwendungsfällen.',
                category: 'Kryptographie',
                tags: ['verschlüsselung', 'rsa', 'sicherheit', 'fortgeschritten']
            }
        ]
    }
];

// Die tatsächlichen iframe-Quellen für die Dokumente
// ACHTUNG!!! HIER REMOTE UND LOKAL PFAD ANPASSEN!!!
const documentSources = {
    'james-bond': 'ai/james-bond-data.html',
    'seo-checklist': 'development/seo-checklist.html',
    'rsa-v1': 'it-security/rsa-erklaerung-v1.html',
    'rsa-v2': 'it-security/rsa-erklaerung-v2.html'
};

// Hauptkomponente
const DocsPortal = () => {
    const [openFolders, setOpenFolders] = useState({});
    const [activeFile, setActiveFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [breadcrumbs, setBreadcrumbs] = useState(['Docs']);
    const [showPreview, setShowPreview] = useState(true);
    const [iframeSrc, setIframeSrc] = useState('');
    const [darkMode, setDarkMode] = useState(true);

    // Ordner öffnen/schließen
    const toggleFolder = (folderId) => {
        setOpenFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    // Datei auswählen und anzeigen
    const selectFile = (folder, file) => {
        setActiveFile(file);
        setBreadcrumbs([folder.name, file.name]);
        setShowPreview(false);

        // URL aktualisieren ohne Neuladen
        window.history.pushState(null, null, `?folder=${folder.id}&file=${file.id}`);

        // iframe-Quelle festlegen
        setIframeSrc(documentSources[file.id] || 'not-found.html');
    };

    // Zurück zur Vorschau
    const goToPreview = () => {
        setShowPreview(true);
        setActiveFile(null);
        setBreadcrumbs(['Docs']);
        window.history.pushState(null, null, window.location.pathname);
        setIframeSrc('');
    };

    // Sidebar ein-/ausblenden
    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    // Theme umschalten
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    // Filterung der Dokumente nach Suchbegriff
    const getFilteredDocuments = () => {
        if (!searchTerm) return documentsData;

        return documentsData.map(folder => {
            const filteredFiles = folder.files.filter(file =>
                file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            return {
                ...folder,
                files: filteredFiles
            };
        }).filter(folder => folder.files.length > 0);
    };

    // Öffne in neuem Tab
    const openInNewTab = () => {
        if (activeFile) {
            window.open(documentSources[activeFile.id], '_blank');
        }
    };

    // Prüfen der URL-Parameter beim Laden und Theme setzen
    useEffect(() => {
        // URL-Parameter verarbeiten
        const urlParams = new URLSearchParams(window.location.search);
        const folderId = urlParams.get('folder');
        const fileId = urlParams.get('file');

        if (folderId && fileId) {
            const folder = documentsData.find(f => f.id === folderId);
            if (folder) {
                setOpenFolders(prev => ({
                    ...prev,
                    [folderId]: true
                }));

                const file = folder.files.find(f => f.id === fileId);
                if (file) {
                    setActiveFile(file);
                    setBreadcrumbs([folder.name, file.name]);
                    setShowPreview(false);
                    setIframeSrc(documentSources[file.id] || 'not-found.html');
                }
            }
        } else {
            // Standard: ersten Ordner öffnen
            setOpenFolders(prev => ({
                ...prev,
                [documentsData[0].id]: true
            }));
        }

        // Gespeichertes Theme wiederherstellen
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setDarkMode(savedTheme === 'dark');
        }
    }, []);

    // Theme-Änderungen speichern und anwenden
    useEffect(() => {
        // Speichere Theme-Einstellung
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');

        // Theme-Klasse auf dem Body-Element setzen
        document.body.className = darkMode ? 'dark-mode' : 'light-mode';
    }, [darkMode]);

    return (
        <div className={`docs-app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
            {/* Header-Bereich */}
            <header className="docs-header">
                <div className="header-left">
                    <button className="toggle-sidebar" onClick={toggleSidebar}>
                        <Menu size={24}/>
                    </button>
                    <h1 className="site-title">mrx3k1.de <span className="title-docs">Docs</span>
                    </h1>
                </div>
                <div className="header-right">
                    <button className="theme-button" onClick={toggleTheme} aria-label="Toggle theme">
                        {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                </div>
            </header>

            <div className="docs-container">
                {/* Sidebar */}
                <aside className={`docs-sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}>
                    <div className="search-container">
                        <div className="search-input-wrapper">
                            <Search size={18} className="search-icon"/>
                            <input
                                type="text"
                                placeholder="Suchen..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <nav className="docs-nav">
                        {getFilteredDocuments().map(folder => (
                            <div key={folder.id} className="nav-folder">
                                <div
                                    className="folder-header"
                                    onClick={() => toggleFolder(folder.id)}
                                >
                                    {openFolders[folder.id] ?
                                        <ChevronDown size={18} className="folder-icon"/> :
                                        <ChevronRight size={18} className="folder-icon"/>
                                    }
                                    <Folder size={18} className="folder-type-icon"/>
                                    <span className="folder-name">{folder.name}</span>
                                </div>

                                {openFolders[folder.id] && (
                                    <div className="folder-files">
                                        {folder.files.map(file => (
                                            <div
                                                key={file.id}
                                                className={`file-item ${activeFile && activeFile.id === file.id ? 'active' : ''}`}
                                                onClick={() => selectFile(folder, file)}
                                            >
                                                <FileText size={16} className="file-icon"/>
                                                <span className="file-name">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Hauptinhalt */}
                <main className="docs-main">
                    <div className="breadcrumb-container">
                        <Breadcrumbs items={breadcrumbs}/>
                    </div>

                    <div className="content-container">
                        {showPreview ? (
                            // Dokument-Vorschau
                            <div className="documents-preview">
                                <h2 className="preview-title">Dokumentation</h2>
                                <p className="preview-description">
                                    Wähle ein Dokument aus der Sidebar, um es anzuzeigen, oder
                                    durchsuche die verfügbaren Dokumente.
                                </p>

                                <div className="document-categories">
                                    {documentsData.map(folder => (
                                        <div key={folder.id} className="category-section">
                                            <h3 className="category-title">
                                                <span className="category-icon-wrapper">
                                                    <Folder size={18} className="category-icon"/>
                                                </span>
                                                {folder.name}
                                            </h3>

                                            <div className="category-documents">
                                                {folder.files.map(file => (
                                                    <div
                                                        key={file.id}
                                                        className="document-item"
                                                        onClick={() => selectFile(folder, file)}
                                                    >
                                                        <DocumentPreview document={file}/>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Dokument-Ansicht im iframe
                            <div className="document-viewer">
                                <div className="document-actions">
                                    <button className="back-button" onClick={goToPreview}>
                                        Zurück zur Übersicht
                                    </button>
                                    <button className="external-link" onClick={openInNewTab}>
                                        <ExternalLink size={16}/>
                                        <span>In neuem Tab öffnen</span>
                                    </button>
                                </div>

                                <div className="document-frame-container">
                                    {/* Hier wird der iframe mit der src-Eigenschaft verwendet */}
                                    <iframe
                                        src={iframeSrc}
                                        className="document-frame"
                                        title={activeFile ? activeFile.name : 'Dokument'}
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        sandbox="allow-same-origin allow-scripts allow-forms"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <footer className="docs-footer">
                <p>Made with ❤️ by Martin Pfeffer</p>
            </footer>
        </div>
    );
};

// App mit Styling
const App = () => {
    return (
        <>
            <style>{`
        /* Grundlegende Styling-Variablen */
        :root {
          --primary-color-dark: #2C2E3B;
          --secondary-color-dark: #383A4D;
          --primary-color-light: #F5F5F7;
          --secondary-color-light: #FFFFFF;
          --accent-color: #7A7FBC;
          --highlight-color: #61DAFB;
          --text-color-dark: #f5f5f5;
          --text-color-light: #333333;
          --text-secondary-dark: #b8b8b8;
          --text-secondary-light: #666666;
          --border-color-dark: rgba(255, 255, 255, 0.1);
          --border-color-light: rgba(0, 0, 0, 0.1);
          --shadow-color: rgba(0, 0, 0, 0.2);
          --header-height: 60px;
          --sidebar-width: 280px;
          --transition-speed: 0.3s;
        }
        
        /* Theme-spezifische Variablen */
        .dark-mode {
          --primary-color: var(--primary-color-dark);
          --secondary-color: var(--secondary-color-dark);
          --text-color: var(--text-color-dark);
          --text-secondary: var(--text-secondary-dark);
          --border-color: var(--border-color-dark);
        }
        
        .light-mode {
          --primary-color: var(--primary-color-light);
          --secondary-color: var(--secondary-color-light);
          --text-color: var(--text-color-light);
          --text-secondary: var(--text-secondary-light);
          --border-color: var(--border-color-light);
        }
        
        /* Globale Styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
          background-color: var(--primary-color);
          color: var(--text-color);
          line-height: 1.6;
          transition: background-color var(--transition-speed), color var(--transition-speed);
        }
        
        /* App-Layout */
        .docs-app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: var(--primary-color);
          color: var(--text-color);
          transition: background-color var(--transition-speed), color var(--transition-speed);
        }
        
        /* Header-Styles */
        .docs-header {
          height: var(--header-height);
          background-color: var(--secondary-color);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          position: sticky;
          top: 0;
          z-index: 100;
          transition: background-color var(--transition-speed), border-color var(--transition-speed);
        }
        
        .header-left, .header-right {
          display: flex;
          align-items: center;
        }
        
        .toggle-sidebar, .theme-button {
          background: none;
          border: none;
          color: var(--text-color);
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color var(--transition-speed), color var(--transition-speed);
        }
        
        .toggle-sidebar:hover, .theme-button:hover {
          background-color: rgba(128, 128, 128, 0.1);
        }
        
        .site-title {
          margin-left: 15px;
          font-size: 1.4rem;
          font-weight: 500;
          color: var(--text-color);
          transition: color var(--transition-speed);
        }
        
        .title-docs {
          color: var(--highlight-color);
          font-weight: 300;
        }
        
        /* Hauptcontainer */
        .docs-container {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        /* Sidebar-Styles */
        .docs-sidebar {
          width: var(--sidebar-width);
          background-color: var(--secondary-color);
          border-right: 1px solid var(--border-color);
          transition: transform var(--transition-speed), width var(--transition-speed), 
                      background-color var(--transition-speed), border-color var(--transition-speed);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .docs-sidebar.hidden {
          transform: translateX(-100%);
          width: 0;
        }
        
        .search-container {
          padding: 15px;
          border-bottom: 1px solid var(--border-color);
          transition: border-color var(--transition-speed);
        }
        
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background-color: rgba(128, 128, 128, 0.1);
          border-radius: 8px;
          padding: 8px 12px;
        }
        
        .search-icon {
          color: var(--text-secondary);
          margin-right: 8px;
          transition: color var(--transition-speed);
        }
        
        .search-input {
          background: none;
          border: none;
          color: var(--text-color);
          width: 100%;
          outline: none;
          font-size: 0.9rem;
          transition: color var(--transition-speed);
        }
        
        .search-input::placeholder {
          color: var(--text-secondary);
          transition: color var(--transition-speed);
        }
        
        .docs-nav {
          overflow-y: auto;
          flex: 1;
          padding: 10px 0;
        }
        
        .nav-folder {
          margin-bottom: 5px;
        }
        
        .folder-header {
          display: flex;
          align-items: center;
          padding: 8px 15px;
          cursor: pointer;
          transition: background-color var(--transition-speed);
        }
        
        .folder-header:hover {
          background-color: rgba(128, 128, 128, 0.1);
        }
        
        .folder-icon {
          margin-right: 5px;
          color: var(--text-secondary);
          transition: color var(--transition-speed);
        }
        
        .folder-type-icon {
          margin-right: 8px;
          color: var(--accent-color);
        }
        
        .folder-name {
          font-weight: 500;
          color: var(--text-color);
          transition: color var(--transition-speed);
        }
        
        .folder-files {
          padding-left: 20px;
        }
        
        .file-item {
          display: flex;
          align-items: center;
          padding: 6px 15px;
          cursor: pointer;
          border-radius: 4px;
          margin: 2px 10px 2px 0;
          transition: background-color var(--transition-speed), color var(--transition-speed);
        }
        
        .file-item:hover {
          background-color: rgba(128, 128, 128, 0.1);
        }
        
        .file-item.active {
          background-color: rgba(122, 127, 188, 0.2);
          color: var(--highlight-color);
        }
        
        .file-icon {
          margin-right: 8px;
          color: var(--text-secondary);
          transition: color var(--transition-speed);
        }
        
        .file-item.active .file-icon {
          color: var(--highlight-color);
        }
        
        .file-name {
          color: var(--text-color);
          transition: color var(--transition-speed);
        }
        
        /* Hauptinhalt-Styles */
        .docs-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        
        .breadcrumb-container {
          padding: 15px 20px;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--secondary-color);
          transition: background-color var(--transition-speed), border-color var(--transition-speed);
        }
        
        .breadcrumbs {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: color var(--transition-speed);
        }
        
        .breadcrumb-separator {
          margin: 0 8px;
          color: var(--text-secondary);
          transition: color var(--transition-speed);
        }
        
        .breadcrumb-item:last-child {
          color: var(--text-color);
          font-weight: 500;
          transition: color var(--transition-speed);
        }
        
        .content-container {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        
        /* Vorschau-Styles */
        .documents-preview {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .preview-title {
          font-size: 1.8rem;
          margin-bottom: 10px;
          color: var(--accent-color);
        }
        
        .preview-description {
          color: var(--text-secondary);
          margin-bottom: 30px;
          transition: color var(--transition-speed);
        }
        
        .document-categories {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .category-section {
          margin-bottom: 20px;
        }
        
        .category-title {
          font-size: 1.3rem;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          color: var(--highlight-color);
        }
        
        .category-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background-color: rgba(122, 127, 188, 0.2);
          margin-right: 10px;
        }
        
        .category-icon {
          color: var(--accent-color);
        }
        
        .category-documents {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .document-item {
          cursor: pointer;
          transition: transform var(--transition-speed);
        }
        
        .document-item:hover {
          transform: translateY(-3px);
        }
        
        .document-preview {
          background-color: var(--secondary-color);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-color);
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: background-color var(--transition-speed), border-color var(--transition-speed), 
                      box-shadow var(--transition-speed);
        }
        
        .document-item:hover .document-preview {
          box-shadow: 0 5px 15px var(--shadow-color);
        }
        
        .document-preview-header {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 15px;
          display: flex;
          align-items: center;
          transition: background-color var(--transition-speed);
        }
        
        .light-mode .document-preview-header {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .preview-icon {
          margin-right: 10px;
          color: var(--accent-color);
        }
        
        .document-preview h3 {
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--text-color);
          transition: color var(--transition-speed);
        }
        
        .document-preview-content {
          padding: 15px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .document-preview p {
          margin-bottom: 15px;
          flex: 1;
          color: var(--text-secondary);
          font-size: 0.9rem;
          transition: color var(--transition-speed);
        }
        
        .document-meta {
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          transition: color var(--transition-speed);
        }
        
        .document-category {
          background-color: rgba(122, 127, 188, 0.2);
          color: var(--highlight-color);
          padding: 3px 8px;
          border-radius: 4px;
        }
        
        .document-divider {
          margin: 0 8px;
          color: var(--text-secondary);
          transition: color var(--transition-speed);
        }
        
        /* Dokument-Viewer-Styles */
        .document-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .document-actions {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        
        .back-button {
          background-color: var(--secondary-color);
          border: none;
          color: var(--text-color);
          padding: 8px 15px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background-color var(--transition-speed), color var(--transition-speed);
        }
        
        .back-button:hover {
          background-color: rgba(128, 128, 128, 0.1);
        }
        
        .external-link {
          display: flex;
          align-items: center;
          color: var(--accent-color);
          text-decoration: none;
          font-size: 0.9rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 15px;
          border-radius: 6px;
          transition: background-color var(--transition-speed);
        }
        
        .external-link:hover {
          background-color: rgba(122, 127, 188, 0.1);
        }
        
        .external-link span {
          margin-left: 5px;
        }
        
        .document-frame-container {
          flex: 1;
          border-radius: 8px;
          overflow: hidden;
          background-color: var(--secondary-color);
          border: 1px solid var(--border-color);
          min-height: 500px;
          transition: background-color var(--transition-speed), border-color var(--transition-speed);
        }
        
        .document-frame {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          min-height: 500px;
        }
        
        /* Footer-Styles */
        .docs-footer {
          background-color: var(--secondary-color);
          padding: 15px;
          text-align: center;
          border-top: 1px solid var(--border-color);
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: background-color var(--transition-speed), border-color var(--transition-speed), 
                    color var(--transition-speed);
        }
        
        /* Animation-Effekte */
        .scrambling-text {
          text-shadow: 0 0 8px currentColor;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .docs-sidebar.visible {
            position: fixed;
            height: calc(100vh - var(--header-height));
            z-index: 90;
            box-shadow: 0 0 20px var(--shadow-color);
          }
          
          .category-documents {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
            <DocsPortal/>
        </>
    );
};

export default App;