'use client';

import { useState } from 'react';
import '../lucky-meter.css'; // Imports lucky-meter.css located in the app/ root folder

const fortunes = [
  { max: 20, text: "🔮 Luck: {score}% — The stars are resting. Exercise extra caution today!" },
  { max: 40, text: "✨ Luck: {score}% — Modest fortune. Small effort brings quiet gains." },
  { max: 60, text: "🌟 Luck: {score}% — Balanced alignment! A good day to make steady progress." },
  { max: 80, text: "🔥 Luck: {score}% — Strong energy surrounding you. Go take a chance!" },
  { max: 100, text: "🚀 Luck: {score}% — Astronomical luck! Everything you touch turns to gold." }
];

const ritualPhrases = [
  "Consulting the cosmic alignment...",
  "Reading the celestial gauge...",
  "Gathering luck aura...",
  "Finalizing fortune..."
];

export default function LuckyMeterPage() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [resultText, setResultText] = useState('');

  const runRitual = () => {
    setIsCalculating(true);
    let phraseIndex = 0;
    setResultText(ritualPhrases[0]);

    const phraseInterval = setInterval(() => {
      phraseIndex++;
      if (phraseIndex < ritualPhrases.length) {
        setResultText(ritualPhrases[phraseIndex]);
      }
    }, 600);

    setTimeout(() => {
      clearInterval(phraseInterval);
      setIsCalculating(false);

      const score = Math.floor(Math.random() * 100) + 1;
      const match = fortunes.find((f) => score <= f.max);
      setResultText(match.text.replace("{score}", score));
    }, 2500);
  };

  return (
    <main className="lucky-meter-page">
      <header className="lm-header">
        <h1 className="lm-title">Lucky Meter</h1>
      </header>

      <div className="meter-container">
        <img
          src="/meter.png"
          alt="Lucky Meter"
          className={`meter-image ${isCalculating ? 'calculating' : ''}`}
        />
      </div>

      <div className="button-area">
        <button
          onClick={runRitual}
          disabled={isCalculating}
          className="meter-button"
        >
          {isCalculating ? 'Reading Stars...' : 'Start Ritual'}
        </button>
      </div>

      <div className="meter-result">
        {resultText}
      </div>
    </main>
  );
}
