'use clien'use client';

import React, { useState } from 'react';

/**
 * LuckyCardReveal
 * Handles the interactive card flip, shake, and reveal animation.
 */
export default function LuckyCardReveal({ quote }) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* Container with pulse-card class for the idle glow effect */}
      <div 
        onClick={handleReveal}
        className={`pulse-card relative w-64 h-96 cursor-pointer transition-transform duration-500 transform ${isRevealed ? 'rotate-y-180' : ''}`}
        style={{ perspective: '1000px' }}
      >
        <div className="w-full h-full bg-gradient-to-br from-amber-400 to-red-600 rounded-xl shadow-xl flex items-center justify-center text-white text-xl font-bold p-6 text-center border-2 border-white">
           {isRevealed ? (
             <div className="animate-in fade-in duration-700">
               {quote || "Your Lucky Pick is waiting!"}
             </div>
           ) : (
             "Tap to Reveal Your Lucky Pick!"
           )}
        </div>
      </div>
      
      {isRevealed && (
        <p className="mt-4 text-amber-500 font-semibold animate-bounce">
          Good luck!
        </p>
      )}
    </div>
  );
}
t'

import React, { useState } from 'react';
import LuckyCardReveal from './lucky-card-reveal'; 

// Premium Card Component
const Card = ({ cardDetails, isHidden }) => {
  if (isHidden) {
    return (
      <div style={{
        width: '50px', height: '70px', background: 'linear-gradient(135deg, #FFB300 25%, #d32f2f 100%)',
        borderRadius: '6px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        border: '2px solid #fff', margin: '0 5px'
      }} />
    );
  }

  const isRed = cardDetails.includes('♥') || cardDetails.includes('♦');
  return (
    <div style={{
      width: '50px', height: '70px', background: '#fff',
      color: isRed ? '#d32f2f' : '#000', borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      border: '1px solid #ddd', margin: '0 5px'
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
    let score = 0; let aces = 0;
    hand.forEach((num) => {
      const val = (num % 13) + 1;
      if (val === 1) { aces += 1; score += 11; } 
      else { score += val > 10 ? 10 : val; }
    });
    while (score > 21 && aces > 0) { score -= 10; aces -= 1; }
    return score;
  };

  // --- New Score Display Helpers ---
  const getPlayerDisplayScore = (hand) => {
    if (hand.length === 0) return '';
    const currentScore = calculateScore(hand);
    
    // Logic for soft Aces (e.g., displaying "7 / 17")
    let rawScore = 0; let aces = 0;
    hand.forEach((num) => {
      const val = (num % 13) + 1;
      if (val === 1) aces += 1; 
      else rawScore += val > 10 ? 10 : val;
    });

    if (aces > 0 && (rawScore + 11 + (aces - 1) <= 21) && currentScore !== 21) {
      return `${currentScore - 10} / ${currentScore}`;
    }
    return currentScore;
  };

  const getDealerDisplayScore = (hand) => {
    if (hand.length === 0) return '';
    // Only calculate the first card's score while the player is taking their turn
    if (gameState === 'playing') {
      return calculateScore([hand[0]]);
    }
    return calculateScore(hand);
  };

  const startNewGame = () => {
    const newDeck = [...Array(52).keys()].sort(() => Math.random() - 0.5);
    setPlayerHand([newDeck.pop(), newDeck.pop()]);
    setDealerHand([newDeck.pop(), newDeck.pop()]);
    setDeck(newDeck);
    setGameState('playing');
    setMessage('Good luck!');
  };

  const hit = () => {
    if (gameState !== 'playing') return;
    const newHand = [...playerHand, deck.pop()];
    setPlayerHand(newHand);
    if (calculateScore(newHand) > 21) {
      setGameState('lost');
      setMessage('Bust! Dealer wins.');
    }
  };

  const stand = () => {
    if (gameState !== 'playing') return;
    
    // Dealer logic: Draw until 17 or higher
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    while (calculateScore(currentDealerHand) < 17) {
      currentDealerHand.push(currentDeck.pop());
    }
    setDealerHand(currentDealerHand);
    
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(currentDealerHand);

    if (dScore > 21 || pScore > dScore) {
      const quotes = [
        "A little luck can open a world of possibilities.", "Today, luck found its way to you.",
        "Great moments begin with a little bit of luck.", "Your lucky moment has arrived.",
        "Trust the journey. Your luck is shining bright.", "The cards aligned, and luck smiled your way.",
        "Every win starts with a little magic.", "A spark of luck can create something amazing.",
        "Keep believing — your lucky story continues.", "Good fortune is closer than you think."
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
      <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>{message}</p>
      
      <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #FFB300', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)' }}>
        
        {/* Dealer Area */}
        <div style={{ marginBottom: '15px' }}>
          <strong>Dealer:</strong> 
          {dealerHand.length > 0 && (
            <span style={{ marginLeft: '10px', color: '#FFB300', fontWeight: 'bold' }}>
              {getDealerDisplayScore(dealerHand)}
            </span>
          )}
          <div style={{ display: 'flex', marginTop: '5px' }}>
             {dealerHand.map((num, i) => (
               <Card 
                 key={i} 
                 cardDetails={getCardDetails(num)} 
                 isHidden={gameState === 'playing' && i === 1} 
               />
             ))}
          </div>
        </div>
        
        {/* Player Area */}
        <div>
          <strong>Your Hand:</strong> 
          {playerHand.length > 0 && (
            <span style={{ marginLeft: '10px', color: '#FFB300', fontWeight: 'bold' }}>
              {getPlayerDisplayScore(playerHand)}
            </span>
          )}
          <div style={{ display: 'flex', marginTop: '5px' }}>
            {playerHand.map((num, i) => <Card key={i} cardDetails={getCardDetails(num)} />)}
          </div>
        </div>

      </div>

      {gameState === 'won' && (
        <div style={{ marginTop: '20px' }}>
            <LuckyCardReveal quote={selectedQuote} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        {gameState === 'playing' ? (
          <>
            <button onClick={hit} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300', fontWeight: 'bold', border: 'none', borderRadius: '4px', color: '#000' }}>Hit</button>
            <button onClick={stand} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300', fontWeight: 'bold', border: 'none', borderRadius: '4px', color: '#000' }}>Stand</button>
          </>
        ) : (
          <button onClick={startNewGame} style={{ padding: '10px 20px', cursor: 'pointer', background: '#FFB300', fontWeight: 'bold', border: 'none', borderRadius: '4px', color: '#000' }}>
            {gameState === 'idle' ? 'Deal New Game' : 'Play Again'}
          </button>
        )}
      </div>
    </div>
  );
}
