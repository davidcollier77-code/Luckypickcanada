  const handleReveal = () => {
    alert("Click received!"); // <--- ADD THIS LINE
    
    if (isTestMode || (!isRevealed && !isGenerating)) {
      triggerCardDraw(); 
    }
  };
