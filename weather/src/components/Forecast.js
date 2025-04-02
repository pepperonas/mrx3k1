import React from 'react';

function Forecast({ forecast }) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
            className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center"
          >
            <h3 className="font-semibold text-lg mb-2">{dayName}</h3>
            <p className="text-gray-500 text-sm">
              {date.toLocaleDateString('de-DE')}
            </p>
            <img 
              src={iconUrl} 
              alt={description}
              className="w-16 h-16 my-2" 
            />
            <p className="capitalize text-sm text-gray-600 mb-2">{description}</p>
            <p className="text-2xl font-bold">{avgTemp}°C</p>
          </div>
        );
      })}
    </div>
  );
}

export default Forecast;
