'use client';

import { useState } from 'react';

export default function FAQSection() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const faqs = [
    {
      question: "How does the daily Lucky Pick card generator work?",
      answer: "Our daily Lucky Pick generator allows you to reveal one collectible digital card every 24 hours. The system uses a specialized randomization algorithm to select your daily card from our digital deck, offering you a unique spark of encouragement. You can now build your own collection! Every card you reveal is automatically saved to your personal digital binder. The cards feature varying rarities to make each daily draw an exciting piece of digital entertainment—have fun and see if you can collect them all! (Please note: Lucky Pick Canada is purely for fun and has no affiliation with real-world lotteries or gambling)."
    },
    {
      question: "What is the Lucky Meter (Daily Resonance Ritual) and how does it work?",
      answer: "The Lucky Meter—also known as your Daily Resonance Ritual—is an interactive way to check your daily \"luck\" levels just for fun! When you awaken your resonance, the site generates a unique percentage from 0 to 100%, paired with an uplifting, Canadian-themed fortune or daily quote. You can check back every 24 hours for a new reading. Lucky Pick Canada is purely a digital entertainment experience designed for fun, with no affiliation with real-world gambling or lottery prizes."
    },
    {
      question: "Is Lucky Pick Canada free to play?",
      answer: "Yes! The core Lucky Pick Canada experience, including checking the Daily Lucky Meter, browsing the Community Map, and reading Lucky Stories, is entirely free to access. We also offer optional premium digital gift experiences and personalized multi-picks for a small fee if you want to share a lucky moment with someone else."
    },
    {
      question: "What are Lucky Stories and the Community Map?",
      answer: "The Community Map and Community Stories are related but distinct features. Community Stories lets people submit, read, and share positive/lucky experiences. The Community Map lets visitors explore those community lucky moments visually across Canada."
    },
    {
      question: "Are picks intended for gambling or entertainment?",
      answer: "Lucky Pick Canada is designed strictly for entertainment and positive encouragement. We do not provide lottery services, gambling, or real-money payouts. The generated numbers and card reveals are simply fun digital experiences designed to bring a little everyday magic and optimism to your routine."
    },
    {
      question: "How do gift experiences work?",
      answer: "Our gift experiences allow you to send a premium, interactive digital card reveal to a friend or loved one. When you purchase a gift package, we send a beautifully styled email to the recipient containing a unique link. Once they click the link, they get to enjoy a specialized, animated slow reveal of their lucky jewel-themed picks!"
    },
    {
      question: "What is the Lucky Crystal Ball?",
      answer: "The Lucky Crystal Ball is an AI-powered oracle that delivers playful, mystical fortunes and daily guidance. Simply ask a question to receive a whimsical reading steeped in Canadian magic!"
    }
  ];

  const toggleFaq = (question) => {
    setOpenQuestion(openQuestion === question ? null : question);
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section
      className="homepage-section faq-section"
      aria-labelledby="faq-heading"
      style={{
        maxWidth: '800px',
        marginInline: 'auto',
        padding: '32px 16px',
        marginTop: '24px'
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') }}
      />

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p className="homepage-offer-kicker" style={{ color: '#eabe52', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Got Questions?</p>
        <h2 id="faq-heading" style={{ color: 'white', fontSize: '2rem', marginTop: '8px' }}>Frequently Asked Questions</h2>
      </div>

      <div className="faq-accordion" style={{ display: 'grid', gap: '12px' }}>
        {faqs.map((faq) => {
          const isOpen = openQuestion === faq.question;
          return (
            <div
              key={faq.question}
              className="faq-item"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(234, 190, 82, 0.3)', // Gold accent border
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => toggleFaq(faq.question)}
                aria-expanded={isOpen}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 24px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(234, 190, 82, 0.1)'; e.currentTarget.style.color = '#fff0bd'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'white'; }}
              >
                <span>{faq.question}</span>
                <span
                  style={{
                    color: '#eabe52', // Gold
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    fontSize: '1.2rem',
                    display: 'inline-block'
                  }}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </button>

              <div
                style={{
                  maxHeight: isOpen ? '500px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}
              >
                <div style={{ padding: '0 24px 24px 24px', color: '#cbd5e1', lineHeight: '1.7', fontSize: '1rem' }}>
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
