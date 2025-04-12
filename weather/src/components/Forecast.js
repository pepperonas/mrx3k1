import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function Forecast({ forecast }) {
  const { darkMode } = useContext(ThemeContext);

  // Hilfsfunktion, um den Wochentag zu erhalten
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { weekday: 'long' });
  };

  // Hilfsfunktion, um die durchschnittliche Temperatur zu berechnen
  const getAverageTemp = (dayData) => {
    const sum = dayData.reduce((acc, item) => acc + item.main.temp, 0);
    return Math.round(sum / dayData.length);
  };

  // Hilfsfunktion, um das häufigste Wettersymbol zu erhalten
  const getMostFrequentIcon = (dayData) => {
    const iconCount = {};
    dayData.forEach(item => {
      const icon = item.weather[0].icon;
      iconCount[icon] = (iconCount[icon] || 0) + 1;
    });

    let mostFrequentIcon = '';
    let maxCount = 0;

    Object.entries(iconCount).forEach(([icon, count]) => {
      if (count > maxCount) {
        mostFrequentIcon = icon;
        maxCount = count;
      }
    });

    return mostFrequentIcon;
  };

  return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
        {forecast.map((dayData, index) => {
          const date = new Date(dayData[0].dt * 1000);
          const dayName = getDayName(date);
          const avgTemp = getAverageTemp(dayData);
          const icon = getMostFrequentIcon(dayData);
          const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
          const description = dayData[0].weather[0].description;

          return (
              <div
                  key={index}
                  className={`rounded-lg shadow-md p-3 sm:p-4 flex flex-col items-center ${darkMode ? 'bg-primary-light' : 'bg-white'}`}
              >
                <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2">{dayName}</h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-xs sm:text-sm`}>
                  {date.toLocaleDateString('de-DE')}
                </p>
                <img
                    src={iconUrl}
                    alt={description}
                    className="w-12 h-12 sm:w-16 sm:h-16 my-1 sm:my-2"
                />
                <p className={`capitalize text-xs sm:text-sm mb-1 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {description}
                </p>
                <p className="text-xl sm:text-2xl font-bold">{avgTemp}°C</p>
              </div>
          );
        })}
      </div>
  );
}

export default Forecast;