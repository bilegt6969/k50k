'use client'

import React, { useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import { cva } from 'class-variance-authority'
import Link from 'next/link'
import {
  CalendarRangeIcon,
  HashIcon,
  ShoppingBag,
  TrendingUp,
  UsersIcon,
  Mail,
  ArrowRight,
  Zap,
  ChevronDown,
  CircleHelp
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Navigation Primitives ---

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn('flex flex-1 list-none items-center justify-center space-x-1', className)}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  'group inline-flex h-10 w-max items-center justify-center rounded-full px-4 py-2 text-sm font-medium outline-none transition-[color,background-color,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50',
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), 'group', className)}
    {...props}
  >
    {children}{' '}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 opacity-80 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      'left-0 top-0 w-full duration-200 ease-out data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in-0 data-[motion^=to-]:fade-out data-[motion^=from-]:zoom-in-98 data-[motion^=to-]:zoom-out-95 data-[motion=from-end]:slide-in-from-right-8 data-[motion=from-start]:slide-in-from-left-8 data-[motion=to-end]:slide-out-to-right-8 data-[motion=to-start]:slide-out-to-left-8 md:absolute md:w-auto',
      className,
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [glassRect, setGlassRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const updateRect = () => {
      let rect = wrapper.getBoundingClientRect()
      if (rect.height <= 30 || rect.width <= 100) {
        const viewportEl = wrapper.firstElementChild as HTMLElement | null
        if (viewportEl) rect = viewportEl.getBoundingClientRect()
      }
      if (rect.height > 30 && rect.width > 100) {
        setGlassRect(rect)
      } else {
        setGlassRect(null)
      }
    }

    updateRect()
    const intervalId = setInterval(updateRect, 120)
    const resizeObs = new ResizeObserver(updateRect)
    resizeObs.observe(wrapper)
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)

    return () => {
      clearInterval(intervalId)
      resizeObs.disconnect()
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [])

  const portalTarget =
    typeof document !== 'undefined'
      ? document.getElementById('dropdown-glass-portal')
      : null

  const portaledGlass =
    portalTarget &&
    glassRect &&
    glassRect.height > 0 &&
    createPortal(
      <div
        className="dropdown-glass fixed rounded-[32px]"
        style={{
          top: glassRect.top,
          left: glassRect.left,
          width: glassRect.width,
          height: glassRect.height,
        }}
        aria-hidden
      />,
      portalTarget
    )

  return (
    <>
      <div className={cn('absolute left-0 top-full flex justify-center mt-4')}>
        <div ref={wrapperRef} className="relative overflow-hidden rounded-[32px]">
          <NavigationMenuPrimitive.Viewport
            className={cn(
              'origin-top-center relative z-50 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-visible text-popover-foreground duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-98 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-98 md:w-[var(--radix-navigation-menu-viewport-width)]',
              className,
            )}
            ref={ref}
            {...props}
          />
        </div>
      </div>
      {portaledGlass}
    </>
  )
})
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName

// --- Main Menu Component ---

const navLinkCls = (variant: 'default' | 'white') =>
  variant === 'white'
    ? 'text-black hover:text-black hover:bg-black/[0.04]'
    : 'text-neutral-300 hover:bg-black/45 hover:text-neutral-50 active:bg-black/55'

const navIconCls = (variant: 'default' | 'white') =>
  variant === 'white'
    ? 'text-red-500 group-hover:text-black'
    : 'text-neutral-400 group-hover:text-neutral-100'

/** Dropdown triggers — avoid theme accent + pure white on glass */
const navTriggerCls = (variant: 'default' | 'white') =>
  variant === 'white'
    ? 'text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950 data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-950'
    : 'text-neutral-300 hover:bg-black/45 hover:text-neutral-50 data-[state=open]:bg-black/50 data-[state=open]:text-neutral-50'

