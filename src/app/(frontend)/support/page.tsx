'use client';

import React from 'react'; // Import ReactNode
import { motion } from 'framer-motion';
 
// --- Define Interface for ContactOption Props ---
interface ContactOptionProps {
  icon: React.ReactNode; // Type for JSX elements like <EmailIcon />
  title: string;
  description: string;
  actionText: string;
  actionLink: string;
}

// --- Contact Option Component ---
// Use the ContactOptionProps interface to type the destructured props
const ContactOption = ({ icon, title, description, actionText, actionLink }: ContactOptionProps) => {
  return (
    <motion.div
      className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8"
      whileHover={{ y: -4, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
    >
      <div className="mb-4 text-blue-400">
        {icon} {/* Render the icon node */}
      </div>
      <h3 className="text-xl font-medium text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-neutral-400 mb-6">{description}</p>
      <a
        href={actionLink}
        className="inline-flex items-center text-blue-400 font-medium hover:text-blue-300 transition-colors"
      >
        {actionText} <ArrowRightIcon />
      </a>
    </motion.div>
  );
};

// --- Icon Components (No changes needed here) ---
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// --- Main Support Page Component ---
const SupportPage = () => {
  return (
    <div className="min-h-screen bg-black font-sans antialiased">
      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        <motion.h1
          className="text-3xl md:text-4xl font-semibold text-white text-center mb-6 tracking-tight"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Customer Support
        </motion.h1>

        <motion.p
          className="text-center text-neutral-400 mb-16 md:mb-24 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          We&lsquore here to help with any questions about your orders, authentication process, or any other concerns. Choose your preferred way to reach us.
        </motion.p>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Pass props to ContactOption */}
          <ContactOption
            icon={<EmailIcon />}
            title="Email Support"
            description="Send us an email and we'll get back to you within 24 hours, even on weekends."
            actionText="Email us"
            actionLink="mailto:support@sainto.mn"
          />

          <ContactOption
            icon={<ChatIcon />}
            title="Live Chat"
            description="Chat with our support team in real-time during business hours (10:00-18:00)."
            actionText="Start a chat"
            actionLink="/chat" // Assuming you have a chat page/route
          />

          <ContactOption
            icon={<PhoneIcon />}
            title="Phone Support"
            description="For urgent matters, call us directly at our customer service line."
            actionText="Call now"
            actionLink="tel:+97677123456" // Example Mongolian phone number format
          />
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="mt-20 md:mt-32 bg-neutral-900 border border-neutral-800 rounded-2xl p-8 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl font-medium text-white mb-6 tracking-tight">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">What are your support hours?</h3>
              <p className="text-neutral-400">Our customer support team is available Monday through Friday, 10:00 AM to 6:00 PM (GMT+8). Email support is monitored on weekends for urgent issues.</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">How long does it take to get a response?</h3>
              <p className="text-neutral-400">We aim to respond to all emails within 24 hours. Live chat queries are typically answered within minutes during business hours. Phone support may have wait times during peak periods.</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">Can I track my support request?</h3>
              <p className="text-neutral-400">Yes, all email inquiries receive a ticket number for tracking. You can check the status of your request through our customer portal using this reference number.</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <motion.a
              href="/faqs" // Assuming you have an FAQs page
              className="inline-flex items-center text-blue-400 font-medium hover:text-blue-300 transition-colors"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              View all FAQs <ArrowRightIcon />
            </motion.a>
          </div>
        </motion.div>
      </main>

      {/* Footer Section */}
      
      {/* Global Styles for Font */}
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
    </div>
  );
};

export default SupportPage;
