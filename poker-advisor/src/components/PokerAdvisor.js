// PokerAdvisor.js
import React, { useState, useEffect } from 'react';
import './PokerAdvisor.css';

const PokerAdvisor = () => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [flopCards, setFlopCards] = useState([]);
  const [position, setPosition] = useState('early');
  const [result, setResult] = useState(null);
  const [gameStage, setGameStage] = useState('preflop');
  const [activeSuit, setActiveSuit] = useState(null);
  const [showPositions, setShowPositions] = useState(false);
  const [showPositionImpact, setShowPositionImpact] = useState(false);

  const suits = ['♥', '♦', '♣', '♠'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const positions = ['early', 'middle', 'late', 'button', 'small blind', 'big blind'];

  // Effekt zur Demonstration der Positionsauswirkung
  useEffect(() => {
    if (result && result.decisionByPosition) {
      // Wenn eine Analyse mit Positionsauswirkung existiert
      setShowPositionImpact(true);
    } else {
      setShowPositionImpact(false);
    }
  }, [result]);

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

    // Frühere Ergebnisse zurücksetzen, wenn Karten geändert werden
    setResult(null);
  };

  const switchToFlop = () => {
    if (selectedCards.length === 2) {
      setGameStage('flop');
      setResult(null);
      setActiveSuit(null);
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
    setActiveSuit(null);
  };

  const toggleSuit = (suit) => {
    if (activeSuit === suit) {
      setActiveSuit(null);
    } else {
      setActiveSuit(suit);
    }
  };

  const togglePositions = () => {
    setShowPositions(!showPositions);
  };

  const resetCards = () => {
    if (gameStage === 'preflop') {
      setSelectedCards([]);
    } else {
      setFlopCards([]);
    }
    setResult(null);
  };

  const resetAll = () => {
    setSelectedCards([]);
    setFlopCards([]);
    setGameStage('preflop');
    setPosition('early');
    setResult(null);
    setActiveSuit(null);
  };

  // Hilfsfunktion zum Rendern von Karten mit Farbe
  const renderCard = (card) => {
    const value = card.charAt(0) === '1' ? '10' : card.charAt(0);
    const suit = card.charAt(value === '10' ? 2 : 1);
    const isRed = suit === '♥' || suit === '♦';

    return (
        <span className={`card-display ${isRed ? 'red' : ''}`}>
        {value}{suit}
      </span>
    );
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

  const getDecisionForPosition = (handData, pos) => {
    // Daten von der Hand
    const { isPair, card1Value, isSuited, highCard, lowCard, isConnector } = handData;

    let decision = 'fold';
    let confidence = 0;

    // Premium starting hands
    if (isPair && card1Value >= values.indexOf('J')) {
      decision = 'raise';
      confidence = 90;
    } else if (card1Value === values.indexOf('A') && highCard === values.indexOf('K') && isSuited) {
      decision = 'raise';
      confidence = 85;
    } else if (card1Value === values.indexOf('A') && highCard === values.indexOf('K')) {
      decision = 'raise';
      confidence = 80;
    } else if (isPair && card1Value >= values.indexOf('8')) {
      decision = pos === 'early' ? 'call' : 'raise';
      confidence = 70;
    } else if ((card1Value === values.indexOf('A') || highCard === values.indexOf('A')) && isSuited) {
      decision = pos === 'early' ? 'call' : 'raise';
      confidence = 65;
    } else if (isConnector && isSuited && lowCard >= values.indexOf('9')) {
      decision = pos === 'early' ? 'fold' : 'call';
      confidence = 60;
    } else if (isPair) {
      decision = pos === 'early' ? 'fold' : (pos === 'late' || pos === 'button') ? 'call' : 'fold';
      confidence = 55;
    } else if (isConnector && isSuited) {
      decision = (pos === 'late' || pos === 'button') ? 'call' : 'fold';
      confidence = 50;
    } else if (highCard >= values.indexOf('Q') && lowCard >= values.indexOf('9')) {
      decision = (pos === 'late' || pos === 'button') ? 'call' : 'fold';
      confidence = 45;
    } else {
      decision = 'fold';
      confidence = 80;
    }

    // Adjust decision based on position
    if (pos === 'button' || pos === 'small blind' || pos === 'big blind') {
      if (decision === 'fold' && confidence < 70) {
        decision = 'call';
        confidence -= 20;
      }
    }

    return { decision, confidence };
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

    // Handtyp bestimmen für die Erklärung
    let handType = '';
    if (isPair) {
      if (card1Value >= values.indexOf('J')) {
        handType = 'Premium Paar';
      } else if (card1Value >= values.indexOf('8')) {
        handType = 'Mittleres Paar';
      } else {
        handType = 'Kleines Paar';
      }
    } else if (card1Value === values.indexOf('A') && card2Value === values.indexOf('K')) {
      handType = isSuited ? 'Premium Hand (AK suited)' : 'Starke Hand (AK offsuit)';
    } else if ((card1Value === values.indexOf('A') || card2Value === values.indexOf('A')) && isSuited) {
      handType = 'Ass mit gleicher Farbe';
    } else if (isConnector && isSuited) {
      handType = lowCard >= values.indexOf('9') ? 'Suited Connector (hoch)' : 'Suited Connector';
    } else if (highCard >= values.indexOf('Q') && lowCard >= values.indexOf('9')) {
      handType = 'Hohe Karten';
    } else {
      handType = 'Schwache Starthand';
    }

    const handData = { isPair, card1Value, isSuited, highCard, lowCard, isConnector };

    // Entscheidung für die aktuelle Position
    const currentResult = getDecisionForPosition(handData, position);

    // Entscheidungen für alle Positionen berechnen (für Positionsvergleich)
    const decisionByPosition = {};
    positions.forEach(pos => {
      decisionByPosition[pos] = getDecisionForPosition(handData, pos);
    });

    setResult({
      decision: currentResult.decision,
      explanation: handType,
      confidence: currentResult.confidence,
      decisionByPosition: decisionByPosition
    });
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
    const handSuits = allCards.map(card => card.charAt(card.charAt(0) === '1' ? 2 : 1));
    const suitCounts = {};
    handSuits.forEach(suit => {
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

    // Funktionen für alle Positionen
    const getDecisionForFlopPosition = (pos) => {
      // Decide on post-flop action
      let decision = 'fold';
      let confidence = 0;

      if (handEvaluation.strength >= 7) {
        // Full house or better
        decision = 'raise';
        confidence = 95;
      } else if (handEvaluation.strength >= 5) {
        // Straight or flush
        decision = 'raise';
        confidence = 85;
      } else if (handEvaluation.strength === 4) {
        // Three of a kind
        decision = 'raise';
        confidence = 75;
      } else if (handEvaluation.strength === 3) {
        // Two pair
        decision = 'call';
        confidence = 65;
      } else if (handEvaluation.strength === 2) {
        // Pair
        if (drawPotential > 20) {
          decision = 'call';
          confidence = 60;
        } else {
          decision = pos === 'early' ? 'fold' : 'call';
          confidence = 50;
        }
      } else {
        // High card
        if (drawPotential > 25) {
          decision = 'call';
          confidence = 55;
        } else if (drawPotential > 0) {
          decision = pos === 'early' ? 'fold' : 'call';
          confidence = 40;
        } else {
          decision = 'fold';
          confidence = 75;
        }
      }

      // Adjust decision based on position
      if ((pos === 'button' || pos === 'late') && decision === 'fold' && confidence < 70) {
        decision = 'call';
        confidence -= 15;
      }

      return { decision, confidence };
    };

    // Entscheidung für die aktuelle Position
    const currentResult = getDecisionForFlopPosition(position);

    // Entscheidungen für alle Positionen
    const decisionByPosition = {};
    positions.forEach(pos => {
      decisionByPosition[pos] = getDecisionForFlopPosition(pos);
    });

    // Erklärung zusammensetzen
    let explanation = handEvaluation.name;

    if (handEvaluation.strength >= 7) {
      explanation += " - Sehr starke Hand";
    } else if (handEvaluation.strength >= 5) {
      explanation += " - Starke Hand";
    } else if (handEvaluation.strength === 4) {
      explanation += " - Gute Hand";
    } else if (handEvaluation.strength === 3) {
      explanation += " - Solide Hand";
    } else if (handEvaluation.strength === 2) {
      if (drawPotential > 20) {
        explanation += ` mit Draw-Potential: ${drawExplanation}`;
      } else {
        explanation += " - Mittlere Hand";
      }
    } else {
      if (drawPotential > 25) {
        explanation += ` mit starkem Draw-Potential: ${drawExplanation}`;
      } else if (drawPotential > 0) {
        explanation += ` mit Draw-Potential: ${drawExplanation}`;
      } else {
        explanation += " - Schwache Hand";
      }
    }

    setResult({
      decision: currentResult.decision,
      explanation: explanation,
      confidence: currentResult.confidence,
      decisionByPosition: decisionByPosition
    });
  };

  return (
      <div className="poker-container">
        <h1 className="heading">Poker Hand Advisor</h1>

        <div className="controls-area">
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

          <div className="position-dropdown">
            <button className="dropdown-button" onClick={togglePositions}>
              Position: {position} ▼
            </button>
            {showPositions && (
                <div className="dropdown-content">
                  {positions.map(pos => (
                      <button
                          key={pos}
                          className={`dropdown-item ${position === pos ? 'active' : ''}`}
                          onClick={() => {
                            setPosition(pos);
                            setShowPositions(false);
                            // Ergebnis aktualisieren, wenn bereits eine Analyse vorliegt
                            if (result && result.decisionByPosition) {
                              setResult({
                                ...result,
                                decision: result.decisionByPosition[pos].decision,
                                confidence: result.decisionByPosition[pos].confidence
                              });
                            }
                          }}
                      >
                        {pos}
                      </button>
                  ))}
                </div>
            )}
          </div>
        </div>

        <div className="selected-cards">
          <div className="selected-info">
            {gameStage === 'preflop' ? (
                <div>
                  Deine Karten: {
                  selectedCards.length > 0
                      ? selectedCards.map(card => renderCard(card)).map((card, i) =>
                          <span key={i}>{i > 0 ? ' ' : ''}{card}</span>
                      )
                      : 'Keine ausgewählt'
                }
                </div>
            ) : (
                <>
                  <div>
                    Deine Karten: {
                    selectedCards.map(card => renderCard(card)).map((card, i) =>
                        <span key={i}>{i > 0 ? ' ' : ''}{card}</span>
                    )
                  }
                  </div>
                  <div>
                    Flop: {
                    flopCards.length > 0
                        ? flopCards.map(card => renderCard(card)).map((card, i) =>
                            <span key={i}>{i > 0 ? ' ' : ''}{card}</span>
                        )
                        : 'Keine ausgewählt'
                  }
                  </div>
                </>
            )}
          </div>
          <button className="reset-button" onClick={resetCards}>
            {gameStage === 'preflop' ? 'Karten zurücksetzen' : 'Flop zurücksetzen'}
          </button>
        </div>

        <div className="card-selection-area">
          <div className="suits-bar">
            {suits.map(suit => (
                <button
                    key={suit}
                    className={`suit-button ${suit === '♥' || suit === '♦' ? 'red' : ''} ${activeSuit === suit ? 'active' : ''}`}
                    onClick={() => toggleSuit(suit)}
                >
                  {suit}
                </button>
            ))}
          </div>

          {activeSuit && (
              <div className="values-grid">
                {values.map(value => {
                  const card = `${value}${activeSuit}`;
                  const isSelected = gameStage === 'preflop'
                      ? selectedCards.includes(card)
                      : flopCards.includes(card);
                  const isDisabled = (gameStage === 'flop' && selectedCards.includes(card)) ||
                      (gameStage === 'preflop' && selectedCards.length === 2 && !selectedCards.includes(card)) ||
                      (gameStage === 'flop' && flopCards.length === 3 && !flopCards.includes(card));

                  return (
                      <button
                          key={card}
                          className={`value-button ${isSelected ? 'selected' : ''} ${activeSuit === '♥' || activeSuit === '♦' ? 'red' : ''}`}
                          onClick={() => handleCardClick(card)}
                          disabled={isDisabled}
                      >
                        {value}
                      </button>
                  );
                })}
              </div>
          )}
        </div>

        <div className="action-buttons">
          <button
              className="analyze-button"
              onClick={analyzeHand}
              disabled={
                  (gameStage === 'preflop' && selectedCards.length !== 2) ||
                  (gameStage === 'flop' && (selectedCards.length !== 2 || flopCards.length !== 3))
              }
          >
            Hand analysieren
          </button>

          <button
              className="reset-all-button"
              onClick={resetAll}
          >
            Alles zurücksetzen
          </button>
        </div>

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

              {showPositionImpact && (
                  <div className="position-impact">
                    <h3 className="impact-title">Positionseinfluss:</h3>
                    <div className="position-table">
                      <div className="position-row header">
                        <div className="position-cell">Position</div>
                        <div className="position-cell">Aktion</div>
                      </div>
                      {positions.map(pos => (
                          <div
                              key={pos}
                              className={`position-row ${position === pos ? 'active' : ''}`}
                          >
                            <div className="position-cell">{pos}</div>
                            <div className={`position-cell action ${result.decisionByPosition[pos].decision}`}>
                              {result.decisionByPosition[pos].decision.toUpperCase()}
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>
        )}
      </div>
  );
};

export default PokerAdvisor;