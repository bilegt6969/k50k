'use client';

import React from 'react';
import { motion } from 'framer-motion';
 

  
  interface ShippingMethodProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    eta: string;
    cost: string;
  }
  
  const ShippingMethod: React.FC<ShippingMethodProps> = ({ 
    icon, 
    title, 
    description, 
    eta, 
    cost 
  }) => (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center">
      <div className="md:flex-1">
        <div className="flex items-center mb-3">
          <div className="mr-3 text-blue-400">
            {icon}
          </div>
          <h3 className="text-xl font-medium text-white tracking-tight">{title}</h3>
        </div>
        <p className="text-neutral-400 mb-5 md:mb-0">{description}</p>
      </div>
      <div className="md:flex-shrink-0 md:ml-6 flex flex-col items-start">
        <div className="text-sm text-neutral-500 mb-1">Estimated delivery</div>
        <div className="text-white font-medium mb-2">{eta}</div>
        <div className="text-sm text-blue-400 font-medium">{cost}</div>
      </div>
    </div>
  );

const DeliveryTruck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);

const Express = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const Pickup = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShippingPage = () => {
  return (
    <div className="min-h-screen bg-black font-sans antialiased">
      <main className="max-w-3xl mx-auto px-6 py-20 md:py-32">
        <motion.h1 
          className="text-3xl md:text-4xl font-semibold text-white text-center mb-6 tracking-tight"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Shipping Information
        </motion.h1>
        
        <motion.p
          className="text-center text-neutral-400 mb-16 md:mb-24 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          All items go through our authentication process before shipping. Delivery times start after authentication is complete.
        </motion.p>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ShippingMethod 
            icon={<DeliveryTruck />}
            title="Standard Shipping"
            description="Available for all orders within Mongolia. Most cost-effective option for non-urgent deliveries."
            eta="3-5 business days"
            cost="Free for orders ₮100,000+"
          />
          
          <ShippingMethod 
            icon={<Express />}
            title="Express Delivery"
            description="Priority handling and expedited shipping for urgent orders. Available in all major cities."
            eta="1-2 business days"
            cost="₮15,000"
          />
          
          <ShippingMethod 
            icon={<Pickup />}
            title="In-Store Pickup"
            description="Pick up your authenticated items at our Ulaanbaatar location. Available once authentication is complete."
            eta="Same day (if ready by 4PM)"
            cost="Free"
          />
        </motion.div>

        <motion.div
          className="mt-16 md:mt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl font-medium text-white mb-8 tracking-tight">
            Shipping Policy Information
          </h2>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 mb-12">
            <h3 className="text-lg font-medium text-white mb-4 tracking-tight">
              Shipping Timeline
            </h3>
            <p className="text-neutral-400 mb-6">
              Our unique authentication process means shipping timelines differ from traditional retailers. Here&aposs what to expect:
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0 text-green-400">
                  <CheckIcon />
                </div>
                <div className="ml-1">
                  <span className="text-white font-medium">Order Processing:</span>
                  <span className="text-neutral-400 ml-2">1-2 business days</span>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 text-green-400">
                  <CheckIcon />
                </div>
                <div className="ml-1">
                  <span className="text-white font-medium">Authentication:</span>
                  <span className="text-neutral-400 ml-2">1-3 business days</span>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 text-green-400">
                  <CheckIcon />
                </div>
                <div className="ml-1">
                  <span className="text-white font-medium">Shipping:</span>
                  <span className="text-neutral-400 ml-2">Varies by method selected (see above)</span>
                </div>
              </div>
            </div>
            
            <p className="text-neutral-400">
              Total estimated time from order to delivery: 5-10 business days for standard shipping (depending on product availability and location).
            </p>
          </div>
          
          <div className="space-y-10">
            <div>
              <h3 className="text-lg font-medium text-white mb-3 tracking-tight">
                International Shipping
              </h3>
              <p className="text-neutral-400">
                Currently, sainto only ships within Mongolia. We&aposre working on expanding our international shipping options and will update this page when available. For international customers with a Mongolian shipping address, we can accommodate your order.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-3 tracking-tight">
                Order Tracking
              </h3>
              <p className="text-neutral-400">
                All orders include tracking information sent via email and SMS once your authenticated item ships. You can also track your order status by logging into your sainto account or using the tracking number provided with any major Mongolian courier.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-3 tracking-tight">
                Shipping Restrictions
              </h3>
              <p className="text-neutral-400">
                Some remote areas in Mongolia may require additional shipping time or fees. During checkout, accurate delivery address information will determine if your location has any shipping restrictions or additional costs.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-lg font-medium text-white mb-4 tracking-tight">
            Have more questions about shipping?
          </h2>
          <motion.a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-blue-500 text-white text-sm font-medium tracking-tight"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Contact Support
          </motion.a>
        </motion.div>
      </main>

 

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

export default ShippingPage;