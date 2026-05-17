'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '../../../lib/utils' // Assuming standard utils path, adjust if needed
import { useClickOutside } from '@/hooks/use-click-outside'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  ShoppingBag,
  Hash,
  Users, 
  Calendar,
  CircleHelp,
  BookOpen,
  Ruler,
  X,
  ArrowUpRight,
  Plus,
  Minus,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import AuthButton from '@/app/(frontend)/auth/AuthButton'

// --- Types ---
interface Props {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

interface MenuItemWithIcon {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface MenuItemLink {
  title: string
  href: string
}

interface MenuData {
  categories: MenuItemWithIcon[]
  brands: MenuItemLink[]
  resources: MenuItemWithIcon[]
}

// --- Data ---
const menuItems: MenuData = {
  categories: [
    { title: "Shop All Categories", href: "/shop-all", icon: ShoppingBag },
    { title: "Sneakers", href: "/categories/sneakers", icon: Hash },
    { title: "Apparel", href: "/categories/apparel", icon: Users },
    { title: "Accessories", href: "/categories/accessories", icon: Calendar },
  ],
  brands: [
    { title: "Nike", href: "/brands/nike" },
    { title: "Adidas", href: "/brands/adidas" },
    { title: "Stüssy", href: "/brands/stussy" },
    { title: "Bape", href: "/brands/bape" },
    { title: "Air Jordan", href: "/brands/air-jordan" },
    { title: "Supreme", href: "/brands/supreme" },
  ],
  resources: [
    { title: "Support", href: "/resources/support", icon: CircleHelp },
    { title: "Style Guide", href: "/resources/style-guide", icon: BookOpen },
    { title: "Size Charts", href: "/resources/size-guide", icon: Ruler },
  ],
}

// --- Component ---
const MobileMenu = ({ isOpen, setIsOpen }: Props) => {
  const ref = useClickOutside(() => setIsOpen(false))
  const [mounted, setMounted] = useState(false)

  // 1. Wait for mount to avoid hydration mismatch with Portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Ultra smooth animation variants with perfect easing
  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1] // Emphasized easing - ultra smooth
      } 
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.35, 
        ease: [0.32, 0, 0.67, 0] // Smooth deceleration
      } 
    }
  }

  const menuVariants: Variants = {
    hidden: { 
      y: '100%', 
      opacity: 0,
      scale: 0.95,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        damping: 25,
        mass: 0.8
      }
    },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 180,  // Lower stiffness = smoother motion
        damping: 22,     // Lower damping = less resistance
        mass: 0.7,       // Lower mass = more responsive
        opacity: { 
          duration: 0.4, 
          ease: [0.16, 1, 0.3, 1] 
        }
      }
    },
    exit: { 
      y: '100%', 
      opacity: 0,
      scale: 0.96,
      transition: { 
        type: "spring",
        stiffness: 250,
        damping: 28,
        mass: 0.6,
        opacity: { 
          duration: 0.25, 
          ease: [0.32, 0, 0.67, 0] 
        }
      }
    }
  }

  const closeButtonVariants: Variants = {
    hidden: { opacity: 0, scale: 0.7, rotate: -90 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: { 
        delay: 0.15,
        type: "spring",
        stiffness: 250,
        damping: 20
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.7,
      rotate: 90,
      transition: { 
        duration: 0.2,
        ease: [0.32, 0, 0.67, 0]
      } 
    }
  }

  const handleClose = () => setIsOpen(false)

  // If not mounted on client yet, return null
  if (!mounted) return null

  // 2. Wrap the entire output in createPortal(..., document.body)
  // This moves the HTML div to the bottom of the <body> tag, outside the Navbar.
  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end md:hidden">
          {/* Backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Close Button */}
          <motion.button
            variants={closeButtonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleClose}
            className="absolute top-6 left-6 z-[10000] p-3 bg-white rounded-full shadow-lg transition-shadow hover:shadow-xl"
          >
            <X className="w-6 h-6 text-black" />
          </motion.button>

          {/* Main Card Container */}
          <motion.div
            ref={ref}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-[10000] w-full h-[85vh] bg-white rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex-1 overflow-y-auto px-6 pt-12 pb-4">
              <div className="mb-2 border-b border-gray-200">
                <AuthButton variant="mobile" onNavigate={handleClose} />
              </div>

              {/* Accordion Group: Categories */}
              <Accordion type="single" collapsible className="w-full mb-2" defaultValue="categories">
                <CustomAccordionItem 
                  value="categories" 
                  title="Categories" 
                  items={menuItems.categories} 
                  onClick={handleClose}
                />
              </Accordion>

              {/* Direct Links Group */}
              <div className="border-t border-gray-200">
                 <DirectLinkItem href="/for-you" title="For You" onClick={handleClose} />
                 <div className="border-t border-gray-200" />
                 <DirectLinkItem href="/about-us" title="About" onClick={handleClose} />
                 <div className="border-t border-gray-200" />
                 <DirectLinkItem href="/contact" title="Contact" onClick={handleClose} />
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body // <--- Target DOM Node
  )
}

// --- Sub-Components ---

const CustomAccordionItem = ({ value, title, items, onClick }: any) => {
  return (
    <AccordionItem value={value} className="border-none">
      <AccordionTrigger className="py-5 hover:no-underline group [&[data-state=open]>div>div>.plus]:hidden [&[data-state=open]>div>div>.minus]:block [&[data-state=closed]>div>div>.plus]:block [&[data-state=closed]>div>div>.minus]:hidden">
        <div className="flex items-center justify-between w-full">
          <span className="text-3xl font-bold text-black tracking-tight">{title}</span>
          <motion.div 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors group-hover:bg-gray-200"
          >
            <Plus className="w-5 h-5 text-black plus" />
            <Minus className="w-5 h-5 text-black minus hidden" />
          </motion.div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-6">
        <div className="flex flex-col space-y-4 pl-1">
          {items.map((item: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: idx * 0.05,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              <Link
                href={item.href}
                onClick={onClick}
                className="block text-xl text-gray-800 hover:text-black transition-colors font-medium"
              >
                {item.title}
              </Link>
            </motion.div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

const DirectLinkItem = ({ href, title, onClick }: { href: string, title: string, onClick: () => void }) => (
  <Link 
    href={href} 
    onClick={onClick}
    className="flex items-center justify-between w-full py-5 group"
  >
    <span className="text-3xl font-bold text-black tracking-tight">{title}</span>
    <motion.div
      whileHover={{ x: 3, y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <ArrowUpRight className="w-6 h-6 text-black" />
    </motion.div>
  </Link>
)

const FooterLink = ({ href, label, onClick }: { href: string, label: string, onClick: () => void }) => (
  <Link 
    href={href} 
    onClick={onClick} 
    className="block text-base font-medium text-gray-900 hover:text-gray-600"
  >
    {label}
  </Link>
)

export default MobileMenu