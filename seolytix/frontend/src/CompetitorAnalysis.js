// src/CompetitorAnalysis.js - Komponente für die Konkurrenzanalyse

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    Users,
    TrendingUp,
    TrendingDown,
    Award,
    AlertTriangle,
    Clock,
    Search,
    Plus,
    X,
    BarChart2,
    FileText,
    Layers,
    Smartphone,
    Tag
} from 'lucide-react';

const CompetitorAnalysis = ({ apiUrl, mainSiteData }) => {
    const [competitorUrls, setCompetitorUrls] = useState(['']);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Fügt ein neues Eingabefeld für Konkurrenz-URL hinzu
    const addCompetitorField = () => {
        if (competitorUrls.length < 5) { // Maximal 5 Konkurrenten zulassen
            setCompetitorUrls([...competitorUrls, '']);
        }
    };

    // Entfernt ein Eingabefeld für Konkurrenz-URL
    const removeCompetitorField = (index) => {
        const updatedUrls = [...competitorUrls];
        updatedUrls.splice(index, 1);
        setCompetitorUrls(updatedUrls);
    };

    // Aktualisiert den Wert eines Konkurrenz-URL-Felds
    const handleCompetitorUrlChange = (index, value) => {
        const updatedUrls = [...competitorUrls];
        updatedUrls[index] = value;
        setCompetitorUrls(updatedUrls);
    };

    // Formatiert URLs (fügt http:// hinzu, falls nötig)
    const formatUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    };

    // Startet die Konkurrenzanalyse
    const startCompetitorAnalysis = async () => {
        if (!mainSiteData) {
            setError('Bitte analysieren Sie zuerst Ihre Website');
            return;
        }

        // Überprüfen, ob mindestens eine Konkurrenz-URL eingegeben wurde
        const validCompetitorUrls = competitorUrls
            .map(url => url.trim())
            .filter(url => url.length > 0)
            .map(url => formatUrl(url));

        if (validCompetitorUrls.length === 0) {
            setError('Bitte geben Sie mindestens eine Konkurrenz-URL ein');
            return;
        }

        setError('');
        setIsAnalyzing(true);
        setResults(null);

        try {
            const response = await fetch(`${apiUrl}/api/competitors/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mainUrl: mainSiteData.url,
                    competitorUrls: validCompetitorUrls
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Fehler bei der Konkurrenzanalyse');
            }

            setResults(data.data);
        } catch (error) {
            console.error('Fehler bei der Konkurrenzanalyse:', error);
            setError(`Fehler bei der Konkurrenzanalyse: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Grafik-Farben basierend auf dem Status
    const getStatusColor = (status) => {
        switch (status) {
            case 'better': return '#4CAF50';  // Grün
            case 'worse': return '#F44336';   // Rot
            default: return '#FFC107';        // Gelb (neutral)
        }
    };

    // Farbe für Score-Vergleiche
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Formatiert eine Domain aus der URL
    const formatDomain = (url) => {
        try {
            const domain = new URL(url).hostname;
            return domain.startsWith('www.') ? domain.substring(4) : domain;
        } catch (e) {
            return url;
        }
    };

    // Vergleichsdaten für Diagramm aufbereiten
    const prepareChartData = () => {
        if (!results || !results.comparison || !results.comparison.scoreComparison) {
            return [];
        }

        const { scoreComparison } = results.comparison;

        return [
            {
                name: 'Gesamt',
                Ihre_Website: scoreComparison.overall.main,
                Konkurrenz: scoreComparison.overall.competitor,
                status: scoreComparison.overall.status
            },
            {
                name: 'Meta-Title',
                Ihre_Website: scoreComparison.metaTitle.main,
                Konkurrenz: scoreComparison.metaTitle.competitor,
                status: scoreComparison.metaTitle.status
            },
            {
                name: 'Meta-Description',
                Ihre_Website: scoreComparison.metaDescription.main,
                Konkurrenz: scoreComparison.metaDescription.competitor,
                status: scoreComparison.metaDescription.status
            },
            {
                name: 'Überschriften',
                Ihre_Website: scoreComparison.headings.main,
                Konkurrenz: scoreComparison.headings.competitor,
                status: scoreComparison.headings.status
            },
            {
                name: 'Inhalt',
                Ihre_Website: scoreComparison.content.main,
                Konkurrenz: scoreComparison.content.competitor,
                status: scoreComparison.content.status
            },
            {
                name: 'Ladezeit',
                Ihre_Website: scoreComparison.loadTime.main,
                Konkurrenz: scoreComparison.loadTime.competitor,
                status: scoreComparison.loadTime.status
            }
        ];
    };

    // Rendert die Übersichts-Tabelle
    const renderOverviewTab = () => {
        if (!results || !results.comparison) return null;

        const { scoreComparison, strengths, weaknesses } = results.comparison;
        const chartData = prepareChartData();

        return (
            <div>
                {/* Score-Vergleich */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-semibold text-[#2C2E3B] mb-4 flex items-center">
                        <BarChart2 size={18} className="mr-2"/> SEO-Score Vergleich
                    </h3>

                    <div className="flex justify-between items-center mb-3">
                        <div className="text-center">
                            <span className="block text-gray-600 text-sm">Ihre Website</span>
                            <span className={`block text-2xl font-bold ${getScoreColor(scoreComparison.overall.main)}`}>
                {scoreComparison.overall.main}/100
              </span>
                        </div>

                        <div className="flex items-center">
                            {scoreComparison.overall.status === 'better' ? (
                                <TrendingUp className="text-green-500 mx-2" size={24} />
                            ) : scoreComparison.overall.status === 'worse' ? (
                                <TrendingDown className="text-red-500 mx-2" size={24} />
                            ) : (
                                <div className="text-yellow-500 mx-2">=</div>
                            )}
                            <span className="text-sm text-gray-500">
                {Math.abs(scoreComparison.overall.difference)}%
              </span>
                        </div>

                        <div className="text-center">
                            <span className="block text-gray-600 text-sm">Ø Konkurrenz</span>
                            <span className={`block text-2xl font-bold ${getScoreColor(scoreComparison.overall.competitor)}`}>
                {scoreComparison.overall.competitor}/100
              </span>
                        </div>
                    </div>

                    {/* Vergleichsdiagramm */}
                    <div className="h-80 my-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Ihre_Website" fill="#2C2E3B" />
                                <Bar dataKey="Konkurrenz" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stärken und Schwächen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Stärken */}
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                            <Award size={18} className="mr-2 text-green-500"/> Ihre SEO-Stärken
                        </h3>

                        {strengths.length > 0 ? (
                            <ul className="space-y-2">
                                {strengths.map((strength, index) => (
                                    <li key={index} className="flex items-start">
                                        <TrendingUp className="text-green-500 mr-2 mt-1" size={16} />
                                        <div>
                                            <span className="font-medium">{getFactorName(strength.factor)}: </span>
                                            <span>{strength.difference > 0 ? '+' : ''}{strength.difference}% besser als die Konkurrenz</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-600">Keine signifikanten Stärken identifiziert.</p>
                        )}
                    </div>

                    {/* Schwächen */}
                    <div className="p-4 bg-red-50 rounded-lg">
                        <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                            <AlertTriangle size={18} className="mr-2 text-red-500"/> Verbesserungspotenzial
                        </h3>

                        {weaknesses.length > 0 ? (
                            <ul className="space-y-2">
                                {weaknesses.map((weakness, index) => (
                                    <li key={index} className="flex items-start">
                                        <TrendingDown className="text-red-500 mr-2 mt-1" size={16} />
                                        <div>
                                            <span className="font-medium">{getFactorName(weakness.factor)}: </span>
                                            <span>{weakness.difference}% schlechter als die Konkurrenz</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-600">Keine signifikanten Schwächen identifiziert.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Rendert den Keywords-Tab
    const renderKeywordsTab = () => {
        if (!results || !results.comparison) return null;

        const { sharedKeywords, missingKeywords } = results.comparison;

        return (
            <div>
                {/* Fehlende Keywords */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                        <Tag size={18} className="mr-2"/> Wichtige Keywords der Konkurrenz
                    </h3>

                    {missingKeywords && missingKeywords.length > 0 ? (
                        <div>
                            <p className="text-sm text-gray-600 mb-3">
                                Diese Keywords werden von Ihren Konkurrenten häufig verwendet, fehlen aber auf Ihrer Website:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {missingKeywords.map((item, index) => (
                                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="font-medium text-[#2C2E3B] mb-1">{item.keyword}</div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Quelle: {formatDomain(item.source)}</span>
                                            <span className="text-gray-500">Häufigkeit: {item.frequency}x</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">Keine relevanten Keywords gefunden.</p>
                    )}
                </div>

                {/* Gemeinsame Keywords */}
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                        <Layers size={18} className="mr-2"/> Gemeinsame Keywords
                    </h3>

                    {sharedKeywords && Object.keys(sharedKeywords).length > 0 ? (
                        <div className="space-y-4">
                            {Object.entries(sharedKeywords).map(([domain, keywords], domainIndex) => (
                                <div key={domainIndex} className="bg-white p-3 rounded-lg border border-gray-200">
                                    <h4 className="font-medium text-[#2C2E3B] mb-2">{formatDomain(domain)}</h4>

                                    {keywords.length > 0 ? (
                                        <div className="space-y-2">
                                            {keywords.map((item, keywordIndex) => (
                                                <div key={keywordIndex} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium">{item.keyword}</span>
                                                    <div className="flex items-center">
                            <span className="px-2 py-1 bg-[#2C2E3B] bg-opacity-10 rounded mr-2">
                              Sie: {item.mainSiteCount}x
                            </span>
                                                        <span className="px-2 py-1 bg-[#8884d8] bg-opacity-10 rounded">
                              Konkurrenz: {item.competitorCount}x
                            </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600">Keine gemeinsamen Keywords mit dieser Website.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">Keine gemeinsamen Keywords gefunden.</p>
                    )}
                </div>
            </div>
        );
    };

    // Rendert den Konkurrenten-Tab
    const renderCompetitorsTab = () => {
        if (!results || !results.competitors) return null;

        return (
            <div className="space-y-6">
                {results.competitors.map((competitor, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                            <Users size={18} className="mr-2"/> {formatDomain(competitor.url)}
                        </h3>

                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">SEO-Score:</span>
                            <span className={`text-xl font-bold ${getScoreColor(competitor.overallScore)}`}>
                {competitor.overallScore}/100
              </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Meta Infos */}
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <FileText className="text-[#2C2E3B] mr-2 mt-1" size={16}/>
                                    <div>
                                        <div className="font-medium">Meta-Informationen</div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Title: {competitor.metaTitle.exists ? `${competitor.metaTitle.length} Zeichen` : 'Fehlt'}
                                            <br />
                                            Description: {competitor.metaDescription.exists ? `${competitor.metaDescription.length} Zeichen` : 'Fehlt'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Überschriften */}
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <Layers className="text-[#2C2E3B] mr-2 mt-1" size={16}/>
                                    <div>
                                        <div className="font-medium">Überschriften</div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            H1: {competitor.headings.h1Count},
                                            H2: {competitor.headings.h2Count},
                                            H3: {competitor.headings.h3Count}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Inhalt */}
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <FileText className="text-[#2C2E3B] mr-2 mt-1" size={16}/>
                                    <div>
                                        <div className="font-medium">Inhalt</div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Wortanzahl: {competitor.content.wordCount}
                                            <br />
                                            Lesbarkeit: {competitor.content.readabilityScore}/100
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Ladezeit */}
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <Clock className="text-[#2C2E3B] mr-2 mt-1" size={16}/>
                                    <div>
                                        <div className="font-medium">Ladezeit</div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {competitor.loadTime.toFixed(2)} Sekunden
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Keywords */}
                        {competitor.keywords && competitor.keywords.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-medium text-[#2C2E3B] mb-2">Top Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {competitor.keywords.slice(0, 10).map((keyword, keywordIndex) => (
                                        <span
                                            key={keywordIndex}
                                            className="px-2 py-1 bg-[#2C2E3B] bg-opacity-10 rounded text-sm"
                                        >
                      {keyword.word} ({keyword.count}x)
                    </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Hilfsfunktion, um Faktornamen lesbar zu machen
    const getFactorName = (factor) => {
        const factorMap = {
            'overall': 'Gesamt-Score',
            'metaTitle': 'Meta-Title',
            'metaDescription': 'Meta-Description',
            'headings': 'Überschriften',
            'content': 'Inhalt',
            'loadTime': 'Ladezeit'
        };

        return factorMap[factor] || factor;
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2C2E3B] flex items-center">
                <Users className="mr-2" size={20}/> Konkurrenzanalyse
            </h2>

            {!results && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-gray-600 mb-4">
                        Vergleichen Sie Ihre Website mit bis zu 5 Konkurrenzwebsites, um Ihre SEO-Stärken und -Schwächen zu identifizieren.
                    </p>

                    <div className="space-y-3 mb-4">
                        {competitorUrls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => handleCompetitorUrlChange(index, e.target.value)}
                                        placeholder="https://competitor.com"
                                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C2E3B] focus:border-transparent"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                        <Users size={18}/>
                                    </div>
                                </div>
                                {index > 0 && (
                                    <button
                                        onClick={() => removeCompetitorField(index)}
                                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <X size={18}/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-2">
                        {competitorUrls.length < 5 && (
                            <button
                                onClick={addCompetitorField}
                                className="flex items-center px-4 py-2 text-[#2C2E3B] border border-[#2C2E3B] rounded-lg hover:bg-gray-50"
                            >
                                <Plus size={18} className="mr-1"/> Konkurrent hinzufügen
                            </button>
                        )}

                        <button
                            onClick={startCompetitorAnalysis}
                            disabled={isAnalyzing || !mainSiteData}
                            className={`flex-grow px-6 py-2 bg-[#2C2E3B] text-white rounded-lg hover:bg-opacity-90 flex items-center justify-center ${(isAnalyzing || !mainSiteData) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isAnalyzing ? (
                                <>Analysiere<span className="ml-2 animate-pulse">...</span></>
                            ) : (
                                <>Konkurrenzanalyse starten <Search size={18} className="ml-2"/></>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 text-red-500 text-sm flex items-center">
                            <AlertTriangle size={16} className="mr-1"/> {error}
                        </div>
                    )}

                    {!mainSiteData && (
                        <div className="mt-3 text-yellow-500 text-sm flex items-center">
                            <AlertTriangle size={16} className="mr-1"/> Bitte analysieren Sie zuerst Ihre Website.
                        </div>
                    )}
                </div>
            )}

            {isAnalyzing && (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2C2E3B] mb-4"></div>
                    <p className="text-gray-600">Analysiere Konkurrenzwebsites...</p>
                </div>
            )}

            {results && !isAnalyzing && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-medium text-sm mr-2 ${activeTab === 'overview' ? 'text-[#2C2E3B] border-b-2 border-[#2C2E3B]' : 'text-gray-500 hover:text-[#2C2E3B]'}`}
                        >
                            Übersicht
                        </button>
                        <button
                            onClick={() => setActiveTab('keywords')}
                            className={`px-4 py-2 font-medium text-sm mr-2 ${activeTab === 'keywords' ? 'text-[#2C2E3B] border-b-2 border-[#2C2E3B]' : 'text-gray-500 hover:text-[#2C2E3B]'}`}
                        >
                            Keywords
                        </button>
                        <button
                            onClick={() => setActiveTab('competitors')}
                            className={`px-4 py-2 font-medium text-sm ${activeTab === 'competitors' ? 'text-[#2C2E3B] border-b-2 border-[#2C2E3B]' : 'text-gray-500 hover:text-[#2C2E3B]'}`}
                        >
                            Konkurrenten
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'keywords' && renderKeywordsTab()}
                    {activeTab === 'competitors' && renderCompetitorsTab()}

                    {/* Neue Analyse Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => {
                                setResults(null);
                                setCompetitorUrls(['']);
                            }}
                            className="px-4 py-2 text-[#2C2E3B] border border-[#2C2E3B] rounded-lg hover:bg-gray-50"
                        >
                            Neue Analyse
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitorAnalysis;