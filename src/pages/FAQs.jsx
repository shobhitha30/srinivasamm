import React, { useState } from 'react';
import websiteData from '../data/websiteData.json';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function FAQs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
          Frequently Asked Questions
        </h1>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)' }}>
        {websiteData.faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} style={{ borderBottom: '1px solid var(--border-color)', padding: '1.25rem 0' }}>
              <button
                onClick={() => toggleFAQ(index)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--primary-700)'
                }}
              >
                {faq.question}
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {isOpen && (
                <div style={{ marginTop: '1rem', color: 'var(--gray-700)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
