// src/ContentGenerator.js - Komponente für die Generierung von SEO-optimierten Inhalten

import React, {useState} from 'react';
import {
    AlertCircle,
    CheckSquare,
    Copy,
    Download,
    Edit3,
    FileText,
    List,
    MessageSquare,
    Send,
    Sliders,
    Sparkles
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

    // Content generieren
    const generateContent = async () => {
        if (!topic.trim()) {
            setError('Bitte geben Sie ein Thema ein');
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
                metaDescription: true
            };

            // API-Anfrage senden
            const response = await fetch(`${apiUrl}/api/content/generate`, {
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
                        {/* Haupteinstellungen */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Thema/Titel *
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="z.B. Die 10 besten SEO-Strategien für kleine Unternehmen"
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
                                <select>
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-[#2C2E3B]
                                    focus:border-transparent"
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
                                        Gliederung (optional)
                                    </label>
                                    <textarea
                                        value={outline}
                                        onChange={(e) => setOutline(e.target.value)}
                                        placeholder="1. Einleitung&#10;2. Hauptteil&#10;   2.1 Unterpunkt&#10;3. Fazit"
                                        rows="5"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                    ></textarea>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Geben Sie eine Gliederung vor, um die Struktur des Inhalts
                                        zu steuern.
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
                                disabled={isGenerating || !topic.trim() || !apiKey}
                                className={`px-6 py-3 bg-[#2C2E3B] text-white rounded-lg hover:bg-opacity-90 flex items-center ${(isGenerating || !topic.trim() || !apiKey) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isGenerating ? (
                                    <>Content generieren<span
                                        className="ml-2 animate-pulse">...</span></>
                                ) : (
                                    <>Content generieren <Sparkles size={18} className="ml-2"/></>
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
                                <Sparkles className="mr-2" size={18}/> Generierter Content
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
                                <span
                                    className="font-medium">Typ:</span> {generatedContent.contentType}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span
                                    className="font-medium">Wortanzahl:</span> ~{generatedContent.wordCount} ({formatReadingTime(generatedContent.wordCount)})
                            </div>
                        </div>

                        <div
                            className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto whitespace-pre-wrap markdown">
                            {generatedContent.content}
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setGeneratedContent(null)}
                                className="px-6 py-3 bg-[#2C2E3B] text-white rounded-lg hover:bg-opacity-90 flex items-center"
                            >
                                Neuen Content generieren <Sparkles size={18} className="ml-2"/>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            className="p-4 border border-gray-200 rounded-lg hover:border-[#2C2E3B] cursor-pointer transition-all">
                            <div className="font-medium text-[#2C2E3B] mb-2 flex items-center">
                                <Edit3 size={16} className="mr-2"/> Content bearbeiten
                            </div>
                            <p className="text-sm text-gray-600">
                                Bearbeiten Sie den generierten Content mit einem visuellen Editor
                            </p>
                        </div>

                        <div
                            className="p-4 border border-gray-200 rounded-lg hover:border-[#2C2E3B] cursor-pointer transition-all">
                            <div className="font-medium text-[#2C2E3B] mb-2 flex items-center">
                                <MessageSquare size={16} className="mr-2"/> Feedback geben
                            </div>
                            <p className="text-sm text-gray-600">
                                Lassen Sie die KI den Content basierend auf Ihrem Feedback
                                verbessern
                            </p>
                        </div>

                        <div
                            className="p-4 border border-gray-200 rounded-lg hover:border-[#2C2E3B] cursor-pointer transition-all">
                            <div className="font-medium text-[#2C2E3B] mb-2 flex items-center">
                                <Send size={16} className="mr-2"/> Direkt publizieren
                            </div>
                            <p className="text-sm text-gray-600">
                                Publizieren Sie den Content direkt auf Ihrer Website oder als
                                Entwurf
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentGenerator;
