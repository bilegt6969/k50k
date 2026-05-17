'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is SAINTO?",
    answer: "SAINTO is a pioneering fashion retail platform born in Ulaanbaatar, Mongolia. We connect global fashion with discerning consumers across Central Asia, focusing on authenticity, fair pricing, and trust."
  },
  {
    question: "Why should I trust SAINTO?",
    answer: "Every item sold on SAINTO is authenticated and sourced from globally trusted platforms. Our mission is to provide genuine products in a market often plagued by counterfeits."
  },
  {
    question: "Where does SAINTO deliver?",
    answer: "We currently focus on Mongolia and Central Asia, but our ambition is to expand delivery across more regions in the near future."
  },
  {
    question: "Are items refundable?",
    answer: "Yes, items are 100% refundable within 1 week of purchase. The refund window starts when the package is delivered to your hand."
  },
  {
    question: "How fast is delivery?",
    answer: "Speed is one of our core values. SAINTO leverages strategic logistics partners to ensure faster delivery than traditional retail channels in the region."
  },
  {
    question: "Can I invest in SAINTO?",
    answer: "Yes. We are actively seeking partners who share our passion for authenticity, innovation, and growth. Contact us through our investment opportunities page for more details."
  }
];

const   FAQ = () => {
  // First item open by default
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      if (prev.includes(index)) {
        // Close the clicked item
        return prev.filter(item => item !== index);
      } else {
        // Open the clicked item
        if (prev.length >= 2) {
          // If 2 items are already open, remove the first one and add the new one
          return [...prev.slice(1), index];
        } else {
          // Otherwise just add the new item
          return [...prev, index];
        }
      }
    });
  };

  return (
    <div className="text-black bg-white flex flex-col lg:flex-row pb-12 lg:pb-20">
      
      {/* Left side - Title (Now w-1/4 on large screens) */}
      <div className="w-full lg:w-1/4 flex items-start justify-start pt-12 lg:pt-20 px-6 lg:pl-12 lg:pr-6">
        <h1 className="text-4xl lg:text-6xl font-medium leading-tight tracking-tighter">
          FAQs
        </h1>
      </div>
  
      {/* Spacer (Now w-1/4 on large screens, hidden on small screens) */}
      <div className="hidden lg:block lg:w-1/4"></div>

      {/* Right side - FAQ Items (Now w-2/4 on large screens) */}
      <div className="w-full lg:w-2/4 flex flex-col items-start justify-start pt-8 lg:pt-20 px-6 lg:pr-12 lg:pl-6">
        <div className="space-y-0 w-full">
          {faqData.map((item, index) => (
            <div key={index} className="border-b border-neutral-300">
              <button
                onClick={() => toggleItem(index)}
                className="w-full py-6 flex items-center justify-between text-left px-4 hover:bg-neutral-100 transition-colors duration-200"
              >
                <span className="text-xl md:text-2xl lg:text-3xl font-medium tracking-tight text-gray-900 pr-4">
                  {item.question}
                </span>
                <Plus 
                  className={`w-6 h-6 text-gray-900 transition-transform duration-200 ease-out flex-shrink-0 ${
                    openItems.includes(index) ? 'rotate-45' : 'rotate-0'
                  }`}
                />
              </button>
              
              <div 
                className={`transition-all duration-200 ease-out overflow-hidden ${
                  openItems.includes(index) ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'
                }`}
              >
                {/* Answer Content Wrapper */}
                <div className="pr-6 md:pr-10">
                  <div className="text-base text-gray-900 leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
