// controllers/aiController.js
const axios = require('axios');

// Controller für die AI-Anfragen an OpenAI API
exports.generateSeoSuggestions = async (req, res) => {
  try {
    const { apiKey, data } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API-Key erforderlich'
      });
    }

    if (!data || !data.prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt-Daten erforderlich'
      });
    }

    // Anfrage an OpenAI API senden
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Du bist ein SEO-Experte, der klare, spezifische und implementierbare Verbesserungsvorschläge für Websites macht. Antworte im JSON-Format."
            },
            {
              role: "user",
              content: data.prompt
            }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
    );

    // Erfolgreiche Antwort zurückgeben
    res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Fehler bei der AI-Anfrage:', error);

    // Strukturierte Fehlerantwort
    let errorMessage = 'Fehler bei der AI-Anfrage';
    let errorDetails = {};

    if (error.response) {
      // OpenAI API hat mit einem Fehlercode geantwortet
      errorMessage = error.response.data.error?.message || 'API-Fehler';
      errorDetails = error.response.data;
    } else if (error.request) {
      // Keine Antwort erhalten
      errorMessage = 'Keine Antwort von der API erhalten';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorDetails
    });
  }
};