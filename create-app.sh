#!/bin/bash
# Poker App Setup Skript ohne Tailwind

echo "=== Poker App Setup Skript ==="
echo "Dieses Skript erstellt eine komplette Poker Advisor App ohne Tailwind"

# Überprüfen, ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "Node.js ist nicht installiert. Bitte installiere Node.js und versuche es erneut."
    exit 1
fi

echo "Node.js gefunden: $(node -v)"
echo "npm gefunden: $(npm -v)"

# Projekt erstellen
echo "Erstelle React-Projekt..."
npx create-react-app poker-advisor

# In das Projektverzeichnis wechseln
cd poker-advisor || exit 1

# Components-Ordner erstellen
mkdir -p src/components

# App.css erstellen - einfaches CSS
echo "Erstelle App.css..."
cat > src/App.css << 'EOF'
.App {
  text-align: center;
}
EOF

# index.css erstellen - einfaches CSS
echo "Erstelle index.css..."
cat > src/index.css << 'EOF'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #1a1b26;
  color: #c0caf5;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

# PokerAdvisor.css erstellen mit eigenen Stilen
echo "Erstelle PokerAdvisor.css..."
cat > src/components/PokerAdvisor.css << 'EOF'
.poker-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: #1a1b26;
  color: #c0caf5;
  min-height: 100vh;
  font-family: sans-serif;
}

.heading {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #7aa2f7;
}

.section {
  width: 100%;
  max-width: 28rem;
  margin-bottom: 1.5rem;
}

.tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.tab {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  background-color: #2C2E3B;
  color: #c0caf5;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tab:hover {
  background-color: #3d59a1;
}

.tab.active {
  background-color: #3d59a1;
}

.subtitle {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
  color: #a9b1d6;
}

.selected-info {
  margin-bottom: 0.5rem;
  color: #9aa5ce;
}

.positions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.position-button {
  padding: 0.5rem;
  border-radius: 0.25rem;
  background-color: #2C2E3B;
  color: #c0caf5;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.position-button:hover {
  background-color: #3d59a1;
}

.position-button.active {
  background-color: #3d59a1;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.suit-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.suit-label {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.suit-label.red {
  color: #f7768e;
}

.card-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.25rem;
}

.card-button {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  background-color: #2C2E3B;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.card-button:hover {
  background-color: #4e4f61;
}

.card-button.selected {
  background-color: #3d59a1;
}

.card-button.red {
  color: #f7768e;
}

.card-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.analyze-button {
  padding: 0.5rem 1.5rem;
  background-color: #3d59a1;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 1.5rem;
}

.analyze-button:hover {
  background-color: #5171d2;
}

.result-container {
  width: 100%;
  max-width: 28rem;
  padding: 1rem;
  border-radius: 0.25rem;
  background-color: #2C2E3B;
  border: 1px solid #414868;
}

.result-title {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #a9b1d6;
}

