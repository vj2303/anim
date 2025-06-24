import { useRef, useCallback, MutableRefObject } from 'react';

// Define GSAP tween interface for better typing
interface GSAPTween {
  kill(): void;
}

interface SmoothScrollOptions {
  duration?: number;
  ease?: string;
  onUpdate?: (position: number) => void;
}

export function useSmoothScroll(
  positionRef: MutableRefObject<number>,
  options: SmoothScrollOptions = {}
) {
  const { duration = 0.5, ease = "power2.out", onUpdate } = options;
  const currentTweenRef = useRef<GSAPTween | null>(null);
  const targetPositionRef = useRef<number>(0);

  const scrollTo = useCallback((targetPosition: number) => {
    if (!(window as any).gsap) return;

    // Kill any existing tween
    if (currentTweenRef.current) {
      currentTweenRef.current.kill();
    }

    targetPositionRef.current = targetPosition;

    // Create smooth tween
    currentTweenRef.current = (window as any).gsap.to(positionRef, {
      current: targetPosition,
      duration: duration,
      ease: ease,
      onUpdate: () => {
        if (onUpdate) {
          onUpdate(positionRef.current);
        }
      }
    }) as GSAPTween;
  }, [positionRef, duration, ease, onUpdate]);

  const scrollBy = useCallback((delta: number) => {
    const newTarget = targetPositionRef.current + delta;
    scrollTo(newTarget);
  }, [scrollTo]);

  const stopScroll = useCallback(() => {
    if (currentTweenRef.current) {
      currentTweenRef.current.kill();
      currentTweenRef.current = null;
    }
  }, []);

  return {
    scrollTo,
    scrollBy,
    stopScroll,
    targetPosition: targetPositionRef.current
  };
}