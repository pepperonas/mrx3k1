import React, {useEffect, useState} from 'react';
import axios from 'axios';
import WeatherCard from './components/WeatherCard';
import SearchBar from './components/SearchBar';
import Forecast from './components/Forecast';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [location, setLocation] = useState('Berlin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        <div className="container mx-auto px-4 py-8 max-w-5xl bg-white min-h-screen">
            <h1 className="text-4xl font-bold text-center text-blue-500 mb-8 tracking-tight">
                Wetter App
            </h1>

            <SearchBar onSearch={fetchWeather}/>

            {error && (
                <div
                    className="bg-gray-100 border border-red-300 text-red-600 px-4 py-3 rounded-lg shadow-sm relative mt-4 mb-4">
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
                            <h2 className="text-2xl font-semibold text-blue-500  mb-4">
                                5-Tage-Vorhersage für {location}
                            </h2>
                            <Forecast forecast={forecast}/>
                        </div>
                    )}
                </>
            )}

            <div className="mt-8 text-center">
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300"
                    onClick={() => fetchWeather(location)}
                >
                    JETZT AKTUALISIEREN!
                </button>
            </div>
        </div>
    );
}

export default App;