const Menu = ({ variant = 'default' }: { variant?: 'default' | 'white' }) => {
  return (
    <NavigationMenu className="relative z-10">
      <NavigationMenuList className="gap-1">
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/for-you"
              className={cn(
                'group flex items-center h-7 px-4 text-sm font-medium rounded-full transition-[color,background-color] duration-200 ease-out',
                navLinkCls(variant),
              )}
            >
              <TrendingUp className={cn('w-4 h-4 mr-2 transition-colors', navIconCls(variant))} />
              For You
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* 2. Categories (Dropdown) */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              'h-7 px-4 text-sm font-medium rounded-full bg-transparent transition-[color,background-color] duration-200 ease-out',
              navTriggerCls(variant),
            )}
          >
            Categories
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }}
              className="flex w-[600px] gap-2 p-2 rounded-[32px] border border-neutral-200/90 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              {/* Left Column: Navigation Links */}
              <div className="flex flex-col justify-center w-1/2 p-2 space-y-1">
                <div className="px-3 pb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Browse
                </div>
                {[
                  {
                    title: 'Sneakers',
                    href: '/categories/sneakers',
                    icon: <HashIcon className="w-4 h-4" />,
                    desc: 'Latest drops & heat',
                  },
                  {
                    title: 'Apparel',
                    href: '/categories/apparel',
                    icon: <UsersIcon className="w-4 h-4" />,
                    desc: 'Streetwear collections',
                  },
                  {
                    title: 'Accessories',
                    href: '/categories/accessories',
                    icon: <CalendarRangeIcon className="w-4 h-4" />,
                    desc: 'Belts, bags & hats',
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-start p-3 rounded-2xl transition-colors duration-200 ease-out hover:bg-neutral-100"
                  >
                    <div className="mt-1 mr-4 p-2 rounded-full bg-neutral-100 text-neutral-600 transition-colors duration-200 group-hover:bg-neutral-200 group-hover:text-neutral-900">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950">
                        {item.title}
                      </div>
                      <p className="text-xs text-neutral-500 group-hover:text-neutral-600">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Right Column: Featured Card */}
              <div className="w-1/2">
                <Link
                  href="/shop-all"
                  className="flex flex-col justify-between h-full p-6 bg-[#EFEFEA] rounded-[24px] hover:opacity-90 transition-opacity cursor-pointer no-underline"
                >
                  <div className="flex justify-end">
                    <ShoppingBag className="w-12 h-12 text-neutral-800 opacity-10" />
                  </div>
                  
                  <div className="flex items-center justify-center flex-1">
                    <div className="grid grid-cols-2 gap-2 opacity-20">
                        <div className="w-2 h-2 bg-black rounded-full" />
                        <div className="w-2 h-2 bg-black rounded-full" />
                        <div className="w-2 h-2 bg-black rounded-full" />
                        <div className="w-2 h-2 bg-black rounded-full" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Shop All
                    </h3>
                    <p className="text-sm text-neutral-600 leading-tight mt-1">
                      Explore our entire catalog.
                    </p>
                  </div>
                </Link>
              </div>
            </motion.div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* 3. Brands (Dropdown) */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              'h-9 px-4 text-sm font-medium rounded-full bg-transparent transition-[color,background-color] duration-200 ease-out',
              navTriggerCls(variant),
            )}
          >
            Brands
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.85 }}
              className="flex w-[700px] gap-2 p-2 rounded-[32px] border border-neutral-200/90 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              {/* Left Column: Two columns of text links */}
              <div className="flex-1 p-4">
                <div className="px-2 pb-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Top Brands
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {[
                    { name: 'Nike', desc: 'Just do it' },
                    { name: 'Adidas', desc: 'Three stripes' },
                    { name: 'Stüssy', desc: 'Iconic street' },
                    { name: 'Bape', desc: 'A Bathing Ape' },
                    { name: 'Air Jordan', desc: 'Flight' },
                    { name: 'Supreme', desc: 'NY Skate' },
                    { name: 'Palace', desc: 'London Skate' },
                    { name: 'Yeezy', desc: 'By Kanye' },
                  ].map((brand) => (
                    <Link
                      key={brand.name}
                      href={`/brands/${brand.name.toLowerCase()}`}
                      className="group block p-3 rounded-xl transition-colors duration-200 ease-out hover:bg-neutral-100"
                    >
                      <div className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950">
                        {brand.name}
                      </div>
                      <div className="text-xs text-neutral-500 group-hover:text-neutral-600 truncate">
                        {brand.desc}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/brands"
                  className="mt-4 flex items-center text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg transition-colors duration-200 ease-out hover:bg-neutral-100 w-fit"
                >
                  View all brands <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>

              {/* Right Column: Featured Brand Card */}
              <div className="w-[240px]">
                <Link
                  href="/brands/nike"
                  className="flex flex-col h-full bg-[#202020] rounded-[24px] p-1 hover:bg-[#252525] transition-colors border border-white/5"
                >
                  <div className="flex-1 bg-neutral-800/50 rounded-[20px] m-1 flex items-center justify-center relative overflow-hidden group">
                    <Zap className="w-10 h-10 text-white/20 group-hover:text-white/40 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white font-semibold">
                        New Arrivals
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-200">Brand Spotlight</span>
                      <ArrowRight className="w-4 h-4 text-neutral-500" />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Latest drops from top partners.
                    </p>
                  </div>
                </Link>
              </div>
            </motion.div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* 4. About (Simple Link) */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/about-us"
              className={cn(
                'group flex items-center h-9 px-4 text-sm font-medium rounded-full transition-[color,background-color] duration-200 ease-out',
                navLinkCls(variant),
              )}
            >
              <CircleHelp className={cn('w-4 h-4 mr-2 transition-colors', navIconCls(variant))} />
              About
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* 5. Contact (Simple Link) */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/contact"
              className={cn(
                'group flex items-center h-9 px-4 text-sm font-medium rounded-full transition-[color,background-color] duration-200 ease-out',
                navLinkCls(variant),
              )}
            >
              <Mail className={cn('w-4 h-4 mr-2 transition-colors', navIconCls(variant))} />
              Contact Us
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

export default Menu