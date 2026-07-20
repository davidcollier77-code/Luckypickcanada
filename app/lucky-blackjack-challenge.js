'use client';

import { useMemo, useState } from 'react';

const suits = [
  { id: 'hearts', symbol: '♥', label: 'Hearts', color: '#b91c1c' },
  { id: 'diamonds', symbol: '♦', label: 'Diamonds', color: '#dc2626' },
  { id: 'clubs', symbol: '♣', label: 'Clubs', color: '#064e3b' },
  { id: 'spades', symbol: '♠', label: 'Spades', color: '#111827' },
];

const ranks = [
  { rank: 'A', value: 11, label: 'Ace' },
  { rank: '2', value: 2, label: 'Two' },
  { rank: '3', value: 3, label: 'Three' },
  { rank: '4', value: 4, label: 'Four' },
  { rank: '5', value: 5, label: 'Five' },
  { rank: '6', value: 6, label: 'Six' },
  { rank: '7', value: 7, label: 'Seven' },
  { rank: '8', value: 8, label: 'Eight' },
  { rank: '9', value: 9, label: 'Nine' },
  { rank: '10', value: 10, label: 'Ten' },
  { rank: 'J', value: 10, label: 'Jack' },
  { rank: 'Q', value: 10, label: 'Queen' },
  { rank: 'K', value: 10, label: 'King' },
];

const resultCopy = {
  win: {
    title: '🏆 YOU WIN!',
    messages: [
      'The cards were feeling lucky today! Enjoy your winning hand!',
      'A golden hand for a lucky Canadian moment. Keep that clover energy close!',
      'Your LuckyPickCanada streak just found the spotlight. Nicely played!',
    ],
  },
  push: {
    title: '🤝 PUSH!',
    messages: [
      'Perfect balance! The cards stayed even — your luck continues!',
      'A polished draw with premium poise. The table is keeping your luck warm!',
      'Even cards, even brighter chances. Your next lucky hand is waiting!',
    ],
  },
  lose: {
    title: '💥 BUST!',
    messages: [
      'The luck took a little detour this hand. Every new deal brings a fresh chance!',
      'A quick clover reset for the table. Fresh cards can flip the fortune fast!',
      'The hand cooled off, but the LuckyPickCanada glow is ready for the next deal!',
    ],
  },
};

function createDeck() {
  return suits.flatMap((suit) => ranks.map((rank) => ({ ...rank, suit: suit.id, suitSymbol: suit.symbol, suitLabel: suit.label, suitColor: suit.color, id: `${rank.rank}-${suit.id}` })));
}

function getRandomIndex(max) {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] % max;
  }

  return Math.floor(Math.random() * max);
}

