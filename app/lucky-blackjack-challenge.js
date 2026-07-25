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
    if (gameState !== 'playing') return;
    const newDeck = [...deck];
    setPlayerHand([...playerHand, newDeck.pop()]);
    setDeck(newDeck);
  };

  const stand = () => {
    if (gameState !== 'playing') return;
    
    let dScore = 18; 
    let pScore = playerHand.reduce((acc, card) => acc + (card % 13 + 1), 0);

    if (dScore > 21 || pScore > dScore) {
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
      setGameState('won');
      setMessage('🎉 YOU WIN! Claim Your Lucky Pick!');
    } else {
      setGameState('lost');
      setMessage('Dealer wins this time!');
    }
  };

  return (
    <div style={{ padding: '30px', background: '#0a0b1e', color: '#fff', borderRadius: '15px', border: '2px solid #FFB300', maxWidth: '500px', margin: 'auto' }}>
      <h1 style={{ color: '#FFB300', textAlign: 'center' }}>LuckyPick Blackjack</h1>
      <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>{message}</p>

      {/* Card Display Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', margin: '20px 0', padding: '15px', border: '1px dashed #FFB300' }}>
        <div style={{ textAlign: 'center' }}>
          <strong>Dealer Hand:</strong> {gameState !== 'idle' ? 'Hidden' : '-'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <strong>Player Hand:</strong> {playerHand.map((c) => (c % 13 + 1)).join(', ')}
        </div>
      </div>

      {/* Quote Display Section */}
      {gameState === 'won' && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <LuckyCardReveal quote={selectedQuote} />
        </div>
      )}

      {/* Game Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
        {gameState === 'playing' ? (
          <>
            <button onClick={hit} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300', color: '#000', fontWeight: 'bold' }}>Hit</button>
            <button onClick={stand} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300', color: '#000', fontWeight: 'bold' }}>Stand</button>
          </>
        ) : gameState === 'lost' ? (
          <button onClick={startNewGame} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300', color: '#000', fontWeight: 'bold' }}>
            Try Again
          </button>
        ) : (
          <button onClick={startNewGame} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300', color: '#000', fontWeight: 'bold' }}>
            {gameState === 'idle' ? 'Deal New Game' : 'Play Again'}
          </button>
        )}
      </div>
      
      {gameState === 'won' && (
        <p style={{ textAlign: 'center', color: '#FFB300', marginTop: '15px' }}>*Refresh to start fresh*</p>
      )}
    </div>
  );
}
