import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
}: UseSwipeOptions): SwipeHandlers {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isHorizontalSwipe.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || isHorizontalSwipe.current !== null) return;

    const deltaX = Math.abs(e.touches[0].clientX - touchStart.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStart.current.y);

    // Determine swipe direction after some movement
    if (deltaX > 10 || deltaY > 10) {
      isHorizontalSwipe.current = deltaX > deltaY;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;

      // Only handle horizontal swipes
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
    },
    [onSwipeLeft, onSwipeRight, minSwipeDistance]
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}
