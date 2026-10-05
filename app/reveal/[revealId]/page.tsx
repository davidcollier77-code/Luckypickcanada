'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import LuckyRevealPopup from '../../lucky-reveal-popup';

// Create a deterministic reveal based on revealId
function createRevealFromId(revealId: string) {
  // Use the revealId as a seed for deterministic randomness
  let seed = 0;
  for (let i = 0; i < revealId.length; i++) {
    seed = ((seed << 5) - seed) + revealId.charCodeAt(i);
    seed = seed & seed; // Convert to 32bit integer
  }
  
  // Simple seeded random function
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  // Determine game type based on seed
  const isSevenPick = seededRandom() > 0.5;
  const count = isSevenPick ? 7 : 6;
  const max = isSevenPick ? 50 : 49;
  
  // Generate deterministic lucky numbers
  const numbers = Array.from({ length: max }, (_, index) => index + 1);
  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(seededRandom() * (index + 1));
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }
  const luckyNumbers = numbers.slice(0, count).sort((a, b) => a - b);
  
  // Pick lucky color and day deterministically
  const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
  const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const luckyColor = luckyColors[Math.floor(seededRandom() * luckyColors.length)];
  const luckyDay = luckyDays[Math.floor(seededRandom() * luckyDays.length)];
  
  return {
    game: {
      name: isSevenPick ? '7 Pick' : '6 Pick',
      numbers: luckyNumbers,
    },
    luckyColor,
    luckyDay,
  };
}

function RevealPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const revealId = params?.revealId as string;
  const [reveal, setReveal] = useState<any>(null);
  const [showGiftBanner, setShowGiftBanner] = useState(false);

  const recipientEmail = searchParams?.get('recipientEmail') || '';

  // The gift-delivery endpoint only sets this flag after it has verified the Stripe
  // session and confirmed the dispatch. Its absence means delivery is unconfirmed, so the
  // success copy and the pick itself must stay hidden even if `recipientEmail` is present
  // (for example on a hand-crafted or stale URL).
  const giftDeliveryConfirmed = searchParams?.get('giftDelivered') === '1';

  useEffect(() => {
    if (revealId && giftDeliveryConfirmed) {
      // Generate a deterministic reveal based on the revealId
      const generatedReveal = createRevealFromId(revealId);
      setReveal(generatedReveal);
    }
  }, [revealId, giftDeliveryConfirmed]);

  useEffect(() => {
    if (giftDeliveryConfirmed && recipientEmail.trim() !== '') {
      setShowGiftBanner(true);
    }
  }, [giftDeliveryConfirmed, recipientEmail]);
  
  const handleClose = () => {
    router.push('/');
  };

  if (!giftDeliveryConfirmed) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1.5rem',
        background: '#061826',
        color: '#f8fafc',
        fontFamily: 'Arial, Helvetica, sans-serif',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '34rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.35rem 1rem',
            borderRadius: '999px',
            background: 'rgba(253, 230, 138, 0.15)',
            border: '1px solid rgba(253, 230, 138, 0.34)',
            color: '#fde68a',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
          }}>
            Gift not confirmed
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', lineHeight: 1.15, margin: '1.1rem 0 0.9rem' }}>
            We could not confirm this gift
          </h1>
          <p role="status" aria-live="polite" style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#d1fae5', margin: 0 }}>
            This reveal has not been confirmed as delivered. If you just sent a Lucky Pick Canada gift, return
            to the gift link you were emailed and we will finish sending it.
          </p>
        </div>
      </main>
    );
  }

  if (!reveal) {
    return null;
  }

  return (
    <>
      {showGiftBanner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '1.25rem 2rem',
          background: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #047857 100%)',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.35), 0 0 15px rgba(232, 186, 82, 0.2)',
          color: '#ffffff',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '1rem',
          borderBottom: '3px solid #e8ba52',
          animation: 'slideDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <style>{`
            @keyframes slideDown {
              from { transform: translateY(-100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            🎁 Gift Dispatched Successfully: A special gem-tier pick has been emailed to <strong style={{ color: '#fff0ac', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{recipientEmail.replace(/[<>"']/g, '')}</strong>
          </span>
          <button type="button" onClick={() => setShowGiftBanner(false)} style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '0.4rem 1.2rem',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          >
            Dismiss
          </button>
        </div>
      )}
      <LuckyRevealPopup reveal={reveal} onClose={handleClose} />
    </>
  );
}

export default function RevealPage() {
  return (
    <Suspense fallback={null}>
      <RevealPageContent />
    </Suspense>
  );
}
