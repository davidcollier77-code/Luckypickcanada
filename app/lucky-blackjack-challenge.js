'use client';

import React, { useState, useTransition } from 'react';
// Import your existing component
import LuckyCardReveal from './lucky-card-reveal'; 

// ... (Keep the CustomLogo code exactly as it was) ...

export default function LuckyBlackjackChallenge() {
  const [gameState, setGameState] = useState('idle');
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [deck, setDeck] = useState([]);
  const [message, setMessage] = useState('Beat the Dealer for Lucky Picks!');
  const [selectedQuote, setSelectedQuote] = useState('');
  const [, startTransition] = useTransition();

  // ... (Keep your shuffle and helper functions exactly as they were) ...

  const stand = () => {
    // ... (Keep your existing stand logic) ...
    // Inside your 'won' block:
    if (dScore > 21 || pScore > dScore) {
      setGameState('won');
      setMessage('🎉 YOU WIN! Claim Your Lucky Pick!');
      const quotes = ["Fortune favors the bold!", "Your luck is blooming today!", "A golden opportunity awaits!", "Victory looks good on you!"];
      setSelectedQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    } 
    // ...
  };

  return (
    <div style={{ /* ... your existing styles ... */ }}>
      {/* ... your existing logo and hand display code ... */}

      {/* 1. Only show the card if we won */}
      {gameState === 'won' && (
        <div style={{ marginTop: '20px' }}>
          <LuckyCardReveal quote={selectedQuote} />
        </div>
      )}

      {/* 2. Modified Button Logic to "Lock" the game */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
        {gameState === 'playing' ? (
          <>
            <button onClick={hit} style={{ /* ... styles ... */ }}>Hit</button>
            <button onClick={stand} style={{ /* ... styles ... */ }}>Stand</button>
          </>
        ) : gameState === 'idle' ? (
          <button onClick={startNewGame} style={{ /* ... styles ... */ }}>Deal Cards</button>
        ) : gameState === 'lost' || gameState === 'push' ? (
          <button onClick={startNewGame} style={{ /* ... styles ... */ }}>Play Again</button>
        ) : (
          // If gameState === 'won', we render NOTHING here, locking the game.
          <p style={{ color: '#FFB300' }}>Refresh page to play again!</p>
        )}
      </div>
    </div>
  );
}
