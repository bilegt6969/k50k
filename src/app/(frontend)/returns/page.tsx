'use client';

import React from 'react';
import { motion } from 'framer-motion';
 
// Define the PolicyBlock component
interface PolicyBlockProps {
  title: string;
  children: React.ReactNode;
}

const PolicyBlock: React.FC<PolicyBlockProps> = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-lg font-medium text-white mb-3 tracking-tight">{title}</h3>
    <div className="text-neutral-400">
      {children}
    </div>
  </div>
);

interface ReturnStepProps {
  number: number;
  title: string;
  description: string;
}

const ReturnStep: React.FC<ReturnStepProps> = ({ number, title, description }) => (
  <div className="flex gap-5 pb-8 relative">
    {/* Line connecting steps */}
    {number < 4 && (
      <div className="absolute left-5 top-12 w-px h-full bg-neutral-800 -z-10" />
    )}
    {/* Step number circle */}
    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
      {number}
    </div>
    <div className="pt-1">
      <h3 className="text-lg font-medium text-white mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-neutral-400">
        {description}
      </p>
    </div>
  </div>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ReturnsPage = () => {
  return (
    <div className="min-h-screen bg-black font-sans antialiased">
      <main className="max-w-3xl mx-auto px-6 py-20 md:py-32">
        <motion.h1 
          className="text-3xl md:text-4xl font-semibold text-white text-center mb-6 tracking-tight"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Returns & Refunds
        </motion.h1>
        
        <motion.p
          className="text-center text-neutral-400 mb-16 md:mb-24 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          We stand behind the authenticity of our products. In the rare case that an issue arises, here&apos;s how our return process works.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 mb-12">
            <div className="flex items-center text-blue-400 mb-4">
              <AlertIcon />
              <span className="font-medium">Important Notice</span>
            </div>
            <p className="text-neutral-400 mb-3">
              As a marketplace for authenticated items, our return policy differs from typical retailers. Most sales are final once authenticated, but we do have specific conditions where returns are accepted.
            </p>
            <p className="text-neutral-400">
              Please review our complete policy below before making a purchase.
            </p>
          </div>

          <h2 className="text-2xl font-medium text-white mb-8 tracking-tight">
            Return Process
          </h2>

          <div className="mb-16">
            <ReturnStep
              number={1}
              title="Contact Customer Support"
              description="Reach out to our support team within 48 hours of receiving your item. Include your order number, clear photos of the issue, and a detailed description of your concern."
            />
            
            <ReturnStep
              number={2}
              title="Return Authorization"
              description="If your return request is approved, we'll send you a Return Authorization (RA) number and detailed return instructions, including the shipping address."
            />
            
            <ReturnStep
              number={3}
              title="Ship the Item Back"
              description="Package the item carefully in its original packaging with all included accessories and tags. Write the RA number clearly on the outside of the package."
            />
            
            <ReturnStep
              number={4}
              title="Refund Processing"
              description="Once we receive and inspect the returned item, we'll process your refund. This typically takes 7-14 business days to appear in your original payment method."
            />
          </div>

          <h2 className="text-2xl font-medium text-white mb-8 tracking-tight">
            Return Policy Details
          </h2>

          <div className="mb-12">
            <PolicyBlock title="Eligible Items for Return">
              <p>Returns are accepted only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Item received is significantly different from description</li>
                <li>Item has manufacturing defects not disclosed in the listing</li>
                <li>Incorrect item shipped</li>
                <li>Authentication concerns (requires review by our team)</li>
              </ul>
            </PolicyBlock>

            <PolicyBlock title="Items Not Eligible for Return">
              <ul className="list-disc pl-6 space-y-2">
                <li>Items showing signs of wear or use after delivery</li>
                <li>Items without original packaging, tags, or accessories</li>
                <li>Items returned more than 5 days after delivery</li>
                <li>Items purchased with explicit &apos;as is&apos; condition notes</li>
                <li>Buyer&apos;s remorse or change of mind</li>
              </ul>
            </PolicyBlock>

            <PolicyBlock title="Refund Options">
              <p>When a return is approved and processed, you will receive one of the following:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Full refund to original payment method (minus original shipping fees)</li>
                <li>Store credit (with a 5% bonus value)</li>
                <li>Exchange for a different item (when available and applicable)</li>
              </ul>
            </PolicyBlock>
          </div>

          <motion.div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center text-green-400 mb-4">
              <CheckIcon />
              <span className="font-medium ml-2">Authenticity Guarantee</span>
            </div>
            <p className="text-neutral-400">
              If our authentication team discovers that an item you received is not authentic despite passing our initial verification, we will provide a full refund including all fees and shipping costs, plus a 10% store credit as compensation for your inconvenience.
            </p>
          </motion.div>

          <div className="mt-16 text-center">
            <h3 className="text-lg font-medium text-white mb-4 tracking-tight">
              Need to initiate a return?
            </h3>
            <motion.a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-blue-500 text-white text-sm font-medium tracking-tight"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Contact Support
            </motion.a>
          </div>
        </motion.div>
 
      <style>{`
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
              </main>
    </div>
  );
};

export default ReturnsPage;