'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChevronIconProps {
  isOpen: boolean;
}

const ChevronIcon = ({ isOpen }: ChevronIconProps) => (
  <motion.svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4 text-neutral-500"
    initial={false}
    animate={{ rotate: isOpen ? 180 : 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </motion.svg>
);

interface FaqItemProps {
  question: string;
  answer: string | React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
  isLast: boolean;
}

const FaqItem = ({ question, answer, isOpen, onClick, isLast }: FaqItemProps) => {
  return (
    <div className={`${!isLast ? 'border-b border-neutral-800' : ''}`}>
      <motion.button
        onClick={onClick}
        className="flex justify-between items-center w-full text-left py-6 focus:outline-none group"
        whileTap={{ scale: 0.995 }}
        aria-expanded={isOpen}
      >
        <span className="flex-1 text-lg font-medium text-neutral-200 pr-4 tracking-tight">
          {question}
        </span>
        <span className="flex-shrink-0">
          <ChevronIcon isOpen={isOpen} />
        </span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
            }}
            className="overflow-hidden"
          >
            <div className="pb-8 pt-1 text-base text-neutral-400 leading-relaxed tracking-tight">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FaqItemData {
  question: string;
  answer: string | React.ReactNode;
}

const DarkAppleFaqPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqData: FaqItemData[] = [
    {
      question: "What is sainto?",
      answer: "sainto is Mongolia&apos;s premier online marketplace connecting buyers and sellers of authentic, highly sought-after sneakers, streetwear, collectibles, and electronics. Think of us as a trusted intermediary ensuring authenticity and smoothing transactions, similar to StockX, but tailored for the Mongolian market."
    },
    {
      question: "How does sainto ensure authenticity?",
      answer: "Authenticity is our top priority. Every item sold on sainto undergoes a rigorous multi-point inspection process by our trained authenticators. We source directly from trusted suppliers in Hong Kong and verify each product before it&apos;s shipped to a buyer, guaranteeing you receive genuine items."
    },
    {
      question: "Where do the products come from?",
      answer: "To provide access to a wide range of global releases and exclusive items, we primarily source our products from verified partners and suppliers based in Hong Kong. All items are then air-shipped directly to Mongolia for authentication and local delivery."
    },
    {
      question: "How long does shipping take?",
      answer: (
        <>
          Shipping times vary. Once an item is authenticated at our facility (after arrival from Hong Kong or a local seller), delivery typically takes <span className="font-medium text-neutral-300">2-5 business days</span> within Ulaanbaatar, longer elsewhere. The total process from order might average <span className="font-medium text-neutral-300">7-14 business days</span> due to international transit and verification.
        </>
      )
    },
    {
      question: "What are the fees involved?",
      answer: (
        <>
          sainto incorporates a processing and service fee (approximately <span className="font-medium text-neutral-300">20%</span> of transaction value) covering authentication, secure logistics, and platform costs. This is factored into the final buyer price or deducted from the seller payout. See our Terms of Service for the detailed buyer/seller fee breakdown.
        </>
      )
    },
    {
      question: "How do I buy an item?",
      answer: "Find your item. Choose &apos;Buy Now&apos; at the lowest Ask or &apos;Place Bid&apos; with your offer. If your bid is met or you Buy Now, proceed to payment. We then authenticate the item before shipping it to you."
    },
    {
      question: "How do I sell an item?",
      answer: "Find your item to list. Choose &apos;Sell Now&apos; at the highest Bid or &apos;Place Ask&apos; with your price. Once there&apos;s a match, ship the item to us for verification. After it passes, we process your payout (minus fees)."
    },
    {
      question: "What currency and payment methods are used?",
      answer: "All transactions use Mongolian Tögrög (MNT ₮). We accept QPay, major local bank cards, and bank transfers. Check the checkout for current options."
    },
    {
      question: "What is your return policy?",
      answer: "Due to our live marketplace model, all sales are final once authenticated. We don&apos;t typically offer returns or exchanges. However, if you receive an incorrect item or have authenticity concerns, contact support immediately."
    },
    {
      question: "How can I contact customer support?",
      answer: <>Reach us via email at <a href="mailto:support@sainto.mn" className="text-blue-400 hover:text-blue-300 font-medium">support@sainto.mn</a>, our website&apos;s contact form, or social media.</>
    }
  ];

  return (
    <div className="min-h-screen bg-black font-sans antialiased">
      <main className="max-w-3xl mx-auto px-6 py-20 md:py-32">
        <motion.h1 
          className="text-3xl md:text-4xl font-semibold text-white text-center mb-16 md:mb-24 tracking-tight"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Frequently Asked Questions
        </motion.h1>

        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {faqData.map((item, index) => (
            <FaqItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onClick={() => handleToggle(index)}
              isLast={index === faqData.length - 1}
            />
          ))}
        </motion.div>
      </main>

      <style >{`
        @font-face {
          font-family: 'SF Pro Display';
          src: url('/fonts/sf-pro-display-regular.woff2') format('woff2');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'SF Pro Display';
          src: url('/fonts/sf-pro-display-medium.woff2') format('woff2');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'SF Pro Display';
          src: url('/fonts/sf-pro-display-semibold.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }
        body {
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: black;
          color: #f5f5f5;
        }
      `}</style>
    </div>
  );
};

export default DarkAppleFaqPage;