'use client';

import React, { useState, useEffect, useTransition } from 'react';

// Pure CSS / SVG Gilded Maple Leaf & Clover Logo
const CustomLogo = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE082" />
        <stop offset="50%" stopColor="#FFB300" />
        <stop offset="100%" stopColor="#FF6F00" />
      </linearGradient>
      <linearGradient id="auroraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00E676" />
        <stop offset="100%" stopColor="#00B0FF" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" stroke="url(#goldGrad)" strokeWidth="3" fill="#0A1913" />
    <circle cx="38" cy="38" r="14" fill="url(#auroraGrad)" opacity="0.8" />
    <circle cx="62" cy="38" r="14" fill="url(#auroraGrad)" opacity="0.8" />
    <circle cx="38" cy="62" r="14" fill="url(#auroraGrad)" opacity="0.8" />
    <circle cx="62" cy="62" r="14" fill="url(#auroraGrad)" opacity="0.8" />
    <path d="M50 20 L54 32 L64 28 L58 38 L68 44 L56 50 L58 64 L50 56 L42 64 L44 50 L32 44 L42 38 L36 28 L46 32 Z" fill="url(#goldGrad)" />
    <rect x="48" y="58" width="4" height="22" rx="2" fill="url(#goldGrad)" />
  </svg>
);

export default function LuckyBlackjackChallenge() {
  const [gameState, setGameState] = useState('idle');
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [deck, setDeck] = useState([]);
  const [message, setMessage] = useState('Beat the Dealer for Lucky Picks!');
  const [, startTransition] = useTransition();

  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let newDeck = [];
    for (let s of suits) {
      for (let v of values) {
        let numericValue = parseInt(v);
        if (['J', 'Q', 'K'].includes(v)) numericValue = 10;
        if (v === 'A') numericValue = 11;
        newDeck.push({ suit: s, value: v, numericValue });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const calculateScore = (hand) => {
    let score = hand.reduce((acc, card) => acc + card.numericValue, 0);
    let aces = hand.filter(card => card.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const startNewGame = () => {
    const newDeck = createDeck();
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setMessage('Your Turn: Hit or Stand?');
  };

  const hit = () => {
    if (gameState !== 'playing' || deck.length === 0) return;
    const newDeck = [...deck];
    const card = newDeck.pop();
    const newHand = [...playerHand, card];
    
    setDeck(newDeck);
    setPlayerHand(newHand);
    
    if (calculateScore(newHand) > 21) {
      setGameState('lost');
      setMessage('Bust! Dealer Wins.');
    }
  };

  const stand = () => {
    if (gameState !== 'playing') return;
    
    let currentDeck = [...deck];
    let currentDealerHand = [...dealerHand];
    
    while (calculateScore(currentDealerHand) < 17 && currentDeck.length > 0) {
      currentDealerHand.push(currentDeck.pop());
    }
    
    const pScore = calculateScore(playerHand);
    const dScore = calculateScore(currentDealerHand);
    
    setDealerHand(currentDealerHand);
    setDeck(currentDeck);
    
    startTransition(() => {
      if (dScore > 21 || pScore > dScore) {
        setGameState('won');
        setMessage('🎉 YOU WIN! Claim Your Lucky Pick!');
      } else if (dScore > pScore) {
        setGameState('lost');
        setMessage('Dealer Wins. Try Again!');
      } else {
        setGameState('push');
        setMessage("It's a Tie! Play Again.");
      }
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #05130E 0%, #0A2218 50%, #040D09 100%)',
      border: '2px solid #FFB300',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '500px',
      margin: '20px auto',
      boxShadow: '0px 10px 30px rgba(0, 230, 118, 0.15), 0px 0px 15px rgba(255, 179, 0, 0.3)',
      color: '#FFFFFF',
      fontFamily: 'sans-serif',
      textAlign: 'center'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
        <CustomLogo />
        <h2 style={{
          background: 'linear-gradient(90deg, #FFE082, #FFB300)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '10px 0 4px 0'
        }}>
          LuckyPick Canada Blackjack
        </h2>
        <p style={{ color: '#00E676', fontSize: '14px', margin: 0 }}>{message}</p>
      </div>

      {gameState !== 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', color: '#FFB300', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              Dealer ({gameState === 'playing' ? '?' : calculateScore(dealerHand)})
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {dealerHand.map((card, idx) => (
                <div key={idx} style={{
                  width: '45px',
                  height: '65px',
                  background: idx === 1 && gameState === 'playing' ? '#1A3A2A' : '#FFF',
                  color: ['♥', '♦'].includes(card.suit) ? '#D32F2F' : '#212121',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: idx === 1 && gameState === 'playing' ? '1px solid #00E676' : 'none'
                }}>
                  {idx === 1 && gameState === 'playing' ? '?' : `${card.value}${card.suit}`}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
            <p style={{ fontSize: '12px', color: '#00E676', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              You ({calculateScore(playerHand)})
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {playerHand.map((card, idx) => (
                <div key={idx} style={{
                  width: '45px',
                  height: '65px',
                  background: '#FFF',
                  color: ['♥', '♦'].includes(card.suit) ? '#D32F2F' : '#212121',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {card.value}{card.suit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {gameState === 'idle' || gameState !== 'playing' ? (
          <button onClick={startNewGame} style={{
            background: 'linear-gradient(180deg, #FFD54F 0%, #FFB300 100%)',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '25px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(255, 179, 0, 0.4)'
          }}>
            {gameState === 'idle' ? 'Deal Cards' : 'Play Again'}
          </button>
        ) : (
          <>
            <button onClick={hit} style={{
              background: '#00E676',
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '20px',
              cursor: 'pointer'
            }}>
              Hit
            </button>
            <button onClick={stand} style={{
              background: '#FF5252',
              color: '#FFF',
              border: 'none',
              padding: '10px 20px',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '20px',
              cursor: 'pointer'
            }}>
              Stand
            </button>
          </>
        )}
      </div>
    </div>
  );
}
