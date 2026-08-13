'use client';

import { useState } from 'react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How does the daily Lucky Pick card generator work?",
      answer: "Our daily Lucky Pick card generator allows you to open one collectible digital card every 24 hours. The system uses a specialized randomization algorithm to select your daily card from our digital deck, offering you a unique spark of encouragement and a moment of possibility each day. The cards are tiered with varying rarities to make each draw exciting."
    },
    {
      question: "Is Lucky Pick Canada free to play?",
      answer: "Yes! The core Lucky Pick Canada experience, including checking the Daily Lucky Meter, browsing the Community Map, and reading Lucky Stories, is entirely free to access. We also offer optional premium digital gift experiences and personalized multi-picks for a small fee if you want to share a lucky moment with someone else."
    },
    {
      question: "What are Lucky Stories and the Community Map?",
      answer: "The Community Map and Lucky Stories sections are places where users across Canada share their uplifting moments and small wins. When someone experiences a lucky moment, they can share it on the map, allowing others to explore these positive stories coast to coast. It's a way to keep the good energy moving and celebrate together."
    },
    {
      question: "Are picks intended for gambling or entertainment?",
      answer: "Lucky Pick Canada is designed strictly for entertainment and positive encouragement. We do not provide lottery services, gambling, or real-money payouts. The generated numbers and card reveals are simply fun digital experiences designed to bring a little everyday magic and optimism to your routine."
    },
    {
      question: "How do gift experiences work?",
      answer: "Our gift experiences allow you to send a premium, interactive digital card reveal to a friend or loved one. When you purchase a gift package, we send a beautifully styled email to the recipient containing a unique link. Once they click the link, they get to enjoy a specialized, animated slow reveal of their lucky jewel-themed picks!"
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p className="homepage-offer-kicker" style={{ color: '#eabe52', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Got Questions?</p>
        <h2 id="faq-heading" style={{ color: 'white', fontSize: '2rem', marginTop: '8px' }}>Frequently Asked Questions</h2>
      </div>

      <div className="faq-accordion" style={{ display: 'grid', gap: '12px' }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="faq-item"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(234, 190, 82, 0.3)', // Gold accent border
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => toggleFaq(index)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.05rem',
                  fontWeight: '600',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(234, 190, 82, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                <div style={{ padding: '0 20px 20px 20px', color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
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
