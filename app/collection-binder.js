"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';


const SERIES_1_PLACEHOLDERS = [
  // 5 Standard Tier
  { id: 'placeholder-std-1', title: 'Placeholder Standard 1', tier: 'standard', image: '/placeholder1.png' },
  { id: 'placeholder-std-2', title: 'Placeholder Standard 2', tier: 'standard', image: '/placeholder2.png' },
  { id: 'placeholder-std-3', title: 'Placeholder Standard 3', tier: 'standard', image: '/placeholder3.png' },
  { id: 'placeholder-std-4', title: 'Placeholder Standard 4', tier: 'standard', image: '/placeholder4.png' },
  { id: 'placeholder-std-5', title: 'Placeholder Standard 5', tier: 'standard', image: '/placeholder5.png' },
  // 3 Premium Tier
  { id: 'placeholder-prm-1', title: 'Placeholder Premium 1', tier: 'premium', image: '/placeholder6.png' },
  { id: 'placeholder-prm-2', title: 'Placeholder Premium 2', tier: 'premium', image: '/placeholder7.png' },
  { id: 'placeholder-prm-3', title: 'Placeholder Premium 3', tier: 'premium', image: '/placeholder8.png' },
  // 2 Flagship Tier
  { id: 'placeholder-flg-1', title: 'Placeholder Flagship 1', tier: 'flagship', image: '/placeholder9.png' },
  { id: 'placeholder-flg-2', title: 'Placeholder Flagship 2', tier: 'flagship', image: '/placeholder10.png' }
];

export default function CollectionBinder() {
  const [isOpen, setIsOpen] = useState(false);
  const [unlockedCards, setUnlockedCards] = useState([]);
  const fileInputRef = useRef(null);

  // Load unlocked cards
  const loadUnlockedCards = () => {
    try {
      const stored = window.localStorage.getItem('unlockedCards');
      if (stored) {
        setUnlockedCards(JSON.parse(stored));
      } else {
        setUnlockedCards([]);
      }
    } catch (e) {
      console.warn('Failed to read unlocked cards', e);
    }
  };

  useEffect(() => {
    // Initial load
    if (typeof window !== 'undefined') {
      loadUnlockedCards();

      // Auto-open check
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'collection' || params.get('view') === 'binder') {
        setIsOpen(true);
      }

      // Listen for newly revealed cards
      window.addEventListener('unlockedCardsUpdated', loadUnlockedCards);

      return () => {
        window.removeEventListener('unlockedCardsUpdated', loadUnlockedCards);
      };
    }
  }, []);

  // Sync state if modal is opened (just to be safe)
  useEffect(() => {
    if (isOpen) {
      loadUnlockedCards();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Backup functionality
  const handleBackup = () => {
    try {
      const dataStr = JSON.stringify(unlockedCards);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'luckypickcanada-collection.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to backup collection.');
    }
  };

  // Restore functionality
  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = JSON.parse(event.target.result);
        if (Array.isArray(result) && result.every(item => typeof item === 'string')) {
          window.localStorage.setItem('unlockedCards', JSON.stringify(result));
          setUnlockedCards(result);
          alert('Collection restored successfully!');
        } else {
          alert('Invalid backup format. Must be a list of cards.');
        }
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.onerror = () => alert('Error reading file.');
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Group cards by tier
  const tiers = [
    { id: 'standard', label: 'Standard Tier' },
    { id: 'premium', label: 'Premium Tier' },
    { id: 'flagship', label: 'Flagship Tier' }
  ];

  const totalCards = SERIES_1_PLACEHOLDERS.length;
  // unique collected cards count (intersection of LUCKY_CARDS and unlockedCards)
  const collectedCount = SERIES_1_PLACEHOLDERS.filter(c => unlockedCards.includes(c.id)).length;

  return (
    <>
      {/* Trigger Button */}
      <div className="w-full flex justify-center mt-6">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-400 hover:text-white transition-colors py-2 px-4 rounded-full border border-gray-700 hover:border-gray-500 bg-gray-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          tabIndex={0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>View Collection</span>
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          {/* Backdrop Click Handler */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Modal Content container */}
          <div className="relative w-full max-w-md h-[85vh] max-h-[800px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/90 z-10">
              <div>
                <h2 className="text-lg font-bold text-white">Series 1 Binder</h2>
                <p className="text-xs text-gray-400 font-medium tracking-wider uppercase mt-1">
                  {collectedCount} / {totalCards} Collected
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              {tiers.map(tier => {
                const tierCards = SERIES_1_PLACEHOLDERS.filter(c => c.tier === tier.id);
                if (tierCards.length === 0) return null;

                return (
                  <div key={tier.id} className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2">
                      {tier.label}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {tierCards.map(card => {
                        const isUnlocked = unlockedCards.includes(card.id);

                        return (
                          <div key={card.id} className="flex flex-col items-center group">
                            <div className={`relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 border-2 transition-all ${isUnlocked ? 'border-gray-700 group-hover:border-gray-500' : 'border-gray-800/50'}`}>
                               <img
                                  src={card.image}
                                  alt={isUnlocked ? card.title : 'Locked Card'}
                                  className={`w-full h-full object-cover transition-all duration-300 ${!isUnlocked ? 'brightness-0 opacity-40 grayscale blur-[1px]' : ''}`}
                                  loading="lazy"
                                />
                                {!isUnlocked && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-500 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </div>
                                )}
                            </div>
                            <div className="mt-2 text-center w-full px-1">
                              <p className={`text-sm font-medium truncate ${isUnlocked ? 'text-gray-200' : 'text-gray-500'}`}>
                                {card.title}
                              </p>
                              {isUnlocked && (
                                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                                  {tier.label.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Footer Utilities */}
              <div className="pt-8 pb-4 border-t border-gray-800 mt-8 flex flex-col space-y-3">
                <button
                  onClick={handleBackup}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg transition-colors text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Backup Collection</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 bg-transparent hover:bg-gray-800 border border-gray-700 text-gray-400 hover:text-gray-300 py-2.5 rounded-lg transition-colors text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Restore Collection</span>
                </button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleRestore}
                />
              </div>
            </div>

          </div>
        </div>
      , document.body)}
    </>
  );
}
