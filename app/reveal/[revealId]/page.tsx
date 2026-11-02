'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import LuckyRevealPopup from '../../lucky-reveal-popup';
import { buildLuckyReveal, LUCKY_COLORS, LUCKY_DAYS } from '../../lucky-reveal';

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
  
  // Pick lucky color and day deterministically from the shared reveal vocabulary
  const luckyColor = LUCKY_COLORS[Math.floor(seededRandom() * LUCKY_COLORS.length)];
  const luckyDay = LUCKY_DAYS[Math.floor(seededRandom() * LUCKY_DAYS.length)];
  
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
  const [giftDelivered, setGiftDelivered] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  
  const recipientEmail = searchParams?.get('recipientEmail') || '';

  useEffect(() => {
    if (revealId) {
      // For cs_ stripe sessions, verify they are actually paid gifts via server
      if (revealId.startsWith('cs_')) {
        fetch(`/api/verify-session?session_id=${encodeURIComponent(revealId)}`)
          .then(res => {
            if (!res.ok) throw new Error('Invalid or unpaid session');
            return res.json();
          })
          .then(data => {
            const metadata = data.metadata || {};
            let verifiedReveal = null;

            if (data.success && metadata.checkoutType === 'gift_package' && metadata.giftNumbers) {
              // Gift Edition results must match the emailed reveal exactly.
              const numbers = String(metadata.giftNumbers).split(',').map(Number);
              verifiedReveal = buildLuckyReveal({
                game: numbers.length === 7 ? '7' : '6',
                numbers,
                luckyColor: metadata.giftLuckyColor,
                luckyDay: metadata.giftLuckyDay,
              });
            } else if (data.success && data.reveal?.numbers?.length) {
              // Paid Lucky Reveal sessions return the persisted server-generated
              // reveal. It must be used as-is so the same paid session always
              // renders the same pick.
              verifiedReveal = buildLuckyReveal({
                game: data.reveal.game ?? data.game,
                numbers: data.reveal.numbers,
                luckyColor: data.reveal.luckyColor,
                luckyDay: data.reveal.luckyDay,
              });
            }

            if (verifiedReveal) {
              setReveal(verifiedReveal);
              setGiftDelivered(Boolean(metadata.giftDeliveredAt));
            } else {
              // Never substitute a locally derived pick for a paid reveal.
              setAuthError('Unable to verify this gift delivery.');
            }
          })
          .catch(err => {
            console.error('Failed to verify gift reveal:', err);
            setAuthError('Unable to verify this gift delivery.');
          });
      } else if (process.env.NODE_ENV === 'development') {
         // Generate a deterministic reveal based on the revealId (for legacy revealIds not starting with cs_)
         const generatedReveal = createRevealFromId(revealId);
         setReveal(generatedReveal);
      } else {
        // In production, require server verification for all reveals
        setAuthError('Unable to verify this gift delivery.');
      }
    }
  }, [revealId]);

  const showGiftBanner = giftDelivered && recipientEmail.trim() !== '';
  
  const handleClose = () => {
    router.push('/');
  };
  
  if (authError) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>
        <h2>Reveal Unavailable</h2>
        <p>{authError}</p>
        <button onClick={handleClose} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#333', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
          Return Home
        </button>
      </div>
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
          <button type="button" onClick={() => setGiftDelivered(false)} style={{
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
