// src/ErrorHandler.js - Gemeinsame Fehlerbehandlung

import React, { useState, useEffect, createContext, useContext } from 'react';
import { AlertCircle, X } from 'lucide-react';

// Kontext für globale Fehlerbehandlung
const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
    const [errors, setErrors] = useState([]);

    // Fehler hinzufügen
    const addError = (message, type = 'error') => {
        const id = Date.now();
        setErrors(prevErrors => [...prevErrors, { id, message, type }]);

        // Fehler nach 6 Sekunden automatisch entfernen
        setTimeout(() => {
            removeError(id);
        }, 6000);

        return id;
    };

    // Fehler entfernen
    const removeError = (id) => {
        setErrors(prevErrors => prevErrors.filter(error => error.id !== id));
    };

    // API-Fehler behandeln
    const handleApiError = (error) => {
        console.error('API-Fehler:', error);

        let message = 'Ein Fehler ist aufgetreten';

        if (error.response) {
            // Der Server hat mit einem Fehlercode geantwortet
            message = error.response.data?.message || `Fehler ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
            // Die Anfrage wurde gesendet, aber es kam keine Antwort zurück
            message = 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.';
        } else if (error.message) {
            // Fehler beim Senden der Anfrage
            message = error.message;
        }

        return addError(message);
    };

    return (
        <ErrorContext.Provider value={{ errors, addError, removeError, handleApiError }}>
            {children}
            <ErrorToasts errors={errors} removeError={removeError} />
        </ErrorContext.Provider>
    );
};

// Hook für den Zugriff auf den Fehler-Kontext
export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError muss innerhalb eines ErrorProviders verwendet werden');
    }
    return context;
};

// Toast-Komponente zur Anzeige von Fehlern
const ErrorToasts = ({ errors, removeError }) => {
    if (errors.length === 0) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
            {errors.map((error) => (
                <div
                    key={error.id}
                    className={`${
                        error.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' :
                            error.type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
                                'bg-blue-100 border-blue-500 text-blue-700'
                    } border-l-4 p-4 rounded shadow-md max-w-md flex items-start justify-between`}
                >
                    <div className="flex">
                        <AlertCircle className="mr-2 flex-shrink-0" size={20} />
                        <span>{error.message}</span>
                    </div>
                    <button onClick={() => removeError(error.id)} className="ml-2 flex-shrink-0">
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

// Hilfsfunktion zum Abrufen von Daten mit Fehlerbehandlung
export const fetchWithErrorHandling = async (url, options = {}, errorHandler) => {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Ein Fehler ist aufgetreten');
        }

        return data;
    } catch (error) {
        if (errorHandler) {
            errorHandler(error);
        }
        throw error;
    }
};

// Beispiel für die Integration in App.js:
/*
import { ErrorProvider, useError } from './ErrorHandler';

function App() {
  return (
    <ErrorProvider>
      <AppContent />
    </ErrorProvider>
  );
}

function AppContent() {
  const { addError, handleApiError } = useError();

  const fetchData = async () => {
    try {
      const data = await fetchWithErrorHandling('/api/data', {}, handleApiError);
      // Verarbeite die Daten
    } catch (error) {
      // Fehler wurde bereits von fetchWithErrorHandling behandelt
    }
  };

  return (
    // App-Inhalt
  );
}
*/