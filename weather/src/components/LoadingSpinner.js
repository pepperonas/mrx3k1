import React from 'react';

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-3 text-blue-500 font-medium">Lade Wetterdaten...</p>
    </div>
  );
}

export default LoadingSpinner;
