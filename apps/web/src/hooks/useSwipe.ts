import { useRef, useCallback, useEffect, RefObject } from 'react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
}

export function useSwipe<T extends HTMLElement>(
  ref: RefObject<T>,
  { onSwipeLeft, onSwipeRight, minSwipeDistance = 50 }: UseSwipeOptions
): void {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      isHorizontalSwipe.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current || isHorizontalSwipe.current !== null) return;

      const deltaX = Math.abs(e.touches[0].clientX - touchStart.current.x);
      const deltaY = Math.abs(e.touches[0].clientY - touchStart.current.y);

      if (deltaX > 10 || deltaY > 10) {
        isHorizontalSwipe.current = deltaX > deltaY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      if (isHorizontalSwipe.current !== true) {
        touchStart.current = null;
        isHorizontalSwipe.current = null;
        return;
      }

      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStart.current.x - touchEndX;

      if (Math.abs(diff) >= minSwipeDistance) {
        if (diff > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diff < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }

      touchStart.current = null;
      isHorizontalSwipe.current = null;
    };

    // Use capture phase to get events before children
    element.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    element.addEventListener('touchmove', handleTouchMove, { capture: true, passive: true });
    element.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart, { capture: true });
      element.removeEventListener('touchmove', handleTouchMove, { capture: true });
      element.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [ref, onSwipeLeft, onSwipeRight, minSwipeDistance]);
}