function shuffleDeck(deck) {
  const shuffled = [...deck];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function scoreHand(hand) {
  let score = hand.reduce((total, card) => total + card.value, 0);
  let aces = hand.filter((card) => card.rank === 'A').length;

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
}

function getResult(playerHand, dealerHand) {
  const playerScore = scoreHand(playerHand);
  const dealerScore = scoreHand(dealerHand);

  if (playerScore > 21) {
    return 'lose';
  }

  if (dealerScore > 21 || playerScore > dealerScore) {
    return 'win';
  }

  if (playerScore === dealerScore) {
    return 'push';
  }

  return 'lose';
}

function dealGame() {
  const deck = shuffleDeck(createDeck());
  return {
    deck: deck.slice(4),
    playerHand: [deck[0], deck[2]],
    dealerHand: [deck[1], deck[3]],
    status: 'playing',
    result: null,
    resultMessageIndex: null,
  };
}

function pickResultMessageIndex(result) {
  return getRandomIndex(resultCopy[result].messages.length);
}

function completeGame(game, result) {
  return { ...game, status: 'finished', result, resultMessageIndex: pickResultMessageIndex(result) };
}

function finishDealerTurn(game) {
  const deck = [...game.deck];
  const dealerHand = [...game.dealerHand];

  while (scoreHand(dealerHand) < 17 && deck.length) {
    dealerHand.push(deck.shift());
  }

  const finalGame = { ...game, deck, dealerHand };
  return completeGame(finalGame, getResult(finalGame.playerHand, finalGame.dealerHand));
}

function PlayingCard({ card, hidden = false, index = 0 }) {
  return (
    <span className={`blackjack-card ${hidden ? 'is-hidden' : ''}`} style={{ '--deal-delay': `${index * 110}ms`, '--suit-color': card?.suitColor || '#facc15' }} aria-label={hidden ? 'Hidden dealer card' : `${card.label} of ${card.suitLabel}`}>
      <span className="blackjack-card-face blackjack-card-back-face">
        <span className="blackjack-card-back-mark">♣</span>
        <strong>LPC</strong>
      </span>
      <span className="blackjack-card-face blackjack-card-front-face">
        <span className="blackjack-card-corner top"><strong>{card?.rank}</strong><small>{card?.suitSymbol}</small></span>
        <span className="blackjack-card-center">{card?.suitSymbol}</span>
        <span className="blackjack-card-corner bottom"><strong>{card?.rank}</strong><small>{card?.suitSymbol}</small></span>
      </span>
    </span>
  );
}

function ScoreBadge({ label, score, suffix }) {
  return (
    <span className="blackjack-score-badge">
      {label}: <strong>{score}</strong>{suffix ? <small>{suffix}</small> : null}
    </span>
  );
}

export default function LuckyBlackjackChallenge() {
  const [game, setGame] = useState(() => dealGame());
  const playerScore = scoreHand(game.playerHand);
  const dealerScore = scoreHand(game.dealerHand);
  const isFinished = game.status === 'finished';
  const result = isFinished ? resultCopy[game.result] : null;
  const luckyMessage = result ? result.messages[game.resultMessageIndex ?? 0] : null;
  const dealerVisibleScore = scoreHand([game.dealerHand[0]]);
  const statusText = useMemo(() => {
    if (isFinished) {
      return game.result === 'push' ? 'The cards balanced perfectly.' : game.result === 'win' ? 'Your hand is closest to 21.' : 'The table will shine again tomorrow.';
    }

    if (playerScore === 21) {
      return 'Blackjack. Stand to reveal the computer hand.';
    }

    return 'Choose Hit for another card or Stand to reveal the computer hand.';
  }, [game.result, isFinished, playerScore]);

  function hit() {
    if (game.status !== 'playing' || !game.deck.length) {
      return;
    }

    const [nextCard, ...nextDeck] = game.deck;
    const nextPlayerHand = [...game.playerHand, nextCard];
    const nextGame = { ...game, deck: nextDeck, playerHand: nextPlayerHand };

    if (scoreHand(nextPlayerHand) > 21) {
      setGame(completeGame(nextGame, 'lose'));
      return;
    }

    setGame(nextGame);
  }

  function stand() {
    if (game.status !== 'playing') {
      return;
    }

    setGame(finishDealerTurn(game));
  }

  function newHand() {
    setGame(dealGame());
  }

  return (
    <section id="lucky-blackjack-challenge" className="lucky-blackjack" aria-labelledby="lucky-blackjack-title">
      <style>{`
        @keyframes blackjack-card-deal {
          from { opacity: 0; transform: translate3d(-34px, -42px, 0) rotate(-10deg) scale(0.92); }
          to { opacity: 1; transform: translate3d(0, 0, 0) rotate(var(--card-tilt, 0deg)) scale(1); }
        }

        @keyframes blackjack-sparkle {
          0%, 100% { opacity: 0.24; transform: scale(0.72) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.25) rotate(24deg); }
        }

        @keyframes blackjack-aurora-sweep {
          0% { transform: translateX(-24%) rotate(-8deg); opacity: 0.34; }
          50% { transform: translateX(8%) rotate(5deg); opacity: 0.72; }
          100% { transform: translateX(22%) rotate(-3deg); opacity: 0.42; }
        }

        @keyframes blackjack-result-fade-in {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .lucky-blackjack { margin-top: 2rem; padding: clamp(1.25rem, 4vw, 2.1rem); border-radius: 36px; color: #fff7d6; background: radial-gradient(circle at 12% 15%, rgba(250, 204, 21, 0.28), transparent 27%), radial-gradient(circle at 86% 12%, rgba(16, 185, 129, 0.32), transparent 28%), radial-gradient(circle at 50% 110%, rgba(185, 28, 28, 0.14), transparent 33%), linear-gradient(145deg, rgba(1, 14, 10, 0.98), rgba(4, 48, 35, 0.94) 44%, rgba(2, 8, 23, 0.96)); border: 1px solid rgba(255, 235, 160, 0.36); box-shadow: 0 36px 110px rgba(0,0,0,0.58), 0 0 60px rgba(16,185,129,0.2), 0 0 42px rgba(250,204,21,0.16), inset 0 1px 0 rgba(255,255,255,0.12); overflow: hidden; position: relative; backdrop-filter: blur(18px) saturate(140%); }
        .lucky-blackjack::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle at 15% 24%, rgba(255,255,255,0.24) 0 1px, transparent 1.5px), radial-gradient(circle at 78% 18%, rgba(250,204,21,0.42) 0 1px, transparent 1.5px), linear-gradient(135deg, transparent 0 46%, rgba(255,235,160,0.08) 49%, transparent 52%); background-size: 160px 160px, 220px 220px, auto; pointer-events: none; opacity: 0.64; }
        .lucky-blackjack::after { content: ''; position: absolute; left: -20%; top: 4%; width: 115%; height: 8rem; border-radius: 999px; background: linear-gradient(90deg, transparent, rgba(20,184,166,0.48), rgba(250,204,21,0.28), rgba(255,255,255,0.18), transparent); filter: blur(16px); animation: blackjack-aurora-sweep 13s ease-in-out infinite alternate; pointer-events: none; }
        .blackjack-content { position: relative; z-index: 1; }
        .blackjack-hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; align-items: start; }
        .blackjack-kicker { margin: 0 0 0.5rem; text-transform: uppercase; letter-spacing: 2px; color: #facc15; font-weight: 950; }
        .blackjack-title { margin: 0; font-size: clamp(2rem, 7vw, 4rem); line-height: 0.95; letter-spacing: -0.055em; background: linear-gradient(180deg, #fffdf0, #ffe88d 26%, #facc15 54%, #9a5f10); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 34px rgba(250,204,21,0.2); }
        .blackjack-copy { margin: 0.85rem 0 0; max-width: 720px; color: rgba(255,247,214,0.9); line-height: 1.65; font-size: 1.03rem; }
        .blackjack-free-badge { justify-self: end; display: grid; place-items: center; min-width: 118px; min-height: 118px; padding: 0.8rem; border-radius: 999px; text-align: center; color: #071225; font-weight: 950; text-transform: uppercase; letter-spacing: 0.8px; background: radial-gradient(circle at 32% 24%, #fff8c8, #facc15 42%, #9a5f10 100%); border: 2px solid rgba(255,247,214,0.76); box-shadow: 0 0 34px rgba(250,204,21,0.58), inset 0 3px 10px rgba(255,255,255,0.62), inset 0 -14px 22px rgba(79,45,8,0.34); }
        .blackjack-table { margin-top: 1.4rem; padding: clamp(1rem, 3vw, 1.5rem); border-radius: 32px; background: radial-gradient(circle at 50% 40%, rgba(16,185,129,0.18), transparent 33%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 10px), linear-gradient(145deg, rgba(4,78,56,0.82), rgba(2,54,42,0.96)); border: 1px solid rgba(255,235,160,0.3); box-shadow: inset 0 2px 28px rgba(0,0,0,0.4), 0 20px 50px rgba(0,0,0,0.32); position: relative; overflow: hidden; }
        .blackjack-table::before { content: '✦'; position: absolute; right: 1.1rem; top: 0.7rem; color: rgba(250,204,21,0.36); font-size: 5rem; line-height: 1; animation: blackjack-sparkle 3.6s ease-in-out infinite; }
        .blackjack-hands { display: grid; gap: 1.1rem; }
        .blackjack-hand-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .blackjack-hand-title { margin: 0; color: #fff7d6; font-size: 1.04rem; text-transform: uppercase; letter-spacing: 1.4px; }
        .blackjack-score-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.72rem; border-radius: 999px; color: #fde68a; background: rgba(2,8,23,0.38); border: 1px solid rgba(255,235,160,0.28); font-weight: 850; }
        .blackjack-score-badge small { color: rgba(255,247,214,0.72); font-weight: 800; }
        .blackjack-cards { display: flex; flex-wrap: wrap; gap: clamp(0.55rem, 2vw, 0.85rem); min-height: 144px; align-items: center; }
        .blackjack-card { --card-tilt: -1deg; width: clamp(74px, 19vw, 108px); aspect-ratio: 0.72; display: inline-block; position: relative; transform-style: preserve-3d; animation: blackjack-card-deal 520ms cubic-bezier(.16,.84,.28,1) both; animation-delay: var(--deal-delay); perspective: 900px; }
        .blackjack-card:nth-child(2n) { --card-tilt: 2deg; }
        .blackjack-card-face { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 14px; backface-visibility: hidden; overflow: hidden; transition: transform 620ms cubic-bezier(.18,.78,.24,1); }
        .blackjack-card-front-face { color: var(--suit-color); background: linear-gradient(145deg, #fffdf4, #f8fafc 54%, #f3e8c6); border: 2px solid rgba(255,247,214,0.86); box-shadow: 0 16px 34px rgba(0,0,0,0.34), inset 0 0 0 5px rgba(184,134,11,0.12), inset 0 1px 8px rgba(255,255,255,0.88); }
        .blackjack-card-front-face::before { content: ''; position: absolute; inset: 10px; border-radius: 10px; border: 1px solid rgba(121,69,12,0.18); }
        .blackjack-card-back-face { transform: rotateY(180deg); background: radial-gradient(circle at 50% 38%, rgba(250,204,21,0.34), transparent 24%), linear-gradient(145deg, #021a12, #064e3b 48%, #120a04); border: 2px solid rgba(255,247,214,0.74); box-shadow: 0 16px 34px rgba(0,0,0,0.34), inset 0 0 0 5px rgba(250,204,21,0.13); color: #facc15; }
        .blackjack-card.is-hidden .blackjack-card-front-face { transform: rotateY(180deg); }
        .blackjack-card.is-hidden .blackjack-card-back-face { transform: rotateY(0deg); }
        .blackjack-card-corner { position: absolute; display: grid; justify-items: center; line-height: 1; font-weight: 950; }
        .blackjack-card-corner.top { top: 0.55rem; left: 0.55rem; }
        .blackjack-card-corner.bottom { right: 0.55rem; bottom: 0.55rem; transform: rotate(180deg); }
        .blackjack-card-corner small { font-size: 1rem; }
        .blackjack-card-center { font-size: clamp(2.6rem, 9vw, 4.6rem); text-shadow: 0 3px 0 rgba(0,0,0,0.08); }
        .blackjack-card-back-mark { display: grid; place-items: center; width: 3.8rem; height: 3.8rem; border-radius: 50%; color: #5a3708; font-size: 2.6rem; background: radial-gradient(circle at 30% 22%, #fff8c8, #facc15 42%, #9a5f10 100%); box-shadow: 0 0 26px rgba(250,204,21,0.5), inset 0 2px 7px rgba(255,255,255,0.6); }
        .blackjack-card-back-face strong { position: absolute; bottom: 0.9rem; font-size: 0.72rem; letter-spacing: 2px; color: #fff7d6; }
        .blackjack-controls { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-top: 1.1rem; }
        .blackjack-button { min-height: 48px; padding: 0.85rem 1.1rem; border-radius: 999px; border: 1px solid rgba(255,242,180,0.82); font-weight: 950; cursor: pointer; transition: transform 180ms ease, filter 180ms ease, box-shadow 180ms ease; }
        .blackjack-button.primary { color: #06110d; background: linear-gradient(135deg, #fff8c8, #facc15 48%, #b7791f); box-shadow: 0 0 26px rgba(250,204,21,0.42), inset 0 1px 0 rgba(255,255,255,0.6); }
        .blackjack-button.secondary { color: #fff7d6; background: rgba(2,8,23,0.36); border-color: rgba(255,235,160,0.34); }
        .blackjack-button:hover:not(:disabled) { transform: translateY(-2px); filter: saturate(1.12); }
        .blackjack-button:disabled { opacity: 0.48; cursor: not-allowed; }
        .blackjack-status { margin: 0.95rem 0 0; color: rgba(255,247,214,0.88); line-height: 1.55; font-weight: 750; }
        .blackjack-result { margin-top: 1.1rem; padding: 1rem; border-radius: 24px; text-align: center; background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(250,204,21,0.16), rgba(16,185,129,0.12)); border: 1px solid rgba(255,235,160,0.36); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 40px rgba(250,204,21,0.2); animation: blackjack-result-fade-in 520ms cubic-bezier(.16,.84,.28,1) both; }
        .blackjack-result h3 { margin: 0; font-size: clamp(1.8rem, 6vw, 3rem); font-weight: 1000; letter-spacing: 0.035em; color: #fff7d6; text-shadow: 0 0 24px rgba(250,204,21,0.42), 0 2px 0 rgba(0,0,0,0.22); }
        .blackjack-lucky-message { display: inline-flex; align-items: center; justify-content: center; gap: 0.48rem; margin: 0.55rem auto 0; max-width: 620px; line-height: 1.55; color: #facc15; font-size: clamp(0.94rem, 2.6vw, 1.08rem); font-weight: 850; text-shadow: 0 0 18px rgba(250,204,21,0.24); }
        .blackjack-lucky-icon { display: inline-grid; place-items: center; width: 1.65rem; height: 1.65rem; flex: 0 0 auto; border-radius: 999px; color: #064e3b; background: radial-gradient(circle at 30% 20%, #fff8c8, #facc15 48%, #b7791f); box-shadow: 0 0 18px rgba(250,204,21,0.42), inset 0 1px 4px rgba(255,255,255,0.6); font-size: 0.95rem; }
        .blackjack-feature-links { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.7rem; margin-top: 1rem; }
        .blackjack-feature-link { padding: 0.85rem; border-radius: 18px; color: #fff7d6; text-decoration: none; background: rgba(2,8,23,0.34); border: 1px solid rgba(255,235,160,0.24); font-weight: 900; text-align: center; }
        @media (max-width: 720px) { .blackjack-hero { grid-template-columns: 1fr; } .blackjack-free-badge { justify-self: start; min-width: 96px; min-height: 96px; } .blackjack-feature-links { grid-template-columns: 1fr; } .blackjack-controls { display: grid; grid-template-columns: 1fr 1fr; } .blackjack-controls .blackjack-button:last-child { grid-column: 1 / -1; } }
      `}</style>

      <div className="blackjack-content">
        <div className="blackjack-hero">
          <div>
            <p className="blackjack-kicker">New free luck experience</p>
            <h2 id="lucky-blackjack-title" className="blackjack-title">Lucky Blackjack Challenge</h2>
            <p className="blackjack-copy">
              A polished one-hand blackjack mini-game with a realistic 52-card deck, classic suits, smooth reveals, and LuckyPickCanada maple-clover sparkle. Entertainment only: no betting, no money, no prizes, and no gambling features.
            </p>
          </div>
          <div className="blackjack-free-badge">Free<br />One Hand</div>
        </div>

        <div className="blackjack-table" aria-live="polite">
          <div className="blackjack-hands">
            <div>
              <div className="blackjack-hand-header">
                <h3 className="blackjack-hand-title">Computer hand</h3>
                <ScoreBadge label={isFinished ? 'Score' : 'Shown'} score={isFinished ? dealerScore : dealerVisibleScore} suffix={isFinished ? '' : 'one card hidden'} />
              </div>
              <div className="blackjack-cards">
                {game.dealerHand.map((card, index) => <PlayingCard key={`${card.id}-${index}`} card={card} hidden={!isFinished && index === 1} index={index} />)}
              </div>
            </div>

            <div>
              <div className="blackjack-hand-header">
                <h3 className="blackjack-hand-title">Your hand</h3>
                <ScoreBadge label="Score" score={playerScore} />
              </div>
              <div className="blackjack-cards">
                {game.playerHand.map((card, index) => <PlayingCard key={`${card.id}-${index}`} card={card} index={index + 2} />)}
              </div>
            </div>
          </div>

          <div className="blackjack-controls">
            <button type="button" className="blackjack-button primary" onClick={hit} disabled={isFinished}>Hit</button>
            <button type="button" className="blackjack-button secondary" onClick={stand} disabled={isFinished}>Stand</button>
            <button type="button" className="blackjack-button secondary" onClick={newHand}>New free hand</button>
          </div>
          <p className="blackjack-status">{statusText}</p>

          {result ? (
            <div className="blackjack-result">
              <h3>{result.title}</h3>
              <p className="blackjack-lucky-message"><span className="blackjack-lucky-icon" aria-hidden="true">🍀</span>{luckyMessage}</p>
              <div className="blackjack-controls" style={{ justifyContent: 'center' }}>
                <a href="#luck-meter-title" className="blackjack-button primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  Try Another Luck Experience
                </a>
              </div>
            </div>
          ) : null}
        </div>

        <div className="blackjack-feature-links" aria-label="Other LuckyPickCanada features">
          <a className="blackjack-feature-link" href="#luck-meter-title">Lucky Meter</a>
          <a className="blackjack-feature-link" href="#lucky-stories">Lucky Cards and Stories</a>
          <a className="blackjack-feature-link" href="#little-luck-map">Lucky Picks</a>
        </div>
      </div>
    </section>
  );
}
