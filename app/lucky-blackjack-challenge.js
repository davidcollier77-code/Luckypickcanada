'use client';

import React, { useState } from 'react';
import LuckyCardReveal from './lucky-card-reveal'; 

export default function LuckyBlackjackChallenge() {
  const [gameState, setGameState] = useState('idle');
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [deck, setDeck] = useState([]);
  const [message, setMessage] = useState('Beat the Dealer for Lucky Picks!');
  const [selectedQuote, setSelectedQuote] = useState('');

  // Fisher-Yates Shuffle
  const shuffleDeck = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const startNewGame = () => {
    const newDeck = shuffleDeck([...Array(52).keys()]);
    setPlayerHand([newDeck.pop(), newDeck.pop()]);
    setDealerHand([newDeck.pop(), newDeck.pop()]);
    setDeck(newDeck);
    setGameState('playing');
    setMessage('Good luck!');
  };

  const hit = () => {
    const newDeck = [...deck];
    setPlayerHand([...playerHand, newDeck.pop()]);
    setDeck(newDeck);
  };

  const stand = () => {
    // Basic dealer logic for demonstration
    let dScore = 18; // Simplified for this example
    let pScore = playerHand.reduce((acc, card) => acc + (card % 13 + 1), 0);

    if (dScore > 21 || pScore > dScore) {
      setGameState('won');
      setMessage('🎉 YOU WIN! Claim Your Lucky Pick!');
      
      const quotes = [
        "A little luck can open a world of possibilities.",
        "Today, luck found its way to you.",
        "Great moments begin with a little bit of luck.",
        "Your lucky moment has arrived.",
        "Trust the journey. Your luck is shining bright.",
        "The cards aligned, and luck smiled your way.",
        "Every win starts with a little magic.",
        "A spark of luck can create something amazing.",
        "Keep believing — your lucky story continues.",
        "Good fortune is closer than you think."
      ];
      setSelectedQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    } else {
      setGameState('lost');
      setMessage('Dealer wins this time!');
    }
  };

  return (
    <div style={{ padding: '20px', background: '#0a0b1e', color: '#fff', borderRadius: '15px', border: '2px solid #FFB300' }}>
      <h1>LuckyPick Blackjack</h1>
      <p>{message}</p>

      {gameState === 'won' && (
        <div style={{ marginTop: '20px' }}>
          <LuckyCardReveal quote={selectedQuote} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
        {gameState === 'playing' ? (
          <>
            <button onClick={hit} style={{ padding: '10px 20px', cursor: 'pointer' }}>Hit</button>
            <button onClick={stand} style={{ padding: '10px 20px', cursor: 'pointer' }}>Stand</button>
          </>
        ) : gameState === 'idle' ? (
          <button onClick={startNewGame} style={{ padding: '10px 20px', cursor: 'pointer' }}>Deal Cards</button>
        ) : gameState === 'lost' || gameState === 'push' ? (
          <button onClick={startNewGame} style={{ padding: '10px 20px', cursor: 'pointer' }}>Play Again</button>
        ) : (
          <p style={{ color: '#FFB300' }}>Refresh page to play again!</p>
        )}
      </div>
    </div>
  );
}
