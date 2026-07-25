'use client';

import React, { useState } from 'react';
import LuckyCardReveal from './lucky-card-reveal'; 

// Premium Card Component
const Card = ({ cardDetails }) => {
  const isRed = cardDetails.includes('♥') || cardDetails.includes('♦');
  return (
    <div style={{
      width: '50px',
      height: '70px',
      background: 'white',
      color: isRed ? '#d32f2f' : '#000',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '1.2rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      border: '1px solid #ddd',
      margin: '0 5px'
    }}>
      {cardDetails}
    </div>
  );
};

export default function LuckyBlackjackChallenge() {
  const [gameState, setGameState] = useState('idle');
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [deck, setDeck] = useState([]);
  const [message, setMessage] = useState('Beat the Dealer for Lucky Picks!');
  const [selectedQuote, setSelectedQuote] = useState('');

  const getCardDetails = (num) => {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suits = ['♠', '♥', '♦', '♣'];
    return `${ranks[num % 13]}${suits[Math.floor(num / 13)]}`;
  };

  const calculateScore = (hand) => {
    let score = 0;
    let aces = 0;
    hand.forEach((num) => {
      const val = (num % 13) + 1;
      if (val === 1) { aces += 1; score += 11; } 
      else { score += val > 10 ? 10 : val; }
    });
    while (score > 21 && aces > 0) { score -= 10; aces -= 1; }
    return score;
  };

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
    const newHand = [...playerHand, newDeck.pop()];
    setPlayerHand(newHand);
    setDeck(newDeck);
    if (calculateScore(newHand) > 21) {
      setGameState('lost');
      setMessage('Bust! Dealer wins.');
    }
  };

  const stand = () => {
    if (gameState !== 'playing') return;
    
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(dealerHand);

    if (pScore > dScore) {
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
      <p style={{ textAlign: 'center' }}>{message}</p>
      
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #FFB300', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)' }}>
        <div style={{ marginBottom: '15px' }}>
          <strong>Dealer:</strong>
          <div style={{ display: 'flex', marginTop: '5px' }}>
             {gameState !== 'idle' ? <Card cardDetails={getCardDetails(dealerHand[0])} /> : '-'}
          </div>
        </div>
        <div>
          <strong>Your Hand:</strong>
          <div style={{ display: 'flex', marginTop: '5px' }}>
            {playerHand.map((num, i) => <Card key={i} cardDetails={getCardDetails(num)} />)}
          </div>
        </div>
      </div>

      {gameState === 'won' && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <LuckyCardReveal quote={selectedQuote} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        {gameState === 'playing' ? (
          <>
            <button onClick={hit} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300' }}>Hit</button>
            <button onClick={stand} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300' }}>Stand</button>
          </>
        ) : (
          <button onClick={startNewGame} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300' }}>
            {gameState === 'idle' ? 'Deal' : 'Play Again'}
          </button>
        )}
      </div>
    </div>
  );
}
