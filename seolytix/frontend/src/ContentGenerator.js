// src/ContentGenerator.js - Komponente für die Generierung und Verbesserung von SEO-optimierten Inhalten

import React, {useState} from 'react';
import {
    AlertCircle,
    CheckCircle,
    CheckSquare,
    Copy,
    Download,
    Edit3,
    FileText,
    List,
    MessageSquare,
    Send,
    Sliders,
    Sparkles,
    Link2
} from 'lucide-react';

const ContentGenerator = ({apiKey, apiUrl, onError}) => {
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [contentType, setContentType] = useState('Artikel');
    const [tone, setTone] = useState('informativ');
    const [wordCount, setWordCount] = useState(500);
    const [targetAudience, setTargetAudience] = useState('Allgemeine Leser');
    const [outline, setOutline] = useState('');
    const [includeFAQ, setIncludeFAQ] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [error, setError] = useState('');
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [mode, setMode] = useState('create'); // 'create' oder 'improve'
    const [existingContentUrl, setExistingContentUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importedContent, setImportedContent] = useState('');
    const [activeAction, setActiveAction] = useState(null); // 'edit', 'feedback', 'publish'
    const [successMessage, setSuccessMessage] = useState(null);

    // Content-Typen und Tonalitäten für Auswahlmenüs
    const contentTypes = [
        'Artikel',
        'Blogbeitrag',
        'Produktbeschreibung',
        'Landing Page',
        'Über uns',
        'FAQ',
        'Anleitung',
        'Vergleich'
    ];

    const toneOptions = [
        'informativ',
        'sachlich',
        'überzeugend',
        'freundlich',
        'professionell',
        'enthusiastisch',
        'humorvoll'
    ];

    const audienceOptions = [
        'Allgemeine Leser',
        'Anfänger/Einsteiger',
        'Fortgeschrittene',
        'Experten',
        'Unternehmen/B2B',
        'Konsumenten/B2C',
        'Technisch versierte Personen'
    ];

    const handleImportKeyDown = (e) => {
        if (e.key === 'Enter' && !isImporting && existingContentUrl.trim()) {
            e.preventDefault();
            importContentFromUrl();
        }
    };

    // Bestehenden Content von URL importieren
    const importContentFromUrl = async () => {
        if (!existingContentUrl.trim()) {
            setError('Bitte geben Sie eine URL ein');
            return;
        }

        try {
            setIsImporting(true);
            setError('');

            // URL formatieren, falls noch kein Protokoll angegeben ist
            let formattedUrl = existingContentUrl;
            if (!existingContentUrl.startsWith('http://') && !existingContentUrl.startsWith('https://')) {
                formattedUrl = 'https://' + existingContentUrl;
                setExistingContentUrl(formattedUrl);
            }

            // URL-Format validieren
            try {
                new URL(formattedUrl);
            } catch (e) {
                throw new Error('Ungültige URL. Bitte geben Sie eine vollständige URL ein (z.B. https://example.com)');
            }

            // In einer echten Implementierung würden wir hier eine API anfragen
            // Wir nutzen den vorhandenen Backend-Endpunkt für Crawling, um den Inhalt zu extrahieren
            const response = await fetch(`${apiUrl}/api/crawl/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: formattedUrl,
                    options: {
                        maxDepth: 0, // Nur die angegebene Seite analysieren
                        maxUrls: 1,  // Nur eine URL (die angegebene)
                        includeImages: false,
                        includeExternalLinks: false,
                        onlyHtmlPages: true
                    }
                })
            });

            const responseData = await response.json();

            if (!responseData.success) {
                throw new Error(responseData.message || 'Fehler beim Importieren des Contents');
            }

            // Aus den Crawl-Ergebnissen den relevanten Content extrahieren
            const crawlData = responseData.data;
            const pageData = crawlData.crawledPages?.[0];

            if (!pageData) {
                throw new Error('Keine Daten für die angegebene URL gefunden');
            }

            // Content in die Form einfüllen
            setTopic(pageData.title || '');

            // Text-Inhalt aus Crawl-Daten extrahieren (bei echtem Crawl würde hier der Seiteninhalt stehen)
            let extractedContent = '';
            if (pageData.wordCount > 0) {
                // In einem echten Backend würde hier der tatsächliche Content stehen
                // Hier simulieren wir einen extrahierten Inhalt basierend auf den verfügbaren Daten
                extractedContent = `Hier ist der extrahierte Inhalt von ${formattedUrl}.\n\n`;

                if (pageData.h1 && pageData.h1.length > 0) {
                    extractedContent += `# ${pageData.h1[0]}\n\n`;
                }

                extractedContent += `Diese Seite hat ungefähr ${pageData.wordCount} Wörter`;
                extractedContent += pageData.metaDescription ? `\n\nBeschreibung: ${pageData.description}` : '';
                extractedContent += `\n\nDiese Seite hat ${pageData.internalLinksCount || 0} interne Links und ${pageData.externalLinksCount || 0} externe Links.`;
            }

            setImportedContent(extractedContent || 'Kein Inhalt gefunden. Versuchen Sie eine andere URL.');

            // Keywords extrahieren, falls vorhanden (in echtem Backend würden hier echte Keywords stehen)
            if (pageData.keywords) {
                setKeywords(pageData.keywords.join(', '));
            }

            // Bestehenden Content in outline setzen zur Verbesserung
            setOutline(extractedContent);

        } catch (error) {
            console.error('Fehler beim Content-Import:', error);
            setError(`Fehler beim Importieren des Contents: ${error.message}`);

            if (onError) {
                onError(error.message);
            }
        } finally {
            setIsImporting(false);
        }
    };

    // Content generieren oder verbessern
    const generateContent = async () => {
        if (mode === 'create' && !topic.trim()) {
            setError('Bitte geben Sie ein Thema ein');
            return;
        }

        if (mode === 'improve' && !importedContent && !outline.trim()) {
            setError('Bitte importieren Sie zuerst Content oder geben Sie Text ein');
            return;
        }

        if (!apiKey) {
            setError('API-Key fehlt. Bitte geben Sie einen gültigen API-Key ein');
            return;
        }

        setError('');
        setIsGenerating(true);
        setGeneratedContent(null);

        try {
            // Keyword-Liste aus dem Eingabefeld erstellen
            const keywordList = keywords
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);

            // Content-Request zusammenstellen
            const contentRequest = {
                topic,
                keywords: keywordList,
                contentType,
                tone,
                wordCount: parseInt(wordCount),
                targetAudience,
                outline: outline.trim() || null,
                includeFAQ,
                includeHeadings: true,
                metaDescription: true,
                mode: mode,
                existingContent: importedContent || outline
            };

            // API-Anfrage senden (für echte Implementierung)
            const response = await fetch(`${apiUrl}/api/content/${mode === 'create' ? 'generate' : 'improve'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey,
                    contentRequest
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Fehler bei der Content-Generierung');
            }

            setGeneratedContent(data.data);

        } catch (error) {
            console.error('Fehler bei der Content-Generierung:', error);
            setError(`Fehler bei der Content-Generierung: ${error.message}`);

            if (onError) {
                onError(error.message);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Content in die Zwischenablage kopieren
    const copyToClipboard = () => {
        if (!generatedContent) return;

        try {
            navigator.clipboard.writeText(generatedContent.content);
            setCopySuccess(true);

            // Nach 2 Sekunden den Erfolgsstatus zurücksetzen
            setTimeout(() => {
                setCopySuccess(false);
            }, 2000);
        } catch (err) {
            setError('Fehler beim Kopieren in die Zwischenablage');
        }
    };

    // Content als Markdown-Datei herunterladen
    const downloadContent = () => {
        if (!generatedContent) return;

        const fileName = `${topic.replace(/\s+/g, '-').toLowerCase()}-content.md`;
        const fileContent = generatedContent.content;

        const element = document.createElement('a');
        const file = new Blob([fileContent], {type: 'text/markdown'});
        element.href = URL.createObjectURL(file);
        element.download = fileName;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Text für Lesezeit formatieren
    const formatReadingTime = (wordCount) => {
        const wordsPerMinute = 200;
        const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
        return `~${readingTimeMinutes} min Lesezeit`;
    };

    // Funktion zum Speichern des bearbeiteten Contents
    const saveEditedContent = (editedContent) => {
        setGeneratedContent({
            ...generatedContent,
            content: editedContent
        });
        setActiveAction(null);
    };

    // Funktion zum Verarbeiten des Feedbacks
    const processFeedback = async (feedback, selectedParts) => {
        setIsGenerating(true);

        try {
            // Hier würde in einer echten Implementierung ein API-Aufruf erfolgen
            // Beispiel für eine Simulation:
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simuliertes Ergebnis
            const improvedContent = generatedContent.content.split('\n\n')
                .map((paragraph, index) => {
                    if (selectedParts.includes(index)) {
                        return paragraph + "\n\n[Verbesserter Abschnitt basierend auf Feedback: " + feedback + "]";
                    }
                    return paragraph;
                })
                .join('\n\n');

            setGeneratedContent({
                ...generatedContent,
                content: improvedContent,
                improvement: true
            });

        } catch (error) {
            console.error('Fehler bei der Feedback-Verarbeitung:', error);
            setError(`Fehler bei der Verbesserung: ${error.message}`);
        } finally {
            setIsGenerating(false);
            setActiveAction(null);
        }
    };

    // Funktion zum Veröffentlichen des Contents
    const publishContent = async (publishData, content) => {
        setIsGenerating(true);

        try {
            // Hier würde in einer echten Implementierung ein API-Aufruf erfolgen
            // Beispiel für eine Simulation:
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Erfolgreiche Nachricht anzeigen
            setActiveAction(null);
            setSuccessMessage(
                publishData.status === 'draft'
                    ? `Content wurde als Entwurf gespeichert: "${publishData.title}"`
                    : `Content wurde erfolgreich veröffentlicht: "${publishData.title}"`
            );

            // Nach 3 Sekunden die Erfolgsnachricht ausblenden
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);

        } catch (error) {
            console.error('Fehler beim Veröffentlichen:', error);
            setError(`Fehler beim Veröffentlichen: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // ContentEditor Komponente für die Bearbeitung des generierten Contents
    const ContentEditor = ({ content, onSave, onCancel }) => {
        const [editedContent, setEditedContent] = useState(content);

        return (
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#2C2E3B] flex items-center mb-4">
                    <Edit3 className="mr-2" size={18}/> Content bearbeiten
                </h3>

                <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent font-mono"
                />

                <div className="flex justify-end mt-4 space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-[#2C2E3B] border border-[#2C2E3B] rounded-lg hover:bg-gray-50"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={() => onSave(editedContent)}
                        className="px-4 py-2 bg-[#2C2E3B] text-white rounded-lg hover:bg-opacity-90"
                    >
                        Speichern
                    </button>
                </div>
            </div>
        );
    };

    // FeedbackForm Komponente für Feedback zur Verbesserung
    const FeedbackForm = ({ content, onSubmit, onCancel }) => {
        const [feedback, setFeedback] = useState('');
        const [selectedParts, setSelectedParts] = useState([]);

        const contentParagraphs = content.split('\n\n').filter(p => p.trim());

        const toggleParagraphSelection = (index) => {
            if (selectedParts.includes(index)) {
                setSelectedParts(selectedParts.filter(i => i !== index));
            } else {
                setSelectedParts([...selectedParts, index]);
            }
        };

        return (
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#2C2E3B] flex items-center mb-4">
                    <MessageSquare className="mr-2" size={18}/> Feedback geben
                </h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wählen Sie die Abschnitte aus, die verbessert werden sollen
                    </label>
                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                        {contentParagraphs.map((paragraph, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded cursor-pointer ${
                                    selectedParts.includes(index)
                                        ? 'bg-[#2C2E3B] bg-opacity-10 border border-[#2C2E3B]'
                                        : 'bg-gray-50 border border-gray-200'
                                }`}
                                onClick={() => toggleParagraphSelection(index)}
                            >
                                <p className="text-sm">{paragraph}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ihr Feedback
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Beschreiben Sie, wie der Inhalt verbessert werden soll..."
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                    ></textarea>
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-[#2C2E3B] border border-[#2C2E3B] rounded-lg hover:bg-gray-50"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={() => onSubmit(feedback, selectedParts)}
                        disabled={!feedback.trim() || selectedParts.length === 0}
                        className={`px-4 py-2 bg-[#2C2E3B] text-white rounded-lg hover:bg-opacity-90 ${
                            !feedback.trim() || selectedParts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        Feedback senden
                    </button>
                </div>
            </div>
        );
    };

    // PublishForm Komponente für die direkte Veröffentlichung
    const PublishForm = ({ content, title, onPublish, onCancel }) => {
        const [publishData, setPublishData] = useState({
            title: title || '',
            slug: title ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '',
            excerpt: '',
            status: 'draft',
            categories: [],
            tags: []
        });

        const handleChange = (field, value) => {
            setPublishData({
                ...publishData,
                [field]: value
            });

            // Slug automatisch aktualisieren, wenn Titel geändert wird
            if (field === 'title') {
                setPublishData({
                    ...publishData,
                    title: value,
                    slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                });
            }
        };

        return (
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-[#2C2E3B] flex items-center mb-4">
                    <Send className="mr-2" size={18}/> Content veröffentlichen
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titel
                        </label>
                        <input
                            type="text"
                            value={publishData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug
                        </label>
                        <input
                            type="text"
                            value={publishData.slug}
                            onChange={(e) => handleChange('slug', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Auszug
                        </label>
                        <textarea
                            value={publishData.excerpt}
                            onChange={(e) => handleChange('excerpt', e.target.value)}
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    checked={publishData.status === 'draft'}
                                    onChange={() => handleChange('status', 'draft')}
                                    className="h-4 w-4 text-[#2C2E3B] focus:ring-[#2C2E3B]"
                                />
                                <span className="ml-2 text-sm">Entwurf</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    checked={publishData.status === 'publish'}
                                    onChange={() => handleChange('status', 'publish')}
                                    className="h-4 w-4 text-[#2C2E3B] focus:ring-[#2C2E3B]"
                                />
                                <span className="ml-2 text-sm">Veröffentlichen</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6 space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-[#2C2E3B] border border-[#2C2E3B] rounded-lg hover:bg-gray-50"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={() => onPublish(publishData, content)}
                        disabled={!publishData.title.trim()}
                        className={`px-6 py-2 bg-[#2C2E3B] text-white rounded-lg hover:bg-opacity-90 ${
                            !publishData.title.trim() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {publishData.status === 'draft' ? 'Als Entwurf speichern' : 'Veröffentlichen'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2C2E3B] flex items-center">
                <FileText className="mr-2" size={20}/> Content-Generator
            </h2>

            <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 mb-4">
                    Generieren Sie SEO-optimierten Content für Ihre Website mit Hilfe von KI.
                </p>

                {/* Content-Generierung Formular */}
                {!generatedContent && (
                    <div>
                        {/* Modus-Auswahl */}
                        <div className="mb-6">
                            <div className="flex space-x-4">
                                <button
                                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${mode === 'create' ? 'bg-[#2C2E3B] text-white' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setMode('create')}
                                >
                                    <Sparkles size={18} className="mr-2" />
                                    Neuen Content erstellen
                                </button>
                                <button
                                    className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center ${mode === 'improve' ? 'bg-[#2C2E3B] text-white' : 'bg-gray-100 text-gray-700'}`}
                                    onClick={() => setMode('improve')}
                                >
                                    <Edit3 size={18} className="mr-2" />
                                    Bestehenden Content verbessern
                                </button>
                            </div>
                        </div>

                        {/* URL-Import für Content-Verbesserung */}
                        {mode === 'improve' && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                                    <Link2 size={18} className="mr-2"/> Content von URL importieren
                                </h3>

                                <div className="flex mb-4">
                                    <div className="relative flex-grow">
                                        <input
                                            type="text"
                                            value={existingContentUrl}
                                            onChange={(e) => setExistingContentUrl(e.target.value)}
                                            onKeyDown={handleImportKeyDown}
                                            placeholder="https://example.com/page-to-improve"
                                            className="w-full p-3 pr-10 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                            disabled={isImporting}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                            <Link2 size={18}/>
                                        </div>
                                    </div>
                                    <button
                                        onClick={importContentFromUrl}
                                        disabled={isImporting || !existingContentUrl.trim()}
                                        className={`px-6 py-3 bg-[#2C2E3B] text-white rounded-r-lg hover:bg-opacity-90 flex items-center ${(isImporting || !existingContentUrl.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isImporting ? (
                                            <>Importiere<span className="ml-2 animate-pulse">...</span></>
                                        ) : (
                                            <>Importieren</>
                                        )}
                                    </button>
                                </div>

                                <p className="text-sm text-gray-600">
                                    Geben Sie die URL einer bestehenden Seite ein, deren Content Sie verbessern möchten.
                                    Der Content wird analysiert und für die Verbesserung vorbereitet.
                                </p>

                                {importedContent && (
                                    <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                                        <div className="flex justify-between mb-2">
                                            <h4 className="text-sm font-medium">Importierter Content</h4>
                                            <span className="text-xs text-gray-500">
                                                {importedContent.split(' ').length} Wörter
                                            </span>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto text-sm">
                                            {importedContent}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Haupteinstellungen */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {mode === 'create' ? 'Thema/Titel *' : 'Thema/Titel (Optional für Verbesserung)'}
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={mode === 'create'
                                    ? "z.B. Die 10 besten SEO-Strategien für kleine Unternehmen"
                                    : "Titel beibehalten oder neuen Vorschlagen"}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keywords (durch Komma getrennt)
                            </label>
                            <input
                                type="text"
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="z.B. SEO, Suchmaschinenoptimierung, Google Ranking"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Content-Typ
                                </label>
                                <select
                                    value={contentType}
                                    onChange={(e) => setContentType(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                >
                                    {contentTypes.map((type, index) => (
                                        <option key={index} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tonalität
                                </label>
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                >
                                    {toneOptions.map((option, index) => (
                                        <option key={index} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Wortanzahl
                                </label>
                                <input
                                    type="number"
                                    value={wordCount}
                                    onChange={(e) => setWordCount(Math.max(100, Math.min(2000, parseInt(e.target.value) || 500)))}
                                    min="100"
                                    max="2000"
                                    step="100"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                />
                                <span
                                    className="text-xs text-gray-500">{formatReadingTime(wordCount)}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Zielgruppe
                                </label>
                                <select
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                >
                                    {audienceOptions.map((option, index) => (
                                        <option key={index} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Erweiterte Optionen Toggle */}
                        <div className="mb-4">
                            <button
                                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                className="flex items-center text-[#2C2E3B] hover:underline focus:outline-none"
                            >
                                <Sliders size={16} className="mr-2"/>
                                {showAdvancedOptions ? 'Erweiterte Optionen ausblenden' : 'Erweiterte Optionen einblenden'}
                            </button>
                        </div>

                        {/* Erweiterte Optionen */}
                        {showAdvancedOptions && (
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {mode === 'create' ? 'Gliederung (optional)' : 'Bearbeiten Sie den Content (optional)'}
                                    </label>
                                    <textarea
                                        value={outline}
                                        onChange={(e) => setOutline(e.target.value)}
                                        placeholder={mode === 'create' ?
                                            "1. Einleitung\n2. Hauptteil\n   2.1 Unterpunkt\n3. Fazit" :
                                            "Sie können den importierten Content hier direkt bearbeiten oder Anpassungen vornehmen."
                                        }
                                        rows="8"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                    ></textarea>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {mode === 'create' ?
                                            "Geben Sie eine Gliederung vor, um die Struktur des Inhalts zu steuern." :
                                            "Bearbeiten Sie den importierten Content nach Ihren Wünschen. Die KI wird auf Basis Ihrer Änderungen optimieren."
                                        }
                                    </p>
                                </div>

                                <div className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        id="includeFAQ"
                                        checked={includeFAQ}
                                        onChange={() => setIncludeFAQ(!includeFAQ)}
                                        className="w-4 h-4 text-[#2C2E3B] border-gray-300 rounded focus:ring-[#2C2E3B]"
                                    />
                                    <label htmlFor="includeFAQ"
                                           className="ml-2 text-sm text-gray-700">
                                        FAQ-Abschnitt hinzufügen
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Fehlermeldung */}
                        {error && (
                            <div className="mb-4 text-red-500 text-sm flex items-center">
                                <AlertCircle size={16} className="mr-1"/> {error}
                            </div>
                        )}

                        {/* API Key Hinweis */}
                        {!apiKey && (
                            <div className="mb-4 text-yellow-500 text-sm flex items-center">
                                <AlertCircle size={16} className="mr-1"/> Bitte geben Sie einen
                                API-Key ein, um den Content-Generator zu nutzen.
                            </div>
                        )}

                        {/* Generierungs-Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={generateContent}
                                disabled={isGenerating || (mode === 'create' && !topic.trim()) || !apiKey || (mode === 'improve' && !importedContent && !outline.trim())}
                                className={`px-6 py-3 bg-[#2C2E3B] text-white rounded-lg hover:bg-opacity-90 flex items-center ${(isGenerating || (mode === 'create' && !topic.trim()) || !apiKey || (mode === 'improve' && !importedContent && !outline.trim())) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isGenerating ? (
                                    <>Content {mode === 'create' ? 'generieren' : 'verbessern'}<span
                                        className="ml-2 animate-pulse">...</span></>
                                ) : (
                                    <>Content {mode === 'create' ? 'generieren' : 'verbessern'} <Sparkles size={18} className="ml-2"/></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Generierter Content */}
                {generatedContent && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[#2C2E3B] flex items-center">
                                <Sparkles className="mr-2" size={18}/> {generatedContent.improvement ? 'Verbesserter Content' : 'Generierter Content'}
                            </h3>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 text-[#2C2E3B] hover:bg-gray-100 rounded-lg flex items-center"
                                    title="In die Zwischenablage kopieren"
                                >
                                    {copySuccess ? <CheckSquare size={18}/> : <Copy size={18}/>}
                                </button>

                                <button
                                    onClick={downloadContent}
                                    className="p-2 text-[#2C2E3B] hover:bg-gray-100 rounded-lg flex items-center"
                                    title="Als Markdown herunterladen"
                                >
                                    <Download size={18}/>
                                </button>

                                <button
                                    onClick={() => setGeneratedContent(null)}
                                    className="p-2 text-[#2C2E3B] hover:bg-gray-100 rounded-lg flex items-center"
                                    title="Neu generieren"
                                >
                                    <Edit3 size={18}/>
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Thema:</span> {generatedContent.topic}
                            </div>
                            <div className="text-sm text-gray-600 mb-2 flex">
                                <span className="font-medium mr-1">Keywords:</span>
                                <div className="flex flex-wrap gap-1">
                                    {generatedContent.keywords.map((keyword, index) => (
                                        <span key={index}
                                              className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Typ:</span> {generatedContent.contentType}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Wortanzahl:</span> ~{generatedContent.wordCount} ({formatReadingTime(generatedContent.wordCount)})
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto whitespace-pre-wrap markdown">
                            {generatedContent.content}
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setGeneratedContent(null)}
                                className="px-6 py-3 bg-[#2C2E3B] text-white rounded-lg hover:bg-opacity-90 flex items-center"
                            >
                                {generatedContent.improvement ? 'Content erneut verbessern' : 'Neuen Content generieren'} <Sparkles size={18} className="ml-2"/>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Live Vorschau für komplexere Implementierungen */}
            {generatedContent && (
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <h3 className="text-lg font-semibold text-[#2C2E3B] flex items-center mb-4">
                        <List className="mr-2" size={18}/> Weiterführende Aktionen
                    </h3>

                    {/* Erfolgs-Nachricht */}
                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
                            <CheckCircle size={18} className="mr-2" />
                            {successMessage}
                        </div>
                    )}

                    {!activeAction ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                onClick={() => setActiveAction('edit')}
                                className="p-4 border border-gray-200 rounded-lg hover:border-[#2C2E3B] cursor-pointer transition-all"
                            >
                                <div className="font-medium text-[#2C2E3B] mb-2 flex items-center">
                                    <Edit3 size={16} className="mr-2"/> Content bearbeiten
                                </div>
                                <p className="text-sm text-gray-600">
                                    Bearbeiten Sie den {generatedContent.improvement ? 'verbesserten' : 'generierten'} Content mit einem visuellen Editor
                                </p>
                            </div>

                            <div
                                onClick={() => setActiveAction('feedback')}
                                className="p-4 border border-gray-200 rounded-lg hover:border-[#2C2E3B] cursor-pointer transition-all"
                            >
                                <div className="font-medium text-[#2C2E3B] mb-2 flex items-center">
                                    <MessageSquare size={16} className="mr-2"/> Feedback geben
                                </div>
                                <p className="text-sm text-gray-600">
                                    Lassen Sie die KI den Content basierend auf Ihrem Feedback verbessern
                                </p>
                            </div>

                            <div
                                onClick={() => setActiveAction('publish')}
                                className="p-4 border border-gray-200 rounded-lg hover:border-[#2C2E3B] cursor-pointer transition-all"
                            >
                                <div className="font-medium text-[#2C2E3B] mb-2 flex items-center">
                                    <Send size={16} className="mr-2"/> Direkt publizieren
                                </div>
                                <p className="text-sm text-gray-600">
                                    Publizieren Sie den Content direkt auf Ihrer Website oder als Entwurf
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Aktive Aktion anzeigen
                        <>
                            {activeAction === 'edit' && (
                                <ContentEditor
                                    content={generatedContent.content}
                                    onSave={saveEditedContent}
                                    onCancel={() => setActiveAction(null)}
                                />
                            )}

                            {activeAction === 'feedback' && (
                                <FeedbackForm
                                    content={generatedContent.content}
                                    onSubmit={processFeedback}
                                    onCancel={() => setActiveAction(null)}
                                />
                            )}

                            {activeAction === 'publish' && (
                                <PublishForm
                                    content={generatedContent.content}
                                    title={generatedContent.topic}
                                    onPublish={publishContent}
                                    onCancel={() => setActiveAction(null)}
                                />
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContentGenerator;