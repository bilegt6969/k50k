'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';

// --- ENGLISH-ONLY CONTENT OBJECT ---
const content = {
  brandName: '',
  headerTitle: 'The Art Of Pioneering',
  heroSubtitle: 'Connecting Fashion, Culture, and Technology.',
  letterTitle: 'An Open Letter',
  
  // Letter content
  openingQuestion: 'Can you remember the first time you fell in love with a piece of fashion?',
  
  paragraph1: "We can. That feeling when you find something that just fits—not just your body, but who you are. Fashion has this power to make you feel invincible, to tell your story without saying a word.",
  
  paragraph2: "But if you're shopping in Ulaanbaatar, or anywhere in Central Asia, that magic often gets lost in translation. You find the perfect piece online, but is it real? The price seems suspiciously high. You order it, and then... you wait. And wait. And the worst part? Constantly second-guessing whether you're being taken advantage of.",
  
  paragraph3: "We've been there. So in December 2023, we started building something different—not just another marketplace, but a bridge to bring genuine, authenticated fashion directly to a region that deserves better access. After a strategic pause, we came back in February 2025 with a clear mission: make global fashion accessible, trustworthy, and affordable for Central Asia.",
  
  paragraph4: "We're fashion nerds at heart. We built SAINTO because we believe you shouldn't have to gamble on authenticity, pay absurd markups, or sacrifice weeks waiting for global fashion to reach your doorstep. Every detail matters to us: exclusive sourcing from verified platforms, fair pricing, and logistics partners who understand our region's unique challenges.",
  
  paragraph5: "This isn't just about selling clothes. It's about changing how an entire region shops for fashion. It's about building trust where skepticism has become the default, and proving that Central Asian customers deserve the same access, quality, and respect as shoppers anywhere else in the world.",
  
  closingLine: "We'll handle the worrying about authenticity, logistics, and fair pricing. You just fall in love with fashion again.",
  
  signature: '— Bilegt Amartuvshin',
  signatureTitle: 'Founder and Lead Developer',
  
  investTitle: 'Join Our Journey',
  investIntro: "We're actively seeking partners who share our passion for authenticity, innovation, and transforming fashion retail across Central Asia. If you believe in our vision, we'd love to connect.",
  investButton: 'Learn More About Investment Opportunities',
  
  footerText: `©${new Date().getFullYear()} SAINTO. All rights reserved.`,
};

// Define animation variants
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      staggerChildren: 0.15,
    },
  },
};

const textVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

// Toast notification component
const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white text-black px-6 py-4 rounded-full shadow-2xl border border-gray-200"
    >
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  );
};

