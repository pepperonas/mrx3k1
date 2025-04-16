// services/contentGeneratorService.js - Service zur Generierung von SEO-optimierten Inhalten

const axios = require('axios');

/**
 * Generiert SEO-optimierten Content basierend auf Keywords und Vorgaben
 * @param {string} apiKey - OpenAI API-Schlüssel des Nutzers
 * @param {Object} contentRequest - Anfragedaten für die Content-Generierung
 * @returns {Object} Generierter Content
 */
exports.generateContent = async (apiKey, contentRequest) => {
    try {
        if (!apiKey) {
            throw new Error('API-Schlüssel fehlt');
        }

        const { topic, keywords, contentType, tone, wordCount, targetAudience } = contentRequest;

        if (!topic) {
            throw new Error('Thema ist erforderlich');
        }

        // Prompt für die Content-Generierung erstellen
        const prompt = createContentPrompt(contentRequest);

        // Anfrage an OpenAI API senden
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Du bist ein erfahrener SEO-Content-Ersteller und Experte für die Erstellung von ${contentType || 'Artikeln'} mit einem ${tone || 'informativen'} Ton.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2500
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        // Antwort parsen
        const generatedContent = response.data.choices[0].message.content;

        // Zusätzliche Metadaten für den generierten Inhalt hinzufügen
        return {
            topic,
            content: generatedContent,
            keywords: keywords || [],
            contentType: contentType || 'Artikel',
            wordCount: wordCount || 500,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('Fehler bei der Content-Generierung:', error);
        throw error;
    }
};

/**
 * Erstellt einen Prompt für die Content-Generierung basierend auf den Anforderungen
 * @param {Object} contentRequest - Anfragedaten für die Content-Generierung
 * @returns {string} Prompt für die Content-Generierung
 */
const createContentPrompt = (contentRequest) => {
    const {
        topic,
        keywords = [],
        contentType = 'Artikel',
        tone = 'informativ',
        wordCount = 500,
        targetAudience = 'Allgemein',
        outline = null,
        includeFAQ = false,
        includeHeadings = true,
        metaDescription = true
    } = contentRequest;

    // Basis-Prompt
    let prompt = `Erstelle einen SEO-optimierten ${contentType} zum Thema "${topic}" mit ungefähr ${wordCount} Wörtern.`;

    // Keywords hinzufügen
    if (keywords && keywords.length > 0) {
        prompt += `\nVerwende die folgenden Keywords natürlich im Text: ${keywords.join(', ')}.`;
    }

    // Ton und Zielgruppe hinzufügen
    prompt += `\nDer Inhalt sollte einen ${tone}en Ton haben und für ${targetAudience} verständlich sein.`;

    // Struktur-Vorgaben
    if (includeHeadings) {
        prompt += '\nVerwende eine klare Struktur mit H2 und H3 Überschriften.';
    }

    // Outline, falls vorhanden
    if (outline) {
        prompt += `\nFolge dieser Gliederung:\n${outline}`;
    }

    // FAQ-Abschnitt
    if (includeFAQ) {
        prompt += '\nFüge am Ende einen FAQ-Abschnitt mit 3-5 häufig gestellten Fragen und Antworten hinzu.';
    }

    // Meta-Description
    if (metaDescription) {
        prompt += '\nSchlage auch eine SEO-optimierte Meta-Description mit 150-160 Zeichen vor.';
    }

    prompt += '\nAchte auf:';
    prompt += '\n- Natürlichen Textfluss und Lesbarkeit';
    prompt += '\n- Korrekte Keyworddichte (nicht übertreiben)';
    prompt += '\n- Einen ansprechenden Einleitungsabsatz';
    prompt += '\n- Einen überzeugenden Abschlussabsatz mit Call-to-Action';

    return prompt;
};

/**
 * Generiert Content-Ideen basierend auf einem Keyword
 * @param {string} apiKey - OpenAI API-Schlüssel des Nutzers
 * @param {string} keyword - Hauptkeyword für Ideen
 * @param {string[]} relatedKeywords - Verwandte Keywords
 * @returns {Object} Liste mit Content-Ideen
 */
exports.generateContentIdeas = async (apiKey, keyword, relatedKeywords = []) => {
    try {
        if (!apiKey) {
            throw new Error('API-Schlüssel fehlt');
        }

        if (!keyword) {
            throw new Error('Keyword ist erforderlich');
        }

        // Prompt für Content-Ideen
        const prompt = `
Generiere 10 verschiedene Content-Ideen für das Keyword "${keyword}" ${relatedKeywords.length > 0 ? `und die verwandten Keywords ${relatedKeywords.join(', ')}` : ''}.

Berücksichtige verschiedene Content-Typen wie:
- Detaillierte Anleitungen 
- Vergleichsartikel
- Checklisten
- Expert Guides
- Infografiken
- Fallstudien
- Interview-Beiträge
- Erklärungsvideos
- Umfrageberichte
- FAQ-Sammlungen

Gib das Ergebnis im folgenden JSON-Format zurück:

\`\`\`json
{
  "contentIdeas": [
    {
      "title": "Titel der Content-Idee",
      "type": "Content-Typ (z.B. Anleitung, Vergleich, etc.)",
      "description": "Kurze Beschreibung (1-2 Sätze)",
      "mainKeyword": "Hauptkeyword",
      "relatedKeywords": ["verwandtes Keyword 1", "verwandtes Keyword 2"],
      "estimatedWordCount": Ungefähre Wortanzahl als Zahl
    }
  ]
}
\`\`\`

Stelle sicher, dass jede Idee einzigartig ist und einen klaren Mehrwert für die Zielgruppe bietet.
`;

        // Anfrage an OpenAI API senden
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Du bist ein SEO-Content-Stratege, der kreative und umsetzbare Content-Ideen entwickelt."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        // Antwort parsen
        const content = response.data.choices[0].message.content;

        // JSON aus der Antwort extrahieren
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
            content.match(/{[\s\S]*}/);

        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
        const contentIdeas = JSON.parse(jsonStr);

        return contentIdeas;

    } catch (error) {
        console.error('Fehler bei der Generierung von Content-Ideen:', error);
        throw error;
    }
};

/**
 * Verbessert bestehenden Content mit SEO-Optimierung und Stilanpassungen
 * @param {string} apiKey - OpenAI API-Schlüssel des Nutzers
 * @param {Object} contentRequest - Anfragedaten für die Content-Verbesserung
 * @returns {Object} Verbesserter Content
 */
exports.improveContent = async (apiKey, contentRequest) => {
    try {
        if (!apiKey) {
            throw new Error('API-Schlüssel fehlt');
        }

        const {
            existingContent,
            topic,
            keywords,
            contentType,
            tone,
            wordCount,
            targetAudience
        } = contentRequest;

        if (!existingContent) {
            throw new Error('Bestehender Content ist erforderlich');
        }

        // Prompt für die Content-Verbesserung erstellen
        const prompt = createContentImprovementPrompt(contentRequest);

        // Anfrage an OpenAI API senden
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Du bist ein erfahrener SEO-Content-Redakteur und Experte für die Optimierung von ${contentType || 'Artikeln'} mit einem ${tone || 'informativen'} Ton.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2500
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        // Antwort parsen
        const improvedContent = response.data.choices[0].message.content;

        // Zusätzliche Metadaten für den verbesserten Inhalt hinzufügen
        return {
            topic: topic || 'Verbesserter Content',
            content: improvedContent,
            keywords: keywords || [],
            contentType: contentType || 'Artikel',
            wordCount: estimateWordCount(improvedContent),
            generatedAt: new Date().toISOString(),
            improvement: true
        };

    } catch (error) {
        console.error('Fehler bei der Content-Verbesserung:', error);
        throw error;
    }
};

/**
 * Erstellt einen Prompt für die Content-Verbesserung basierend auf den Anforderungen
 * @param {Object} contentRequest - Anfragedaten für die Content-Verbesserung
 * @returns {string} Prompt für die Content-Verbesserung
 */
const createContentImprovementPrompt = (contentRequest) => {
    const {
        existingContent,
        topic = '',
        keywords = [],
        contentType = 'Artikel',
        tone = 'informativ',
        wordCount = 0,
        targetAudience = 'Allgemein',
        includeFAQ = false,
        includeHeadings = true,
        metaDescription = true
    } = contentRequest;

    // Basis-Prompt
    let prompt = `Verbessere und optimiere den folgenden ${contentType}:

"""
${existingContent}
"""

`;

    // Richtlinien für die Verbesserung
    prompt += `\nBitte verbessere diesen Content mit folgenden Vorgaben:`;

    // Wenn ein Thema oder Titel angegeben wurde
    if (topic) {
        prompt += `\n- Passe den Inhalt an das Thema/den Titel "${topic}" an, falls nötig.`;
    }

    // Keywords hinzufügen
    if (keywords && keywords.length > 0) {
        prompt += `\n- Optimiere den Text für folgende Keywords: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}.`;
    }

    // Tonalität und Zielgruppe hinzufügen
    prompt += `\n- Passe den Ton auf "${tone}" an und stelle sicher, dass er für ${targetAudience} verständlich ist.`;

    // Wortanzahl, falls angegeben
    if (wordCount > 0) {
        prompt += `\n- Passe die Wortanzahl auf ungefähr ${wordCount} Wörter an (kürzen oder erweitern).`;
    }

    // Struktur-Vorgaben
    if (includeHeadings) {
        prompt += '\n- Verbessere die Struktur mit klaren H2 und H3 Überschriften.';
    }

    // FAQ-Abschnitt
    if (includeFAQ) {
        prompt += '\n- Füge einen FAQ-Abschnitt mit 3-5 relevanten Fragen und Antworten hinzu, falls noch nicht vorhanden.';
    }

    // Meta-Description
    if (metaDescription) {
        prompt += '\n- Schlage eine verbesserte SEO-optimierte Meta-Description mit 150-160 Zeichen vor.';
    }

    prompt += '\n\nAllgemeine Verbesserungen:';
    prompt += '\n- Verbessere die Lesbarkeit und den natürlichen Textfluss.';
    prompt += '\n- Optimiere die Keyworddichte (nicht übertreiben, natürliche Integration).';
    prompt += '\n- Stärke die Einleitung und den Abschluss.';
    prompt += '\n- Korrigiere grammatikalische Fehler und verbessere die Formulierungen.';
    prompt += '\n- Füge relevante interne Verlinkungen ein (als Platzhalter markiert mit [Link: Thema]).';
    prompt += '\n- Optimiere für besseres SEO-Ranking.';

    return prompt;
};

/**
 * Schätzt die Wortanzahl eines Texts
 * @param {string} text - Zu analysierender Text
 * @returns {number} Geschätzte Wortanzahl
 */
const estimateWordCount = (text) => {
    return text.split(/\s+/).filter(word => word.length > 0).length;
};