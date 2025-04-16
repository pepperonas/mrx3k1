// src/DashboardView.js - Dashboard für historische SEO-Daten und Vergleiche

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
    BarChart2,
    TrendingUp,
    Calendar,
    Activity,
    Link2,
    Globe,
    Clock,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';

// Mock-Daten für die Demonstrationszwecke
const generateMockHistory = (url) => {
    const domain = url ? new URL(url).hostname : 'example.com';
    const today = new Date();
    const data = [];

    // Letzten 6 Monate generieren
    for (let i = 0; i < 6; i++) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);

        // Start mit niedrigerem Score und verbessern über Zeit
        const baseScore = 60 + i * 5 + Math.floor(Math.random() * 10 - 5);

        data.unshift({
            date: date.toISOString().slice(0, 10),
            overallScore: Math.min(baseScore, 100),
            metaScore: Math.min(baseScore + Math.floor(Math.random() * 15), 100),
            contentScore: Math.min(baseScore - 5 + Math.floor(Math.random() * 20), 100),
            speedScore: Math.min(baseScore - 10 + Math.floor(Math.random() * 25), 100),
            mobileScore: Math.min(baseScore + 5 + Math.floor(Math.random() * 15), 100)
        });
    }

    return data;
};

// Mock-Daten für Issues
const generateMockIssues = () => {
    return [
        { id: 1, type: 'error', message: 'Meta-Description fehlt', url: '/kontakt' },
        { id: 2, type: 'warning', message: 'Bilder ohne Alt-Text', count: 8, url: '/produkte' },
        { id: 3, type: 'error', message: 'H1-Überschrift fehlt', url: '/blog/2022/10' },
        { id: 4, type: 'warning', message: 'Langsame Ladezeit (> 4s)', url: '/galerie' },
        { id: 5, type: 'info', message: 'Inhalte könnten mehr Keywords enthalten', url: '/' }
    ];
};

