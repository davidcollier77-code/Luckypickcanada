'use client';

import { useState } from 'react';
import { faqItems } from './faq-content';

/**
 * Renders the homepage FAQ accordion with all answers initially collapsed.
 * Opening a question closes the previous one; selecting it again collapses it.
 * Copy comes from `faq-content.js`, the same module the FAQPage structured data
 * uses, so the visible answers and the structured data cannot diverge.
 *
 * @returns {import('react').ReactElement} The interactive FAQ accordion.
 */
export default function FAQSection() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const faqs = faqItems;

  const toggleFaq = (question) => {
    setOpenQuestion(openQuestion === question ? null : question);
  };

  return (
    <section
      className="homepage-section faq-section"
      aria-labelledby="faq-heading"
      style={{
        maxWidth: '800px',
        marginInline: 'auto',
        padding: '32px 16px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <p className="homepage-offer-kicker" style={{ color: '#eabe52', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Got Questions?</p>
        <h2 id="faq-heading" style={{ color: 'white', fontSize: '2rem', marginTop: '8px' }}>Frequently Asked Questions</h2>
      </div>

      <div className="faq-accordion" style={{ display: 'grid', gap: '12px' }}>
        {faqs.map((faq, index) => {
          const isOpen = openQuestion === faq.question;
          const contentId = `faq-answer-${index}`;
          const buttonId = `faq-btn-${index}`;
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
                id={buttonId}
                aria-controls={contentId}
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
                id={contentId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen ? true : undefined}
                style={{
                  // Long answers must never be clipped: the tallest new answer
                  // wraps to well over the previous 500 px allowance on a phone.
                  maxHeight: isOpen ? '1600px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}
              >
                <div style={{ padding: '0 24px 24px 24px', color: '#cbd5e1', lineHeight: '1.7', fontSize: '1rem' }}>
                  {faq.answer.split('\n\n').map((paragraph, paragraphIndex) => (
                    <p
                      key={paragraphIndex}
                      style={{ margin: paragraphIndex === 0 ? 0 : '0.85rem 0 0' }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