.decision {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.decision.raise {
  color: #9ece6a;
}

.decision.call {
  color: #e0af68;
}

.decision.fold {
  color: #f7768e;
}

.explanation {
  margin-bottom: 0.5rem;
  color: #a9b1d6;
}

.confidence-bar {
  width: 100%;
  background-color: #414868;
  border-radius: 9999px;
  height: 0.625rem;
}

.confidence-level {
  height: 0.625rem;
  border-radius: 9999px;
}

.confidence-level.high {
  background-color: #9ece6a;
}

.confidence-level.medium {
  background-color: #e0af68;
}

.confidence-level.low {
  background-color: #f7768e;
}

.confidence-text {
  text-align: right;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  color: #9aa5ce;
}
EOF

# App.js erstellen
echo "Erstelle App.js..."
cat > src/App.js << 'EOF'
import React from 'react';
import PokerAdvisor from './components/PokerAdvisor';
import './App.css';

function App() {
  return (
    <div className="App">
      <PokerAdvisor />
    </div>
  );
}

export default App;
EOF

# PokerAdvisor.js erstellen
echo "Erstelle PokerAdvisor.js..."
cat > src/components/PokerAdvisor.js << 'EOF'
import React, { useState } from 'react';
import './PokerAdvisor.css';

const PokerAdvisor = () => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [flopCards, setFlopCards] = useState([]);
  const [position, setPosition] = useState('early');
  const [result, setResult] = useState(null);
  const [gameStage, setGameStage] = useState('preflop'); // preflop or flop

  const suits = ['♥', '♦', '♣', '♠'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const positions = ['early', 'middle', 'late', 'button', 'small blind', 'big blind'];

  const handleCardClick = (card) => {
    if (gameStage === 'preflop') {
      if (selectedCards.includes(card)) {
        setSelectedCards(selectedCards.filter(c => c !== card));
      } else if (selectedCards.length < 2) {
        setSelectedCards([...selectedCards, card]);
      }
    } else if (gameStage === 'flop') {
      if (flopCards.includes(card)) {
        setFlopCards(flopCards.filter(c => c !== card));
      } else if (flopCards.length < 3) {
        setFlopCards([...flopCards, card]);
      }
    }
  };

  const switchToFlop = () => {
    if (selectedCards.length === 2) {
      setGameStage('flop');
      setResult(null);
    } else {
      setResult({
        decision: 'Bitte 2 Karten auswählen',
        explanation: '',
        confidence: 0
      });
    }
  };

  const switchToPreflop = () => {
    setGameStage('preflop');
    setFlopCards([]);
    setResult(null);
  };

  // Helper function to calculate hand strength
  const evaluateHand = (hand) => {
    // Convert card format to value and suit arrays
    const cards = hand.map(card => {
      const value = card.charAt(0) === '1' ? '10' : card.charAt(0);
      const suit = card.charAt(value === '10' ? 2 : 1);
      return { value, suit };
    });

    // Count values
    const valueCounts = {};
    cards.forEach(card => {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });

    // Count suits
    const suitCounts = {};
    cards.forEach(card => {
      suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    });

    // Check for pairs, three of a kind, etc.
    const pairs = Object.values(valueCounts).filter(count => count === 2).length;
    const threeOfAKind = Object.values(valueCounts).filter(count => count === 3).length > 0;
    const fourOfAKind = Object.values(valueCounts).filter(count => count >= 4).length > 0;
    const flush = Object.values(suitCounts).some(count => count >= 5);

    // Check for straight (simplified)
    const valueArray = values;
    const cardValues = cards.map(card => {
      return valueArray.indexOf(card.value);
    }).sort((a, b) => a - b);

    let hasStraight = false;
    for (let i = 0; i < cardValues.length - 4; i++) {
      if (
        cardValues[i] + 1 === cardValues[i+1] &&
        cardValues[i] + 2 === cardValues[i+2] &&
        cardValues[i] + 3 === cardValues[i+3] &&
        cardValues[i] + 4 === cardValues[i+4]
      ) {
        hasStraight = true;
        break;
      }
    }

    // Special case for A-5 straight
    if (
      cardValues.includes(0) && // 2
      cardValues.includes(1) && // 3
      cardValues.includes(2) && // 4
      cardValues.includes(3) && // 5
      cardValues.includes(12)   // A
    ) {
      hasStraight = true;
    }

    // Check for full house
    const fullHouse = pairs > 0 && threeOfAKind;

    // Check for straight flush (simplified)
    let straightFlush = false;
    if (hasStraight && flush) {
      // This is a simplification; a proper straight flush check would be more complex
      const flushSuit = Object.entries(suitCounts).find(([suit, count]) => count >= 5)?.[0];
      if (flushSuit) {
        const flushCards = cards.filter(card => card.suit === flushSuit);
        // Simple check for sequence in flush cards
        const flushValues = flushCards.map(card => valueArray.indexOf(card.value)).sort((a, b) => a - b);
        for (let i = 0; i < flushValues.length - 4; i++) {
          if (
            flushValues[i] + 1 === flushValues[i+1] &&
            flushValues[i] + 2 === flushValues[i+2] &&
            flushValues[i] + 3 === flushValues[i+3] &&
            flushValues[i] + 4 === flushValues[i+4]
          ) {
            straightFlush = true;
            break;
          }
        }
      }
    }

    // Determine hand strength
    if (straightFlush) return { strength: 9, name: 'Straight Flush' };
    if (fourOfAKind) return { strength: 8, name: 'Four of a Kind' };
    if (fullHouse) return { strength: 7, name: 'Full House' };
    if (flush) return { strength: 6, name: 'Flush' };
    if (hasStraight) return { strength: 5, name: 'Straight' };
    if (threeOfAKind) return { strength: 4, name: 'Three of a Kind' };
    if (pairs === 2) return { strength: 3, name: 'Two Pair' };
    if (pairs === 1) return { strength: 2, name: 'Pair' };
    return { strength: 1, name: 'High Card' };
  };

  const analyzeHand = () => {
    if (gameStage === 'preflop') {
      analyzePreflopHand();
    } else {
      analyzeFlopHand();
    }
  };

  const analyzePreflopHand = () => {
    if (selectedCards.length !== 2) {
      setResult({
        decision: 'Bitte 2 Karten auswählen',
        explanation: '',
        confidence: 0
      });
      return;
    }

    const card1Value = values.indexOf(selectedCards[0].split('')[0]);
    const card2Value = values.indexOf(selectedCards[1].split('')[0]);
    const card1Suit = selectedCards[0].split('')[1];
    const card2Suit = selectedCards[1].split('')[1];

    const isPair = card1Value === card2Value;
    const isSuited = card1Suit === card2Suit;
    const highCard = Math.max(card1Value, card2Value);
    const lowCard = Math.min(card1Value, card2Value);
    const gap = highCard - lowCard - 1;
    const isConnector = gap <= 1;

    let decision = 'fold';
    let explanation = '';
    let confidence = 0;

    // Premium starting hands
    if (isPair && card1Value >= values.indexOf('J')) {
      decision = 'raise';
      explanation = 'Premium Paar';
      confidence = 90;
    } else if (card1Value === values.indexOf('A') && card2Value === values.indexOf('K') && isSuited) {
      decision = 'raise';
      explanation = 'Premium Hand (AK suited)';
      confidence = 85;
    } else if (card1Value === values.indexOf('A') && card2Value === values.indexOf('K')) {
      decision = 'raise';
      explanation = 'Starke Hand (AK offsuit)';
      confidence = 80;
    } else if (isPair && card1Value >= values.indexOf('8')) {
      decision = position === 'early' ? 'call' : 'raise';
      explanation = 'Mittleres Paar';
      confidence = 70;
    } else if ((card1Value === values.indexOf('A') || card2Value === values.indexOf('A')) && isSuited) {
      decision = position === 'early' ? 'call' : 'raise';
      explanation = 'Ass mit gleicher Farbe';
      confidence = 65;
    } else if (isConnector && isSuited && lowCard >= values.indexOf('9')) {
      decision = position === 'early' ? 'fold' : 'call';
      explanation = 'Suited Connector (hoch)';
      confidence = 60;
    } else if (isPair) {
      decision = position === 'early' ? 'fold' : (position === 'late' || position === 'button') ? 'call' : 'fold';
      explanation = 'Kleines Paar';
      confidence = 55;
    } else if (isConnector && isSuited) {
      decision = (position === 'late' || position === 'button') ? 'call' : 'fold';
      explanation = 'Suited Connector';
      confidence = 50;
    } else if (highCard >= values.indexOf('Q') && lowCard >= values.indexOf('9')) {
      decision = (position === 'late' || position === 'button') ? 'call' : 'fold';
      explanation = 'Hohe Karten';
      confidence = 45;
    } else {
      decision = 'fold';
      explanation = 'Schwache Starthand';
      confidence = 80;
    }

    // Adjust decision based on position
    if (position === 'button' || position === 'small blind' || position === 'big blind') {
      if (decision === 'fold' && confidence < 70) {
        decision = 'call';
        explanation += ' (späte Position)';
        confidence -= 20;
      }
    }

    setResult({ decision, explanation, confidence });
  };

  const analyzeFlopHand = () => {
    if (selectedCards.length !== 2 || flopCards.length !== 3) {
      setResult({
        decision: 'Bitte 2 Hole Cards und 3 Flop-Karten auswählen',
        explanation: '',
        confidence: 0
      });
      return;
    }

    // Combine hole cards and flop cards
    const allCards = [...selectedCards, ...flopCards];

    // Check for duplicate cards
    const uniqueCards = new Set(allCards);
    if (uniqueCards.size !== allCards.length) {
      setResult({
        decision: 'Fehler',
        explanation: 'Duplikate Karten ausgewählt',
        confidence: 0
      });
      return;
    }

    // Evaluate current hand strength
    const handEvaluation = evaluateHand(allCards);

    // Calculate draw potential
    let drawPotential = 0;
    let drawExplanation = '';

    // Check for flush draw
    const suits = allCards.map(card => card.charAt(card.charAt(0) === '1' ? 2 : 1));
    const suitCounts = {};
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });

    if (Object.values(suitCounts).some(count => count === 4)) {
      drawPotential += 30;
      drawExplanation += 'Flush Draw (9 outs). ';
    }

    // Check for open-ended straight draw (simplified)
    const valueArray = values;
    const cardValues = allCards.map(card => {
      const value = card.charAt(0) === '1' ? '10' : card.charAt(0);
      return valueArray.indexOf(value);
    }).sort((a, b) => a - b);

    const uniqueValues = [...new Set(cardValues)];
    let hasOpenEndedStraightDraw = false;

    for (let i = 0; i < uniqueValues.length - 3; i++) {
      if (
        uniqueValues[i] + 1 === uniqueValues[i+1] &&
        uniqueValues[i] + 2 === uniqueValues[i+2] &&
        uniqueValues[i] + 3 === uniqueValues[i+3]
      ) {
        hasOpenEndedStraightDraw = true;
        break;
      }
    }

    if (hasOpenEndedStraightDraw) {
      drawPotential += 25;
      drawExplanation += 'Open-Ended Straight Draw (8 outs). ';
    }

    // Check for gutshot straight draw
    let hasGutshot = false;
    for (let i = 0; i < uniqueValues.length - 2; i++) {
      if (
        uniqueValues[i] + 1 === uniqueValues[i+1] &&
        uniqueValues[i] + 3 === uniqueValues[i+2]
      ) {
        hasGutshot = true;
        break;
      }
    }

    if (hasGutshot) {
      drawPotential += 15;
      drawExplanation += 'Gutshot Straight Draw (4 outs). ';
    }

    // Decide on post-flop action
    let decision = 'fold';
    let explanation = handEvaluation.name;
    let confidence = 0;

    if (handEvaluation.strength >= 7) {
      // Full house or better
      decision = 'raise';
      explanation = `${handEvaluation.name} - Sehr starke Hand`;
      confidence = 95;
    } else if (handEvaluation.strength >= 5) {
      // Straight or flush
      decision = 'raise';
      explanation = `${handEvaluation.name} - Starke Hand`;
      confidence = 85;
    } else if (handEvaluation.strength === 4) {
      // Three of a kind
      decision = 'raise';
      explanation = `${handEvaluation.name} - Gute Hand`;
      confidence = 75;
    } else if (handEvaluation.strength === 3) {
      // Two pair
      decision = 'call';
      explanation = `${handEvaluation.name} - Solide Hand`;
      confidence = 65;
    } else if (handEvaluation.strength === 2) {
      // Pair
      if (drawPotential > 20) {
        decision = 'call';
        explanation = `${handEvaluation.name} mit Draw-Potential: ${drawExplanation}`;
        confidence = 60;
      } else {
        decision = position === 'early' ? 'fold' : 'call';
        explanation = `${handEvaluation.name} - Mittlere Hand`;
        confidence = 50;
      }
    } else {
      // High card
      if (drawPotential > 25) {
        decision = 'call';
        explanation = `${handEvaluation.name} mit starkem Draw-Potential: ${drawExplanation}`;
        confidence = 55;
      } else if (drawPotential > 0) {
        decision = position === 'early' ? 'fold' : 'call';
        explanation = `${handEvaluation.name} mit Draw-Potential: ${drawExplanation}`;
        confidence = 40;
      } else {
        decision = 'fold';
        explanation = `${handEvaluation.name} - Schwache Hand`;
        confidence = 75;
      }
    }

    // Adjust decision based on position
    if ((position === 'button' || position === 'late') && decision === 'fold' && confidence < 70) {
      decision = 'call';
      explanation += ' (späte Position)';
      confidence -= 15;
    }

    setResult({ decision, explanation, confidence });
  };

  return (
    <div className="poker-container">
      <h1 className="heading">Poker Hand Advisor</h1>

      <div className="section">
        <div className="tabs">
          <button
            className={`tab ${gameStage === 'preflop' ? 'active' : ''}`}
            onClick={switchToPreflop}
          >
            Pre-Flop
          </button>
          <button
            className={`tab ${gameStage === 'flop' ? 'active' : ''}`}
            onClick={switchToFlop}
          >
            Flop
          </button>
        </div>

        <h2 className="subtitle">Position auswählen:</h2>
        <div className="positions-grid">
          {positions.map(pos => (
            <button
              key={pos}
              className={`position-button ${position === pos ? 'active' : ''}`}
              onClick={() => setPosition(pos)}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h2 className="subtitle">
          {gameStage === 'preflop' ? 'Deine Karten auswählen (2):' : 'Flop Karten auswählen (3):'}
        </h2>

        {gameStage === 'preflop' && (
          <div className="selected-info">Ausgewählt: {selectedCards.join(', ')}</div>
        )}

        {gameStage === 'flop' && (
          <div className="selected-info">
            <div>Deine Karten: {selectedCards.join(', ')}</div>
            <div>Flop: {flopCards.join(', ')}</div>
          </div>
        )}

        <div className="cards-grid">
          {suits.map(suit => (
            <div key={suit} className="suit-column">
              <div className={`suit-label ${suit === '♥' || suit === '♦' ? 'red' : ''}`}>{suit}</div>
              <div className="card-buttons">
                {values.map(value => (
                  <button
                    key={`${value}${suit}`}
                    className={`card-button ${
                      (gameStage === 'preflop' && selectedCards.includes(`${value}${suit}`)) ||
                      (gameStage === 'flop' && flopCards.includes(`${value}${suit}`))
                        ? 'selected'
                        : ''} ${suit === '♥' || suit === '♦' ? 'red' : ''}`}
                    onClick={() => handleCardClick(`${value}${suit}`)}
                    disabled={(gameStage === 'flop' && selectedCards.includes(`${value}${suit}`)) ||
                             (gameStage === 'preflop' && selectedCards.length === 2 && !selectedCards.includes(`${value}${suit}`)) ||
                             (gameStage === 'flop' && flopCards.length === 3 && !flopCards.includes(`${value}${suit}`))}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className="analyze-button"
        onClick={analyzeHand}
      >
        Hand analysieren
      </button>

      {result && (
        <div className="result-container">
          <h2 className="result-title">Empfehlung:</h2>
          <div className={`decision ${result.decision}`}>
            {result.decision.toUpperCase()}
          </div>
          <div className="explanation">{result.explanation}</div>
          <div className="confidence-bar">
            <div
              className={`confidence-level ${
                result.confidence > 70 ? 'high' :
                result.confidence > 50 ? 'medium' : 'low'
              }`}
              style={{width: `${result.confidence}%`}}
            ></div>
          </div>
          <div className="confidence-text">Konfidenz: {result.confidence}%</div>
        </div>
      )}
    </div>
  );
};

export default PokerAdvisor;
EOF

# index.js erstellen
echo "Erstelle index.js..."
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

echo "Erstelle README.md..."
cat > README.md << 'EOF'
# Poker Hand Advisor

Eine React-App zur Bewertung von Poker-Händen. Die App bietet Empfehlungen für Spielentscheidungen basierend auf deinen Karten, der Position am Tisch und dem Spielfortschritt.

## Features

- Pre-Flop Handanalyse
- Flop Handanalyse (nach dem Austeilen der drei Gemeinschaftskarten)
- Positionsbasierte Empfehlungen
- Bewertung von Draw-Potential
- Dunkles Theme-Design mit dem Farbschema #2C2E3B

## Starten der App

```bash
npm start
```

Besuche [http://localhost:3000](http://localhost:3000) im Browser, um die App zu nutzen.

## Technologien

- React
- Reines CSS (ohne externe UI-Bibliotheken/Frameworks)
EOF

echo "Installiere Abhängigkeiten..."
npm install

echo ""
echo "=== Setup abgeschlossen ==="
echo "Die Poker App wurde erfolgreich erstellt!"
echo ""
echo "Um die App zu starten, führe folgende Befehle aus:"
echo "cd poker-advisor"
echo "npm start"
echo ""
echo "Die App ist dann unter http://localhost:3000 verfügbar."