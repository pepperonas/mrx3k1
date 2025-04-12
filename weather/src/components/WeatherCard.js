import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function WeatherCard({ weather }) {
  const { darkMode } = useContext(ThemeContext);
  const iconUrl = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

  return (
      <div className={`rounded-lg shadow-lg p-4 sm:p-6 mt-4 sm:mt-6 ${darkMode ? 'bg-primary-light' : 'bg-white'}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <img
                src={iconUrl}
                alt={weather.weather[0].description}
                className="w-16 h-16 sm:w-24 sm:h-24"
            />
            <div className="ml-3 sm:ml-4">
              <h2 className="text-xl sm:text-3xl font-bold">{weather.name}</h2>
              <p className={`capitalize text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {weather.weather[0].description}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-3xl sm:text-5xl font-bold">{Math.round(weather.main.temp)}°C</p>
            <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Gefühlt: {Math.round(weather.main.feels_like)}°C
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4 sm:mt-6 text-center">
          <div className={`p-2 sm:p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Luftfeuchtigkeit</p>
            <p className="text-lg sm:text-xl font-semibold">{weather.main.humidity}%</p>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Wind</p>
            <p className="text-lg sm:text-xl font-semibold">{Math.round(weather.wind.speed * 3.6)} km/h</p>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Max. Temp.</p>
            <p className="text-lg sm:text-xl font-semibold">{Math.round(weather.main.temp_max)}°C</p>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${darkMode ? 'bg-primary' : 'bg-blue-50'}`}>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Min. Temp.</p>
            <p className="text-lg sm:text-xl font-semibold">{Math.round(weather.main.temp_min)}°C</p>
          </div>
        </div>
      </div>
  );
}

export default WeatherCard;