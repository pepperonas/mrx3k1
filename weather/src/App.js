import React, {useEffect, useState, useContext} from 'react';
import axios from 'axios';
import WeatherCard from './components/WeatherCard';
import SearchBar from './components/SearchBar';
import Forecast from './components/Forecast';
import LoadingSpinner from './components/LoadingSpinner';
import ThemeSwitch from './components/ThemeSwitch';
import { ThemeContext } from './context/ThemeContext';

function App() {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [location, setLocation] = useState('Berlin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { darkMode } = useContext(ThemeContext);

    const API_KEY = '21027f5e389230401529c52f24f6887e'; // Hier muss ein gültiger API-Key eingetragen werden
    const API_URL = 'https://api.openweathermap.org/data/2.5';

    useEffect(() => {
        fetchWeather(location);
    }, []);

    const fetchWeather = async (city) => {
        setLoading(true);
        setError('');
        try {
            // Aktuelles Wetter abrufen
            const weatherResponse = await axios.get(
                `${API_URL}/weather?q=${city}&units=metric&lang=de&appid=${API_KEY}`
            );

            // 5-Tage-Vorhersage abrufen
            const forecastResponse = await axios.get(
                `${API_URL}/forecast?q=${city}&units=metric&lang=de&appid=${API_KEY}`
            );

            setWeather(weatherResponse.data);

            // Gruppiere Vorhersagedaten nach Tagen
            const dailyData = forecastResponse.data.list.reduce((acc, item) => {
                const date = new Date(item.dt * 1000).toDateString();
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(item);
                return acc;
            }, {});

            setForecast(Object.values(dailyData).slice(0, 5));
            setLocation(city);
        } catch (err) {
            setError('Stadt nicht gefunden oder API-Fehler. Bitte versuche es erneut.');
            console.error('Fehler beim Abrufen des Wetters:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-primary text-white' : 'bg-white text-gray-800'}`}>
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className={`text-4xl font-bold tracking-tight ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                        Wetter App
                    </h1>
                    <ThemeSwitch />
                </div>

                <SearchBar onSearch={fetchWeather}/>

                {error && (
                    <div
                        className={`border px-4 py-3 rounded-lg shadow-sm relative mt-4 mb-4 ${darkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-gray-100 border-red-300 text-red-600'}`}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <LoadingSpinner/>
                ) : (
                    <>
                        {weather && <WeatherCard weather={weather}/>}

                        {forecast && (
                            <div className="mt-8">
                                <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                                    5-Tage-Vorhersage für {location}
                                </h2>
                                <Forecast forecast={forecast}/>
                            </div>
                        )}
                    </>
                )}

                <div className="mt-8 text-center">
                    <button
                        className={`font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        onClick={() => fetchWeather(location)}
                    >
                        JETZT AKTUALISIEREN!
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;