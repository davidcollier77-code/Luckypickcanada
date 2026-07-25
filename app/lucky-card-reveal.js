  const [revealState, setRevealState] = useState('closed');
  const [selectedCard, setSelectedCard] = useState(null);
  const isRevealing = revealState === 'revealing';
  const isRevealed = revealState === 'revealed';
  const activeCard = selectedCard || premiumLuckyCards[0];

  function revealCard() {
    if (revealState !== 'closed') {
      return;
    }

    const nextCard = pickRandomLuckyCard();
    setSelectedCard(nextCard);
    setRevealState('revealing');
    window.setTimeout(() => setRevealState('revealed'), 1450);
  }

  return (
    <section aria-labelledby="lucky-card-title" style={{ marginTop: '1.25rem', padding: 'clamp(1.25rem, 3vw, 1.9rem)', borderRadius: 34, background: 'radial-gradient(circle at 16% 18%, rgba(250, 204, 21, 0.34), transparent 28%), radial-gradient(circle at 84% 10%, rgba(16, 185, 129, 0.34), transparent 24%), radial-gradient(circle at 50% 105%, rgba(185, 28, 28, 0.18), transparent 34%), linear-gradient(145deg, rgba(2, 6, 23, 0.98), rgba(4, 31, 27, 0.9) 48%, rgba(14, 9, 5, 0.96))', color: '#fff7d6', border: '1px solid rgba(255, 235, 160, 0.38)', boxShadow: '0 36px 110px rgba(0, 0, 0, 0.58), 0 0 64px rgba(250, 204, 21, 0.26), 0 0 42px rgba(16,185,129,0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12)', overflow: 'hidden', textAlign: 'center', position: 'relative', backdropFilter: 'blur(18px) saturate(140%)' }}>
      <style>{`
        @keyframes premium-deck-shake {
          0%, 100% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) translate3d(0, 0, 0); }
          12% { transform: rotateX(5deg) rotateY(-10deg) rotateZ(-2.8deg) translate3d(-4px, -2px, 16px); }
          24% { transform: rotateX(-3deg) rotateY(10deg) rotateZ(2.6deg) translate3d(4px, 2px, 18px); }
          38% { transform: rotateX(4deg) rotateY(-7deg) rotateZ(-1.8deg) translate3d(-3px, 0, 20px); }
          54% { transform: rotateX(-2deg) rotateY(7deg) rotateZ(1.6deg) translate3d(3px, -1px, 18px); }
          70% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) translate3d(0, 0, 8px); }
        }

        @keyframes premium-card-idle-glow {
          0%, 100% { filter: drop-shadow(0 0 18px rgba(250, 204, 21, 0.44)); transform: translateY(0) rotateX(0deg); }
          50% { filter: drop-shadow(0 0 34px rgba(255, 247, 214, 0.74)); transform: translateY(-3px) rotateX(2deg); }
        }

        @keyframes premium-card-twinkle {
          0%, 100% { opacity: 0.18; transform: scale(0.58) rotate(0deg); }
          45% { opacity: 1; transform: scale(1.36) rotate(28deg); }
        }

        @keyframes premium-card-orbit {
          from { transform: rotate(0deg) translateX(8px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(8px) rotate(-360deg); }
        }

        @keyframes premium-final-glow {
