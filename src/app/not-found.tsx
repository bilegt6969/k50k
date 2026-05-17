import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link'; // Import Link

export default function App() {
  return (
    <NotFoundPage />
  );
}

function NotFoundPage() {
  return (
    <main data-page="not-found" className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-inter">
      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

      <div className="relative z-10 flex flex-col items-center text-center p-4">
        {/* Black Smoke-like Blurry Thing behind 404 */}
        <div
          className="absolute -z-10"
          style={{
            width: 'clamp(400px, 80vw, 1000px)',
            height: 'clamp(400px, 80vw, 1000px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(40, 40, 40, 0.8) 0%, rgba(20, 20, 20, 0.9) 50%, transparent 100%)',
            filter: 'blur(120px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        ></div>

        {/* Enhanced Base Shadow for 404 */}
        <div
          className="absolute -z-5"
          style={{
            width: 'clamp(500px, 90vw, 1200px)',
            height: 'clamp(100px, 25vw, 300px)',
            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 40%, transparent 70%)',
            filter: 'blur(60px)',
            top: '70%', // Position it at the base of the larger 404 text
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        ></div>

        {/* Lower 404 Text Shadow Effect - Dark overlay on bottom half */}
        <div
          className="absolute -z-3"

        ></div>

        {/* Additional focused bottom shadow */}
        <div
          className="absolute -z-4"

        ></div>

        {/* Main 404 Text WITH Enhanced Shadow */}
        <div className="relative">
          <h1
            className="text-[200px] font-light font-mono text-neutral-800 md:text-[450px] lg:text-[550px] tracking-tight relative z-0 leading-none"
            aria-label="404 Error"

          >
            404
          </h1>
          {/* New: Base shadow for 404 numbers */}

        </div>

        {/* Subtitle Text */}
        <p className="mt-5 text-xl font-normal text-white md:text-2xl relative z-0">
        oopsie whoopsie page go bye bye
        </p>

        {/* Call-to-Action Button */}
        <Link href="/" passHref> {/* Use Link component with href */}
          <a
            className="mt-10 flex items-center gap-2 rounded-full border-2 border-white bg-transparent px-6 py-3 text-sm font-medium uppercase text-white transition-colors hover:bg-white hover:text-black"
          >
            back 2 safety
            <ArrowRight size={16} />
          </a>
        </Link>
      </div>

      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          background-color: black;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          margin: 0;
          padding: 0;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
          animation-fill-mode: both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          animation-fill-mode: both;
        }
      `}</style>
    </main>
  );
}