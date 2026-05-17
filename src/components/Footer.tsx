import React from 'react';
import {Inter_Tight } from 'next/font/google';

// 1. Instantiate the font *without* the 'variable' option.
// This gives us the .className property.
const instrumentSerif = Inter_Tight({
  subsets: ['latin'],
  weight: ['600'],
  // No 'variable' property needed for this method
});

const Footer = ({ variant = 'white' }) => {
  const isWhite = variant === 'white';

  return (
    <>
      {/* 2. Removed the .variable class from the footer element */}
      <footer
        className={`relative ${
          isWhite && 'bg-white' || 'bg-[#0B0B0B]'
        } overflow-hidden`}
      >
        {/* Main Content Section */}
        <div className="relative z-50 pt-22 sm:pt-0 md:pt-32 lg:pt-40 pb-12 sm:pb-32 md:pb-38 lg:pb-38">
          {/* Empty spacer div */}
        </div>

        {/* Large Background Text */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div
            className={`
              ${instrumentSerif.className} ${/* 3. Apply the .className here */ ''}
              ${
                isWhite
                  ? 'text-[#bbb7af] opacity-40'
                  : 'text-[#2a2a2a] opacity-60'
              } 
              font-bold text-[12rem] xs:text-[8rem] sm:text-[12rem] md:text-[18rem] lg:text-[21rem] xl:text-[26rem] 2xl:text-[26rem] leading-none select-none flex items-start tracking-tight
              `}
            // 4. Removed the 'font-[var(--font-instrument-serif)]' class
          >
            sainto
            <span className="text-[3rem] xs:text-[5rem] sm:text-[6rem] md:text-[7rem] lg:text-[10rem] xl:text-[10rem] 2xl:text-[10rem] font-sans">
              🅁
            </span>
          </div>
        </div>

        {/* Bottom Gradient Shadow */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-20 sm:h-28 md:h-32 lg:h-48 xl:h-35 ${
            isWhite
              ? 'bg-gradient-to-t from-white via-white to-transparent'
              : 'bg-gradient-to-t from-black via-[#141414] to-transparent'
          } z-5 pointer-events-none`}
        ></div>

        {/* Bottom Footer Links */}
        <div className="relative z-10 px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto flex flex-row sm:flex-row justify-between items-center text-xs sm:text-sm text-neutral-400 space-y-3 sm:space-y-0">
            {/* Left Section (Copyright) */}
            <div className="text-center sm:text-left items-center order-3 sm:order-1">
              {new Date().getFullYear()} SAINTO. All rights reserved.
            </div>

            {/* Middle Section (Navigation Links) */}
            <div className="hidden sm:flex flex-row sm:flex-row justify-center items-center space-y-3 sm:space-y-0 space-x-4 sm:space-x-4 order-1 sm:order-2">
              <a
                href="#"
                className="hover:text-gray-200 transition-colors whitespace-nowrap"
              >
                About
              </a>
              <a
                href="#"
                className="hover:text-gray-200 transition-colors whitespace-nowrap"
              >
                Contact Us
              </a>
              <a
                href="#"
                className="hover:text-gray-200 transition-colors whitespace-nowrap"
              >
                FAQ
              </a>
              <a
                href="#"
                className="hover:text-gray-200 transition-colors whitespace-nowrap"
              >
                Support
              </a>
              <a
                href="#"
                className="hover:text-gray-200 transition-colors whitespace-nowrap"
              >
                For You
              </a>
            </div>

            {/* Right Section (Terms & Powered By) */}
            <div className="flex flex-wrap justify-center sm:justify-end space-x-4 sm:space-x-6 order-2 sm:order-3">
              <a href="#" className="hover:text-gray-200 transition-colors">
                Terms of Service
              </a>
              <span className="">
                Swags for <span className='underline'>HoëCakes</span> .
                
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Your style tag for the animation remains unchanged */}
      <style>{`
        .underline-animation {
          position: relative;
          display: inline-block;
          text-decoration: none;
        }
        
        .underline-animation::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background-color: currentColor;
          transition: width 0.3s ease-out;
        }
        
        .underline-animation:hover::after {
          width: 100%;
        }
      `}</style>
    </>
  );
};

export default Footer;