const App = () => {
  const [heroBackgroundStyles, setHeroBackgroundStyles] = useState({
    imageOpacity: 0.8,
    filter: 'blur(0px)',
    overlayOpacity: 0,
  });

  const [mainBackgroundOpacity, setMainBackgroundOpacity] = useState(0);
  const [showToast, setShowToast] = useState(false);
  
  // Use ref to track if we're already updating to prevent multiple RAF calls
  const rafIdRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        return;
      }

      // Use requestAnimationFrame for smooth, performant updates
      rafIdRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        // Only update if scroll position changed significantly
        if (Math.abs(scrollY - lastScrollYRef.current) < 2) {
          rafIdRef.current = null;
          return;
        }
        
        lastScrollYRef.current = scrollY;

        const heroSectionScrollHeight = window.innerHeight * 0.8;
        const mainContentStartScroll = window.innerHeight * 0.6;

        const scrollProgressHero = Math.min(1, scrollY / heroSectionScrollHeight);
        const scrollProgressMain = Math.min(1, Math.max(0, (scrollY - mainContentStartScroll) / (heroSectionScrollHeight - mainContentStartScroll)));

        const newImageOpacity = 0.8 * (1 - scrollProgressHero) + 0.1 * scrollProgressHero;
        const newBlur = 10 * scrollProgressHero;
        const newOverlayOpacity = scrollProgressHero;

        setHeroBackgroundStyles({
          imageOpacity: newImageOpacity,
          filter: `blur(${newBlur}px)`,
          overlayOpacity: newOverlayOpacity,
        });

        setMainBackgroundOpacity(scrollProgressMain);
        
        rafIdRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const handleInvestClick = () => {
    setShowToast(true);
  };

  const paragraphStyle = "text-lg md:text-xl tracking-tight font-light leading-relaxed mb-6 text-[#B4B4B4]";

  return (
    <motion.div
      className="min-h-screen bg-[#0B0B0B] text-gray-100 font-inter antialiased overflow-x-hidden relative"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {/* Toast Notification */}
      {showToast && <Toast message="Investment opportunities coming soon!" onClose={() => setShowToast(false)} />}

      {/* Header with brand name */}
      <motion.header
        className="px-6 md:px-16 lg:px-24 flex justify-between items-center py-6 relative z-30"
        variants={textVariants}
      >
 
      </motion.header>

      {/* Hero Section - Using transform3d for better mobile performance */}
      <section className="relative h-[100vh] flex flex-col justify-center items-center text-center w-full mx-auto">
        {/* NOTE: Replace this Pinterest URL with your own hosted image for production reliability */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0 will-change-transform"
          style={{
            backgroundImage: "url('https://i.pinimg.com/1200x/42/da/f0/42daf05e14d15ce40323dac0303576fa.jpg')",
            filter: heroBackgroundStyles.filter,
            opacity: heroBackgroundStyles.imageOpacity,
            transform: 'translate3d(0, 0, 0)', // GPU acceleration for mobile
            transition: 'opacity 0.3s ease-out, filter 0.3s ease-out',
            boxShadow: '0 0 100px 50px rgba(0,0,0,0.8) inset',
          }}
          aria-hidden="true"
        ></div>
        <div
          className="fixed inset-0 bg-[#0B0B0B] will-change-transform"
          style={{
            opacity: heroBackgroundStyles.overlayOpacity,
            transform: 'translate3d(0, 0, 0)', // GPU acceleration
            transition: 'opacity 0.3s ease-out',
          }}
          aria-hidden="true"
        ></div>
        <motion.h2
          className="text-3xl md:text-5xl lg:text-7xl font-playfair-display tracking-tight font-medium leading-tight mb-8 text-white relative z-20"
          variants={textVariants}
        >
          {content.headerTitle}
        </motion.h2>
        <motion.p
          className="text-xl md:text-2xl font-medium text-neutral-100 tracking-tight leading-relaxed relative z-20"
          variants={textVariants}
        >
          {content.heroSubtitle}
        </motion.p>
      </section>

      <main
        className="max-w-3xl mx-auto px-6 md:px-16 lg:px-24 py-20 space-y-16 relative z-20"
        style={{ backgroundColor: `rgba(11,11,11,${mainBackgroundOpacity})`, transition: 'background-color 0.3s ease-out' }}
      >
        {/* Letter Section */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h3
            className="text-3xl md:text-4xl font-playfair-display font-medium mb-12 tracking-tight text-white leading-tight"
            variants={textVariants}
          >
            {content.letterTitle}
          </motion.h3>
          
          <motion.p 
            className="text-xl md:text-2xl tracking-tight font-light leading-relaxed mb-10 text-white italic"
            variants={textVariants}
          >
            {content.openingQuestion}
          </motion.p>
          
          <motion.p className={paragraphStyle} variants={textVariants}>
            {content.paragraph1}
          </motion.p>
          
          <motion.p className={paragraphStyle} variants={textVariants}>
            {content.paragraph2}
          </motion.p>
          
          <motion.p className={paragraphStyle} variants={textVariants}>
            {content.paragraph3}
          </motion.p>
          
          <motion.p className={paragraphStyle} variants={textVariants}>
            {content.paragraph4}
          </motion.p>
          
          <motion.p className={paragraphStyle} variants={textVariants}>
            {content.paragraph5}
          </motion.p>
          
          <motion.p 
            className="text-xl md:text-xl tracking-tight font-light leading-relaxed mt-10 mb-8 text-white italic"
            variants={textVariants}
          >
            {content.closingLine}
          </motion.p>
          
          <motion.div variants={textVariants}>
            <p className="text-lg md:text-xl tracking-tight font-light leading-relaxed text-[#8C8C8C]">
              {content.signature}
            </p>
            <p className="text-base md:text-lg tracking-tight font-light leading-relaxed text-[#6C6C6C] mt-1">
              {content.signatureTitle}
            </p>
          </motion.div>
        </motion.section>

        {/* Investment CTA Section */}
        <motion.section
          className="text-center flex flex-col items-center justify-center pt-12 border-t border-white/30"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h3 
            className="text-3xl md:text-4xl font-playfair-display font-medium leading-tight mb-6 text-white" 
            variants={textVariants}
          >
            {content.investTitle}
          </motion.h3>
          <motion.p
            className="text-lg md:text-xl tracking-tight font-light leading-snug max-w-2xl mx-auto mb-12 text-[#8C8C8C]"
            variants={textVariants}
          >
            {content.investIntro}
          </motion.p>
          <motion.button
            onClick={handleInvestClick}
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-black rounded-full bg-white backdrop-blur-2xl shadow-xl border border-white/30 hover:bg-white/90 hover:border-white/50 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            aria-label="Learn more about investment opportunities"
            whileHover={{ scale: 1.05, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05)' }}
            whileTap={{ scale: 0.95 }}
            variants={textVariants}
          >
            {content.investButton}
          </motion.button>
        </motion.section>
      </main>
      
      <motion.footer
        className="text-center py-8 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <p className="text-sm text-gray-500">{content.footerText}</p>
      </motion.footer>

      <style>{`
        body {
          background-color: black;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .font-playfair-display {
          font-family: 'Playfair Display', Georgia, serif;
        }
        .font-inter {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </motion.div>
  );
};

export default App;