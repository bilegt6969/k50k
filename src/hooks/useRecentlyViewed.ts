// hooks/useRecentlyViewed.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface RecentlyViewedItem {
  id: string;
  name: string;
  mainPictureUrl: string;
  slug: string;
  brandName: string;
  viewedAt: number;
}

const STORAGE_KEY = 'psda_recently_viewed';
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);
  const hasSynced = useRef(false);
  const recentlyViewedRef = useRef<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount - only once
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitialized.current) {
      hasInitialized.current = true;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setRecentlyViewed(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading recently viewed:', error);
      }
    }
  }, []);

  const mergeRecentlyViewed = useCallback((local: RecentlyViewedItem[], firebase: RecentlyViewedItem[]) => {
    const combined = [...local, ...firebase];
    const unique = combined.reduce((acc, item) => {
      const existing = acc.find(x => x.id === item.id);
      if (!existing || item.viewedAt > existing.viewedAt) {
        return [...acc.filter(x => x.id !== item.id), item];
      }
      return acc;
    }, [] as RecentlyViewedItem[]);
    
    return unique
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_ITEMS);
  }, []);

  // Sync with Firebase when user logs in - only once per user session
  useEffect(() => {
    if (user && hasInitialized.current && !hasSynced.current && !isLoading) {
      hasSynced.current = true;
      
      const syncWithFirebase = async () => {
        setIsLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const firebaseData = userDoc.data()?.recentlyViewed || [];
          
          // Get current localStorage data fresh
          const currentStored = localStorage.getItem(STORAGE_KEY);
          const localData = currentStored ? JSON.parse(currentStored) : [];
          
          const merged = mergeRecentlyViewed(localData, firebaseData);
          
          setRecentlyViewed(merged);
          
          // Update both localStorage and Firebase
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          await updateDoc(doc(db, 'users', user.uid), {
            recentlyViewed: merged
          });
        } catch (error) {
          console.error('Firebase sync error:', error);
        } finally {
          setIsLoading(false);
        }
      };

      syncWithFirebase();
    }
  }, [user, mergeRecentlyViewed]);

  // Reset sync flag when user changes
  useEffect(() => {
    hasSynced.current = false;
  }, [user?.uid]);

  // Keep ref in sync so addToRecentlyViewed can read current value without being in its deps
  useEffect(() => {
    recentlyViewedRef.current = recentlyViewed;
  }, [recentlyViewed]);

  const addToRecentlyViewed = useCallback(async (product: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    const newItem: RecentlyViewedItem = {
      ...product,
      viewedAt: Date.now(),
    };

    const current = recentlyViewedRef.current;
    const updated = [newItem, ...current.filter(item => item.id !== product.id)].slice(0, MAX_ITEMS);

    setRecentlyViewed(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          recentlyViewed: updated,
        }, { merge: true });
      } catch (error) {
        console.error('Firebase save error:', error);
      }
    }
  }, [user]);

  const clearRecentlyViewed = useCallback(async () => {
    setRecentlyViewed([]);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          recentlyViewed: []
        });
      } catch (error) {
        console.error('Firebase clear error:', error);
      }
    }
  }, [user]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    isLoading,
  };
};