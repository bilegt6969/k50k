'use client';

import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}

export function AccordionItem({
  title,
  children,
  isOpen,
  onToggle,
  icon,
}: AccordionItemProps) {
  return (
    <div className="bg-white/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 ease-out">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-white/70 group-hover:text-white transition-colors duration-300">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors duration-300">
            {title}
          </h3>
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 text-white/60 transition-all duration-500 ease-out group-hover:text-white ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.25, 0.46, 0.45, 0.94],
              opacity: { duration: 0.3 },
            }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
