// src/App.js - Hauptkomponente für seolytix

import React, {useState} from 'react';
import {AlertCircle, Clock, FileText, Globe, Search, Smartphone} from 'lucide-react';

function App() {
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    // Analysiert eine Website über die Backend-API
    const analyzeWebsite = async () => {
        if (!url) {
            setError('Bitte geben Sie eine URL ein');
            return;
        }

        // URL-Format validieren
        try {
            new URL(url);
        } catch (e) {
            setError('Ungültige URL. Bitte geben Sie eine vollständige URL ein (z.B. https://example.com)');
            return;
        }

        setError('');
        setIsAnalyzing(true);

        try {
            // Backend-API aufrufen
            const response = await fetch('/seolytix/api/seo/analyze', {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({url}),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Fehler bei der Analyse');
            }

            setResults(data.data);
            setIsAnalyzing(false);
        } catch (error) {
            console.error('Fehler bei der Analyse:', error);
            const errorMessage = error.message === 'Failed to fetch'
                ? 'Verbindung zum Server fehlgeschlagen. Bitte prüfe, ob der Backend-Server läuft.'
                : `Fehler bei der Analyse: ${error.message}`;
            setError(errorMessage);
            setIsAnalyzing(false);
        }
    };

    // Event-Handler für Enter-Taste
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isAnalyzing) {
            e.preventDefault();
            analyzeWebsite();
        }
    };

    // Bestimmt die Farbe basierend auf dem Score
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-[#2C2E3B] text-white py-4 px-6 shadow-md">
                <div className="container mx-auto">
                    <h1 className="text-2xl font-bold flex items-center">
                        <Globe className="mr-2"/> SEOlytix
                    </h1>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-[#2C2E3B]">Website SEO
                            analysieren</h2>
                        <div className="flex">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="https://example.com"
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                />
                                <div
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <Globe size={18}/>
                                </div>
                            </div>
                            <button
                                onClick={analyzeWebsite}
                                disabled={isAnalyzing}
                                className={`px-6 py-3 bg-[#2C2E3B] text-white rounded-r-lg hover:bg-opacity-90 flex items-center ${isAnalyzing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isAnalyzing ? (
                                    <>Analysiere<span className="ml-2 animate-pulse">...</span></>
                                ) : (
                                    <>Analysieren <Search size={18} className="ml-2"/></>
                                )}
                            </button>
                        </div>
                        {error && (
                            <div className="mt-2 text-red-500 text-sm flex items-center">
                                <AlertCircle size={16} className="mr-1"/> {error}
                            </div>
                        )}
                    </div>

                    {isAnalyzing && (
                        <div className="text-center py-12">
                            <div
                                className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2C2E3B] mb-4"></div>
                            <p className="text-gray-600">Analysiere Website SEO...</p>
                        </div>
                    )}

                    {results && !isAnalyzing && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-[#2C2E3B]">SEO
                                    Analyse: {results.url}</h3>
                                <div className="flex items-center">
                                    <span
                                        className="text-sm text-gray-600 mr-2">Gesamt-Score:</span>
                                    <span
                                        className={`text-2xl font-bold ${getScoreColor(results.score)}`}>
                    {results.score}/100
                  </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Meta Title */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <FileText className="text-[#2C2E3B] mr-3 mt-1" size={20}/>
                                        <div>
                                            <div
                                                className="flex items-center justify-between w-full">
                                                <h4 className="font-medium text-[#2C2E3B]">Meta
                                                    Title</h4>
                                                <span
                                                    className={`font-medium ${getScoreColor(results.metaTitle.score)}`}>
                          {results.metaTitle.score}/100
                        </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{results.metaTitle.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">Länge: {results.metaTitle.length} Zeichen</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Meta Description */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <FileText className="text-[#2C2E3B] mr-3 mt-1" size={20}/>
                                        <div>
                                            <div
                                                className="flex items-center justify-between w-full">
                                                <h4 className="font-medium text-[#2C2E3B]">Meta
                                                    Description</h4>
                                                <span
                                                    className={`font-medium ${getScoreColor(results.metaDescription.score)}`}>
                          {results.metaDescription.score}/100
                        </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{results.metaDescription.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">Länge: {results.metaDescription.length} Zeichen</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Headings */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <FileText className="text-[#2C2E3B] mr-3 mt-1" size={20}/>
                                        <div>
                                            <div
                                                className="flex items-center justify-between w-full">
                                                <h4 className="font-medium text-[#2C2E3B]">Überschriften</h4>
                                                <span
                                                    className={`font-medium ${getScoreColor(results.headings.score)}`}>
                          {results.headings.score}/100
                        </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{results.headings.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">H1: {results.headings.h1Count}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Images */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <FileText className="text-[#2C2E3B] mr-3 mt-1" size={20}/>
                                        <div>
                                            <div
                                                className="flex items-center justify-between w-full">
                                                <h4 className="font-medium text-[#2C2E3B]">Bilder</h4>
                                                <span
                                                    className={`font-medium ${getScoreColor(results.images.score)}`}>
                          {results.images.score}/100
                        </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{results.images.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">Mit
                                                Alt-Text: {results.images.withAlt}/{results.images.withAlt + results.images.withoutAlt}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Analysis */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <FileText className="text-[#2C2E3B] mr-3 mt-1" size={20}/>
                                        <div>
                                            <div
                                                className="flex items-center justify-between w-full">
                                                <h4 className="font-medium text-[#2C2E3B]">Inhalt</h4>
                                                <span
                                                    className={`font-medium ${getScoreColor(results.contentAnalysis.score)}`}>
                          {results.contentAnalysis.score}/100
                        </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{results.contentAnalysis.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">Wortanzahl: {results.contentAnalysis.wordCount}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Load Speed */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <Clock className="text-[#2C2E3B] mr-3 mt-1" size={20}/>
                                        <div>
                                            <div
                                                className="flex items-center justify-between w-full">
                                                <h4 className="font-medium text-[#2C2E3B]">Ladezeit</h4>
                                                <span
                                                    className={`font-medium ${getScoreColor(results.loadSpeed.score)}`}>
                          {results.loadSpeed.score}/100
                        </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{results.loadSpeed.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">Zeit: {results.loadSpeed.time}s</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Optimization */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <Smartphone className="text-[#2C2E3B] mr-3 mt-1" size={20}/>
                                        <div>
                                            <div
                                                className="flex items-center justify-between w-full">
                                                <h4 className="font-medium text-[#2C2E3B]">Mobile
                                                    Optimierung</h4>
                                                <span
                                                    className={`font-medium ${getScoreColor(results.mobileOptimization.score)}`}>
                          {results.mobileOptimization.score}/100
                        </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{results.mobileOptimization.message}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="bg-[#2C2E3B] text-white py-3 px-6">
                <div className="container mx-auto text-center text-sm">
                    Made with ❤️ by Martin Pfeffer
                </div>
            </footer>
        </div>
    );
}

export default App;