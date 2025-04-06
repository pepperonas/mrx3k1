import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function WeatherCard({ weather }) {
  const { darkMode } = useContext(ThemeContext);
  const iconUrl = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

  return (
      <div className={`rounded-lg shadow-lg p-6 mt-6 ${darkMode ? 'bg-primary-light' : 'bg-white'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <img
                src={iconUrl}
                alt={weather.weather[0].description}
                className="w-24 h-24"
            />
            <div className="ml-4">
              <h2 className="text-3xl font-bold">{weather.name}</h2>
              <p className={`capitalize ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {weather.weather[0].description}
              </p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-5xl font-bold">{Math.round(weather.main.temp)}°C</p>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              Gefühlt: {Math.round(weather.main.feels_like)}°C
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center">
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-500'}>Luftfeuchtigkeit</p>
            <p className="text-xl font-semibold">{weather.main.humidity}%</p>
          </div>
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-500'}>Wind</p>
            <p className="text-xl font-semibold">{Math.round(weather.wind.speed * 3.6)} km/h</p>
          </div>
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-500'}>Max. Temp.</p>
            <p className="text-xl font-semibold">{Math.round(weather.main.temp_max)}°C</p>
          </div>
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-500'}>Min. Temp.</p>
            <p className="text-xl font-semibold">{Math.round(weather.main.temp_min)}°C</p>
          </div>
        </div>
      </div>
  );
}

export default WeatherCard;