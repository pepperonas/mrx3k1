import React, { useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function SearchBar({ onSearch }) {
    const [city, setCity] = useState('');
    const { darkMode } = useContext(ThemeContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (city.trim()) {
            onSearch(city);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-md mx-auto">
            <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Stadt eingeben..."
                className={`flex-grow px-4 py-2 rounded-l-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                        ? 'bg-primary-light border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                }`}
            />
            <button
                type="submit"
                className={`px-6 py-2 rounded-r-lg transition duration-300 ${
                    darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
                Suchen
            </button>
        </form>
    );
}

export default SearchBar;