const DashboardView = ({ websiteUrl }) => {
    const [historicalData, setHistoricalData] = useState([]);
    const [issues, setIssues] = useState([]);
    const [domains, setDomains] = useState([
        { url: 'example.com', lastCheck: '2025-04-10', score: 78 },
        { url: 'meinblog.de', lastCheck: '2025-04-15', score: 85 }
    ]);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Simuliere das Laden von Daten
    useEffect(() => {
        if (websiteUrl) {
            setIsLoading(true);

            // Simuliere eine API-Anfrage
            setTimeout(() => {
                const mockHistory = generateMockHistory(websiteUrl);
                const mockIssues = generateMockIssues();

                setHistoricalData(mockHistory);
                setIssues(mockIssues);
                setIsLoading(false);

                // Aktuellen Domain als ausgewählt setzen
                try {
                    const domain = new URL(websiteUrl).hostname;
                    setSelectedDomain(domain);

                    // Prüfen, ob die Domain bereits in der Liste ist
                    if (!domains.some(d => d.url === domain)) {
                        setDomains([
                            ...domains,
                            {
                                url: domain,
                                lastCheck: new Date().toISOString().slice(0, 10),
                                score: mockHistory[mockHistory.length - 1]?.overallScore || 75
                            }
                        ]);
                    }
                } catch (error) {
                    console.error("Ungültige URL:", error);
                }
            }, 1500);
        }
    }, [websiteUrl]);

    // Formatiere das Datum für die Anzeige
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Bestimmt die Farbe basierend auf dem Score
    const getScoreColor = (score) => {
        if (score >= 80) return '#4CAF50'; // Grün
        if (score >= 60) return '#FF9800'; // Orange
        return '#F44336'; // Rot
    };

    // Rendere die entsprechende Farbe und Icon für Issues
    const getIssueTypeInfo = (type) => {
        switch (type) {
            case 'error':
                return { color: '#F44336', icon: <AlertTriangle size={16} className="mr-2" /> };
            case 'warning':
                return { color: '#FF9800', icon: <AlertTriangle size={16} className="mr-2" /> };
            case 'info':
                return { color: '#2196F3', icon: <CheckCircle size={16} className="mr-2" /> };
            default:
                return { color: '#757575', icon: <AlertTriangle size={16} className="mr-2" /> };
        }
    };

    // Berechnet die Veränderung für ein bestimmtes Feld
    const calculateChange = (field) => {
        if (historicalData.length < 2) return { value: 0, isPositive: true };

        const current = historicalData[historicalData.length - 1][field];
        const previous = historicalData[historicalData.length - 2][field];
        const diff = current - previous;

        return {
            value: Math.abs(diff),
            isPositive: diff >= 0
        };
    };

    // Daten für Pie-Chart vorbereiten
    const prepareIssueTypeData = () => {
        const counts = { error: 0, warning: 0, info: 0 };
        issues.forEach(issue => counts[issue.type]++);

        return [
            { name: 'Kritisch', value: counts.error, color: '#F44336' },
            { name: 'Warnung', value: counts.warning, color: '#FF9800' },
            { name: 'Info', value: counts.info, color: '#2196F3' }
        ];
    };

    // Daten zum Rendern vorbereiten
    const issueTypeData = prepareIssueTypeData();
    const overallChange = calculateChange('overallScore');

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-[#2C2E3B] flex items-center">
                <BarChart2 className="mr-2" size={20}/> SEO Dashboard
            </h2>

            {isLoading ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2C2E3B] mb-4"></div>
                    <p className="text-gray-600">Dashboard wird geladen...</p>
                </div>
            ) : (
                <div>
                    {/* Domain-Auswahl */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                            <Globe size={18} className="mr-2"/> Überwachte Websites
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {domains.map((domain, index) => (
                                <div
                                    key={index}
                                    onClick={() => setSelectedDomain(domain.url)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${domain.url === selectedDomain ? 'bg-[#2C2E3B] text-white border-[#2C2E3B]' : 'bg-white text-gray-800 border-gray-200 hover:border-[#2C2E3B]'}`}
                                >
                                    <div className="font-medium">{domain.url}</div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span>Score: {domain.score}/100</span>
                                        <span>Aktualisiert: {domain.lastCheck}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="p-3 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer hover:border-[#2C2E3B] hover:text-[#2C2E3B] hover:bg-gray-50">
                                <span>+ Neue Website hinzufügen</span>
                            </div>
                        </div>
                    </div>

                    {/* Score-Karten */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Gesamt-Score */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Gesamt-Score</h3>
                                    <div className="text-2xl font-bold mt-1">
                                        {historicalData[historicalData.length - 1]?.overallScore || 0}/100
                                    </div>
                                </div>
                                <div className={`flex items-center text-sm ${overallChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {overallChange.isPositive ? (
                                        <TrendingUp size={14} className="mr-1" />
                                    ) : (
                                        <TrendingUp size={14} className="mr-1 transform rotate-180" />
                                    )}
                                    {overallChange.value}
                                </div>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                                <div
                                    className="h-2 rounded-full"
                                    style={{
                                        width: `${historicalData[historicalData.length - 1]?.overallScore || 0}%`,
                                        backgroundColor: getScoreColor(historicalData[historicalData.length - 1]?.overallScore || 0)
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Meta-Score */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Meta-Tags</h3>
                                    <div className="text-2xl font-bold mt-1">
                                        {historicalData[historicalData.length - 1]?.metaScore || 0}/100
                                    </div>
                                </div>
                                <div className={`flex items-center text-sm ${calculateChange('metaScore').isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {calculateChange('metaScore').isPositive ? (
                                        <TrendingUp size={14} className="mr-1" />
                                    ) : (
                                        <TrendingUp size={14} className="mr-1 transform rotate-180" />
                                    )}
                                    {calculateChange('metaScore').value}
                                </div>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                                <div
                                    className="h-2 rounded-full"
                                    style={{
                                        width: `${historicalData[historicalData.length - 1]?.metaScore || 0}%`,
                                        backgroundColor: getScoreColor(historicalData[historicalData.length - 1]?.metaScore || 0)
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Content-Score */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Inhalt</h3>
                                    <div className="text-2xl font-bold mt-1">
                                        {historicalData[historicalData.length - 1]?.contentScore || 0}/100
                                    </div>
                                </div>
                                <div className={`flex items-center text-sm ${calculateChange('contentScore').isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {calculateChange('contentScore').isPositive ? (
                                        <TrendingUp size={14} className="mr-1" />
                                    ) : (
                                        <TrendingUp size={14} className="mr-1 transform rotate-180" />
                                    )}
                                    {calculateChange('contentScore').value}
                                </div>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                                <div
                                    className="h-2 rounded-full"
                                    style={{
                                        width: `${historicalData[historicalData.length - 1]?.contentScore || 0}%`,
                                        backgroundColor: getScoreColor(historicalData[historicalData.length - 1]?.contentScore || 0)
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Speed-Score */}
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Ladezeit</h3>
                                    <div className="text-2xl font-bold mt-1">
                                        {historicalData[historicalData.length - 1]?.speedScore || 0}/100
                                    </div>
                                </div>
                                <div className={`flex items-center text-sm ${calculateChange('speedScore').isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                    {calculateChange('speedScore').isPositive ? (
                                        <TrendingUp size={14} className="mr-1" />
                                    ) : (
                                        <TrendingUp size={14} className="mr-1 transform rotate-180" />
                                    )}
                                    {calculateChange('speedScore').value}
                                </div>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                                <div
                                    className="h-2 rounded-full"
                                    style={{
                                        width: `${historicalData[historicalData.length - 1]?.speedScore || 0}%`,
                                        backgroundColor: getScoreColor(historicalData[historicalData.length - 1]?.speedScore || 0)
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Haupt-Dashboard-Bereich */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Linke Spalte - Verlaufsgrafik */}
                        <div className="md:col-span-2">
                            <div className="bg-white rounded-lg shadow-md p-4">
                                <h3 className="text-md font-semibold text-[#2C2E3B] mb-4 flex items-center">
                                    <Activity size={18} className="mr-2"/> SEO-Score Verlauf
                                </h3>

                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={historicalData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(dateStr) => {
                                                    const date = new Date(dateStr);
                                                    return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
                                                }}
                                            />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip
                                                formatter={(value) => [`${value}/100`, ""]}
                                                labelFormatter={(dateStr) => formatDate(dateStr)}
                                            />
                                            <Legend />
                                            <Line type="monotone" dataKey="overallScore" name="Gesamt" stroke="#2C2E3B" activeDot={{ r: 8 }} />
                                            <Line type="monotone" dataKey="metaScore" name="Meta-Tags" stroke="#8884d8" />
                                            <Line type="monotone" dataKey="contentScore" name="Inhalt" stroke="#82ca9d" />
                                            <Line type="monotone" dataKey="speedScore" name="Ladezeit" stroke="#ff7300" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Rechte Spalte - Issue-Typen und Liste */}
                        <div className="md:col-span-1">
                            {/* Issue-Typen Grafik */}
                            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                                <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                                    <AlertTriangle size={18} className="mr-2"/> Problemverteilung
                                </h3>

                                <div className="h-60">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={issueTypeData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {issueTypeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`${value}`, "Anzahl"]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Issues Liste */}
                            <div className="bg-white rounded-lg shadow-md p-4">
                                <h3 className="text-md font-semibold text-[#2C2E3B] mb-3 flex items-center">
                                    <Link2 size={18} className="mr-2"/> SEO Probleme
                                </h3>

                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {issues.map(issue => {
                                        const { color, icon } = getIssueTypeInfo(issue.type);
                                        return (
                                            <div
                                                key={issue.id}
                                                className="p-2 border-l-4 bg-gray-50 flex items-center"
                                                style={{ borderLeftColor: color }}
                                            >
                                                {icon}
                                                <div className="text-sm">
                                                    <span className="font-medium">{issue.message}</span>
                                                    {issue.count && <span className="ml-1">({issue.count})</span>}
                                                    <span className="block text-xs text-gray-500">URL: {issue.url}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-3 text-center">
                                    <button className="text-[#2C2E3B] text-sm font-medium hover:underline">
                                        Alle Probleme anzeigen
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;