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
