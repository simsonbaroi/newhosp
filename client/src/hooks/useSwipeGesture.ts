import { useEffect, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance for a swipe
  preventDefaultEvents?: boolean;
}

export const useSwipeGesture = (options: SwipeGestureOptions) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    preventDefaultEvents = false
  } = options;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (preventDefaultEvents) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultEvents) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (preventDefaultEvents) {
        e.preventDefault();
      }
      
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Check if horizontal swipe is dominant (more horizontal than vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      touchStartRef.current = null;
    };

    // Mouse events for desktop testing (optional)
    let mouseStartX: number | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      mouseStartX = e.clientX;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (mouseStartX === null) return;
      
      const deltaX = e.clientX - mouseStartX;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
      
      mouseStartX = null;
    };

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefaultEvents });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultEvents });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefaultEvents });

    // Add mouse event listeners for desktop testing
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, preventDefaultEvents]);

  return elementRef;
};