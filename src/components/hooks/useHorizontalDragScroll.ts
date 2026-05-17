import { useState, useEffect, RefObject, useCallback } from 'react';

export function useHorizontalDragScroll<T extends HTMLElement>(
  ref: RefObject<T | null>
): { isDragging: boolean } {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const element = ref.current;
    if (!element) return;
    setIsDragging(true);
    setStartX(e.pageX - element.offsetLeft);
    setScrollLeft(element.scrollLeft);
    element.style.cursor = 'grabbing';
    element.style.scrollBehavior = 'auto';
    element.style.userSelect = 'none';
  }, [ref]);

  const handleMouseLeaveOrUp = useCallback(() => {
    const element = ref.current;
    if (!element || !isDragging) return;
    setIsDragging(false);
    element.style.cursor = 'grab';
    element.style.scrollBehavior = 'smooth';
    element.style.removeProperty('user-select');
  }, [ref, isDragging]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const element = ref.current;
    if (!isDragging || !element) return;
    e.preventDefault();
    const x = e.pageX - element.offsetLeft;
    const walk = (x - startX) * 2;
    element.scrollLeft = scrollLeft - walk;
  }, [isDragging, ref, startX, scrollLeft]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const element = ref.current;
    if (!element) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - element.offsetLeft);
    setScrollLeft(element.scrollLeft);
    element.style.scrollBehavior = 'auto';
    element.style.userSelect = 'none';
  }, [ref]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const element = ref.current;
    if (!isDragging || !element) return;
    const x = e.touches[0].pageX - element.offsetLeft;
    const walk = (x - startX) * 2;
    element.scrollLeft = scrollLeft - walk;
  }, [isDragging, ref, startX, scrollLeft]);

  const handleTouchEnd = useCallback(() => {
    const element = ref.current;
    if (!element || !isDragging) return;
    setIsDragging(false);
    element.style.scrollBehavior = 'smooth';
    element.style.removeProperty('user-select');
  }, [ref, isDragging]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeaveOrUp);
    element.addEventListener('mouseup', handleMouseLeaveOrUp);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    element.style.cursor = 'grab';

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeaveOrUp);
      element.removeEventListener('mouseup', handleMouseLeaveOrUp);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.style.removeProperty('cursor');
      element.style.removeProperty('scroll-behavior');
      element.style.removeProperty('user-select');
    };
  }, [ref, handleMouseDown, handleMouseLeaveOrUp, handleMouseMove, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isDragging };
}