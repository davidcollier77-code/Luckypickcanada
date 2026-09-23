    }
  };

  const triggerCardDraw = () => {
    stopAll();

    const card = selectWeightedLuckyCard(previousCardId);
    activeTierRef.current = card.tier;
    activeCardRef.current = card;
    card.quote = selectRandomQuote(previousQuote);
    isRevealedRef.current = false;

    setSelectedCard(card);

    setIsRevealed(false);
    setIsGenerating(true);
    setImageError(false);

    requestAnimationFrame(() => {
      if (bgCanvasRef.current) {
        bgCanvasRef.current.width = window.innerWidth;
        bgCanvasRef.current.height = window.innerHeight;
      }
      if (fgCanvasRef.current) {
        fgCanvasRef.current.width = window.innerWidth;
        fgCanvasRef.current.height = window.innerHeight;
      }

      if (!shouldReduceMotion) {
        rafRef.current = requestAnimationFrame(renderCanvas);
      }
    });
    rafStartTimeRef.current = 0;

    if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
            cardMetricsRef.current = {
                cx: rect.left + rect.width / 2,
                cy: rect.top + rect.height / 2,
                w: rect.width,
                h: rect.height
            };
        }
    }

    const { cx, cy, w: cardW, h: cardH } = cardMetricsRef.current;

    particlesRef.current = {
      pools: Array.from({ length: 5 }, () => ({
        u: -0.76 + Math.random() * 1.52,
        lift: 1 + Math.random() * 3,
        width: 10 + Math.random() * 13,
        height: 4 + Math.random() * 8,
      })),
      drips: Array.from({ length: 11 }, (_, index) => {
        const edge = index < 3 ? 'left' : index < 6 ? 'right' : 'bottom';
        return {
          edge,
          start: edge === 'bottom' ? -0.84 + Math.random() * 1.68 : -0.32 + Math.random() * 0.62,
          offset: (Math.random() - 0.5) * 4,
          length: edge === 'bottom'
            ? 18 + Math.random() * 82
            : 24 + Math.random() * 96,
          width: 2.2 + Math.random() * 4.6,
          sway: edge === 'bottom'
            ? 4 + Math.random() * 14
            : 4 + Math.random() * 11,
          phase: Math.random() * Math.PI * 2,
          delay: Math.random() * 0.12,
          duration: 0.8 + Math.random() * 1.55,
          detach: Math.random() > 0.28,
          detachDistance: 12 + Math.random() * 38,
          detachSway: (Math.random() - 0.5) * 22,
        };
      }),
      sparks: Array.from({ length: 24 }, () => {
        const fromBottom = Math.random() > 0.35;
        const side = Math.random() > 0.5 ? -1 : 1;
        return {
          x: cx + (fromBottom ? (-0.44 + Math.random() * 0.88) * cardW * 0.5 : side * cardW * 0.47),
          y: fromBottom
            ? cy + cardH * 0.5 - Math.random() * 12
            : cy + (0.28 + Math.random() * 0.58) * cardH - cardH * 0.5,
          vx: (Math.random() - 0.5) * 28,
          vy: 8 + Math.random() * 42,
          gravity: 22 + Math.random() * 34,
          drift: 4 + Math.random() * 13,
          phase: Math.random() * Math.PI * 2,
          delay: 0.05 + Math.random() * 0.95,
          duration: 0.75 + Math.random() * 1.35,
          size: 1 + Math.random() * 1.65,