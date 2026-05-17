'use client';

import { useEffect, useState, useRef } from 'react';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ArrowRight, ArrowUpRight, User as UserIcon, LogOut, Edit, Heart, Settings, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/functions';

type AuthButtonVariant = 'default' | 'mobile' | 'mobile-header';

type AuthButtonProps = {
  variant?: AuthButtonVariant;
  onNavigate?: () => void;
};

const AuthButton = ({ variant = 'default', onNavigate }: AuthButtonProps) => {
  const isMobileVariant = variant === 'mobile';
  const isMobileHeaderVariant = variant === 'mobile-header';
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 240;
      
      setDropdownPosition({
        top: rect.bottom + 16,
        left: rect.left + (rect.width / 2) - (dropdownWidth / 2)
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSignOut = async (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    setIsSigningOut(true);
    try {
      await signOut(auth);
      setIsOpen(false);
      onNavigate?.();
      router.replace('/');
      toast.success('Амжилттай гарлаа');
    } catch (err) {
      toast.error('Гарахад алдаа гарлаа. Дахин оролдоно уу.');
      console.error('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignIn = () => {
    onNavigate?.();
    router.push('/auth/login');
  };

  const handleProfileClick = () => {
    onNavigate?.();
    router.push('/account');
    setIsOpen(false);
  };

  const displayName =
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'Миний данс';

  const handleEditProfile = () => {
    router.push('/account/edit');
    setIsOpen(false);
  };

  const handleFavorites = () => {
    router.push('/account/favorites');
    setIsOpen(false);
  };

  const handleSettings = () => {
    router.push('/account/settings');
    setIsOpen(false);
  };

  const handlePrivacy = () => {
    router.push('/account/privacy');
    setIsOpen(false);
  };

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: UserIcon, onClick: handleProfileClick },
    { id: 'edit', label: 'Edit Profile', icon: Edit, onClick: handleEditProfile },
    { id: 'favorites', label: 'Favorites', icon: Heart, onClick: handleFavorites },
    { id: 'settings', label: 'Settings', icon: Settings, onClick: handleSettings },
    { id: 'privacy', label: 'Privacy', icon: Shield, onClick: handlePrivacy },
  ];

  const dropdownMenuContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 22,
            mass: 0.6,
            opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
          }}
          className="fixed z-[150] min-w-[240px] p-2.5 rounded-[28px]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            background: 'rgba(20, 20, 20, 0.78)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.04,
                    type: 'spring',
                    stiffness: 250,
                    damping: 22
                  }}
                  onClick={item.onClick}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-full transition-all duration-100 ease-[cubic-bezier(0.16,1,0.3,1)] group text-white relative overflow-hidden"
                  style={{
                    background: hoveredItem === item.id 
                      ? 'rgba(255, 255, 255, 0.22)' 
                      : 'transparent',
                    boxShadow: hoveredItem === item.id
                      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)'
                      : 'none',
                  }}
                >
                  {hoveredItem === item.id && (
                    <motion.div
                      layoutId="hoverBackground"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25
                      }}
                    />
                  )}
                  <motion.div
                    animate={{
                      scale: hoveredItem === item.id ? 1.12 : 1,
                      rotate: hoveredItem === item.id ? 5 : 0
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }}
                    className="relative z-10"
                  >
                    <Icon size={18} />
                  </motion.div>
                  <span className="text-sm font-medium relative z-10">{item.label}</span>
                </motion.button>
              );
            })}

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                delay: menuItems.length * 0.04,
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="my-1.5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />

            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: (menuItems.length + 1) * 0.04,
                type: 'spring',
                stiffness: 250,
                damping: 22
              }}
              onClick={handleSignOut}
              onMouseEnter={() => setHoveredItem('sign-out')}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group text-red-400 hover:text-red-300 relative overflow-hidden"
              style={{
                background: hoveredItem === 'sign-out' 
                  ? 'rgba(239, 68, 68, 0.18)' 
                  : 'transparent',
               
                boxShadow: hoveredItem === 'sign-out'
                  ? 'inset 0 1px 0 rgba(239, 68, 68, 0.15), 0 4px 16px rgba(239, 68, 68, 0.15)'
                  : 'none',
              }}
              disabled={isSigningOut}
            >
              {hoveredItem === 'sign-out' && (
                <motion.div
                  layoutId="hoverBackground"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25
                  }}
                />
              )}
              <div className="relative z-10">
                {isSigningOut ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                    className="w-[18px] h-[18px] border-2 border-red-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <motion.div
                    animate={{
                      scale: hoveredItem === 'sign-out' ? 1.12 : 1,
                      rotate: hoveredItem === 'sign-out' ? 5 : 0
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }}
                  >
                    <LogOut size={18} />
                  </motion.div>
                )}
              </div>
              <span className="text-sm font-medium relative z-10">
                {isSigningOut ? 'Гарах...' : 'Гарах'}
              </span>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={cn('relative', isMobileVariant && 'w-full')}>
      {user ? (
        isMobileVariant ? (
          <div className="w-full">
            <button
              type="button"
              onClick={handleProfileClick}
              className="group flex w-full items-center justify-between py-5 focus:outline-none"
            >
              <div className="flex min-w-0 items-center gap-4">
                <ProfileAvatar user={user} size="lg" />
                <div className="min-w-0 text-left">
                  <p className="truncate text-2xl font-bold tracking-tight text-black sm:text-3xl">
                    {displayName}
                  </p>
                  {user.email && (
                    <p className="truncate text-sm font-medium text-gray-500">{user.email}</p>
                  )}
                </div>
              </div>
              <motion.div
                whileHover={{ x: 3, y: -3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <ArrowUpRight className="h-6 w-6 shrink-0 text-black" />
              </motion.div>
            </button>
            <button
              type="button"
              onClick={(event) => void handleSignOut(event)}
              disabled={isSigningOut}
              className="w-full py-3 text-left text-lg font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
            >
              {isSigningOut ? 'Гарах...' : 'Гарах'}
            </button>
          </div>
        ) : isMobileHeaderVariant ? (
          <button
            type="button"
            onClick={handleProfileClick}
            className="flex items-center justify-center focus:outline-none"
            aria-label="Миний данс"
          >
            <ProfileAvatar user={user} size="sm" onDark />
          </button>
        ) : (
        <>
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className="relative group focus:outline-none flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: isOpen ? 1.08 : 1,
                borderColor: isOpen 
                  ? 'rgba(255, 255, 255, 0.35)' 
                  : 'rgba(255, 255, 255, 0.15)',
              }}
              transition={{
                type: 'spring',
                stiffness: 250,
                damping: 20
              }}
              className="w-9 h-9 rounded-full overflow-hidden border-2 hover:bg-neutral-500 transition-all duration-300"
              style={{
                boxShadow: isOpen 
                  ? '0 0 0 4px rgba(255, 255, 255, 0.12), 0 8px 24px rgba(0, 0, 0, 0.3)' 
                  : '0 0 0 0px rgba(255, 255, 255, 0), 0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
  <img 
    src="/icons/user.svg" 
    alt="Profile" 
    className="w-full h-full object-contain"
  />
</div>
              )}
            </motion.div>
          </button>
          {isMounted && createPortal(dropdownMenuContent, document.body)}
        </>
        )
      ) : isMobileVariant ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="group flex w-full items-center justify-between py-5 focus:outline-none"
          onClick={handleSignIn}
        >
          <span className="text-3xl font-bold tracking-tight text-black">Нэвтрэх</span>
          <motion.div
            whileHover={{ x: 3, y: -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <ArrowUpRight className="h-6 w-6 text-black" />
          </motion.div>
        </motion.button>
      ) : isMobileHeaderVariant ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-sm focus:outline-none"
          onClick={handleSignIn}
        >
          Нэвтрэх
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20
          }}
          className="group relative overflow-hidden transition-all bg-white text-black duration-300 items-center focus:outline-none"
          onClick={handleSignIn}
          style={{
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            padding: '6px 10px'
          }}
        >
          <div className="flex items-center gap-1 text-black font-medium text-sm relative z-10">
            Нэвтрэх
            <motion.div
              animate={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20
              }}
            >
              <ArrowRight className="w-4 h-4 hidden lg:block" />
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          />
        </motion.button>
      )}
    </div>
  );
};

function ProfileAvatar({
  user,
  size,
  onDark = false,
}: {
  user: User;
  size: 'sm' | 'lg';
  onDark?: boolean;
}) {
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-full border bg-gray-100',
        size === 'lg' ? 'h-14 w-14' : 'h-8 w-8',
        onDark ? 'border-white/25 bg-neutral-800' : 'border-gray-200'
      )}
    >
      {user.photoURL ? (
        <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <img src="/icons/user.svg" alt="Profile" className="h-full w-full object-contain" />
        </div>
      )}
    </div>
  );
}

export default AuthButton;