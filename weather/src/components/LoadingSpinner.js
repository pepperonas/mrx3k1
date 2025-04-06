import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

function LoadingSpinner() {
    const { darkMode } = useContext(ThemeContext);

    return (
        <div className="flex justify-center items-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
            <p className={`ml-3 font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>Lade Wetterdaten...</p>
        </div>
    );
}

export default LoadingSpinner;